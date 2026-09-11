# Tenant configs

One JSON file per client. A file here plus a CDN prefix of models is the whole
of onboarding — nothing in `packages/engine` changes to add a client.

```bash
npm run tenants:check            # validate every config
npm run tenants:check acme.json  # just one
```

| File | |
|---|---|
| `inmore.json` | The existing client. Generated from the modules it replaced, so it is provably the same configuration. |
| `_example.json` | A documented reference. Copy it, rename it, delete what you do not need. |

## What to know before editing

**Millimetres are the coordinate system.** Nothing declares a texture size. The
studio derives resolution from `print.physical`, at one density on both axes,
so a print area cannot describe pixels that disagree with its physical shape.

**Most models need `decal`, not `texture`.** A model authored for print has
flat unrolled UVs and can use `texture` with a `uv` window. A model from an
asset library usually cannot — its atlas was built for a photograph, and often
every face shares one patch, so artwork applied through it lands on all six
sides at once. Run `npm run models:uv` to find out which you have, then
`npm run models:axis` for the projection axis.

**A bad config fails loudly.** `assertValidTenantConfig` throws at load with
every problem named and located. That is deliberate: this file decides whether
a client's studio works at all, and it is edited by hand.
