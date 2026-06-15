# APL Document Validation

Describe how APL documents are validated in the data editor, based on the following analysis.

## Overview

`APLValidator` (`APLValidator.js`) + `APLValidationRules.js` validate the APL document JSON against the components this editor supports. The data editor (`apl-data-component`) uses it for two things:

1. **Gate**: an edit that produces validation errors does NOT rebuild the canvas — `onChangeText` skips `EVENT_DOCUMENT_CHANGED` until the document is valid again. Half-added/half-removed components never reach the components.
2. **Red lines**: the same `validate(json)` is passed as jsoneditor's `onValidate` option; jsoneditor maps the returned error paths to lines in the user's text (`getPositionForPath`) and renders gutter annotations + a clickable error list. jsoneditor hardcodes those annotations to type `warning`, so `APLDataComponent` re-types them to `error` (red) via a property interceptor on `jsoneditor.annotations`.

## Where the Rules Come From

- **Introspection** (`APLValidator.getSpecs()`): for every type in `APLComponentRegistry`, a throwaway element is created and its `getAPLProperties()` read. Property types (`dimension`, `color`, `list`, text) and enum values (e.g. Image `scale`, Container `direction`) therefore can never drift from the components. Keys are mapped to JSON names via `options.apl` (`name` -> `id`). List items that are `{cssValue: aplValue}` objects contribute the APL value.
- **`APLValidationRules`**: structure and formats encoded from the official APL docs (URLs inline): children model per type (leaves: Text, Image, EditText, **VectorGraphic, Video**; containers/scrollables that allow children: Container, Frame, ScrollView, TouchWrapper, **Sequence, FlexSequence, GridSequence, Pager**), required properties (`Image.source`, **`VectorGraphic.source`, `Video.source`**), dimension format (number | `auto` | `<n>dp/px/vw/vh/%`), colors via `CSS.supports('color', ...)`. Note `getContainerProperties().position` is `relative`/`absolute` only (no `sticky` — that was a non-APL value removed from the code).

## Error Model

`validate(json)` returns `[{path: Array<string|number>, message}]` — exactly what jsoneditor's `onValidate` expects. Rules:

- **Errors** (block + red): unknown component `type`, missing `type`, missing required props, invalid values of editor-known properties, `items` not an array, children on leaf components, missing/invalid `mainTemplate`.
- **Allowed silently**: unknown property NAMES — official APL is a superset of what the editor models (`bind`, `when`, `style`, command handlers, ...). Marking them red would reject valid APL.
- `undefined` values are treated as absent: `APLProperties.encode` historically wrote `key: undefined` into in-memory documents; JSON cannot express undefined.

## Hard-Won Invariants

- **`APLProperties.decode` must not coerce missing values to `''`** and **`encode` must not write `undefined` into data** — both polluted the document JSON (empty strings / phantom keys) and produced hundreds of false validation errors. The validator first shipped against a document with 205 of them.
- The base inspector's `renderValue`/`refreshValue` must handle `undefined`/`0`/`''` with nullish checks — `innerHTML = undefined` renders the literal string "undefined". The same applies to the **edit field**: `initInput` must use `fieldEl.value = this.value ?? ''` and commit guards must treat `undefined`/`null`/`''` as equal (`isUnchangedValue`), or clicking an empty property commits the string "undefined". See `/apl-inspector`.
- The validator found a real shipped bug on day one: `Schemas/home.js` had `borderColor: "#fffffff"` (7-digit hex). If a baseline document suddenly reports errors, suspect the document first.
- `validate()` must never throw (wrapped in try/catch returning `[]`) — it runs inside jsoneditor's validation promise chain on every keystroke.

## Testing

- `tests/specs/apl-validator/` (this repo): every rule class against the fixture `apl-validator.html`.
- Orchestration repo `tests/specs/apl-data-validation/`: E2E gate + red annotation on the exact line + recovery after fixing.

## Pros
- Enums/types introspected from components - zero-maintenance sync
- Invalid documents can never corrupt the canvas, factory, dom tree or inspector
- Errors point at the exact line of the exact wrong value

## Cons
- Value validation only covers editor-known properties; valid-APL-but-unknown values pass silently
- No severity levels - jsoneditor's onValidate has no warning channel, everything shown is red
- Command/event payloads (onPress etc.) are not validated yet

## Issues
- None currently tracked
