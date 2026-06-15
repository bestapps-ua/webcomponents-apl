# APL Inspector Extensions

Describe the APL-specific inspector components based on the following analysis.

## Overview

The APL Inspector extensions (`ui/components/object-inspector/`) extend the generic Object Inspector with APL-specific behavior: a tree-based component selector (instead of a flat dropdown), APL event/command editing, and a JSON data editor.

## Components

### APLObjectInspectorObjectsComponent (`apl-object-inspector-objects-component`)
Extends `BestAppsObjectInspectorObjectsComponent`. Replaces the `<select>` dropdown with a custom div-based tree selector.

**Features:**
- Tree-indented component list (indentation = 15px * parent depth)
- Dropdown opens/closes on click (absolute positioned, 500px wide, 300px tall)
- Component drag-and-drop reordering within the tree
- Auto-scrolls to selected component
- Persists last selected component name in `localStorage`, restored **once after
  initial load** via `restorePersistedSelection()` (called from `APL.init` after
  `aplLoader.load()`). Previously this restore lived inside `addComponent` and
  ran on *every* add — so dragging in a new component re-asserted the stored
  selection and left the freshly dropped component **inactive** in the inspector.
  `restorePersistedSelection()` enqueues via `addEvent` so it runs after pending
  option-adds have flushed.
- Renames components live when name changes in Properties tab
- Rebuilds tree after component moves via `EVENT_MOVED` subscription
- Click outside the inspector closes the dropdown

**Drag-and-drop in tree:**
- Options are draggable (except the root APLContainer1)
- Drag data format: `OPTION::<guid>`
- Drop triggers `APLDom.move()` -> `APLFactory.cloneByDomItemsMove()`

### APLObjectInspectorPropertiesTabComponent (`apl-object-inspector-properties-tab-component`) — grouped, sorted, collapsible
Extends `BestAppsObjectInspectorPropertiesTabComponent`. Overrides
`getClassByProperty()` (scale-picker) and, more importantly, `layoutProperties()`
to render properties as **collapsible groups** instead of a flat list:

- All keys sorted alphabetically; `name` pinned first; then group sections
  (titles A–Z, members A–Z); then remaining standalone rows (A–Z).
- Grouping comes from `APLPropertyGroups` (`APLPropertyGroups.js`) — a
  property→group taxonomy covering every APL property (Size, Padding, Position,
  Layout, Border, Shadow, Typography, Hint, Input, Media, Appearance, Scrolling,
  Accessibility, State, Data).
- A group only forms when `MIN_GROUP_SIZE` (2) of its members are present for the
  selected component; otherwise its members render as standalone rows.
- `update()` refreshes each group's summary after value changes.

**Base refactor enabling this:** `BestAppsObjectInspectorPropertiesTabComponent`
was split into `createPropertyComponent(key, prop)` (builds a row + wires
`EVENT_ACTIVATE`/`EVENT_CHANGED`) and an overridable `layoutProperties(items)`
hook (default = flat list, unchanged for other consumers).

### APLObjectInspectorPropertyGroupComponent (`apl-object-inspector-property-group-component`)
A collapsible group: header `[+]/[-]` toggle + title + live summary, and a body
holding the member rows.
- **Summary** lists `name: value` for members whose value is non-empty AND
  differs from its default; updates live (subscribes to each member's
  `EVENT_CHANGED`).
- **Collapsed by default**; open/closed state persisted per title in
  `localStorage`.
- The tab `await`s each group's `loadedDefer` before `addProperty()` so the
  group's async `initElements` (which builds `bodyEl`) has run — otherwise rows
  would be appended to an undefined body.

### APLObjectInspectorEventsTabComponent (`apl-object-inspector-events-tab-component`)
Extends `BestAppsObjectInspectorPropertiesTabComponent`. Overrides `getClassByProperty()` to use `APLObjectInspectorPropertyCommandComponent` for `commands` type properties. Implements `onCommandOpen()` to close other command editors when one opens.

### APLObjectInspectorDataTabComponent (`apl-object-inspector-data-tab-component`)
Extends `BestAppsObjectInspectorPropertiesTabComponent`. Embeds a JSONEditor (third-party library) for raw JSON editing of component APL data. Returns `undefined` from `getClassByProperty()` to prevent normal property rendering. Includes the full JSONEditor CSS (~2000 lines) in its `getStyle()` method. Fires `EVENT_TAB_JSON_CHANGED` on any JSON edit.

### APLObjectInspectorPropertyCommandComponent (`apl-object-inspector-property-command-component`)
Extends `BestAppsObjectInspectorPropertyComponent`. Renders a list of APL commands (SendEvent, SetValue) for an event property. Supports:
- Viewing existing commands as clickable items
- Adding new commands via `[+]` button
- Removing commands via `[-]` with confirm dialog
- Editing commands in a popup `APLCommandPropertiesComponent`
- Command type switching (SendEvent <-> SetValue)
- CRUD events: `EVENT_COMMAND_EVENT_ADDED`, `EVENT_COMMAND_EVENT_SAVED`, `EVENT_COMMAND_EVENT_REMOVED`

### APLCommandPropertiesComponent (`apl-command-properties-component`)
Extends `BestAppsObjectInspectorPropertiesTabComponent`. Popup editor for a single command. Shows:
- Command type selector (SendEvent, SetValue)
- Property editors for command fields
- CLOSE and SAVE action buttons
Fires `EVENT_ACTION_CLOSE` and `EVENT_ACTION_SAVE` events.

## Property row editing (base `webcomponents` fix)
Clicking a property value used to commit the literal string `"undefined"` for
properties with no value, because `initInput` did `fieldEl.value = this.value`
(which the input coerces to `"undefined"`). Fixed in the shared base components:
- `BestAppsObjectInspectorPropertyInputComponent.initInput`: `fieldEl.value = this.value ?? ''`.
- `BestAppsObjectInspectorPropertyComponent.isUnchangedValue()` normalizes
  `undefined`/`null`/`''` as equal; used in `onDeactivate` (blur) and the
  input's Enter/Escape handlers so clicking into an empty field and leaving
  commits nothing.
- `deactivate()` now calls `refreshValue()` to restore the value text instead of
  leaving the inert edit field in the cell.

## Pros
- Tree selector provides hierarchical view matching APL document structure
- Drag-and-drop in the tree enables visual component reordering
- JSONEditor integration gives power users raw JSON access
- Command editor handles the full CRUD lifecycle
- `localStorage` persistence remembers last selection across page reloads

## Cons
- `APLObjectInspectorDataTabComponent` embeds ~2000 lines of JSONEditor CSS in `getStyle()` - should use `adoptedStyleSheets` or external CSS
- Tree selector hardcodes `APLContainer1` as non-draggable root
- Click-outside handler uses `mousedown` on `window` - may interfere with other interactions
- Command properties popup uses absolute positioning relative to viewport - may go off-screen
- `EVENT_MOVED` handler uses `subscribeOnce` but checks `component.moved` flag - redundant guard
- JSONEditor icons use hardcoded relative paths to `./vendor/jsoneditor/img/` which won't work in the shadow DOM

## Issues
- None currently tracked
