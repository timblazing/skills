import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { fileURLToPath } from 'node:url';

test('stdio discovery, exact instructions, valid/invalid programs, and embedded resource', async () => {
  const client = new Client({ name: 'openui-protocol-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('../server.mjs', import.meta.url))],
    stderr: 'pipe',
  });
  await client.connect(transport);
  try {
    const { tools } = await client.listTools();
    const renderer = tools.find(tool => tool.name === 'render_openui');
    assert.equal(renderer._meta.ui.resourceUri, 'ui://openui/interface.html');
    assert.equal(renderer.annotations.readOnlyHint, true);
    const instructions = await client.callTool({ name: 'get_openui_instructions', arguments: {} });
    assert.match(instructions.content[0].text, /root = Card/);
    assert.match(instructions.content[0].text, /FormControl\(/);
    const demo = await client.callTool({ name: 'render_openui', arguments: { template: 'demo', title: 'Connection test' } });
    assert.notEqual(demo.isError, true);
    assert.equal(demo.structuredContent.title, 'Connection test');
    assert.match(demo.structuredContent.code, /Send to agent/);
    const custom = await client.callTool({ name: 'render_openui', arguments: { code: 'root = Card([TextContent("Custom response")])' } });
    assert.notEqual(custom.isError, true);
    for (const code of ['root = InventedComponent("wrong")', 'root = Card([missing])']) {
      const bad = await client.callTool({ name: 'render_openui', arguments: { code } });
      assert.equal(bad.isError, true);
      assert.match(bad.content[0].text, /Invalid OpenUI program/);
    }
    const empty = await client.callTool({ name: 'render_openui', arguments: {} });
    assert.equal(empty.isError, true);
    const oversized = await client.callTool({ name: 'render_openui', arguments: { code: 'x'.repeat(60_001) } });
    assert.equal(oversized.isError, true);
    const resource = await client.readResource({ uri: renderer._meta.ui.resourceUri });
    const view = resource.contents[0];
    assert.equal(view.mimeType, 'text/html;profile=mcp-app');
    assert.ok(Buffer.byteLength(view.text) < 5 * 1024 * 1024, 'T3 limits MCP App HTML resources to 5 MiB');
    assert.deepEqual(view._meta.ui.csp, { connectDomains: [], resourceDomains: [] });
    assert.match(view.text, /<!doctype html>/i);
    assert.doesNotMatch(view.text, /<script\b[^>]*\bsrc=|<link\b[^>]*\brel=["']stylesheet/i);
    assert.doesNotMatch(view.text, /\/\* OPENUI_(APP|STYLES) \*\//);
  } finally {
    await client.close();
  }
});
