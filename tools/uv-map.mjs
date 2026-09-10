/**
 * Locate a model's printable panel in UV space.
 *
 * Sketchfab and similar exports pack every face of a product into one atlas —
 * front, back, gussets, base and flaps all share the 0–1 square. Dropping
 * artwork anywhere in that square smears it across panels. This tool groups a
 * mesh's triangles by which way they face in 3D and reports the UV bounds of
 * each group, which is what `print.uv` in a product config needs.
 *
 *   node tools/uv-map.mjs <file.glb> <materialName>
 *
 * It also writes a PNG of the atlas, colour-coded by facing direction, so the
 * numbers can be checked by eye.
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const [file, materialName, outPath] = process.argv.slice(2);

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });

const document = await io.read(file);

const DIRECTIONS = [
  { key: 'front  (+Z)', axis: [0, 0, 1], colour: [226, 72, 31] },
  { key: 'back   (-Z)', axis: [0, 0, -1], colour: [60, 110, 200] },
  { key: 'right  (+X)', axis: [1, 0, 0], colour: [70, 170, 90] },
  { key: 'left   (-X)', axis: [-1, 0, 0], colour: [150, 200, 90] },
  { key: 'top    (+Y)', axis: [0, 1, 0], colour: [190, 190, 190] },
  { key: 'bottom (-Y)', axis: [0, -1, 0], colour: [110, 110, 110] },
];

const groups = DIRECTIONS.map((d) => ({
  ...d,
  tris: [],
  min: [Infinity, Infinity],
  max: [-Infinity, -Infinity],
  area: 0,
}));

for (const mesh of document.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    if (prim.getMaterial()?.getName() !== materialName) continue;

    const position = prim.getAttribute('POSITION');
    const uv = prim.getAttribute('TEXCOORD_0');
    const indices = prim.getIndices();
    if (!uv) continue;

    const count = indices ? indices.getCount() : position.getCount();
    const idx = (i) => (indices ? indices.getScalar(i) : i);

    for (let i = 0; i < count; i += 3) {
      const p = [[], [], []];
      const t = [[], [], []];
      for (let k = 0; k < 3; k += 1) {
        position.getElement(idx(i + k), (p[k] = [0, 0, 0]));
        uv.getElement(idx(i + k), (t[k] = [0, 0]));
      }

      // Face normal from the triangle winding.
      const e1 = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]];
      const e2 = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]];
      const n = [
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0],
      ];
      const len = Math.hypot(...n) || 1;
      const unit = n.map((v) => v / len);

      let best = 0;
      let bestDot = -Infinity;
      groups.forEach((g, gi) => {
        const dot = unit[0] * g.axis[0] + unit[1] * g.axis[1] + unit[2] * g.axis[2];
        if (dot > bestDot) {
          bestDot = dot;
          best = gi;
        }
      });

      const g = groups[best];
      const uvArea =
        Math.abs(
          (t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) - (t[2][0] - t[0][0]) * (t[1][1] - t[0][1])
        ) / 2;
      g.area += uvArea;
      g.tris.push(t);
      for (const point of t) {
        for (let a = 0; a < 2; a += 1) {
          if (point[a] < g.min[a]) g.min[a] = point[a];
          if (point[a] > g.max[a]) g.max[a] = point[a];
        }
      }
    }
  }
}

console.log(`\n${file.split('/').pop()} — material ${JSON.stringify(materialName)}\n`);
for (const g of groups) {
  if (!g.tris.length) continue;
  const w = g.max[0] - g.min[0];
  const h = g.max[1] - g.min[1];
  console.log(
    `  ${g.key}  tris ${String(g.tris.length).padStart(5)}  ` +
      `uv x ${g.min[0].toFixed(3)} y ${g.min[1].toFixed(3)} w ${w.toFixed(3)} h ${h.toFixed(3)}  ` +
      `(atlas area ${(g.area * 100).toFixed(1)}%)`
  );
}

/* --- Atlas render -------------------------------------------------------- */
if (outPath) {
  const S = 700;
  const px = Buffer.alloc(S * S * 3, 18);

  const line = (x0, y0, x1, y1, colour) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) | 0;
    for (let s = 0; s <= steps; s += 1) {
      const x = Math.round(x0 + ((x1 - x0) * s) / steps);
      const y = Math.round(y0 + ((y1 - y0) * s) / steps);
      if (x < 0 || y < 0 || x >= S || y >= S) continue;
      const o = (y * S + x) * 3;
      px[o] = colour[0];
      px[o + 1] = colour[1];
      px[o + 2] = colour[2];
    }
  };

  for (const g of groups) {
    for (const t of g.tris) {
      const pts = t.map(([u, v]) => [u * S, v * S]);
      line(...pts[0], ...pts[1], g.colour);
      line(...pts[1], ...pts[2], g.colour);
      line(...pts[2], ...pts[0], g.colour);
    }
  }

  const raw = Buffer.alloc(S * (S * 3 + 1));
  for (let y = 0; y < S; y += 1) {
    raw[y * (S * 3 + 1)] = 0;
    px.copy(raw, y * (S * 3 + 1) + 1, y * S * 3, (y + 1) * S * 3);
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32 ? zlib.crc32(body) : crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0);
  ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  fs.writeFileSync(
    outPath,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ])
  );
  console.log(`\n  atlas written to ${outPath}`);
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
