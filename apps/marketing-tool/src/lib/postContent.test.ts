import { describe, expect, it } from 'vitest';
import { indianFestivals } from '../data/festivals';
import type { PostRequest } from '../types';
import {
  buildPostContent,
  contrastRatio,
  escapeXml,
  parseHex,
  readableTextColor,
  relativeLuminance,
  renderPostSvg,
  wrapText,
} from './postContent';

const diwali = indianFestivals.find((f) => f.id === 'diwali')!;
const holi = indianFestivals.find((f) => f.id === 'holi')!;
const base: PostRequest = { postType: 'event', brandName: 'Test College' };

describe('colour helpers', () => {
  it('parses short and long hex colours', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(parseHex('FF8800')).toEqual([255, 136, 0]);
    expect(parseHex('#12')).toBeNull();
    expect(parseHex('red')).toBeNull();
  });

  it('computes WCAG luminance and contrast', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1);
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21);
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21);
  });

  it('picks dark text on light backgrounds and light text on dark ones', () => {
    expect(readableTextColor(['#FFD700', '#FFFF00'])).toBe('#1F2937');
    expect(readableTextColor(['#1E3A8A', '#4C1D95'])).toBe('#FFFFFF');
  });
});

describe('buildPostContent', () => {
  it('builds a festival greeting from festival data', () => {
    const content = buildPostContent({ ...base, festival: diwali });
    expect(content.title).toBe('Happy Diwali');
    expect(content.subtitle).toBe(diwali.description);
    expect(content.brandName).toBe('Test College');
    expect(content.palette.background).toEqual([diwali.colors[0], diwali.colors[1]]);
    expect(content.palette.accent).toBe(diwali.colors[2]);
    expect(content.motifs).toContain('diyas');
    expect(content.motifs).toContain('rangoli');
  });

  it('uses an optional custom greeting as the subtitle', () => {
    const content = buildPostContent({ ...base, festival: holi, customText: '  Play safe!  ' });
    expect(content.subtitle).toBe('Play safe!');
    expect(content.motifs).toContain('confetti');
  });

  it('puts the advertisement message in the title', () => {
    const content = buildPostContent({
      ...base,
      postType: 'advertisement',
      customText: 'Admissions open',
    });
    expect(content.title).toBe('Admissions open');
    expect(content.motifs).toEqual([]);
  });

  it('falls back to defaults for an empty announcement', () => {
    const content = buildPostContent({ ...base, postType: 'announcement' });
    expect(content.title).toBe('Announcement');
    expect(content.subtitle).toBe('Important update');
    expect(content.palette.text).toBe('#FFFFFF');
  });
});

describe('wrapText', () => {
  const measure = (s: string) => s.length;

  it('wraps on word boundaries', () => {
    expect(wrapText('the quick brown fox', 10, measure)).toEqual(['the quick', 'brown fox']);
  });

  it('keeps over-long words on their own line', () => {
    expect(wrapText('a supercalifragilistic b', 5, measure)).toEqual([
      'a',
      'supercalifragilistic',
      'b',
    ]);
  });

  it('truncates with an ellipsis past maxLines', () => {
    expect(wrapText('one two three four five', 7, measure, 2)).toEqual(['one two', 'three…']);
  });

  it('handles empty input', () => {
    expect(wrapText('   ', 10, measure)).toEqual([]);
  });
});

describe('renderPostSvg', () => {
  it('escapes user text', () => {
    expect(escapeXml(`<b>"Tom" & 'Jerry'</b>`)).toBe(
      '&lt;b&gt;&quot;Tom&quot; &amp; &apos;Jerry&apos;&lt;/b&gt;',
    );
    const svg = renderPostSvg(
      buildPostContent({
        ...base,
        postType: 'advertisement',
        customText: '<script>alert(1)</script>',
      }),
      1080,
      1080,
    );
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('produces an SVG of the requested size', () => {
    const svg = renderPostSvg(buildPostContent({ ...base, festival: diwali }), 1920, 1080);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('width="1920" height="1080"');
    expect(svg).toContain('Happy Diwali');
    expect(svg).toContain('Test College');
  });
});
