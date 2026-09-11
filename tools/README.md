# Model tools

Command-line helpers for onboarding a product model. Run them before writing a
product config — the numbers they report are exactly what the config needs, and
they turn "which way round is this model?" into a measurement rather than a
guess and a rebuild.

They read Draco-compressed GLBs directly, so they work on the files as
delivered.

## `npm run models:inspect <file.glb>`

Decoded geometry: node hierarchy, mesh and material names, world-space bounding
boxes, UV ranges, and the overall scene size.

Gives you `model.printMeshName` (match on the material name — imported meshes
are usually called `Object_3`) and `model.heightM` (the scene's tallest axis,
converted to the real product's height in metres).

## `npm run models:axis <file.glb> <materialName>`

Which way the faces point, in **world** space, with the share of surface area
each direction holds.

Gives you `print.projection.axis`. Imported models carry nested rotations from
their authoring tool, so the front face in the file is rarely the front face in
the scene — the largest-area axis is almost always the panel you want.

## `npm run models:uv <file.glb> <materialName> [out.png]`

Groups the material's triangles by facing direction and reports the UV bounds
of each, optionally writing a colour-coded picture of the atlas.

Use it to decide `print.mode`. If each direction occupies its own region, the
model has a usable print layout and can use `mode: 'texture'` with a `print.uv`
window. If every direction reports the same bounds and the areas sum to well
over 100%, the faces share one patch of UV space — artwork applied through
those UVs appears on every face at once, and the product needs
`mode: 'decal'`.

All three of the models delivered so far are the second kind.
