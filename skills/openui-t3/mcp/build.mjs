import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { library } from './library.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);
await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
const bundle = await build({
  absWorkingDir: here, entryPoints: ['app.mjs'], bundle: true, write: false,
  minify: true, format: 'iife', target: 'es2020',
  define: { 'process.env.NODE_ENV': '"production"' },
});
const css = await readFile(require.resolve('@openuidev/react-ui/styles/index.css'), 'utf8');
const template = await readFile(new URL('./app.html', import.meta.url), 'utf8');
const html = template.replace('/* OPENUI_STYLES */', css.replace(/<\/style/gi, '<\\/style'))
  .replace('/* OPENUI_APP */', () => bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script'));
await writeFile(new URL('./dist/app.html', import.meta.url), html);
await writeFile(new URL('./dist/library.json', import.meta.url), JSON.stringify({
  root: library.root, schema: library.toJSONSchema(),
  prompt: library.prompt({ bindings: true, builtinFunctions: true }),
}));
console.log(`Built self-contained MCP App (${Math.round(Buffer.byteLength(html) / 1024)} KiB).`);
