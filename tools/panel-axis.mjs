/**
 * Report which way a mesh's faces point, in world space.
 *
 * Answers the one question a product config needs: which axis is the printable
 * panel? Imported models carry nested rotations from their authoring tool, so
 * "the front" in the file is rarely the front in the scene.
 *
 *   node tools/panel-axis.mjs <file.glb> <materialName>
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const [file, materialName] = process.argv.slice(2);

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });

const document = await io.read(file);
const scene = document.getRoot().listScenes()[0];

const AXES = [
  { key: '+X', v: [1, 0, 0] },
  { key: '-X', v: [-1, 0, 0] },
  { key: '+Y', v: [0, 1, 0] },
  { key: '-Y', v: [0, -1, 0] },
  { key: '+Z', v: [0, 0, 1] },
  { key: '-Z', v: [0, 0, -1] },
];

const apply = (m, v) => [
  m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
  m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
  m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14],
];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const length = (v) => Math.hypot(...v);
const normalise = (v) => {
  const l = length(v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

const tally = new Map(AXES.map((a) => [a.key, { tris: 0, area: 0 }]));

const walk = (node, matrix) => {
  const m = multiply(matrix, trs(node));
  const mesh = node.getMesh();

  if (mesh) {
    for (const prim of mesh.listPrimitives()) {
      if (prim.getMaterial()?.getName() !== materialName) continue;
      const position = prim.getAttribute('POSITION');
      const indices = prim.getIndices();
      const count = indices ? indices.getCount() : position.getCount();
      const idx = (i) => (indices ? indices.getScalar(i) : i);

      for (let i = 0; i < count; i += 3) {
        const p = [0, 1, 2].map((k) => {
          const local = [0, 0, 0];
          position.getElement(idx(i + k), local);
          return apply(m, local);
        });
        const e1 = sub(p[1], p[0]);
        const e2 = sub(p[2], p[0]);
        const n = normalise(cross(e1, e2));
        const area = length(cross(e1, e2)) / 2;

        let best = null;
        let bestDot = -Infinity;
        for (const axis of AXES) {
          const d = n[0] * axis.v[0] + n[1] * axis.v[1] + n[2] * axis.v[2];
          if (d > bestDot) {
            bestDot = d;
            best = axis.key;
          }
        }
        const entry = tally.get(best);
        entry.tris += 1;
        entry.area += area;
      }
    }
  }

  node.listChildren().forEach((child) => walk(child, m));
};

scene.listChildren().forEach((n) => walk(n, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));

console.log(`\n${file.split('/').pop()} — material ${JSON.stringify(materialName)} (world space)\n`);
const total = [...tally.values()].reduce((s, e) => s + e.area, 0) || 1;
[...tally.entries()]
  .sort((a, b) => b[1].area - a[1].area)
  .forEach(([key, e]) => {
    if (!e.tris) return;
    console.log(
      `  ${key}  tris ${String(e.tris).padStart(6)}  surface ${((e.area / total) * 100).toFixed(1)}%`
    );
  });

function trs(node) {
  const t = node.getTranslation();
  const [x, y, z, w] = node.getRotation();
  const s = node.getScale();
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  return [
    (1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
    (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
    (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1,
  ];
}
function multiply(a, b) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c += 1)
    for (let r = 0; r < 4; r += 1)
      o[c * 4 + r] =
        a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
}
