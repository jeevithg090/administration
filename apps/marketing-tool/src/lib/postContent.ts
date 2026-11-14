import type { PostRequest } from '../types';

export interface Palette {
  /** Gradient stops for the background. */
  background: [string, string];
  accent: string;
  text: string;
}

export type Motif = 'mandala' | 'moon' | 'diyas' | 'rangoli' | 'confetti';

export interface PostContent {
  title: string;
  subtitle: string;
  brandName: string;
  palette: Palette;
  motifs: Motif[];
}

const DEFAULT_COLORS = ['#4F46E5', '#7C3AED', '#FFD700'];

/** Parse `#rgb` / `#rrggbb` into 0–255 channels, or null if malformed. */
export function parseHex(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const digits =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((d) => d + d)
          .join('')
      : match[1];
  return [0, 2, 4].map((i) => Number.parseInt(digits.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Pick near-white or near-black text, whichever contrasts better with both background stops. */
export function readableTextColor(background: [string, string]): string {
  const light = '#FFFFFF';
  const dark = '#1F2937';
  const worst = (color: string) => Math.min(...background.map((bg) => contrastRatio(color, bg)));
  return worst(light) >= worst(dark) ? light : dark;
}

function motifsFor(request: PostRequest): Motif[] {
  if (request.postType !== 'event' || !request.festival) return [];
  const words = [request.festival.id, ...request.festival.keywords].join(' ').toLowerCase();
  const motifs: Motif[] = [];
  if (/mandala|karva|navratri|garba/.test(words)) motifs.push('mandala');
  if (/moon|karva|eid|crescent/.test(words)) motifs.push('moon');
  if (/diya|lamp|light|diwali/.test(words)) motifs.push('diyas');
  if (/rangoli|pattern|pongal|onam/.test(words)) motifs.push('rangoli');
  if (/colou?r|holi|celebration/.test(words)) motifs.push('confetti');
  return motifs;
}

/** Derive the text, colours and decorations for a post from the user's request. */
export function buildPostContent(request: PostRequest): PostContent {
  const { postType, festival, brandName } = request;
  const customText = request.customText?.trim() ?? '';

  const colors = festival?.colors.length ? festival.colors : DEFAULT_COLORS;
  const background: [string, string] = [colors[0], colors[1] ?? colors[0]];
  const accent = colors[2] ?? DEFAULT_COLORS[2];

  let title: string;
  let subtitle: string;
  if (postType === 'event' && festival) {
    title = `Happy ${festival.name}`;
    subtitle = customText || festival.description;
  } else if (postType === 'advertisement') {
    title = customText || 'Excellence in Education';
    subtitle = 'Your future starts here';
  } else {
    title = 'Announcement';
    subtitle = customText || 'Important update';
  }

  return {
    title,
    subtitle,
    brandName,
    palette: { background, accent, text: readableTextColor(background) },
    motifs: motifsFor(request),
  };
}

/**
 * Greedy word wrap. `measure` returns the rendered width of a string, so this
 * works with a canvas context or any other text metric.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  measure: (value: string) => number,
  maxLines = Infinity,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[\s.,;:!?-]+$/, '')}…`;
    return kept;
  }
  return lines;
}

/** Escape text for inclusion in SVG/XML. */
export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * Self-contained SVG rendering of a post, used when canvas is unavailable.
 * Text is approximated with a fixed average glyph width for wrapping.
 */
export function renderPostSvg(content: PostContent, width: number, height: number): string {
  const { palette } = content;
  const base = Math.min(width, height);
  const titleSize = Math.round(Math.max(28, base / 12));
  const subtitleSize = Math.round(Math.max(16, base / 28));
  const approx = (size: number) => (value: string) => value.length * size * 0.55;

  const titleLines = wrapText(content.title, width * 0.8, approx(titleSize), 3);
  const subtitleLines = wrapText(content.subtitle, width * 0.75, approx(subtitleSize), 4);
  const blockHeight =
    titleLines.length * titleSize * 1.2 + subtitleSize + subtitleLines.length * subtitleSize * 1.4;
  let y = height / 2 - blockHeight / 2 + titleSize;

  const tspans: string[] = [];
  for (const line of titleLines) {
    tspans.push(
      `<text x="50%" y="${Math.round(y)}" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="${titleSize}" fill="${palette.text}">${escapeXml(line)}</text>`,
    );
    y += titleSize * 1.2;
  }
  y += subtitleSize * 0.6;
  for (const line of subtitleLines) {
    tspans.push(
      `<text x="50%" y="${Math.round(y)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${subtitleSize}" fill="${palette.text}" opacity="0.9">${escapeXml(line)}</text>`,
    );
    y += subtitleSize * 1.4;
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">',
    `<stop offset="0" stop-color="${palette.background[0]}"/><stop offset="1" stop-color="${palette.background[1]}"/>`,
    '</linearGradient></defs>',
    '<rect width="100%" height="100%" fill="url(#bg)"/>',
    `<circle cx="${width * 0.1}" cy="${height * 0.12}" r="${base * 0.06}" fill="${palette.accent}" opacity="0.25"/>`,
    `<circle cx="${width * 0.88}" cy="${height * 0.85}" r="${base * 0.08}" fill="${palette.accent}" opacity="0.2"/>`,
    ...tspans,
    `<text x="50%" y="${height - Math.round(base * 0.05)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(Math.max(14, base / 40))}" fill="${palette.text}">${escapeXml(content.brandName)}</text>`,
    '</svg>',
  ].join('');
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
