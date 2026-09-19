import { useEffect, useRef, useState } from 'react';
import { Check, Clipboard, Download, Image as ImageIcon } from 'lucide-react';

export interface ShareData {
  wpm: number;
  accuracy: number;
  consistency: number;
  durationSec: number;
  label: string;
  streak: number;
  level: number;
  isPB: boolean;
}

const W = 1200;
const H = 630;

const cssVar = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function draw(canvas: HTMLCanvasElement, d: ShareData) {
  const mono = '"JetBrains Mono Variable", ui-monospace, monospace';
  const sans = '"Inter Variable", system-ui, sans-serif';
  // Wait briefly for the web fonts, but never let a slow/blocked font leave the card blank.
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`800 120px ${mono}`),
        document.fonts.load(`600 30px ${sans}`),
        document.fonts.load(`400 30px ${sans}`),
      ]),
      new Promise((res) => setTimeout(res, 1500)),
    ]);
  } catch {
    /* fall back to system fonts */
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = W;
  canvas.height = H;

  // The production CSS minifier shortens colours (#33ff66 -> #3f6), so never build colours by
  // string concatenation. Let the canvas normalise any CSS colour, then apply alpha explicitly.
  const rgba = (color: string, alpha: number): string => {
    ctx.fillStyle = '#000000';
    ctx.fillStyle = color;
    const n = String(ctx.fillStyle);
    if (/^#[0-9a-f]{6}$/i.test(n)) {
      const v = parseInt(n.slice(1), 16);
      return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${alpha})`;
    }
    return n;
  };

  const bg = cssVar('--bg', '#111318');
  const surface = cssVar('--surface', '#1a1d24');
  const text = cssVar('--text', '#e6e8ee');
  const muted = cssVar('--muted', '#9aa2b5');
  const accent = cssVar('--accent', '#5eead4');
  const accent2 = cssVar('--accent-2', '#a78bfa');
  const caret = cssVar('--caret', '#ffd166');
  const flameA = cssVar('--flame-a', '#ff8a3d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // soft colour blobs
  const g1 = ctx.createRadialGradient(180, 120, 20, 180, 120, 520);
  g1.addColorStop(0, rgba(accent, 0.33));
  g1.addColorStop(1, rgba(accent, 0));
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(1050, 540, 20, 1050, 540, 520);
  g2.addColorStop(0, rgba(accent2, 0.33));
  g2.addColorStop(1, rgba(accent2, 0));
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // card
  ctx.fillStyle = rgba(surface, 0.8);
  roundRect(ctx, 48, 48, W - 96, H - 96, 36);
  ctx.fill();
  ctx.strokeStyle = rgba(text, 0.13);
  ctx.lineWidth = 2;
  ctx.stroke();

  // brand
  ctx.fillStyle = caret;
  roundRect(ctx, 96, 100, 8, 40, 4);
  ctx.fill();
  ctx.fillStyle = text;
  ctx.font = `700 34px ${sans}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Keyflow', 120, 132);
  ctx.fillStyle = muted;
  ctx.font = `500 24px ${sans}`;
  ctx.textAlign = 'right';
  ctx.fillText(d.label, W - 96, 132);
  ctx.textAlign = 'left';

  // headline WPM
  ctx.fillStyle = text;
  ctx.font = `800 230px ${mono}`;
  ctx.fillText(String(Math.round(d.wpm)), 90, 372);
  const wpmW = ctx.measureText(String(Math.round(d.wpm))).width;
  ctx.fillStyle = accent;
  ctx.font = `700 48px ${sans}`;
  ctx.fillText('WPM', 100 + wpmW, 372);

  // pills (right column): personal best, level, streak
  const pill = (x: number, y: number, label: string, color: string, textColor?: string, solid = false) => {
    ctx.font = `700 28px ${sans}`;
    const w = ctx.measureText(label).width + 48;
    ctx.fillStyle = solid ? color : rgba(color, 0.16);
    roundRect(ctx, x - w, y, w, 56, 28);
    ctx.fill();
    ctx.fillStyle = textColor ?? color;
    ctx.fillText(label, x - w + 24, y + 38);
  };
  const right = W - 96;
  let py = 176;
  if (d.isPB) {
    pill(right, py, '★ PERSONAL BEST', caret, '#111318', true);
    py += 72;
  }
  if (d.streak > 0) {
    pill(right, py, `🔥 ${d.streak}-day streak`, flameA);
    py += 72;
  }
  pill(right, py, `Level ${d.level}`, accent2);

  // stat row
  const stats: [string, string][] = [
    ['ACCURACY', `${d.accuracy.toFixed(d.accuracy % 1 ? 1 : 0)}%`],
    ['CONSISTENCY', `${Math.round(d.consistency)}%`],
    ['TIME', d.durationSec >= 60 ? `${Math.floor(d.durationSec / 60)}m ${Math.round(d.durationSec % 60)}s` : `${Math.round(d.durationSec)}s`],
  ];
  stats.forEach(([k, v], i) => {
    const x = 100 + i * 250;
    ctx.fillStyle = muted;
    ctx.font = `600 22px ${sans}`;
    ctx.fillText(k, x, 448);
    ctx.fillStyle = text;
    ctx.font = `700 52px ${mono}`;
    ctx.fillText(v, x, 508);
  });

  ctx.fillStyle = muted;
  ctx.font = `500 22px ${sans}`;
  ctx.textAlign = 'right';
  ctx.fillText('Find your flow. One keystroke at a time.', W - 96, 560);
  ctx.textAlign = 'left';
}

export function ShareCard({ data }: { data: ShareData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(data);

  useEffect(() => {
    if (ref.current) {
      draw(ref.current, data).catch(() => setError('Could not draw the result card in this browser.'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const blob = () =>
    new Promise<Blob | null>((res) => (ref.current ? ref.current.toBlob(res, 'image/png') : res(null)));

  const flash = (what: string) => {
    setCopied(what);
    setError(null);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const download = async () => {
    const b = await blob();
    if (!b) return;
    const url = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyflow-${Math.round(data.wpm)}wpm.png`;
    a.click();
    URL.revokeObjectURL(url);
    flash('Saved');
  };

  const copyImage = async () => {
    try {
      const b = await blob();
      if (!b || !('ClipboardItem' in window)) throw new Error('unsupported');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]);
      flash('Image copied');
    } catch {
      setError('Copying images is not supported here — use Save image instead.');
    }
  };

  const summary = `I just typed ${Math.round(data.wpm)} WPM at ${Math.round(data.accuracy)}% accuracy on Keyflow${data.streak > 1 ? ` — ${data.streak}-day streak 🔥` : ''}`;
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      flash('Text copied');
    } catch {
      setError('Could not access the clipboard.');
    }
  };

  return (
    <div className="card overflow-hidden p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="label">Your result card</div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost !py-1.5 !text-xs" onClick={download}><Download size={14} /> Save image</button>
          <button className="btn btn-ghost !py-1.5 !text-xs" onClick={copyImage}><ImageIcon size={14} /> Copy image</button>
          <button className="btn btn-ghost !py-1.5 !text-xs" onClick={copyText}><Clipboard size={14} /> Copy text</button>
        </div>
      </div>
      <canvas ref={ref} className="w-full rounded-xl border border-line" style={{ aspectRatio: `${W} / ${H}` }} role="img" aria-label={summary} />
      <div className="mt-2 h-5 text-xs" role="status">
        {copied && <span className="inline-flex items-center gap-1 text-success"><Check size={14} /> {copied}</span>}
        {error && <span className="text-err">{error}</span>}
      </div>
    </div>
  );
}
