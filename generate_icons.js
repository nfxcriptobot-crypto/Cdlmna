import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // Uncompressed raw image data: [filter_byte (0), R, G, B, A, ...]
  const rowLength = width * 4 + 1;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // Helper to calculate CRC32
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function drawTacticalIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const rNorm = dist / (w * 0.5);

  // Background gradient: dark navy/slate
  let r = 10, g = 15, b = 29, a = 255;
  if (rNorm < 0.95) {
    const bgFactor = 1 - rNorm;
    r = Math.min(255, 12 + Math.floor(bgFactor * 25));
    g = Math.min(255, 18 + Math.floor(bgFactor * 35));
    b = Math.min(255, 36 + Math.floor(bgFactor * 65));
  }

  // Outer circular ring
  const ringDist = Math.abs(dist - w * 0.42);
  if (ringDist < w * 0.015) {
    return [56, 189, 248, 255]; // Cyan ring
  }

  // Inner ring
  const innerRingDist = Math.abs(dist - w * 0.28);
  if (innerRingDist < w * 0.012) {
    return [251, 191, 36, 255]; // Amber ring
  }

  // Crosshair lines
  const crosshairW = Math.max(1.5, w * 0.012);
  if ((Math.abs(dx) < crosshairW && (Math.abs(dy) > w * 0.15 && Math.abs(dy) < w * 0.45)) ||
      (Math.abs(dy) < crosshairW && (Math.abs(dx) > w * 0.15 && Math.abs(dx) < w * 0.45))) {
    return [56, 189, 248, 255];
  }

  // Center tactical chevron
  if (dist < w * 0.16) {
    // Shield / chevron in center
    if (Math.abs(dx) < w * 0.12 && dy > -w * 0.1 && dy < w * 0.1) {
      if (Math.abs(dx) + dy * 0.5 < w * 0.1) {
        return [251, 191, 36, 255]; // Bright tactical amber
      }
    }
  }

  // Corner brackets
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const bSize = w * 0.35;
  if ((Math.abs(absX - bSize) < crosshairW && absY < bSize && absY > bSize - w * 0.08) ||
      (Math.abs(absY - bSize) < crosshairW && absX < bSize && absX > bSize - w * 0.08)) {
    return [56, 189, 248, 200];
  }

  return [r, g, b, a];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, drawTacticalIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, drawTacticalIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, drawTacticalIcon));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, drawTacticalIcon));

console.log('PNG Icons successfully generated in /public');
