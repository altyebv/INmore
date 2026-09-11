/**
 * Inspect product models: decoded geometry bounds, UV coverage and materials.
 *
 * Run against any GLB before writing its product configuration — the numbers
 * it reports are exactly what `heightM`, `printMeshName` and `print.uv` need.
 *
 *   node tools/inspect-models.mjs apps/site/public/models/*.glb
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
  });

function worldMatrixOf(node) {
  // gltf-transform gives local TRS; walk up through parents.
  let matrix = node.getWorldMatrix ? node.getWorldMatrix() : null;
  return matrix;
}

for (const path of process.argv.slice(2)) {
  const document = await io.read(path);
  const root = document.getRoot();

  console.log(`\n=== ${path.split('/').pop()} ===`);

  const scene = root.listScenes()[0];
  const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };

  const visit = (node, parentMatrix) => {
    const t = node.getTranslation();
    const r = node.getRotation();
    const s = node.getScale();

    // Compose local matrix (column-major 4x4) from TRS.
    const [x, y, z, w] = r;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    const local = [
      (1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
      (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
      (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0,
      t[0], t[1], t[2], 1,
    ];

    const m = multiply(parentMatrix, local);

    const mesh = node.getMesh();
    if (mesh) {
      for (const prim of mesh.listPrimitives()) {
        const position = prim.getAttribute('POSITION');
        const uv = prim.getAttribute('TEXCOORD_0');
        const material = prim.getMaterial();

        const count = position.getCount();
        const local3 = [0, 0, 0];
        const pmin = [Infinity, Infinity, Infinity];
        const pmax = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < count; i += 1) {
          position.getElement(i, local3);
          const wp = transform(m, local3);
          for (let a = 0; a < 3; a += 1) {
            if (wp[a] < pmin[a]) pmin[a] = wp[a];
            if (wp[a] > pmax[a]) pmax[a] = wp[a];
            if (wp[a] < bounds.min[a]) bounds.min[a] = wp[a];
            if (wp[a] > bounds.max[a]) bounds.max[a] = wp[a];
          }
        }

        let uvReport = 'none';
        if (uv) {
          const el = [0, 0];
          const umin = [Infinity, Infinity];
          const umax = [-Infinity, -Infinity];
          for (let i = 0; i < uv.getCount(); i += 1) {
            uv.getElement(i, el);
            for (let a = 0; a < 2; a += 1) {
              if (el[a] < umin[a]) umin[a] = el[a];
              if (el[a] > umax[a]) umax[a] = el[a];
            }
          }
          uvReport = `u ${umin[0].toFixed(3)}…${umax[0].toFixed(3)}  v ${umin[1].toFixed(3)}…${umax[1].toFixed(3)}`;
        }

        console.log(
          `  mesh ${JSON.stringify(mesh.getName())} material ${JSON.stringify(material?.getName())}\n` +
            `      verts ${count}  world bbox ` +
            `x[${pmin[0].toFixed(3)}, ${pmax[0].toFixed(3)}] ` +
            `y[${pmin[1].toFixed(3)}, ${pmax[1].toFixed(3)}] ` +
            `z[${pmin[2].toFixed(3)}, ${pmax[2].toFixed(3)}]\n` +
            `      uv ${uvReport}`
        );
      }
    }

    node.listChildren().forEach((child) => visit(child, m));
  };

  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  scene.listChildren().forEach((node) => visit(node, identity));

  const size = bounds.max.map((v, i) => v - bounds.min[i]);
  console.log(
    `  -- scene bbox size: ${size.map((v) => v.toFixed(3)).join(' × ')} ` +
      `(tallest axis: ${['x', 'y', 'z'][size.indexOf(Math.max(...size))]})`
  );
  console.log(
    `  -- centre: ${bounds.min.map((v, i) => (v + size[i] / 2).toFixed(3)).join(', ')}`
  );
}

function multiply(a, b) {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      out[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function transform(m, v) {
  return [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14],
  ];
}
