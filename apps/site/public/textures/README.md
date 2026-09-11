# Textures

Substrate and finish maps that describe how a stock behaves under light —
paper tooth, kraft fibre, soft-touch lamination, foil.

Reference them from a product's `material` block in `src/products/`. Nothing
here is required: products render correctly without any of these files.

Keep maps at 1024 px or 2048 px, power-of-two, and prefer a single packed
roughness/normal pair over several large images.
