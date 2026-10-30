import { build } from 'esbuild';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const client = new Client({ name: 'OpenUI browser QA', version: '1.0.0' });
await client.connect(new StdioClientTransport({
  command: process.execPath, args: [fileURLToPath(new URL('../server.mjs', import.meta.url))], stderr: 'pipe',
}));
try {
  const result = await client.callTool({ name: process.argv[4] ?? 'render_openui', arguments: { template: process.argv[3] ?? 'demo' } });
  if (result.isError) throw new Error(JSON.stringify(result.content));
  const { tools } = await client.listTools();
  const renderer = tools.find(tool => tool.name === (process.argv[4] ?? 'render_openui'));
  const resource = await client.readResource({ uri: renderer._meta.ui.resourceUri });
  const bundle = await build({
    absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
    entryPoints: ['test/browser-host.mjs'], bundle: true, write: false, format: 'iife',
    minify: true, target: 'es2022',
  });
  const encode = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
  // Test-only diagnostics relay; never included in production resources.
  const instrumented = resource.contents[0].text.replace('</body>', `<script>setInterval(() => parent.postMessage({qaDiagnostics: {errors: window.openuiDiagnostics?.errors, state: window.openuiDiagnostics?.state, height: innerHeight, scrollHeight: document.documentElement.scrollHeight, width: innerWidth, scrollWidth: document.documentElement.scrollWidth, edges: Object.fromEntries(['#root h1', '#root h2', '.selection-summary', '#sharing', '#status:not(:empty)', '#error:not([hidden])'].map(s => [s, document.querySelector(s)?.getBoundingClientRect().left]).filter(([, v]) => v !== undefined))}}, '*'), 100)</script></body>`);
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OpenUI MCP App local QA</title><style>html,body{margin:0;background:#111;color:#eee}iframe{display:block;width:100%;border:0;height:750px}</style></head><body><iframe id="app" title="OpenUI MCP App" sandbox="allow-scripts allow-forms"></iframe><script>window.fixtureResult=${encode(result)};window.fixtureHtml=${encode(instrumented)};</script><script>${bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
  const destination = process.argv[2] ?? '/tmp/openui-mcp-browser-test.html';
  await writeFile(destination, html);
  console.log(destination);
} finally {
  await client.close();
}
