// Local QA host only. This captures requests; it never sends a T3 message.
import { AppBridge } from '@modelcontextprotocol/ext-apps/app-bridge';
import { PostMessageTransport } from '@modelcontextprotocol/ext-apps';

const frame = document.getElementById('app');
const light = new URLSearchParams(location.search).get('theme') === 'light';
const bridge = new AppBridge(null, { name: 'OpenUI QA host', version: '1.0.0' }, {
  message: { text: {} }, openLinks: {},
  ...(new URLSearchParams(location.search).has('no-context') ? {} : { updateModelContext: { text: {} } }),
}, { hostContext: {
  theme: new URLSearchParams(location.search).get('theme') === 'light' ? 'light' : 'dark', displayMode: 'inline', availableDisplayModes: ['inline'], platform: 'web',
  containerDimensions: { width: innerWidth, maxHeight: 2000 },
  styles: { variables: light ? {
    '--color-background-primary': '#ffffff', '--color-background-secondary': '#f0f0f0',
    '--color-background-inverse': '#202020', '--color-text-primary': '#202020',
    '--color-text-secondary': '#606060', '--color-text-inverse': '#ffffff', '--color-border-primary': '#d0d0d0',
  } : {
    '--color-background-primary': '#202024', '--color-background-secondary': '#303036',
    '--color-background-inverse': '#ededf0', '--color-text-primary': '#ededf0',
    '--color-text-secondary': '#b6b6bf', '--color-text-inverse': '#161618',
    '--color-border-primary': '#44444c',
  } },
} });
window.testMode = 'approve';
window.contextUpdates = [];
bridge.onupdatemodelcontext = async params => {
  if (window.contextDelay) await new Promise(resolve => setTimeout(resolve, window.contextDelay));
  window.contextUpdates.push(params);
  return {};
};
window.qaBridge = bridge;
if (light) {
  document.body.style.background = '#fff';
}

window.handoffMessages = [];
window.handoffRequests = 0;
bridge.onmessage = async (message) => {
  window.handoffRequests += 1;
  if (window.testMode === 'error') throw new Error('Connection lost; delivery unknown.');
  if (window.testMode === 'decline') throw new Error('Declined by the user.');
  if (window.testMode === 'delay') await new Promise(resolve => { window.approvePending = resolve; });
  window.handoffMessages.push(message);
  return {};
};
bridge.oninitialized = async () => {
  await bridge.sendToolInput({ arguments: window.fixtureResult.structuredContent });
  await bridge.sendToolResult(window.fixtureResult);
  window.hostReady = true;
};
bridge.onsizechange = ({ height }) => { if (height) frame.style.height = `${height}px`; };
bridge.connect(new PostMessageTransport(frame.contentWindow, frame.contentWindow)).then(() => {
  frame.srcdoc = window.fixtureHtml;
}).catch(error => { console.error(error); });
