import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c >>> 0;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'binary');
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generatePng(size, isMaskable = false) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc((width * 4 + 1) * height);

  const radius = size * (isMaskable ? 0.38 : 0.44);
  const cx = width / 2;
  const cy = height / 2;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter byte: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient (Deep violet to vibrant indigo)
      const t = (x + y) / (width + height);
      let r = Math.round(99 * (1 - t) + 79 * t);
      let g = Math.round(102 * (1 - t) + 70 * t);
      let b = Math.round(241 * (1 - t) + 229 * t);
      let a = 255;

      if (!isMaskable) {
        // Rounded squircle icon with soft border
        const cornerDist = Math.max(Math.abs(dx), Math.abs(dy));
        if (cornerDist > size * 0.46) {
          a = 0;
        }
      }

      // Draw stylized play triangle symbol in white
      // Triangle points: (-size*0.12, -size*0.18), (-size*0.12, size*0.18), (size*0.18, 0)
      const p1x = -size * 0.12, p1y = -size * 0.18;
      const p2x = -size * 0.12, p2y = size * 0.18;
      const p3x = size * 0.18,  p3y = 0;

      // Point in triangle test with barycentric coords
      const d1 = (dx - p2x) * (p1y - p2y) - (p1x - p2x) * (dy - p2y);
      const d2 = (dx - p3x) * (p2y - p3y) - (p2x - p3x) * (dy - p3y);
      const d3 = (dx - p1x) * (p3y - p1y) - (p3x - p1x) * (dy - p1y);
      const has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
      const has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
      const inTriangle = !(has_neg && has_pos);

      // Play circle accent
      if (Math.abs(dist - radius * 0.72) < size * 0.035) {
        r = 255; g = 255; b = 255; a = Math.max(a, 210);
      } else if (inTriangle) {
        r = 255; g = 255; b = 255; a = 255;
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = createChunk('IHDR', ihdr);
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePng(64, false));

// Also generate public/icon.svg
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#4f46e5" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#818cf8" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#g)" />
  <circle cx="256" cy="256" r="210" fill="url(#glow)" />
  <circle cx="256" cy="256" r="160" stroke="#ffffff" stroke-width="18" stroke-dasharray="14 14" opacity="0.45" />
  <path d="M220 170L340 256L220 342V170Z" fill="#ffffff" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.3))" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg, 'utf-8');

console.log('Successfully generated all PWA icons in /public');
