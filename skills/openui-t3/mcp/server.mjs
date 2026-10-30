import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createParser } from '@openuidev/lang-core';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { validateItems } from './selection.mjs';
import { randomUUID } from 'node:crypto';

const resourceUri = 'ui://openui/personal-v1.html';
const legacyUri = 'ui://openui/interface.html';
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

export async function createServer() {
  const profiles = {};
  for (const name of ['personal', 'legacy']) {
    const spec = JSON.parse(await read(`./dist/${name}.json`));
    profiles[name] = { spec, html: await read(`./dist/${name}.html`), parser: createParser(spec.schema, spec.root) };
  }
  const templates = {};
  for (const [name, file] of Object.entries({ demo: 'mcp-demo', decision: 'decision-review', plan: 'plan-review', snapshot: 'snapshot-review' })) templates[name] = await read(`../assets/${file}.openui`);
  const compactDemo = await read('../assets/compact-demo.openui');
  const server = new McpServer({ name: 'openui', version: '0.3.1' });
  server.registerTool('get_openui_instructions', {
    description: 'Get the exact OpenUI component signatures and language instructions before generating an interactive interface. Use render_openui to display the program inside T3 Code.',
    inputSchema: z.object({ library: z.enum(['personal', 'legacy']).default('personal') }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ library: profile }) => ({ content: [{ type: 'text', text: `Library: ${profiles[profile].spec.id}\n${profiles[profile].spec.prompt}\n\nT3 host rules: Use @ToAssistant for an agent handoff; T3 asks the user to approve each message. Use reactive state for local controls. Pass selectionKeys to render_openui to allow the user to share only named reactive values with their next normal message. Sharing is opt-in and starts no turn. Use stable item IDs as values. @ToAssistant context should contain only selected values, never an entire dataset. Query/Mutation have no toolProvider in this first version. Do not put credentials in the interface. Call render_openui with your completed program. Use template="demo" to test the connection, template="decision" for comparison, "plan" for checklist review, or "snapshot" for findings/service snapshots. New programs use library="personal" (openui-personal@1); existing full-library programs must use render_openui_legacy with library="legacy" (openui-chat@0.18.1). Read matching instructions before generating. A review selection is not approval to execute. Charts remain available in the legacy profile. Adapt assets/decision-review.openui for other decisions; keep stable IDs and explicit scope/provenance.` }] }));

  for (const toolProfile of ['personal', 'legacy']) registerAppTool(server, toolProfile === 'personal' ? 'render_openui' : 'render_openui_legacy', {
    title: 'OpenUI interface',
    description: (toolProfile === 'legacy' ? 'Legacy full-library renderer; use for existing programs and BarChart/LineChart. ' : 'Compact personal library renderer; templates decision, plan, snapshot, demo. ') + 'Render a real interactive OpenUI interface inside this T3 Code conversation. Use for forms, filtering, and decision widgets. Call get_openui_instructions first when generating code. template="demo" runs the connection test; template="decision" compares and shortlists proposed OpenUI workflows. Buttons with @ToAssistant can send a user-approved message back into this conversation.',
    inputSchema: z.object({
      title: z.string().min(1).max(140).default('OpenUI interface'),
      code: z.string().min(1).max(60_000).optional(),
      template: z.enum(['demo', 'decision', 'plan', 'snapshot']).optional(),
      library: z.enum(['personal', 'legacy']).optional().describe('Personal v1 for new programs; legacy preserves full-library positional signatures. Must match the tool: render_openui uses personal, render_openui_legacy uses legacy.'),
      selectionKeys: z.array(z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/).max(80)).max(20).optional()
        .describe('Explicit reactive state keys eligible for opt-in sharing with the next user message. Use stable item IDs as values; omit secrets.'),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    _meta: { ui: { resourceUri: toolProfile === 'personal' ? resourceUri : legacyUri } },
  }, async ({ title, code, template, selectionKeys, library: requested }) => {
    const profile = toolProfile;
    if (requested && requested !== profile) return { isError: true, content: [{ type: 'text', text: 'Use render_openui for personal and render_openui_legacy for legacy programs.' }] };
    if (!code && (template && template !== 'demo' && profile !== 'personal')) return { isError: true, content: [{ type: 'text', text: 'Template and library mismatch. Review templates require personal; legacy accepts demo or custom code.' }] };
    const program = code ?? (template === 'demo' && profile === 'personal' ? compactDemo : templates[template]);
    if (!program) return { isError: true, content: [{ type: 'text', text: 'Supply code or template="demo", "decision", "plan", or "snapshot".' }] };
    const { parser, spec: active } = profiles[profile];
    const result = parser.parse(program);
    const { incomplete, errors, unresolved, orphaned } = result.meta;
    if (!result.root || incomplete || errors.length || unresolved.length || orphaned.length) {
      return { isError: true, content: [{ type: 'text', text: `Invalid OpenUI program: ${JSON.stringify({ incomplete, errors, unresolved, orphaned })}` }] };
    }
    if (profile === 'personal') {
      const visit = node => {
        if (!node || typeof node !== 'object') return;
        if (['ComparisonPanel','ReviewChecklist','SnapshotTable'].includes(node.typeName)) {
          const problem = validateItems(node.props.items);
          if (problem) throw new Error(problem);
          if (node.props.selection?.k !== 'StateRef' || node.props.focus?.k !== 'StateRef') throw new Error('Bind selection and focus to declared $variables.');
        }
        for (const value of Object.values(node)) if (value && typeof value === 'object') visit(value);
      };
      try { visit(result.root); } catch (error) { return { isError: true, content: [{ type: 'text', text: `Invalid OpenUI program: ${error.message}` }] }; }
    }
    return {
      content: [{ type: 'text', text: `OpenUI interface: ${title}. This tool has an MCP App view. Messages from its buttons require T3 approval.\n\n${program}` }],
      _meta: { ui: { resourceUri: profile === 'legacy' ? legacyUri : resourceUri } },
      structuredContent: { title, code: program, library: active.id, interfaceId: randomUUID(),
        selectionKeys: selectionKeys ?? (!code && template === 'demo' ? ['days', 'goal'] : !code && ['decision', 'plan', 'snapshot'].includes(template) ? ['selectedOptions', 'reviewFocus'] : []) },
    };
  });
  for (const [profile, uri] of [['personal', resourceUri], ['legacy', legacyUri]]) registerAppResource(server, `OpenUI ${profile}`, uri, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
    contents: [{ uri, mimeType: RESOURCE_MIME_TYPE, text: profiles[profile].html,
      _meta: { ui: { csp: { connectDomains: [], resourceDomains: [] } } },
    }],
  }));
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await createServer();
  await server.connect(new StdioServerTransport());
}
