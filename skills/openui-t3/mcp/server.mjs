import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createParser } from '@openuidev/lang-core';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

const resourceUri = 'ui://openui/interface.html';
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

export async function createServer() {
  const [html, specText, demo] = await Promise.all([
    read('./dist/app.html'), read('./dist/library.json'), read('../assets/mcp-demo.openui'),
  ]);
  const spec = JSON.parse(specText);
  const parser = createParser(spec.schema, spec.root);
  const server = new McpServer({ name: 'openui', version: '0.2.0' });
  server.registerTool('get_openui_instructions', {
    description: 'Get the exact OpenUI component signatures and language instructions before generating an interactive interface. Use render_openui to display the program inside T3 Code.',
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async () => ({ content: [{ type: 'text', text: `${spec.prompt}\n\nT3 host rules: Use @ToAssistant for an agent handoff; T3 asks the user to approve each message. Use reactive state for local controls. Pass selectionKeys to render_openui to allow the user to share only named reactive values with their next normal message. Sharing is opt-in and starts no turn. Use stable item IDs as values. @ToAssistant context should contain only selected values, never an entire dataset. Query/Mutation have no toolProvider in this first version. Do not put credentials in the interface. Call render_openui with your completed program. Use template="demo" to test the connection.` }] }));

  registerAppTool(server, 'render_openui', {
    title: 'OpenUI interface',
    description: 'Render a real interactive OpenUI interface inside this T3 Code conversation. Use for forms, charts, filtering, and decision widgets. Call get_openui_instructions first when generating code. template="demo" runs the built-in button-to-agent test. Buttons with @ToAssistant can send a user-approved message back into this conversation.',
    inputSchema: z.object({
      title: z.string().min(1).max(140).default('OpenUI interface'),
      code: z.string().min(1).max(60_000).optional(),
      template: z.literal('demo').optional(),
      selectionKeys: z.array(z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/).max(80)).max(20).optional()
        .describe('Explicit reactive state keys eligible for opt-in sharing with the next user message. Use stable item IDs as values; omit secrets.'),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    _meta: { ui: { resourceUri } },
  }, async ({ title, code, template, selectionKeys }) => {
    const program = code ?? (template === 'demo' ? demo : undefined);
    if (!program) return { isError: true, content: [{ type: 'text', text: 'Supply code or template="demo".' }] };
    const result = parser.parse(program);
    const { incomplete, errors, unresolved, orphaned } = result.meta;
    if (!result.root || incomplete || errors.length || unresolved.length || orphaned.length) {
      return { isError: true, content: [{ type: 'text', text: `Invalid OpenUI program: ${JSON.stringify({ incomplete, errors, unresolved, orphaned })}` }] };
    }
    return {
      content: [{ type: 'text', text: `OpenUI interface: ${title}. This tool has an MCP App view. Messages from its buttons require T3 approval.\n\n${program}` }],
      structuredContent: { title, code: program, interfaceId: randomUUID(),
        selectionKeys: selectionKeys ?? (template === 'demo' && !code ? ['days', 'goal'] : []) },
    };
  });
  registerAppResource(server, 'OpenUI interface', resourceUri, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
    contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html,
      _meta: { ui: { csp: { connectDomains: [], resourceDomains: [] } } },
    }],
  }));
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await createServer();
  await server.connect(new StdioServerTransport());
}
