import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const W = 1200, H = 630;

// crc table for PNG chunk CRCs
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = (crcTable[(c ^ b) & 0xff] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

// raw rows: each row prefixed with filter byte 0, then RGB triplets (#0F172A)
const row = Buffer.alloc(1 + W * 3);
row[0] = 0;
for (let x = 0; x < W; x++) {
  row[1 + x * 3] = 0x0F;
  row[2 + x * 3] = 0x17;
  row[3 + x * 3] = 0x2A;
}
const raw = Buffer.alloc(row.length * H);
for (let y = 0; y < H; y++) row.copy(raw, y * row.length);
const idat = deflateSync(raw);

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
writeFileSync('public/og-default.png', png);
console.log(`Wrote ${png.length}-byte og-default.png`);
