#!/usr/bin/env node
'use strict';
// Generates active/inactive clipboard PNG icons for 16, 32, 48, 128 sizes
// Uses only Node.js built-ins: fs, zlib, path

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../icons');
mkdirSync(OUT, { recursive: true });

// ── CRC32 table ──────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, getRGBA) {
  // Build raw scanlines: [filter_byte, r, g, b, a, ...]
  const scanlines = [];
  for (let y = 0; y < height; y++) {
    const row = [0]; // filter type None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getRGBA(x, y, width, height);
      row.push(r, g, b, a);
    }
    scanlines.push(...row);
  }

  const raw = Buffer.from(scanlines);
  const compressed = deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  // compression, filter, interlace = 0

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Icon pixel renderers ──────────────────────────────────────────────────────
// Colors: active = indigo #4f46e5, inactive = gray #9ca3af
// Background: active = light indigo #eef2ff, inactive = light gray #f9fafb

function hexToRGB(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

const ACTIVE_FG = hexToRGB('#4f46e5');
const ACTIVE_BG = hexToRGB('#eef2ff');
const INACTIVE_FG = hexToRGB('#9ca3af');
const INACTIVE_BG = hexToRGB('#f9fafb');

function drawIcon(x, y, w, h, active) {
  const fg = active ? ACTIVE_FG : INACTIVE_FG;
  const bg = active ? ACTIVE_BG : INACTIVE_BG;

  // Normalised coords [0,1]
  const nx = x / w;
  const ny = y / h;

  // Draw a simple clipboard shape
  // Main page rect: 0.33..0.95 x, 0.08..0.96 y
  const inPage = nx >= 0.33 && nx <= 0.95 && ny >= 0.08 && ny <= 0.96;
  // Page border (2px stroke equivalent)
  const borderT = 0.02;
  const onPageBorder = inPage && (
    nx <= 0.33 + borderT || nx >= 0.95 - borderT ||
    ny <= 0.08 + borderT || ny >= 0.96 - borderT
  );

  // Back page rect: 0.05..0.67 x, 0.20..0.96 y
  const inBack = nx >= 0.05 && nx <= 0.67 && ny >= 0.20 && ny <= 0.96;
  const onBackBorder = inBack && (
    nx <= 0.05 + borderT || nx >= 0.67 - borderT ||
    ny <= 0.20 + borderT || ny >= 0.96 - borderT
  );

  // Checkmark (active) or lines (inactive) in main page body
  const inPageBody = nx >= 0.33 + borderT && nx <= 0.95 - borderT &&
                     ny >= 0.08 + borderT && ny <= 0.96 - borderT;

  let r, g, b, a = 255;

  if (onPageBorder || onBackBorder) {
    [r, g, b] = fg;
  } else if (inPage) {
    [r, g, b] = bg;
    // Draw checkmark (active) in the body
    if (active && inPageBody) {
      // Simple diagonal checkmark: two line segments
      // Down-left: nx 0.42..0.62, ny 0.45..0.70
      // Up-right:  nx 0.62..0.85, ny 0.70..0.38
      const inCheck1 = Math.abs((ny - 0.45) - (nx - 0.42) * (0.70 - 0.45) / (0.62 - 0.42)) < 0.06;
      const inCheck2 = Math.abs((ny - 0.70) - (nx - 0.62) * (0.38 - 0.70) / (0.85 - 0.62)) < 0.06;
      const inCheckRange1 = nx >= 0.42 && nx <= 0.62;
      const inCheckRange2 = nx >= 0.62 && nx <= 0.85;
      if ((inCheck1 && inCheckRange1) || (inCheck2 && inCheckRange2)) {
        [r, g, b] = fg;
      }
    } else if (!active && inPageBody) {
      // Draw 3 horizontal lines
      const lineY = [0.38, 0.52, 0.66];
      const lineH = 0.07;
      const lineX1 = 0.48, lineX2 = 0.88;
      const onLine = lineY.some(ly => ny >= ly && ny <= ly + lineH) && nx >= lineX1 && nx <= lineX2;
      if (onLine) [r, g, b] = fg;
    }
  } else if (inBack) {
    [r, g, b] = bg;
  } else {
    // Transparent
    r = g = b = 0; a = 0;
  }

  return [r ?? 0, g ?? 0, b ?? 0, a];
}

// ── Generate icons ────────────────────────────────────────────────────────────
const SIZES = [16, 32, 48, 128];

for (const size of SIZES) {
  for (const active of [true, false]) {
    const state = active ? 'active' : 'inactive';
    const png = encodePNG(size, size, (x, y, w, h) => drawIcon(x, y, w, h, active));
    const outPath = join(OUT, `${state}-${size}.png`);
    writeFileSync(outPath, png);
    console.log(`Written: ${state}-${size}.png (${png.length} bytes)`);
  }
}

console.log('\nAll icons generated in icons/');

