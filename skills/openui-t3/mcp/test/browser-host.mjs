// Local QA host only. This captures requests; it never sends a T3 message.
import { AppBridge } from '@modelcontextprotocol/ext-apps/app-bridge';
import { PostMessageTransport } from '@modelcontextprotocol/ext-apps';

const frame = document.getElementById('app');
const bridge = new AppBridge(null, { name: 'OpenUI QA host', version: '1.0.0' }, {
  message: { text: {} }, openLinks: {},
}, { hostContext: {
  theme: 'dark', displayMode: 'inline', availableDisplayModes: ['inline'], platform: 'web',
  containerDimensions: { width: innerWidth, maxHeight: 2000 },
  styles: { variables: {
    '--color-background-primary': '#202024', '--color-background-secondary': '#303036',
    '--color-background-inverse': '#ededf0', '--color-text-primary': '#ededf0',
    '--color-text-secondary': '#b6b6bf', '--color-text-inverse': '#161618',
    '--color-border-primary': '#44444c',
  } },
} });
window.testMode = 'approve';
window.handoffMessages = [];
window.handoffRequests = 0;
bridge.onmessage = async (message) => {
  window.handoffRequests += 1;
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
