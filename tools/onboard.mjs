#!/usr/bin/env node
/**
 * Turn a GLB into a candidate product config.
 *
 *   node tools/onboard.mjs <file.glb> --height 0.34
 *   node tools/onboard.mjs <file.glb> --height 0.34 --material paper_material
 *   node tools/onboard.mjs <file.glb> --height 0.11 --id tumbler-500 --json
 *
 * ## Why this exists
 *
 * Onboarding a client is meant to be "write a config and upload models". For
 * the models half that was only true in the sense that no engine code had to
 * change — the actual work was running three separate inspection scripts,
 * reading three reports, and hand-tuning an axis, a threshold and an inset
 * until the print area looked right. A developer session per SKU.
 *
 * This does the reading. It picks the print mesh, works out which way the
 * panel faces, decides whether the model's UVs are a usable print layout, and
 * prints a config block ready to paste into a tenant file.
 *
 * ## The part that matters most
 *
 * Given the product's real height, it *measures* the printable panel in
 * millimetres instead of asking someone to estimate it.
 *
 * That is not a convenience. Millimetres are the studio's coordinate system,
 * and in the configs written before this tool existed they were entered by
 * hand and never checked — two of four were wrong, by 13% and 6%, which the
 * runtime only noticed because a later refactor added a warning for it. A
 * measured panel is right by construction.
 *
 * The one number a person still has to supply is the height, because a GLB
 * does not know how big the real object is. Everything else follows from it.
 */

import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

/* --- Arguments ---------------------------------------------------------------- */

const argv = process.argv.slice(2);
const flags = {};
const positional = [];

for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      i += 1;
    } else {
      flags[key] = true;
    }
  } else {
    positional.push(arg);
  }
}

const file = positional[0];

if (!file || flags.help) {
  console.log(`
Turn a GLB into a candidate product config.

  node tools/onboard.mjs <file.glb> --height <metres> [options]

  --height <m>      Required. The real product's height in metres. A GLB does
                    not know how big the real object is, and every millimetre
                    below is derived from this.
  --material <name> Which material carries the print. Defaults to the one with
                    the most surface area.
  --id <id>         Product id for the emitted config. Defaults to the filename.
  --threshold <n>   How square-on a triangle must be to count as the panel.
                    Defaults to 0.8; the report shows what other values give.
  --json            Print only the config block, for piping.
`);
  process.exit(file ? 0 : 1);
}

const heightM = Number(flags.height);
if (!Number.isFinite(heightM) || heightM <= 0) {
  console.error(
    'error: --height is required, in metres. An 8 oz cup is about 0.11; a shopping bag about 0.34.\n' +
      '       Every millimetre in the emitted config is derived from it, so a guess here is a guess everywhere.'
  );
  process.exit(1);
}

const threshold = Number(flags.threshold ?? 0.8);
const quiet = Boolean(flags.json);
const say = (...args) => {
  if (!quiet) console.log(...args);
};

/* --- Maths -------------------------------------------------------------------- */

const apply = (m, v) => [
  m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
  m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
  m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14],
];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
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

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const AXES = [
  { key: '+X', config: 'x', v: [1, 0, 0] },
  { key: '-X', config: '-x', v: [-1, 0, 0] },
  { key: '+Y', config: 'y', v: [0, 1, 0] },
  { key: '-Y', config: '-y', v: [0, -1, 0] },
  { key: '+Z', config: 'z', v: [0, 0, 1] },
  { key: '-Z', config: '-z', v: [0, 0, -1] },
];

/* --- Reading the model --------------------------------------------------------- */

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });

const document = await io.read(file);
const scene = document.getRoot().listScenes()[0];

/** Every triangle in the scene, in world space, grouped by material. */
const materials = new Map();
const sceneBounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };

function record(name, triangle, uv) {
  if (!materials.has(name)) {
    materials.set(name, { name, tris: [], uvs: [], area: 0, hasUV: true });
  }
  const entry = materials.get(name);
  entry.tris.push(triangle);
  if (uv) entry.uvs.push(uv);
  else entry.hasUV = false;
  entry.area += length(cross(sub(triangle[1], triangle[0]), sub(triangle[2], triangle[0]))) / 2;
}

function walk(node, matrix) {
  const m = multiply(matrix, trs(node));
  const mesh = node.getMesh();

  if (mesh) {
    for (const prim of mesh.listPrimitives()) {
      const name = prim.getMaterial()?.getName() ?? mesh.getName() ?? '(unnamed)';
      const position = prim.getAttribute('POSITION');
      if (!position) continue;
      const texcoord = prim.getAttribute('TEXCOORD_0');
      const indices = prim.getIndices();
      const count = indices ? indices.getCount() : position.getCount();
      const idx = (i) => (indices ? indices.getScalar(i) : i);

      for (let i = 0; i + 2 < count; i += 3) {
        const triangle = [0, 1, 2].map((k) => {
          const local = [0, 0, 0];
          position.getElement(idx(i + k), local);
          const world = apply(m, local);
          for (let a = 0; a < 3; a += 1) {
            if (world[a] < sceneBounds.min[a]) sceneBounds.min[a] = world[a];
            if (world[a] > sceneBounds.max[a]) sceneBounds.max[a] = world[a];
          }
          return world;
        });

        const uv = texcoord
          ? [0, 1, 2].map((k) => {
              const t = [0, 0];
              texcoord.getElement(idx(i + k), t);
              return t;
            })
          : null;

        record(name, triangle, uv);
      }
    }
  }

  node.listChildren().forEach((child) => walk(child, m));
}

scene.listChildren().forEach((node) => walk(node, IDENTITY));

if (!materials.size) {
  console.error(`error: no geometry found in ${file}.`);
  process.exit(1);
}

/* --- Picking the print surface -------------------------------------------------- */

const byArea = [...materials.values()].sort((a, b) => b.area - a.area);
const printMaterial = flags.material
  ? materials.get(flags.material)
  : byArea[0];

if (!printMaterial) {
  console.error(
    `error: no material named ${JSON.stringify(flags.material)}.\n` +
      `       Found: ${[...materials.keys()].join(', ')}`
  );
  process.exit(1);
}

/** Model units to metres, from the height the operator supplied. */
const sceneHeight = sceneBounds.max[1] - sceneBounds.min[1] || 1;
const unitsToMm = (heightM / sceneHeight) * 1000;

/* --- Which way does the panel face? --------------------------------------------- */

const tally = new Map(AXES.map((a) => [a.key, { axis: a, tris: 0, area: 0 }]));

for (const triangle of printMaterial.tris) {
  const e1 = sub(triangle[1], triangle[0]);
  const e2 = sub(triangle[2], triangle[0]);
  const c = cross(e1, e2);
  const n = normalise(c);
  const area = length(c) / 2;

  let best = null;
  let bestDot = -Infinity;
  for (const axis of AXES) {
    const d = dot(n, axis.v);
    if (d > bestDot) {
      bestDot = d;
      best = axis.key;
    }
  }
  const entry = tally.get(best);
  entry.tris += 1;
  entry.area += area;
}

const ranked = [...tally.values()].filter((e) => e.tris).sort((a, b) => b.area - a.area);
const totalArea = printMaterial.area || 1;

/*
 * Which face is the print surface is the one judgement this tool cannot make.
 *
 * Largest-by-area is right for a bag or a carton, where the printed panel is
 * also the biggest thing on the model. It is wrong for a rigid gift box: the
 * sides have more surface than the lid, but the lid is what gets printed,
 * because that is what the customer sees first. No amount of geometry tells
 * you that — it is a fact about the product, not the mesh.
 *
 * So the report lists the candidates with their measurements and says which
 * one it picked, and `--axis` overrides it.
 */
const chosenKey = flags.axis
  ? String(flags.axis).toUpperCase().replace(/^([XYZ])$/, '+$1')
  : null;

const facing = chosenKey
  ? ranked.find((e) => e.axis.key === chosenKey)
  : ranked[0];

if (!facing) {
  console.error(
    `error: no faces point ${chosenKey}. Candidates: ${ranked.map((r) => r.axis.key).join(', ')}`
  );
  process.exit(1);
}

/*
 * Up, for the chosen panel.
 *
 * A vertical panel — a bag front, a cup wrap — is read with the world's up. A
 * horizontal one is a lid seen from above, where "up" in the artwork is the
 * far edge of the box rather than the sky.
 */
const horizontal = facing.axis.key === '+Y' || facing.axis.key === '-Y';
const up = horizontal ? '-z' : 'y';
const upVector = horizontal ? [0, 0, -1] : [0, 1, 0];

/* --- Measuring the panel --------------------------------------------------------- */

/** Triangles square-on enough to count, at a given threshold. */
function panelAt(t) {
  const right = normalise(cross(upVector, facing.axis.v));
  const trueUp = normalise(cross(facing.axis.v, right));

  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  let kept = 0;
  let area = 0;

  for (const triangle of printMaterial.tris) {
    const e1 = sub(triangle[1], triangle[0]);
    const e2 = sub(triangle[2], triangle[0]);
    const c = cross(e1, e2);
    if (dot(normalise(c), facing.axis.v) < t) continue;

    kept += 1;
    area += length(c) / 2;
    for (const point of triangle) {
      const u = dot(point, right);
      const v = dot(point, trueUp);
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
  }

  if (!kept) return null;
  const spanU = maxU - minU;
  const spanV = maxV - minV;
  return {
    threshold: t,
    tris: kept,
    share: area / totalArea,
    widthMm: spanU * unitsToMm,
    heightMm: spanV * unitsToMm,
    aspect: spanV ? spanU / spanV : 1,
  };
}

const panel = panelAt(threshold);
const sweep = [...new Set([0.5, 0.65, 0.8, 0.9, 0.95, threshold])]
  .sort((a, b) => a - b)
  .map(panelAt)
  .filter(Boolean);

if (!panel) {
  console.error(
    `error: no triangles face ${facing.axis.key} at threshold ${threshold}.\n` +
      '       Try a lower --threshold, or a different --material.'
  );
  process.exit(1);
}

/* --- Are the UVs a print layout? -------------------------------------------------- */

/**
 * The question that decides `mode`.
 *
 * A model authored for print unwraps each panel to its own patch of UV space.
 * A model from an asset library usually maps every face to the same patch,
 * because its UVs were built for a photograph — and artwork applied through
 * those UVs appears on all six sides at once.
 *
 * The test: take the two largest facing groups and compare their UV bounding
 * boxes. If they sit on top of each other, the faces are sharing one patch.
 */
function uvVerdict() {
  if (!printMaterial.hasUV || !printMaterial.uvs.length) {
    return { mode: 'decal', reason: 'the print material has no UV coordinates at all' };
  }

  const groups = new Map();
  printMaterial.tris.forEach((triangle, i) => {
    const uv = printMaterial.uvs[i];
    if (!uv) return;
    const n = normalise(cross(sub(triangle[1], triangle[0]), sub(triangle[2], triangle[0])));
    let best = null;
    let bestDot = -Infinity;
    for (const axis of AXES) {
      const d = dot(n, axis.v);
      if (d > bestDot) {
        bestDot = d;
        best = axis.key;
      }
    }
    if (!groups.has(best)) {
      groups.set(best, { key: best, count: 0, min: [Infinity, Infinity], max: [-Infinity, -Infinity] });
    }
    const g = groups.get(best);
    g.count += 1;
    for (const [u, v] of uv) {
      if (u < g.min[0]) g.min[0] = u;
      if (u > g.max[0]) g.max[0] = u;
      if (v < g.min[1]) g.min[1] = v;
      if (v > g.max[1]) g.max[1] = v;
    }
  });

  /*
   * Compare every significant pair, not just the two largest.
   *
   * Taking the top two by triangle count gets this wrong on exactly the models
   * it matters for. A bag's two side gussets are the biggest groups and are
   * legitimately unwrapped apart, so the pair test says "separate regions" and
   * recommends `texture` — while the front and back panels, which are what
   * anyone actually prints on, are sitting on top of each other. One
   * overlapping pair anywhere is enough to make the authored UVs unusable.
   */
  const significant = [...groups.values()]
    .filter((g) => g.count >= printMaterial.tris.length * 0.02)
    .sort((a, b) => b.count - a.count);

  if (significant.length < 2) {
    return { mode: 'texture', reason: 'all faces point the same way, so there is nothing to overlap' };
  }

  const overlap = (a, b) => {
    const w = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
    const h = Math.min(a.max[1], b.max[1]) - Math.max(a.min[1], b.min[1]);
    if (w <= 0 || h <= 0) return 0;
    const areaA = (a.max[0] - a.min[0]) * (a.max[1] - a.min[1]);
    const areaB = (b.max[0] - b.min[0]) * (b.max[1] - b.min[1]);
    return (w * h) / Math.min(areaA || 1, areaB || 1);
  };

  let worst = { share: 0, a: significant[0], b: significant[1] };
  for (let i = 0; i < significant.length; i += 1) {
    for (let j = i + 1; j < significant.length; j += 1) {
      const share = overlap(significant[i], significant[j]);
      if (share > worst.share) worst = { share, a: significant[i], b: significant[j] };
    }
  }

  return worst.share > 0.5
    ? {
        mode: 'decal',
        reason:
          `faces pointing ${worst.a.key} and ${worst.b.key} share ` +
          `${(worst.share * 100).toFixed(0)}% of the same UV patch`,
        share: worst.share,
      }
    : {
        mode: 'texture',
        reason:
          `no two facing groups overlap in UV space ` +
          `(worst pair, ${worst.a.key} and ${worst.b.key}, shares ${(worst.share * 100).toFixed(0)}%)`,
        share: worst.share,
      };
}

const uv = uvVerdict();

/* --- The candidate config ---------------------------------------------------------- */

const id = flags.id ?? path.basename(file).replace(/\.glb$/i, '');
const stockMeshes = byArea.slice(0, 2).map((m) => m.name);

const round = (n, places = 1) => Number(n.toFixed(places));

const product = {
  id,
  slug: id,
  status: 'live',
  order: 10,
  name: { en: 'TODO', ar: 'TODO' },
  category: { en: 'TODO', ar: 'TODO' },

  model: {
    url: `models/${path.basename(file)}`,
    printMeshName: printMaterial.name,
    stockMeshes: [printMaterial.name],
    heightM,
  },

  camera: {
    position: horizontal ? [0.55, 0.62, 1] : [0.45, 0.28, 1],
    target: [0, 0, 0],
    fov: 26,
    framing: 1.6,
  },

  print: {
    mode: uv.mode,
    ...(uv.mode === 'decal'
      ? {
          projection: {
            axis: facing.axis.config,
            up,
            threshold: round(threshold, 2),
            inset: 0.06,
            liftMm: 0.4,
          },
        }
      : { uv: { x: 0, y: 0, width: 1, height: 1 } }),

    physical: {
      widthMm: round(panel.widthMm),
      heightMm: round(panel.heightMm),
      bleedMm: 3,
      safeMm: { top: 8, right: 8, bottom: 8, left: 8 },
    },

    wrap: false,
    stock: 'TODO',
    stockPalette: ['TODO'],
    defaultTransform: { width: 0.55, x: 0, y: 0, rotation: 0, repeat: 1 },
  },

  material: { roughness: 0.75, metalness: 0, envMapIntensity: 0.9 },
};

/* --- Reporting ----------------------------------------------------------------------- */

if (quiet) {
  console.log(JSON.stringify(product, null, 2));
  process.exit(0);
}

const name = path.basename(file);
const sizeMm = [0, 1, 2].map((a) => (sceneBounds.max[a] - sceneBounds.min[a]) * unitsToMm);

say(`\n${name}\n${'─'.repeat(name.length)}`);
say(`  ${printMaterial.tris.length} triangles across ${materials.size} material(s)`);
say(
  `  at ${heightM} m tall, the whole object measures ` +
    `${sizeMm.map((n) => round(n)).join(' × ')} mm`
);

say('\nMaterials, by surface area');
for (const m of byArea) {
  const mark = m === printMaterial ? '→' : ' ';
  say(
    `  ${mark} ${m.name.padEnd(28)} ${String(m.tris.length).padStart(6)} tris` +
      `  ${((m.area / [...materials.values()].reduce((s, x) => s + x.area, 0)) * 100).toFixed(0)}%` +
      (m === printMaterial && !flags.material ? '   (chosen: largest)' : '')
  );
}

say(
  `\nPanel — faces ${facing.axis.key}, ` +
    `${((facing.area / totalArea) * 100).toFixed(0)}% of the material` +
    (chosenKey ? '  (you chose this with --axis)' : '  (chosen: largest)')
);

if (ranked.length > 1 && !chosenKey) {
  say('\n  Other candidates. The largest face is not always the printed one —');
  say('  a rigid box prints on its lid, which is smaller than its sides.');
  for (const other of ranked.slice(0, 4)) {
    if (other === facing) continue;
    say(
      `    ${other.axis.key}  ${String(other.tris).padStart(5)} tris  ` +
        `${((other.area / totalArea) * 100).toFixed(0).padStart(3)}% of surface` +
        `    --axis ${other.axis.config}`
    );
  }
}
say('  threshold   tris   of surface   measured panel');
for (const row of sweep) {
  const mark = row.threshold === threshold ? '→' : ' ';
  say(
    `  ${mark} ${row.threshold.toFixed(2)}   ${String(row.tris).padStart(5)}` +
      `   ${(row.share * 100).toFixed(0).padStart(6)}%` +
      `      ${round(row.widthMm)} × ${round(row.heightMm)} mm`
  );
}
say(
  '\n  Raise the threshold to keep print off gussets and curves; lower it if the\n' +
    '  panel is coming out smaller than the real printable area.'
);

say(`\nUV layout — ${uv.mode}`);
say(`  ${uv.reason}.`);
if (uv.mode === 'decal') {
  say('  The studio will build its own print surface by projecting the panel.');
} else {
  say('  The authored UVs are usable as a print layout. Set print.uv to the');
  say('  printable window inside them if the whole square is not printable.');
}

say('\nStill to fill in by hand');
say('  • name / category / summary, in every locale the tenant declares');
say('  • stock and stockPalette — ids from the tenant\'s own stock table');
say('  • safeMm, if the product needs more clearance on one edge than another');
say(`  • bleedMm, if the press wants something other than 3 mm`);
if (stockMeshes.length > 1) {
  say(`  • whether "${stockMeshes[1]}" should also take the stock colour, or stay as authored`);
}

say('\nConfig block\n');
console.log(JSON.stringify(product, null, 2));

say(
  `\nPaste into a tenant's "products" array, then check it:\n` +
    `  npm run tenants:check\n`
);
