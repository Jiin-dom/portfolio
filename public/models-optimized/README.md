# Lossless desk models

The seven GLBs are self-contained replacements for the seven `MODEL_URLS` assets.
Original `public/models` files remain untouched, including the files reached by
the baseline snapshot's `public` junction. No runtime dependencies or decoder
downloads are needed. The camera strap remains present as `Camera_01_strap`, so
the existing `CAMERA_HIDE` behavior still applies.

## Reproduce

From the repository root, with Node.js and npm available:

```sh
npm exec --yes --package=@gltf-transform/core@4.2.1 --package=@gltf-transform/functions@4.2.1 --package=@gltf-transform/extensions@4.2.1 --package=gltf-validator@2.0.0-dev.3.10 -- node scripts/optimize-models.mjs
```

This command was verified on Windows with Node 22.22.3 and npm 10.9.8. Tooling
goes into npm's external cache; it does not update the repository's package files.
Initial tooling installation needs internet access, but loading the GLBs does not.
Alternatively, install the same packages into an external directory and set
`GLTF_TOOLS_DIR` to that directory, then run `node scripts/optimize-models.mjs`.

The script welds only bitwise-identical vertices, deduplicates with unique names
preserved, conservatively prunes unused resources, and writes GLB. Pruning keeps
leaf nodes, attributes, solid textures, and extras. Textures are embedded unchanged.
There is no simplification, quantization, mesh joining, transform baking, texture
recompression, Draco, Meshopt, or Basis conversion. Only smaller candidates are
written; the script reports the selected URLs without editing `FitModel.tsx`.

## Measurements

Original bytes include the glTF JSON and all distinct referenced buffers/images.
These are raw file sizes, not HTTP compressed transfer sizes.

| Model | Original bytes | GLB bytes | Saved bytes |
| --- | ---: | ---: | ---: |
| Camera | 2,440,404 | 2,436,080 | 4,324 |
| Lamp | 1,323,297 | 1,321,240 | 2,057 |
| Plant | 2,635,054 | 2,632,148 | 2,906 |
| Gamepad | 491,401 | 490,404 | 997 |
| Duck | 249,218 | 248,040 | 1,178 |
| Elephant | 537,126 | 536,148 | 978 |
| Succulent | 779,893 | 776,744 | 3,149 |
| **Total** | **8,456,393** | **8,440,804** | **15,589 (0.184%)** |

The referenced file count drops from 44 to 7 for an uncached load of all seven
models. Byte savings are small because these source assets already share vertices
efficiently and textures dominate their sizes. GLBs retain the hidden camera strap
and gamepad cord to preserve their existing runtime contracts.

## Validation and limits

Each output is written, reloaded, and checked against the source document for:

- Exact bytes for every expanded indexed vertex attribute, in triangle order,
  including positions, normals, UVs, and any other supplied attributes.
- Unchanged local position bounds, node names/hierarchy/transforms, mesh names,
  material settings/colors/texture references/samplers, and texture image hashes.
- A present camera strap node. Unchanged gamepad triangle positions and order
  preserve the mesh-local `GAMEPAD_CROP` test without changing its coordinates.
- Self-contained buffers/images and absence of compression/quantization decoders.
- Zero Khronos glTF validator errors. All 16 tangent-space warnings also occur in
  the originals; the optimizer preserves the original lack of explicit tangents.
- Unchanged SHA-256 hashes for every original input file.

`report.json` records per-file source hashes, output hashes, byte measurements,
selection decisions, and validator diagnostics. Both external-directory and
documented npm-exec tooling runs produced the same GLB hashes.

Browser screenshot comparison, loading/GPU timings, and scene performance checks
are left to the main scene performance work. Packaging alone does not establish a
frame-rate or load-time improvement; caching and HTTP compression affect results.
Keeping originals alongside outputs increases repository/static deployment size.
