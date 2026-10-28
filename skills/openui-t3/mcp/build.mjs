import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { library, libraryId } from './library.mjs';
import { library as legacy, libraryId as legacyId } from './legacy-library.mjs';
const here = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);
await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
const notice = await readFile(new URL('./COMPONENTS-LICENSE.txt', import.meta.url), 'utf8');
const template = await readFile(new URL('./app.html', import.meta.url), 'utf8');
const measurements = {};
for (const [profile, active, id] of [['personal', library, libraryId], ['legacy', legacy, legacyId]]) {
  const bundle = await build({
    absWorkingDir: here, entryPoints: ['app.mjs'], bundle: true, write: false,
    minify: true, format: 'iife', target: 'es2020', metafile: true,
    plugins: profile === 'legacy' ? [{ name: 'legacy-profile', setup(b) {
      b.onResolve({ filter: /^\.\/library\.mjs$/ }, () => ({ path: `${here}legacy-library.mjs` }));
    } }] : [],
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  const css = await readFile(profile === 'legacy' ? require.resolve('@openuidev/react-ui/styles/index.css') : new URL('./personal.css', import.meta.url), 'utf8');
  const html = template.replace('/* OPENUI_STYLES */', (`/* ${notice} */\n` + css).replace(/<\/style/gi, '<\\/style'))
    .replace('/* OPENUI_APP */', () => bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script'));
  if (Buffer.byteLength(html) >= 5 * 1024 * 1024) throw new Error(`${profile} exceeds T3 resource cap`);
  const spec = { id, root: active.root, schema: active.toJSONSchema(), prompt: active.prompt({ bindings: true, builtinFunctions: true }) };
  await writeFile(new URL(`./dist/${profile}.html`, import.meta.url), html);
  await writeFile(new URL(`./dist/${profile}.json`, import.meta.url), JSON.stringify(spec));
  await writeFile(new URL(`./dist/${profile}-metafile.json`, import.meta.url), JSON.stringify(bundle.metafile));
  measurements[profile] = { library: id, promptCharacters: spec.prompt.length, schemaDefinitions: Object.keys(spec.schema.$defs).length, htmlBytes: Buffer.byteLength(html), jsBytes: bundle.outputFiles[0].contents.length, cssBytes: Buffer.byteLength(css) };
}
// Preserve the local resource filename for existing tooling; server uses versioned profiles.
await writeFile(new URL('./dist/app.html', import.meta.url), await readFile(new URL('./dist/personal.html', import.meta.url)));
await writeFile(new URL('./dist/library.json', import.meta.url), await readFile(new URL('./dist/personal.json', import.meta.url)));
await writeFile(new URL('./dist/measurements.json', import.meta.url), JSON.stringify(measurements, null, 2));
console.log(JSON.stringify(measurements, null, 2));
