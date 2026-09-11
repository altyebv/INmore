# Tenant configs

One JSON file per client. A file here plus a CDN prefix of GLBs and dielines
is the whole of onboarding — nothing in `packages/engine` should need to change
to add a client.

Empty until the config shape is settled. That happens after placement moves
from texture pixels into millimetres, because the move changes what a
decoration zone has to declare; writing configs before then would mean
rewriting them after.

What will live here:

| File | Purpose |
|---|---|
| `inmore.json` | The existing client, extracted from `apps/site/src/products/*.js`. Proves the separation works. |
| `_example.json` | A documented reference config for a new client. |

Validated at load by `@inmore/config-schema`. A config that fails validation
must produce a readable error naming the offending path, not a blank studio.
