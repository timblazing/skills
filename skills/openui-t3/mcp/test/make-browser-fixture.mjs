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
  const result = await client.callTool({ name: 'render_openui', arguments: { template: 'demo' } });
  const resource = await client.readResource({ uri: 'ui://openui/interface.html' });
  const bundle = await build({
    absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
    entryPoints: ['test/browser-host.mjs'], bundle: true, write: false, format: 'iife',
    minify: true, target: 'es2022',
  });
  const encode = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OpenUI MCP App local QA</title><style>html,body{margin:0;background:#111;color:#eee}iframe{display:block;width:100%;border:0;height:750px}</style></head><body><iframe id="app" title="OpenUI MCP App" sandbox="allow-scripts allow-forms"></iframe><script>window.fixtureResult=${encode(result)};window.fixtureHtml=${encode(resource.contents[0].text)};</script><script>${bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
  const destination = process.argv[2] ?? '/tmp/openui-mcp-browser-test.html';
  await writeFile(destination, html);
  console.log(destination);
} finally {
  await client.close();
}
