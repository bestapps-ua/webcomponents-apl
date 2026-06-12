# APL Data Refresh Pipeline

Describe how editing the APL document JSON rebuilds the editor, based on the following analysis. Read this before touching `APLLoader.refresh()`, `APL.refreshFromDocument()`, or anything that holds component registries.

## Overview

Editing JSON in `apl-data-component` (the jsoneditor panel) triggers a **full teardown and rebuild** of the component tree. There is no diffing: every valid edit recreates all components from the document. Correctness therefore depends on resetting *every* piece of state that references components — there are five of them, and missing any one reintroduces a historical bug (see Cons).

## The Pipeline

```
jsoneditor onChangeText (fires per keystroke, invalid JSON ignored)
  -> APLValidator.validate(json)          GATE: errors -> red lines only,
                                          no event, canvas untouched
                                          (see apl-validation.md)
  -> APLDataComponent.sendChanged(EVENT_DOCUMENT_CHANGED, {json})
  -> APL.refreshFromDocument(json)        debounce 500ms (APL.REFRESH_DEBOUNCE_MS)
                                          + promise queue (no rebuild mid-rebuild)
  -> APL.applyDocument(json)
       1. capture selected component as a TREE PATH (child indexes root->leaf)
       2. aplDom.aplDocument.document = json
       3. await aplLoader.refresh()
       4. reselect component found via findComponentByPath()
  -> APLLoader.refresh()
       1. container.element.wrapper.innerHTML = ''   (shadow wrapper!)
       2. container.clearItems()
       3. dom.reset()
       4. factory.reset()
       5. factory.getInspector()?.clearComponents()
       6. loadComponents()                            (rebuild from document)
```

During `loadComponents()` every created component triggers `factory.onSelect` -> `propertyAdaptor.update` -> `inspector.update`, which re-registers it in the inspector dropdown — that's how the registry repopulates after the clear.

## State That Must Stay in Lockstep

After any rebuild, all of these must agree (the `apl-data-refresh` E2E spec in the orchestration repo asserts it):

| State | Reset by |
|---|---|
| Canvas: components in the document's **shadow wrapper** | `wrapper.innerHTML = ''` (runs `disconnectedCallback` cleanups) |
| `APLFactory.items` | `factory.reset()` |
| `APLDom.items` + `_guidIndex` | `dom.reset()` |
| Document component child-guid list | `container.clearItems()` |
| Inspector `components` + dropdown options | `inspector.clearComponents()` (forwards to objects selector, clears options) |

## Hard-Won Invariants (do not regress)

- **Shadow wrapper, not light DOM**: components are appended to `container.element.wrapper` (shadow). Clearing `container.innerHTML` clears the empty light DOM and silently duplicates the canvas on every edit.
- **`item.index` maps into the document JSON**: `APLDom.getComponentDataByItem()` resolves components to JSON nodes by index. Stale dom items shift the indexes and corrupt drag-and-drop writes. This is why `dom.reset()` is mandatory, and why the E2E spec checks mapping for *every* component.
- **`APLProperties.encode` writes back into the document**: `data[aplProperty] = value` mutates the component's data object, which IS the JSON node. Property fallbacks must be nullish (`data[key] ?? property.value ?? property.default`), never `||` — the `||` version rewrote valid falsy values (`width: 0`, `''`) into defaults *inside the document*.
- **`aplDom.aplDocument === aplLoader.scheme`**: same object, assigned in `APLLoader.getLocalJSON()`. Set `document` on one of them only; double assignment is redundant.
- **Guids and generated names do not survive a rebuild** (`APLText1` is renumbered by traversal order). Anything that must survive uses tree paths — see `APL.getComponentPath()` / `findComponentByPath()`.
- **Debounce + queue**: jsoneditor fires per keystroke; rebuilds are async (`createComponents` awaits each component). Without the queue, two interleaved rebuilds corrupt every registry.

## Testing

- Orchestration repo: `tests/specs/apl-data-refresh/apl-data-refresh.test.ts` — no duplication, add-with-data, falsy values, removal, selection preservation, debounce, dom-to-json mapping. The demo exposes `window.apl` for these tests.
- Tests must wait for the debounce: wrap `aplLoader.refresh` to count completions and `waitUntil` the counter increases, rather than pausing fixed amounts.

## Pros
- Rebuild-from-document is simple and always consistent with the JSON — no diff engine to maintain
- Selection survives edits via tree paths
- One debounced rebuild per editing pause, regardless of typing speed

## Cons
- O(n) teardown/recreate on every edit — fine at editor scale, won't scale to huge documents
- Reselection is best-effort: structural edits that move the selected node to a different path lose the selection
- jsoneditor cursor state is untouched only because nothing calls `jsoneditor.set()` during the rebuild — `APL.updateTabs()` does call it, so property edits made *while* typing in the editor will stomp the cursor

## Issues
- None currently tracked
