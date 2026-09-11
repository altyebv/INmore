# Draco decoder

Copied verbatim from `three/examples/jsm/libs/draco/gltf/`. The product models
are Draco-compressed, and this is the decoder that unpacks them.

It is vendored here rather than pulled from a CDN so the site has no runtime
dependency on a third-party host — the studio must work on a client's office
network without asking anyone's firewall for permission.

To update, re-copy from the `three` package after a version bump. Keep the
three files together; the loader resolves them relative to `/draco/`.
