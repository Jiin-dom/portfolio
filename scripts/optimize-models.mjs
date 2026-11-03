/**
 * Lossless, offline-at-runtime GLB packing. Run from the repository root:
 * npm exec --yes --package=@gltf-transform/core@4.2.1 --package=@gltf-transform/functions@4.2.1 --package=@gltf-transform/extensions@4.2.1 --package=gltf-validator@2.0.0-dev.3.10 -- node scripts/optimize-models.mjs
 *
 * Alternatively install those pinned packages outside the repo and set
 * GLTF_TOOLS_DIR to that directory (the parent of node_modules), then run node.
 * No repository dependencies or runtime decoders are added. Originals are read-only.
 * Only smaller, validated candidates are written. MODEL_URLS is maintained manually.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'public/models-optimized');
const packages = ['@gltf-transform/core', '@gltf-transform/functions', '@gltf-transform/extensions', 'gltf-validator'];
const search = [
  ...(process.env.GLTF_TOOLS_DIR ? [path.join(process.env.GLTF_TOOLS_DIR, 'package.json')] : []),
  ...(process.env.PATH || '').split(path.delimiter).filter(Boolean).map((bin) => path.resolve(bin, '../package.json')),
];
let requireTools;
for (const location of search) {
  const candidate = createRequire(location);
  try { packages.forEach((name) => candidate.resolve(name)); requireTools = candidate; break; } catch { /* next tooling location */ }
}
if (!requireTools) throw new Error('Tooling missing. Use the pinned npm exec command at the top of this script, or GLTF_TOOLS_DIR.');
const [{ NodeIO, PropertyType }, { weld, dedup, prune }, { ALL_EXTENSIONS }, validatorModule] = await Promise.all(
  packages.map((name) => import(pathToFileURL(requireTools.resolve(name)).href)),
);
const validator = validatorModule.default || validatorModule;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const models = {
  camera: 'Camera_01/Camera_01.gltf',
  lamp: 'desk_lamp_arm_01/desk_lamp_arm_01.gltf',
  plant: 'potted_plant_02/potted_plant_02.gltf',
  gamepad: 'gamepad/gamepad.gltf',
  duck: 'rubber_duck_toy/rubber_duck_toy.gltf',
  elephant: 'carved_wooden_elephant/carved_wooden_elephant.gltf',
  succulent: 'potted_plant_04/potted_plant_04.gltf',
};
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const canonical = (value) => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;

// Compare drawn vertex bytes in index order, not accessor/index identities.
// Welding may renumber vertices but must preserve every corner of every triangle.
function attributeSignature(accessor, indices) {
  const array = accessor.getArray();
  const stride = accessor.getElementSize() * array.BYTES_PER_ELEMENT;
  const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const digest = createHash('sha256');
  const count = indices?.length ?? accessor.getCount();
  for (let i = 0; i < count; i++) {
    const offset = (indices ? indices[i] : i) * stride;
    digest.update(bytes.subarray(offset, offset + stride));
  }
  return [accessor.getType(), accessor.getComponentType(), accessor.getNormalized(), count, digest.digest('hex')];
}

async function snapshot(document) {
  const { json, resources } = await io.writeJSON(document);
  const texture = (index) => {
    const { source, sampler, ...rest } = json.textures[index];
    const { uri, ...image } = json.images[source];
    return { ...rest, sampler: json.samplers?.[sampler] || {}, image: { ...image, sha256: hash(resources[uri]) } };
  };
  const material = (index) => {
    const resolve = (value, key = '') => {
      if (value && typeof value === 'object' && key.endsWith('Texture') && 'index' in value) {
        const { index: textureIndex, ...rest } = value;
        return { ...rest, texture: texture(textureIndex) };
      }
      if (Array.isArray(value)) return value.map((item) => resolve(item));
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, k)]));
      return value;
    };
    return index === undefined ? null : resolve(json.materials[index]);
  };
  const nodes = document.getRoot().listNodes();
  return canonical({
    // These static assets have no skinning/morph/animation contracts to optimize.
    nodes: nodes.map((node, index) => ({
      ...json.nodes[index],
      mesh: node.getMesh() ? {
        name: node.getMesh().getName(),
        extras: node.getMesh().getExtras(),
        primitives: node.getMesh().listPrimitives().map((primitive, p) => ({
          mode: primitive.getMode(),
          extras: primitive.getExtras(),
          bounds: [primitive.getAttribute('POSITION').getMin([]), primitive.getAttribute('POSITION').getMax([])],
          material: material(json.meshes[json.nodes[index].mesh].primitives[p].material),
          attributes: Object.fromEntries(primitive.listSemantics().map((semantic) => [semantic,
            attributeSignature(primitive.getAttribute(semantic), primitive.getIndices()?.getArray())])),
        })),
      } : null,
    })),
    scenes: json.scenes,
    scene: json.scene,
    extensionsUsed: json.extensionsUsed,
    extensionsRequired: json.extensionsRequired,
  });
}

await mkdir(output, { recursive: true });
const report = [];
for (const [name, relative] of Object.entries(models)) {
  const source = path.join(root, 'public/models', relative);
  const sourceBytes = await readFile(source);
  const sourceJSON = JSON.parse(sourceBytes);
  assert(!sourceJSON.animations?.length && !sourceJSON.skins?.length, `${name}: unexpected animation/skin`);
  assert(sourceJSON.meshes.every((mesh) => mesh.primitives.every((p) => !p.targets && (p.mode ?? 4) === 4)), `${name}: unexpected primitive`);
  const uris = [...new Set([...(sourceJSON.buffers || []), ...(sourceJSON.images || [])].map((item) => item.uri).filter((uri) => uri && !uri.startsWith('data:')))];
  const resources = await Promise.all(uris.map(async (uri) => {
    assert(!/^[a-z]+:/i.test(uri), 'External network resource prohibited');
    const file = path.resolve(path.dirname(source), decodeURIComponent(uri));
    const bytes = await readFile(file);
    return { uri, bytes: bytes.length, sha256: hash(bytes), file };
  }));
  const beforeBytes = sourceBytes.length + resources.reduce((total, item) => total + item.bytes, 0);
  const document = await io.read(source);
  const before = await snapshot(document);
  await document.transform(
    weld(),
    dedup({ keepUniqueNames: true }),
    prune({ keepLeaves: true, keepAttributes: true, keepSolidTextures: true, keepExtras: true }),
  );
  // Pack into one buffer; never join, flatten, recenter, simplify, quantize or transcode.
  const buffers = document.getRoot().listBuffers();
  for (const accessor of document.getRoot().listAccessors()) accessor.setBuffer(buffers[0]);
  for (const buffer of buffers.slice(1)) buffer.dispose();
  const bytes = await io.writeBinary(document);
  const packedJSON = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + new DataView(bytes.buffer, bytes.byteOffset).getUint32(12, true))).trim());
  assert(!packedJSON.buffers?.some((b) => b.uri) && !packedJSON.images?.some((i) => i.uri), `${name}: GLB must be self-contained`);
  assert(!(packedJSON.extensionsUsed || []).some((ext) => /draco|meshopt|quantization|basisu/i.test(ext)), `${name}: decoder/quantization extension`);
  assert.deepEqual(await snapshot(await io.readBinary(bytes)), before, `${name}: semantic fidelity changed`);
  if (name === 'camera') assert(before.nodes.some((node) => node.name === 'Camera_01_strap'), 'CAMERA_HIDE node missing');
  const validation = await validator.validateBytes(bytes, { uri: `${name}.glb`, maxIssues: 1000 });
  assert.equal(validation.issues.numErrors, 0, `${name}: glTF validation errors: ${JSON.stringify(validation.issues)}`);
  const originalValidation = await validator.validateString(sourceBytes.toString('utf8'), {
    uri: path.basename(source), maxIssues: 1000,
    externalResourceFunction: async (uri) => new Uint8Array(await readFile(path.resolve(path.dirname(source), decodeURIComponent(uri)))),
  });
  const warnings = (issues) => issues.messages.filter((message) => message.severity === 1).map((message) => message.code).sort();
  assert.deepEqual(warnings(validation.issues), warnings(originalValidation.issues), `${name}: validator warnings changed`);
  const selected = bytes.length < beforeBytes;
  if (selected) {
    await writeFile(path.join(output, `${name}.glb`), bytes);
    assert.deepEqual(await readFile(path.join(output, `${name}.glb`)), Buffer.from(bytes));
  }
  // Explicitly detect accidental writes to inputs, including shared/junction-backed files.
  assert.equal(hash(await readFile(source)), hash(sourceBytes));
  for (const resource of resources) assert.equal(hash(await readFile(resource.file)), resource.sha256);
  report.push({ name, source: `/models/${relative}`, url: selected ? `/models-optimized/${name}.glb` : `/models/${relative}`,
    beforeBytes, afterBytes: bytes.length, savedBytes: selected ? beforeBytes - bytes.length : 0,
    selected, sha256: hash(bytes), validation: validation.issues,
    originalValidation: { numErrors: originalValidation.issues.numErrors, numWarnings: originalValidation.issues.numWarnings },
    sourceFiles: [{ uri: path.basename(source), bytes: sourceBytes.length, sha256: hash(sourceBytes) }, ...resources.map(({ file, ...resource }) => resource)] });
}
await writeFile(path.join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.table(report.map(({ name, beforeBytes, afterBytes, savedBytes, selected }) => ({ name, beforeBytes, afterBytes, savedBytes, selected })));
console.log('All round-trip attribute, hierarchy, material, texture, source-integrity and glTF validation checks passed.');
