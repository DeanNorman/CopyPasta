#!/usr/bin/env node
'use strict';
// Generates active/inactive pixel-bowl PNG icons for 16, 32, 48, 128 sizes
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
// The 16x16 pixel bowl from the website (site/index.html, symbol #px-bowl).
// Each layer is [colour, [[x, y, width], ...]]: one-pixel-high runs, drawn in order.
const BOWL = [
  ['#FFF6E6', [[2, 8, 12], [2, 9, 2], [5, 9, 6], [12, 9, 2], [2, 10, 1], [4, 10, 3], [9, 10, 3], [13, 10, 1], [3, 11, 10], [4, 12, 8]]],
  ['#FFCF5C', [[6, 4, 1], [9, 4, 1], [4, 5, 8], [3, 6, 10]]],
  ['#E8553D', [[7, 3, 2], [7, 4, 2], [2, 7, 12]]],
  ['#FF8FA3', [[3, 10, 1], [12, 10, 1]]],
  ['#5FA35A', [[7, 2, 2]]],
  ['#120E14', [[6, 3, 1], [9, 3, 1], [4, 4, 2], [10, 4, 2], [3, 5, 1], [12, 5, 1], [2, 6, 1], [13, 6, 1], [1, 7, 1], [14, 7, 1], [1, 8, 1], [14, 8, 1], [1, 9, 1], [4, 9, 1], [11, 9, 1], [14, 9, 1], [1, 10, 1], [7, 10, 2], [14, 10, 1], [2, 11, 1], [13, 11, 1], [3, 12, 1], [12, 12, 1], [4, 13, 8], [6, 14, 4]]],
];

function hexToRGB(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

const GRID = (() => {
  const grid = Array.from({ length: 16 }, () => new Array(16).fill(null));
  for (const [hex, runs] of BOWL) {
    const rgb = hexToRGB(hex);
    for (const [x, y, w] of runs) for (let i = 0; i < w; i++) grid[y][x + i] = rgb;
  }
  return grid;
})();

// Active: the bowl in colour. Inactive: the same bowl in grey, slightly faded.
// At 128px the art is 96px with 16px of transparent padding, as the Chrome Web Store asks.
function drawIcon(x, y, size, active) {
  const art = size === 128 ? 96 : size;
  const pad = (size - art) / 2;
  const scale = art / 16;
  const gx = Math.floor((x - pad) / scale);
  const gy = Math.floor((y - pad) / scale);
  if (x < pad || y < pad || gx > 15 || gy > 15) return [0, 0, 0, 0];
  const px = GRID[gy][gx];
  if (!px) return [0, 0, 0, 0];
  if (active) return [...px, 255];
  const grey = Math.round(0.299 * px[0] + 0.587 * px[1] + 0.114 * px[2]);
  return [grey, grey, grey, 170];
}

// ── Generate icons ────────────────────────────────────────────────────────────
const SIZES = [16, 32, 48, 128];

for (const size of SIZES) {
  for (const active of [true, false]) {
    const state = active ? 'active' : 'inactive';
    const png = encodePNG(size, size, (x, y, w) => drawIcon(x, y, w, active));
    const outPath = join(OUT, `${state}-${size}.png`);
    writeFileSync(outPath, png);
    console.log(`Written: ${state}-${size}.png (${png.length} bytes)`);
  }
}

console.log('\nAll icons generated in icons/');

