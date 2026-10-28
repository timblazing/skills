// One bounded contract for both explicit messages and opt-in model context.
export const MAX_BYTES = 8_000;
export function envelope(interfaceId, title, selection, library = 'openui-chat@0.18.1') {
  const value = { version: 1, library, interfaceId, title, selection };
  const text = JSON.stringify(value);
  if (new TextEncoder().encode(text).length > MAX_BYTES) {
    throw new Error('Selection is too large to share. Choose fewer items or shorten the text.');
  }
  return value;
}
export function selectState(state, keys) {
  return Object.fromEntries(keys.filter(key => Object.hasOwn(state, `$${key}`)).map(key => [key, state[`$${key}`]]));
}
// Prefer explicit action context; fall back to form state only for older programs.
export function actionSelection(event) {
  return event.params?.context ?? event.formState ?? {};
}

// Serialize writes so a slow acknowledgement cannot overwrite a newer selection.
export function contextQueue(send) {
  let desired, draining, last;
  async function flush() {
    while (desired) {
      const next = desired;
      desired = undefined;
      if (next.text === last) { next.done?.(); continue; }
      try {
        await send(next.text);
        last = next.text;
        if (!desired) next.done?.();
      } catch (error) { next.fail?.(error); }
    }
  }
  return (text, done, fail) => {
    desired = { text, done, fail };
    draining ??= flush().finally(() => { draining = undefined; });
    return draining;
  };
}
