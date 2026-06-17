# APL `when` Property (Conditional Inflation)

Reference for the `when` property — APL's conditional component inflation — and the
visual condition builder + validation that back it. Use this when touching the
condition dialog, the inline summary row, `APLExpression`, or operand/value rules.

Spec: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-conditional-component-inflation.html

## What `when` is

`when` decides whether a component is inflated. It is a data-binding `${...}`
expression that evaluates to a boolean: truthy → the component renders, falsy →
it is skipped. Examples:

```
${viewport.shape == 'round'}
${viewport.width < 600 && viewport.theme == 'dark'}
${index == 0}
```

Declared on the base component (`ui/components/APLComponent.js`):

```js
when: { type: 'expression', options: { visual: 'condition' } }
```

- `type: 'expression'` → routed through `APLExpression` for `${}` syntax validation
  (not the concrete per-type predicates). Any value containing `${` is treated as
  an expression by `checkValue` (see [[apl-validation]] / `apl-validation`).
- `options.visual: 'condition'` → the Properties tab picks the custom inspector
  row class via `getClassByProperty` instead of a plain text field.

## Three surfaces, one expression

All three round-trip the SAME `${...}` string through `APLExpression`, so the
inline summary, the builder, encode, and the document validator never disagree.

1. **Inline inspector row** — `APLObjectInspectorPropertyConditionComponent`
   (`ui/components/object-inspector/tab/property/`). Deliberately NOT an editor:
   a read-only summary (`APLExpression.summarize`) + an `Edit...` button. The
   narrow inspector column is too cramped for a builder, so editing happens in a
   modal. Invalid raw values still turn the row red via the shared `checkValue`
   path (`applyValidation`).
2. **Condition dialog** — `APLConditionDialogComponent` (`ui/dialogs/`), the roomy
   modal builder. Opened from the row's Edit button like the command property
   opens its dialog; returns a `${...}` string on Apply.
3. **`APLExpression`** (`APLExpression.js`) — the shared brain: build/parse/validate
   /summarize/evaluate. Wraps the vendored `jsep` parser (see [[apl-no-build-constraint]]).

## The dialog (`APLConditionDialogComponent`)

Tag: `<apl-condition-dialog-component>`. Extends `APLConfirmDialogComponent`
(see `apl-dialogs`); relabels Close/Confirm → **Cancel/Apply**. Apply is disabled
whenever the current value is invalid.

### Builder mode (default)

`[operand] [operator] [value]` rows joined by a single ALL (`&&`) / ANY (`||`)
selector, with `+ Add condition` and per-row `[-]` remove.

- **Operand** is a real grouped `<select>` (`OPERAND_GROUPS`: Viewport / Data /
  Sequence) plus a `Custom value...` escape that reveals a free-text input.
  NOT a `datalist` — a datalist filters to a single match after a pick, hiding
  the list.
- **Operator** (`OPERATORS`): `is set` (empty op = truthiness test), `==`, `!=`,
  `<`, `<=`, `>`, `>=`.
- **Value** is type-aware per `OPERAND_VALUES`:
  - `enum` operand → a `<select>` of allowed values (wrong data impossible).
  - `number` operand → a numeric-intent text field (kept as text, not
    `type=number`, so a bad value like `aaa` stays visible and gets flagged).
  - unknown/custom operand → free text.

`OPERAND_VALUES` (the type rules) — keep in sync with the spec:

| Operand | Rule |
|---|---|
| `viewport.width` / `height` / `dpi` | number |
| `viewport.shape` | enum: round, rectangle |
| `viewport.mode` | enum: hub, tv, mobile, auto, pc |
| `viewport.theme` | enum: light, dark |
| `index` / `ordinal` / `length` | number |

### Raw mode

`Edit raw expression` toggle swaps the rows for a textarea. `Use the builder`
toggles back, re-parsing via `toClauses`; if the text is too complex to flatten,
it stays in raw mode with an explanatory message.

### Live preview + validation

`_updatePreview()` runs on every change (operand/op/value/join change, raw input)
and: renders the `Result` preview, computes an error message, and sets
`confirmBtnEl.disabled`. There are TWO layers of validation:

- **Syntax** — `APLExpression.validate('condition', expr)` (jsep parse). Catches
  malformed `${...}`.
- **Semantic (operand value type)** — `_checkOperandValue(left, op, val)` against
  `OPERAND_VALUES`. Catches values that parse but don't fit the operand, e.g.
  `viewport.theme == '1'` (theme must be light|dark). A context-path value
  (e.g. `data.x`) is always allowed — that's an operand-to-operand comparison.

Both builder and raw run semantic validation, through different extractors:

- Builder: `_validateClauseValues()` over `_readClauses()` (the DOM rows). Also
  flags incomplete rows ("Choose a property", "Enter a value").
- Raw: `_validateRawValues()` over `APLExpression.comparisons(rawText)`.

`_checkOperandValue` is the single shared rule both call, so builder and raw can
never disagree about what a valid value is.

### Enum operator narrowing

For enum operands the ordering operators (`<`, `<=`, `>`, `>=`) are meaningless
(`shape < round`?), so `_rebuildOps(row)` narrows the operator `<select>` to
`is set` / `==` / `!=` for enum operands and restores the full set for
number/custom operands. A previously chosen ordering op falls back to `==`.

## `APLExpression` API (used by the `when` machinery)

| Method | Purpose |
|---|---|
| `isExpression(v)` | true if `v` contains a `${` segment |
| `extract(v)` | inner strings of each `${...}` segment |
| `parse(inner)` | jsep parse one inner expression (throws on syntax error) |
| `validate(key, v)` | first syntax error message across all segments, or null |
| `summarize(v)` | human label for the inline row (`==`→`=`, `&&`→`AND`, …) |
| `fromClauses(join, clauses)` | build a `${...}` from builder rows |
| `toClauses(v)` | parse a FLAT `&&`/`||` comparison chain back to rows; `{mode:'raw'}` if too complex |
| `comparisons(v)` | EVERY `{left,op,right}` comparison anywhere in the AST (superset of toClauses; robust to nesting/mixed `&&`/`||`), used for raw-mode semantic validation |
| `evaluate(v, ctx)` | evaluate against a binding context (CallExpression / APL built-ins NOT yet supported) |

`comparisons` vs `toClauses`: `toClauses` only succeeds for a single flat chain
(it drives the builder rows). `comparisons` walks the whole AST via the generic
`_eachNode` visitor, so even
`${a == '1' || (b == 11 && c == 'round')}` is fully validated in raw mode. It
returns `[]` for an unparseable string (the syntax layer reports those).

## Gotchas

- Use ASCII in UI text (`[-]` not `×`, `!=` not `≠`) — non-ASCII rendered as
  mojibake here.
- The base inspector rule `.value * { width:100%; height:100% }` collapses custom
  controls — override with higher specificity (the dialog and row both do).
- `right` values are stored UNQUOTED in clauses/comparisons; `fromClauses`
  re-quotes bare words as string literals and leaves numbers / context paths bare
  (`CONTEXT_ROOTS`).

## Phase plan

Conditional inflation is phased. DONE: Phase 1 (authoring + `${}` syntax
validation), Phase 2 (visual builder + evaluator + operand-value semantic
validation in both builder and raw). PENDING: Phase 3 — rewrite
`APLLoader.createComponents` for first-match (single-child) vs all-match
(multi-child) inflation + `data`/`firstItem`/`lastItem`, and a design-vs-preview
canvas toggle using `APLExpression.evaluate` against a viewport/data context from
`APLScreen`. See `apl-loader`, `apl-screen`.

## Tests

- `tests/specs/apl-data-types/apl-data-types.test.ts` — `APLExpression` units
  (`fromClauses`/`toClauses`/`comparisons`/`summarize`/`evaluate`).
- `tests/specs/apl-property-groups/apl-property-groups.test.ts` — dialog behavior
  (enum→dropdown, operator narrowing, builder + raw semantic validation, Apply
  enable/disable reacting on change).
