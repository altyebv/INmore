# Product models

Drop approved product models here as `.glb`. Each product's configuration in
`src/products/` points at its file by path, and the studio picks it up
automatically the next time it loads — no code change required.

## Expected for the paper cup

| | |
|---|---|
| File | `paper-cup.glb` |
| Printable mesh name | `CupBody` |
| Units | Metres (a real 8 oz cup is ~0.093 m tall) |
| Origin | Centre of the cup, at mid-height |
| Up axis | +Y |

## UV requirements

The mesh named `CupBody` must be unwrapped as the flat, unrolled print area:

- **U (horizontal)** runs 0 → 1 once around the cup. The seam sits at U = 0/1.
- **V (vertical)** runs 0 at the base to 1 at the rim.
- The wrap must be continuous — no mirrored or overlapping islands, or artwork
  will repeat or tear across the surface.

The printable window inside that UV space is defined per product in
`print.uv`, so a model whose UVs include the rim curl or base is fine: adjust
`print.uv` rather than re-unwrapping.

Every other mesh (rim, base, interior) keeps the materials it was authored
with and is never printed on.

## Export checklist

- Triangulated, single UV set, Y-up, metres
- Materials as glTF PBR (metallic-roughness)
- Textures embedded, Draco compression optional
- Keep the file under ~3 MB — it loads on mobile connections

## Until a model is added

The studio falls back to reference geometry that implements the same print
contract, so the experience is fully usable while models are being approved.
Only the paper cup has such a fallback; a product with no proxy simply loads
its model.

---

# Models currently here

| File | Product | Print mode |
|---|---|---|
| `bag.glb` | Twisted-handle shopping bag | decal, front panel |
| `gift-box.glb` | Rigid gift box | decal, lid |
| `package1.glb` | Flat-bottom takeaway package | decal, front panel |
| `paper-cup.glb` | *not yet supplied* — cup uses reference geometry | texture |

## Why these three print by projection

Their UV atlases were authored for photographic textures, not for print. On the
gift box and the package **every face maps to the same patch of UV space**, so
artwork applied through those UVs would appear on all six sides at once. Rather
than re-unwrapping someone else's model, the studio builds its own print
surface: it takes the triangles facing the panel being printed, projects them
flat, and lays the artwork over the product as a decal. See
`src/three/printSurface.js`.

This works and looks right, with two consequences worth knowing:

- The print area follows the model's silhouette rather than a real dieline, so
  the millimetre figures in each config are the physical product's, entered by
  hand, not measured from the mesh.
- Artwork cannot wrap around a corner. For these products it does not need to.

A model authored for print — flat unrolled UVs, one island per panel — should
use `print.mode: 'texture'` instead and will be more accurate. If you are
commissioning models, ask for that.

## Adding another model

1. `npm run models:inspect public/models/<file>.glb` — mesh and material names,
   scene size.
2. `npm run models:axis public/models/<file>.glb <materialName>` — which axis
   the printable panel faces.
3. `npm run models:uv public/models/<file>.glb <materialName>` — whether the
   UVs are a print layout or a shared atlas.
4. Copy an existing config in `src/products/` and fill in what you measured.

See `tools/README.md` for what each command reports.
