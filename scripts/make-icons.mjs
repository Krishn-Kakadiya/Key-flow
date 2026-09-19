// Renders the Keyflow logo to PNG icons (no image libraries needed).
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const shapes = [
  { x: 11, y: 38, w: 12, h: 12, r: 3, c: '#5eead4', a: 1 },
  { x: 26, y: 38, w: 12, h: 12, r: 3, c: '#a78bfa', a: 1 },
  { x: 41, y: 38, w: 12, h: 12, r: 3, c: '#5eead4', a: 0.55 },
  { x: 14, y: 12, w: 5, h: 20, r: 2.5, c: '#ffd166', a: 1 },
  { x: 25, y: 16, w: 26, h: 4, r: 2, c: '#e6e8ee', a: 0.9 },
  { x: 25, y: 24, w: 16, h: 4, r: 2, c: '#626b82', a: 1 },
];

function inside(s, px, py) {
  const cx = Math.min(Math.max(px, s.x + s.r), s.x + s.w - s.r);
  const cy = Math.min(Math.max(py, s.y + s.r), s.y + s.h - s.r);
  return px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h && (px - cx) ** 2 + (py - cy) ** 2 <= s.r ** 2;
}

function render(size) {
  const bg = hex('#111318');
  const SS = 3;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const px = ((x + (sx + 0.5) / SS) / size) * 64;
        const py = ((y + (sy + 0.5) / SS) / size) * 64;
        let col = bg;
        for (const s of shapes) if (inside(s, px, py)) {
          const c = hex(s.c);
          col = col.map((v, i) => Math.round(v * (1 - s.a) + c[i] * s.a));
        }
        r += col[0]; g += col[1]; b += col[2];
      }
      const n = SS * SS;
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = Math.round(r / n); raw[o + 1] = Math.round(g / n); raw[o + 2] = Math.round(b / n); raw[o + 3] = 255;
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

for (const size of [192, 512]) writeFileSync(`public/pwa-${size}.png`, render(size));
console.log('icons written');
