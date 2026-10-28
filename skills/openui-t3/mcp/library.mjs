// The compact contract is shared by prompt generation, parser and renderer.
import React, { useState } from 'react';
import { createLibrary, defineComponent, reactive, action, useStateField, useTriggerAction, useIsStreaming } from '@openuidev/react-lang';
import { z } from 'zod';
import { selectedItems, visibleItems, validateItems } from './selection.mjs';
export const libraryId = 'openui-personal@1';
const h = React.createElement;
const text = z.string();
const define = (name, props, component, description) => defineComponent({ name, props: z.object(props), component, description });
const TextContent = define('TextContent', { text, size: z.enum(['normal', 'small', 'large-heavy']).optional() }, ({ props: p }) => h('p', { className: p.size }, p.text), 'Plain text, escaped.');
const CardHeader = define('CardHeader', { title: text, subtitle: text.optional() }, ({ props: p }) => h('header', {}, h('h1', {}, p.title), p.subtitle && h('p', { className: 'muted' }, p.subtitle)), 'Interface title and provenance.');
const Status = define('Status', { label: text, tone: z.enum(['neutral','success','warning','danger']).optional() }, ({ props: p }) => h('span', { className: `badge ${p.tone ?? 'neutral'}` }, p.label), 'Supplied status, never inferred completion.');
const Button = define('Button', { label: text, action: action(), variant: z.enum(['primary','secondary','tertiary']).optional() }, ({ props: p }) => {
  const trigger = useTriggerAction(), streaming = useIsStreaming();
  return h('button', { type: 'button', disabled: streaming, onClick: () => trigger(p.label, undefined, p.action) }, p.label);
}, 'Local action or user-approved @ToAssistant request.');
const Input = define('Input', { name: text, label: text, value: reactive(text) }, ({ props: p }) => {
  const { value, setValue: set } = useStateField(p.name, p.value), disabled = useIsStreaming();
  return h('label', {}, p.label, h('input', { value: value ?? '', disabled, onChange: e => set(e.target.value) }));
}, 'Labeled text field; bind value to a declared $variable.');
const Checkbox = define('Checkbox', { name: text, label: text, value: reactive(z.boolean()) }, ({ props: p }) => {
  const { value, setValue: set } = useStateField(p.name, p.value), disabled = useIsStreaming();
  return h('label', { className: 'check' }, h('input', { type: 'checkbox', checked: !!value, disabled, onChange: e => set(e.target.checked) }), p.label);
}, 'Labeled checkbox; selection does not imply completion.');
const Select = define('Select', { name: text, label: text, options: z.array(text), value: reactive(text) }, ({ props: p }) => {
  const { value, setValue: set } = useStateField(p.name, p.value), disabled = useIsStreaming();
  return h('label', {}, p.label, h('select', { value, disabled, onChange: e => set(e.target.value) }, p.options.map(option => h('option', { key: option }, option))));
}, 'Labeled native select with string options.');
const item = z.object({ id: text, title: text, status: text, details: text, criteria: z.record(text, text), recommendation: text.optional() });
const panelProps = { title: text, provenance: text, items: z.array(item).max(100), selection: reactive(z.record(text, z.boolean())), focus: reactive(text) };
function ReviewPanel({ props: p, kind }) {
  const { value: selection, setValue: setSelection } = useStateField(`${kind}Selection`, p.selection);
  const { value: focus, setValue: setFocus } = useStateField(`${kind}Focus`, p.focus);
  const [query, setQuery] = useState(''), [filter, setFilter] = useState(''), [sort, setSort] = useState('source');
  const trigger = useTriggerAction(), streaming = useIsStreaming();
  const problem = validateItems(p.items);
  if (problem) return h('p', { role: 'alert' }, problem);
  const chosen = selectedItems(p.items, selection);
  const visible = visibleItems(p.items, query, filter, sort);
  const hidden = chosen.filter(row => !visible.some(v => v.id === row.id)).length;
  const toggle = id => setSelection({ ...(selection ?? {}), [id]: selection?.[id] !== true });
  const details = row => h('details', {}, h('summary', {}, 'Details'), h('p', {}, row.details), h('dl', {}, Object.entries(row.criteria).map(([key, value]) => h('div', { key }, h('dt', {}, key), h('dd', {}, value)))), row.recommendation && h('p', {}, h('strong', {}, 'Recommendation (judgment): '), row.recommendation));
  const check = row => h('label', { className: 'check' }, h('input', { type: 'checkbox', checked: selection?.[row.id] === true, disabled: streaming, onChange: () => toggle(row.id) }), h('span', {}, row.title));
  return h('section', { className: `review-panel ${kind}`, 'aria-label': p.title },
    h('h2', {}, p.title), h('p', { className: 'muted' }, p.provenance),
    h('div', { className: 'filters' },
      h('label', {}, 'Search', h('input', { type: 'search', value: query, onChange: e => setQuery(e.target.value) })),
      h('label', {}, 'Status', h('select', { value: filter, onChange: e => setFilter(e.target.value) }, h('option', { value: '' }, 'All statuses'), [...new Set(p.items.map(row => row.status))].map(value => h('option', { key: value }, value)))),
      h('label', {}, 'Order', h('select', { value: sort, onChange: e => setSort(e.target.value) }, h('option', { value: 'source' }, 'Source order'), h('option', { value: 'title' }, 'Title A–Z'), h('option', { value: 'status' }, 'Status A–Z')))),
    kind === 'checklist' && h('p', { className: 'muted' }, `${p.items.filter(row => row.status === 'complete').length} of ${p.items.length} supplied steps complete. Selecting a step only marks it for discussion.`),
    (query || filter || sort !== 'source') && h('button', { type: 'button', onClick: () => { setQuery(''); setFilter(''); setSort('source'); } }, 'Clear filters'),
    h('p', { role: 'status' }, `${chosen.length} selected${hidden ? ` · ${hidden} hidden by filters` : ''}${chosen.length ? ': ' + chosen.map(row => row.title).join(', ') : '. Select entries to discuss.'}`),
    !visible.length ? h('p', { className: 'empty' }, p.items.length ? 'No matching entries. Clear search or change the status filter. Hidden selections are retained.' : 'No entries supplied. There is nothing to select.') :
    kind === 'snapshot' ? h('table', { className: 'snapshot-table' }, h('caption', {}, 'Selectable snapshot entries'), h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Finding / service'), h('th', { scope: 'col' }, 'Status'), h('th', { scope: 'col' }, 'Evidence'))), h('tbody', {}, visible.map(row => h('tr', { key: row.id }, h('td', {}, check(row)), h('td', { 'data-label': 'Status' }, h('span', { className: 'badge' }, row.status)), h('td', { 'data-label': 'Evidence' }, details(row)))))) :
    h('div', { className: 'review-rows' }, visible.map(row => h('article', { key: row.id, className: 'review-row' }, h('div', { className: 'row-heading' }, check(row), h('span', { className: 'badge' }, row.status)), kind === 'comparison' && h('p', {}, row.details), details(row)))),
    h('div', { className: 'review-actions' },
      h('button', { type: 'button', disabled: !chosen.length || streaming, onClick: () => setSelection({}) }, 'Clear selection'),
      h('label', {}, 'Discussion focus', h('select', { value: focus ?? 'tradeoffs', disabled: streaming, onChange: e => setFocus(e.target.value) }, ['tradeoffs','scope','risks','implementation order'].map(value => h('option', { key: value }, value)))),
      chosen.length > 0 && h('button', { type: 'button', disabled: streaming, onClick: () => trigger('Discuss the selected entries and review focus. This is a discussion request, not approval to execute work.', undefined, { type: 'continue_conversation', params: { context: { selected: chosen.map(({ id, title }) => ({ id, title })), reviewFocus: focus } } }) }, 'Ask agent about selection')),
    h('p', { className: 'muted' }, 'Use Share selection below to attach selected context to normal chat. Explicit requests require T3 approval.'));
}
const panels = [['ComparisonPanel','comparison'], ['ReviewChecklist','checklist'], ['SnapshotTable','snapshot']].map(([name, kind]) => define(name, panelProps, args => h(ReviewPanel, { ...args, kind }), 'Bounded snapshot review. Unique stable IDs; criteria are named values. Bind selection and focus to $variables. Filters retain hidden selections. Provenance must state source/revision/time or sample data. Selection is discussion, not execution approval.'));
const child = z.union([TextContent.ref, CardHeader.ref, Status.ref, Button.ref, Input.ref, Checkbox.ref, Select.ref, ...panels.map(p => p.ref)]);
const Disclosure = define('Disclosure', { title: text, children: z.array(child) }, ({ props: p, renderNode }) => h('details', {}, h('summary', {}, p.title), renderNode(p.children)), 'Expandable rationale.');
const Card = define('Card', { children: z.array(z.union([child, Disclosure.ref])) }, ({ props: p, renderNode }) => h('main', { className: 'personal-card' }, renderNode(p.children)), 'Root container.');
export const library = createLibrary({ components: [Card, CardHeader, TextContent, Status, Button, Input, Checkbox, Select, Disclosure, ...panels], root: 'Card' });
