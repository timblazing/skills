import { App, applyDocumentTheme, applyHostStyleVariables } from '@modelcontextprotocol/ext-apps';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Renderer } from '@openuidev/react-lang';
import { library } from './library.mjs';
import { envelope, selectState, actionSelection, contextQueue } from './handoff.mjs';

const app = new App({ name: 'OpenUI for T3', version: '0.2.0' }, {});
const view = document.getElementById('root');
const root = createRoot(view);
const status = document.getElementById('status');
const error = document.getElementById('error');
const share = document.getElementById('share');
const sharingStatus = document.getElementById('sharing-status');
const preview = document.getElementById('selection-preview');
let pending = false, connected = false, sharing = false, timer, disposed = false;
let identity = crypto.randomUUID(), title = 'OpenUI interface', keys = [], currentCode;
window.openuiDiagnostics = { errors: [], parse: null, state: {}, actions: [] };
window.openuiLibraryPrompt = library.prompt({ bindings: true, builtinFunctions: true });
const fail = message => { error.hidden = false; error.textContent = String(message); };
const queueContext = contextQueue(text => app.updateModelContext({ content: [{ type: 'text', text }] }, { timeout: 10_000 }));
function selected() { return selectState(window.openuiDiagnostics.state, keys); }
function currentEnvelope() { return envelope(identity, title, selected()); }
function updatePreview() {
  try { preview.textContent = JSON.stringify(currentEnvelope(), null, 2); }
  catch (cause) { preview.textContent = cause.message; }
}
function publish() {
  clearTimeout(timer);
  if (!connected || disposed) return;
  try {
    const wasSharing = sharing;
    const text = sharing ? JSON.stringify(currentEnvelope()) : JSON.stringify(envelope(identity, title, {}));
    sharingStatus.textContent = sharing ? 'Updating selection…' : 'Clearing shared selection…';
    queueContext(text, () => {
      const latest = sharing ? JSON.stringify(currentEnvelope()) : JSON.stringify(envelope(identity, title, {}));
      if (sharing !== wasSharing || text !== latest) return;
      sharingStatus.textContent = sharing ? 'Selection available to your next message.' : 'Selection cleared. Sharing is off.';
    }, cause => {
      sharingStatus.textContent = 'Sharing could not be confirmed. Check before using this selection.';
      fail(cause.message);
    });
  } catch (cause) {
    // Replace a previously shared selection with an empty envelope, never leave it silently stale.
    sharing = false;
    share.textContent = 'Share selection';
    share.setAttribute('aria-pressed', 'false');
    queueContext(JSON.stringify(envelope(identity, title, {})), () => {
      sharingStatus.textContent = 'Selection cleared. Sharing is off.';
    }, () => { sharingStatus.textContent = 'Could not clear the previous selection.'; });
    fail(cause.message);
  }
}
share.addEventListener('click', () => {
  sharing = !sharing;
  share.textContent = sharing ? 'Stop sharing' : 'Share selection';
  share.setAttribute('aria-pressed', String(sharing));
  error.hidden = true;
  publish();
});
function applyContext(context) {
  if (context?.theme) applyDocumentTheme(context.theme);
  if (context?.styles?.variables) applyHostStyleVariables(context.styles.variables);
}
async function onAction(event) {
  if (pending) return;
  if (!connected) { fail('The host connection is unavailable. Reopen the interface to reconnect.'); return; }
  window.openuiDiagnostics.actions.push(event);
  pending = true;
  view.inert = true;
  view.setAttribute('aria-busy', 'true');
  share.disabled = true;
  error.hidden = true;
  try {
    if (event.type === 'continue_conversation') {
      if (!app.getHostCapabilities()?.message) throw new Error('This host does not support messages from apps.');
      const text = event.humanFriendlyMessage?.trim();
      if (!text || text.length > 2_000) throw new Error('Use a message between 1 and 2,000 characters.');
      const details = envelope(identity, title, actionSelection(event));
      status.textContent = 'Waiting for your approval in T3…';
      const result = await app.sendMessage({ role: 'user', content: [{
        type: 'text', text: `${text}\n\nOpenUI selection: ${JSON.stringify(details)}`,
      }] }, { timeout: 60_000 });
      if (result.isError) throw new Error('T3 did not accept the message.');
      status.textContent = 'Message sent to the conversation.';
    } else if (event.type === 'open_url') {
      await app.openLink({ url: event.params.url });
      status.textContent = 'Link opened.';
    } else { throw new Error(`Unsupported action: ${event.type}`); }
  } catch (cause) {
    // Only explicit rejection is a decline; transport errors can mean delivery is uncertain.
    status.textContent = /declined|rejected by (the )?user/i.test(cause.message)
      ? 'Message declined. Nothing was sent.'
      : 'Delivery was not confirmed. Check the conversation before retrying.';
    fail(cause instanceof Error ? cause.message : cause);
  } finally {
    pending = false;
    view.inert = false;
    view.setAttribute('aria-busy', 'false');
    share.disabled = !connected || !keys.length || !app.getHostCapabilities()?.updateModelContext;
  }
}
function render(args, isStreaming = false) {
  if (typeof args?.code !== 'string') return;
  // Completed tool results carry a unique identity. Partial input does not enable sharing.
  if (args.interfaceId) identity = args.interfaceId;
  if (typeof args.title === 'string') { title = args.title; document.title = title; }
  keys = args.selectionKeys ?? [];
  share.disabled = pending || !connected || !keys.length || !app.getHostCapabilities()?.updateModelContext;
  if (!sharing && connected) sharingStatus.textContent = !app.getHostCapabilities()?.updateModelContext
    ? 'Selection sharing is unavailable in this host.'
    : keys.length ? 'Sharing is off. Only listed values will be attached.' : 'This interface has no shareable selection.';
  if (currentCode && currentCode !== args.code) {
    window.openuiDiagnostics.state = {};
    if (sharing) { sharing = false; publish(); share.textContent = 'Share selection'; share.setAttribute('aria-pressed', 'false'); }
  }
  currentCode = args.code;
  root.render(React.createElement(Renderer, {
    response: args.code, library, isStreaming, onAction,
    onParseResult: result => {
      window.openuiDiagnostics.parse = result;
      window.openuiDiagnostics.state = { ...result.stateDeclarations, ...window.openuiDiagnostics.state };
      updatePreview();
    },
    onStateUpdate: state => {
      window.openuiDiagnostics.state = state;
      updatePreview();
      if (sharing) {
        clearTimeout(timer);
        sharingStatus.textContent = 'Selection changed. Updating…';
        timer = setTimeout(publish, 250);
      }
    },
    onError: errors => {
      window.openuiDiagnostics.errors = errors;
      if (errors.length) fail('This interface could not render. Ask the agent to correct the program.');
    },
  }));
  updatePreview();
}
app.ontoolinputpartial = ({ arguments: args }) => render(args, true);
app.ontoolinput = ({ arguments: args }) => render(args);
app.ontoolresult = result => {
  if (result.isError) { fail('OpenUI rejected this program. Ask the agent to correct it.'); return; }
  render(result.structuredContent);
};
app.onhostcontextchanged = applyContext;
app.onteardown = async () => {
  clearTimeout(timer);
  sharing = false;
  if (connected && app.getHostCapabilities()?.updateModelContext) await queueContext(JSON.stringify(envelope(identity, title, {})));
  disposed = true;
  root.unmount();
  return {};
};
app.onclose = () => {
  connected = false;
  clearTimeout(timer);
  share.disabled = true;
  status.textContent = 'Disconnected. Reopen the interface to reconnect.';
  sharingStatus.textContent = 'Sharing unavailable. A previous selection may remain in context.';
};
status.textContent = 'Connecting to T3…';
app.connect().then(() => {
  connected = true;
  applyContext(app.getHostContext());
  status.textContent = app.getHostCapabilities()?.message ? 'Connected to T3.' : 'Connected. Agent messages unavailable in this host.';
  share.disabled = !keys.length || !app.getHostCapabilities()?.updateModelContext;
  sharingStatus.textContent = !app.getHostCapabilities()?.updateModelContext
    ? 'Selection sharing is unavailable in this host.' : 'Sharing is off. Only listed values will be attached.';
}).catch(cause => { status.textContent = 'Connection unavailable.'; fail(`Unable to connect to the host: ${cause.message}`); });
