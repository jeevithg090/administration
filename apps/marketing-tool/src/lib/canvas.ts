import type { AspectRatio } from '../types';
import { renderPostSvg, svgToDataUrl, wrapText, type Motif, type PostContent } from './postContent';

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');
  return { canvas, ctx };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/** Deterministic pseudo-random sequence so the same post renders identically. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function drawMotif(
  ctx: CanvasRenderingContext2D,
  motif: Motif,
  w: number,
  h: number,
  color: string,
) {
  const base = Math.min(w, h);
  const random = seeded(w * 31 + h);
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  switch (motif) {
    case 'mandala': {
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = Math.max(2, base / 400);
      const r = base * 0.32;
      for (let ring = r * 0.3; ring <= r; ring += r / 6) {
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, ring, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2);
        ctx.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
        ctx.stroke();
      }
      break;
    }
    case 'moon': {
      const r = base * 0.08;
      const x = w * 0.82;
      const y = h * 0.18;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x + r * 0.45, y - r * 0.25, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'diyas': {
      ctx.globalAlpha = 0.35;
      const size = base / 60;
      for (let i = 0; i < 8; i++) {
        const x = w * (0.08 + random() * 0.84);
        const y = i % 2 === 0 ? h * (0.05 + random() * 0.15) : h * (0.8 + random() * 0.12);
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x, y - size * 0.9, size * 0.3, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'rangoli': {
      ctx.globalAlpha = 0.35;
      const size = base * 0.05;
      for (const [cx, cy] of [
        [size * 1.6, size * 1.6],
        [w - size * 1.6, h - size * 1.6],
      ]) {
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * size, cy + Math.sin(a) * size, size / 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'confetti': {
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.arc(random() * w, random() * h, base / 150 + random() * (base / 80), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }
  ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, content: PostContent, w: number, h: number) {
  const base = Math.min(w, h);
  const titleSize = Math.round(Math.max(28, base / 12));
  const subtitleSize = Math.round(Math.max(16, base / 28));
  const { text } = content.palette;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.font = `bold ${titleSize}px Georgia, serif`;
  const titleLines = wrapText(content.title, w * 0.8, (s) => ctx.measureText(s).width, 3);
  ctx.font = `${subtitleSize}px Inter, Arial, sans-serif`;
  const subtitleLines = wrapText(content.subtitle, w * 0.75, (s) => ctx.measureText(s).width, 4);

  const blockHeight =
    titleLines.length * titleSize * 1.2 +
    subtitleSize * 0.6 +
    subtitleLines.length * subtitleSize * 1.4;
  let y = h / 2 - blockHeight / 2 + titleSize;

  ctx.font = `bold ${titleSize}px Georgia, serif`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = titleSize / 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = text;
  for (const line of titleLines) {
    ctx.fillText(line, w / 2, y);
    y += titleSize * 1.2;
  }

  y += subtitleSize * 0.6;
  ctx.shadowBlur = subtitleSize / 6;
  ctx.font = `${subtitleSize}px Inter, Arial, sans-serif`;
  ctx.globalAlpha = 0.92;
  for (const line of subtitleLines) {
    ctx.fillText(line, w / 2, y);
    y += subtitleSize * 1.4;
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.font = `600 ${Math.round(Math.max(14, base / 40))}px Inter, Arial, sans-serif`;
  ctx.fillText(content.brandName, w / 2, h - base * 0.05);
  ctx.restore();
}

/** Draw `logo` in the top-right corner on a translucent white plate. */
function drawLogo(ctx: CanvasRenderingContext2D, logo: HTMLImageElement, w: number, h: number) {
  const base = Math.min(w, h);
  const box = base * 0.16;
  const margin = base * 0.04;
  const scale = Math.min(box / logo.width, box / logo.height);
  const lw = logo.width * scale;
  const lh = logo.height * scale;
  const pad = box * 0.12;
  const x = w - margin - lw;
  const y = margin;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.roundRect(x - pad, y - pad, lw + pad * 2, lh + pad * 2, pad);
  ctx.fill();
  ctx.drawImage(logo, x, y, lw, lh);
  ctx.restore();
}

/** Render a complete post locally. Falls back to SVG if canvas is unavailable. */
export async function renderLocalPost(
  content: PostContent,
  aspectRatio: AspectRatio,
  logoUrl?: string,
): Promise<string> {
  const { width: w, height: h } = aspectRatio;
  try {
    const { canvas, ctx } = createCanvas(w, h);
    const [c1, c2] = content.palette.background;
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, c1);
    gradient.addColorStop(1, c2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const vignette = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.4);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    content.motifs.forEach((motif) => drawMotif(ctx, motif, w, h, content.palette.accent));
    drawText(ctx, content, w, h);
    if (logoUrl) drawLogo(ctx, await loadImage(logoUrl), w, h);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.warn('Canvas rendering failed, using SVG fallback:', error);
    return svgToDataUrl(renderPostSvg(content, w, h));
  }
}

/**
 * Fit an AI-generated image to the exact output size (cover crop) and overlay
 * the logo. Returns the original URL if the image cannot be drawn (e.g. CORS).
 */
export async function finalizeImage(
  imageUrl: string,
  aspectRatio: AspectRatio,
  logoUrl?: string,
): Promise<string> {
  const { width: w, height: h } = aspectRatio;
  try {
    const img = await loadImage(imageUrl);
    const { canvas, ctx } = createCanvas(w, h);
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    if (logoUrl) drawLogo(ctx, await loadImage(logoUrl), w, h);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.warn('Could not post-process the generated image:', error);
    return imageUrl;
  }
}
