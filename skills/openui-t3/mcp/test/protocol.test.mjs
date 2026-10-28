import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { readFile } from 'node:fs/promises';
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
    assert.equal(renderer._meta.ui.resourceUri, 'ui://openui/personal-v1.html');
    assert.equal(renderer.annotations.readOnlyHint, true);
    const instructions = await client.callTool({ name: 'get_openui_instructions', arguments: {} });
    assert.match(instructions.content[0].text, /root = Card/);
    assert.match(instructions.content[0].text, /ComparisonPanel\(/);
    const demo = await client.callTool({ name: 'render_openui', arguments: { template: 'demo', title: 'Connection test' } });
    assert.notEqual(demo.isError, true);
    assert.equal(demo.structuredContent.title, 'Connection test');
    assert.match(demo.structuredContent.code, /Send to agent/);
    assert.deepEqual(demo.structuredContent.selectionKeys, ['days', 'goal']);
    const second = await client.callTool({ name: 'render_openui', arguments: { template: 'demo' } });
    assert.notEqual(demo.structuredContent.interfaceId, second.structuredContent.interfaceId);
    const decision = await client.callTool({ name: 'render_openui', arguments: { template: 'decision' } });
    assert.notEqual(decision.isError, true, JSON.stringify(decision.content));
    assert.deepEqual(decision.structuredContent.selectionKeys, ['selectedOptions', 'reviewFocus']);
    assert.match(decision.structuredContent.code, /openui-personal-library-v1/);
    assert.equal(decision.structuredContent.library, 'openui-personal@1');
    for (const template of ['plan', 'snapshot']) {
      const result = await client.callTool({ name: 'render_openui', arguments: { template } });
      assert.notEqual(result.isError, true, JSON.stringify(result.content));
      assert.equal(result.structuredContent.library, 'openui-personal@1');
    }
    const legacyTool = tools.find(tool => tool.name === 'render_openui_legacy');
    assert.equal(legacyTool._meta.ui.resourceUri, 'ui://openui/interface.html');
    for (const file of ['mcp-demo', 'decision-review-legacy']) {
      const code = await readFile(new URL(`../../assets/${file}.openui`, import.meta.url), 'utf8');
      const result = await client.callTool({ name: 'render_openui_legacy', arguments: { code } });
      assert.notEqual(result.isError, true, JSON.stringify(result.content));
      assert.equal(result.structuredContent.library, 'openui-chat@0.18.1');
    }
    const legacyInstructions = await client.callTool({ name: 'get_openui_instructions', arguments: { library: 'legacy' } });
    assert.match(legacyInstructions.content[0].text, /BarChart\(/);
    assert.match(legacyInstructions.content[0].text, /LineChart\(/);
    const legacyResource = await client.readResource({ uri: legacyTool._meta.ui.resourceUri });
    assert.ok(Buffer.byteLength(legacyResource.contents[0].text) < 5 * 1024 * 1024);
    const mismatch = await client.callTool({ name: 'render_openui', arguments: { template: 'demo', library: 'legacy' } });
    assert.equal(mismatch.isError, true);
    const duplicate = decision.structuredContent.code.replace('"id": "plan-review"', '"id": "comparison"');
    assert.equal((await client.callTool({ name: 'render_openui', arguments: { code: duplicate } })).isError, true);
    const unbound = decision.structuredContent.code.replace(', $selectedOptions, $reviewFocus)', ', {}, "risks")');
    assert.equal((await client.callTool({ name: 'render_openui', arguments: { code: unbound } })).isError, true);
    const emptyPanel = decision.structuredContent.code.replace(/\[\{.*\}\], \$selectedOptions/, '[], $selectedOptions');
    assert.notEqual((await client.callTool({ name: 'render_openui', arguments: { code: emptyPanel } })).isError, true);
    const override = await client.callTool({ name: 'render_openui', arguments: {
      template: 'decision', code: 'root = Card([TextContent("Override")])',
    } });
    assert.deepEqual(override.structuredContent.selectionKeys, []);
    const custom = await client.callTool({ name: 'render_openui', arguments: { code: 'root = Card([TextContent("Custom response")])' } });
    assert.notEqual(custom.isError, true);
    assert.deepEqual(custom.structuredContent.selectionKeys, []);
    for (const code of ['root = InventedComponent("wrong")', 'root = Card([missing])', 'root = Card([Button("Bad", @InventedAction())])']) {
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
