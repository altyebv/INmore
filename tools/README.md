# Model tools

Onboarding a client is meant to be "write a config, upload models". The config
half is `tenants/*.json` and `npm run tenants:check`. This is the models half.

## `npm run models:onboard <file.glb> -- --height <metres>`

One command. Reads the model, picks the print mesh, works out which way the
panel faces, decides whether the authored UVs are usable as a print layout, and
prints a config block ready to paste into a tenant file.

```bash
npm run models:onboard apps/site/public/models/bag.glb -- --height 0.34
npm run models:onboard model.glb -- --height 0.19 --axis y --threshold 0.85

# --json emits the config block alone, for piping. Call node directly for this
# one: npm prints its own banner to stdout and would corrupt the output.
node tools/onboard.mjs model.glb --height 0.11 --id tumbler-500 --json
```

| | |
|---|---|
| `--height <m>` | **Required.** The real product's height in metres. |
| `--axis <a>` | Which way the printed panel faces. Defaults to the largest. |
| `--material <name>` | Which material carries the print. Defaults to the largest. |
| `--threshold <n>` | How square-on a triangle must be to count. Default `0.8`. |
| `--id <id>` | Product id. Defaults to the filename. |
| `--json` | Only the config block, for piping. |

### Why `--height` is the one thing you must supply

A GLB does not know how big the real object is, and **every millimetre in the
output is derived from that number.** Give it the product's real height and the
printable panel is *measured* rather than estimated.

That matters more than it sounds. Millimetres are the studio's coordinate
system — placement, the safe area, and the print-ready export all resolve
against them. In the four configs written before this tool existed they were
entered by hand and never checked. Measured against the models:

| product | config said | model says | |
|---|---|---|---|
| shopping bag | 190 × 240 | 199 × 284 | 18% short |
| rigid gift box (lid) | 220 × 220 | 171 × 171 | 29% over |
| takeaway package | 180 × 300 | 187 × 294 | close |

The runtime warns when a panel's *aspect* disagrees with its config, which
caught the bag and the package. It could not catch the gift box: its error is
uniform, so the aspect is unchanged and only the absolute size is wrong. This
tool catches both, because it measures instead of comparing ratios.

A disagreement means one of two things, and it is worth knowing which: either
the declared millimetres are wrong, or the model is not proportional to the
real product. The studio renders the model and the press prints the dieline, so
if those two disagree, what the customer approved is not what arrives.

### The one judgement it cannot make

Which face is the print surface. Largest-by-area is right for a bag or a
carton, where the printed panel is also the biggest thing on the model. It is
wrong for a rigid gift box — the sides have more surface than the lid, but the
lid is what gets printed, because that is what the customer sees first. No
amount of geometry tells you that.

So it lists the candidates with their measurements and says which one it
picked. Override with `--axis`.

## The originals

`models:onboard` replaces the everyday use of these three, which remain for
when you want to look at one thing closely.

| | |
|---|---|
| `npm run models:inspect <file.glb>` | Node hierarchy, mesh and material names, world bounds, UV ranges. |
| `npm run models:axis <file.glb> <material>` | Which way faces point, in world space, by surface area. |
| `npm run models:uv <file.glb> <material> [out.png]` | UV bounds per facing group, optionally as a picture of the atlas. |

## Not built, deliberately

A live tuning page — load a GLB, drag a threshold slider, watch the decal move.
It was in the plan and it is not here, because the threshold sweep and the axis
candidates in the report answer the same questions without a second app to
maintain. What it would still add is *seeing* the decal on the model before
committing to a config; until that is painful enough to want, pasting the block
into a tenant file and opening the studio is the same loop with fewer moving
parts.
