import { App, applyDocumentTheme, applyHostStyleVariables } from '@modelcontextprotocol/ext-apps';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Renderer } from '@openuidev/react-lang';
import { library } from './library.mjs';

const app = new App({ name: 'OpenUI for T3', version: '0.1.0' }, {});
const root = createRoot(document.getElementById('root'));
const status = document.getElementById('status');
const error = document.getElementById('error');
let pending = false;
let connected = false;
window.openuiDiagnostics = { errors: [], parse: null, state: {}, actions: [] };
window.openuiLibraryPrompt = library.prompt({ bindings: true, builtinFunctions: true });
const fail = (message) => { error.hidden = false; error.textContent = String(message); };

function applyContext(context) {
  if (context?.theme) applyDocumentTheme(context.theme);
  if (context?.styles?.variables) applyHostStyleVariables(context.styles.variables);
}

async function onAction(event) {
  if (pending) return;
  if (!connected) { fail('The host connection is not ready. Try again after it connects.'); return; }
  window.openuiDiagnostics.actions.push(event);
  pending = true;
  error.hidden = true;
  try {
    if (event.type === 'continue_conversation') {
      if (!app.getHostCapabilities()?.message) throw new Error('This host does not support messages from apps.');
      const text = event.humanFriendlyMessage?.trim();
      if (!text) throw new Error('The action did not include a message.');
      const details = { context: event.params?.context, formName: event.formName, formState: event.formState };
      status.textContent = 'Waiting for your approval in T3…';
      const result = await app.sendMessage({ role: 'user', content: [{
        type: 'text', text: `${text}\n\nOpenUI interface values:\n${JSON.stringify(details, null, 2)}`,
      }] });
      if (result.isError) throw new Error('T3 did not accept the message.');
      status.textContent = 'Message sent to the conversation.';
    } else if (event.type === 'open_url') {
      await app.openLink({ url: event.params.url });
      status.textContent = 'Link opened.';
    } else {
      throw new Error(`Unsupported action: ${event.type}`);
    }
  } catch (cause) {
    status.textContent = 'The action was not confirmed. Check the conversation before retrying.';
    fail(cause instanceof Error ? cause.message : cause);
  } finally {
    pending = false;
  }
}

function render(args, isStreaming = false) {
  if (typeof args?.code !== 'string') return;
  if (typeof args.title === 'string') document.title = args.title;
  root.render(React.createElement(Renderer, {
    response: args.code, library, isStreaming, onAction,
    onParseResult: result => { window.openuiDiagnostics.parse = result; },
    onStateUpdate: state => { window.openuiDiagnostics.state = state; },
    onError: errors => {
      window.openuiDiagnostics.errors = errors;
      if (errors.length) fail(JSON.stringify(errors, null, 2));
    },
  }));
}

// Register handlers before connect so the first tool notifications cannot be missed.
app.ontoolinputpartial = ({ arguments: args }) => render(args, true);
app.ontoolinput = ({ arguments: args }) => render(args);
app.ontoolresult = (result) => {
  if (result.isError) { fail('OpenUI rejected this program. Ask the agent to correct it.'); return; }
  render(result.structuredContent);
};
app.onhostcontextchanged = applyContext;
app.onteardown = async () => { root.unmount(); return {}; };
app.connect().then(() => {
  connected = true;
  applyContext(app.getHostContext());
}).catch(cause => fail(`Unable to connect to the host: ${cause.message}`));
