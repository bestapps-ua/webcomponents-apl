# APLSequenceComponent

Describe the APLSequenceComponent.

## Overview

`APLSequenceComponent` (`ui/components/APLSequenceComponent.js`) is the canonical
scrolling list: children laid out in a single, continuous, non-wrapping strip
along one axis. Extends `APLScrollableComponent` and registers as `Sequence`.

## Tag: `<apl-sequence-component>`

## APL Reference
https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-sequence.html

## Properties
None of its own — Sequence is exactly the scrollable base. It inherits
`scrollDirection`, `snap`, `numbered`, `preserve` (from `APLScrollableComponent`),
`data` + `onChildrenChanged` (multi-child), the actionable handlers, `onScroll`,
and all base properties. See the `/apl-multichild` skill.

## Layout (`getStyle` + `onCSSSet`)
Single chain, no wrapping (`flex-wrap: nowrap`):
- vertical (default): `flex-direction: column`, `overflow-y: auto`
- horizontal: `flex-direction: row`, `overflow-x: auto`

Note: this axis mapping is the **opposite** of FlexSequence — a vertical
Sequence stacks children in a column, whereas a vertical FlexSequence wraps
rows.

## Wiring / Validation / Tests
- `registerAPLComponent('Sequence', ...)`; loaded in `index.html` after the
  scrollable base; auto-added to the palette.
- `APLValidationRules.childrenAllowed.Sequence = true`.
- Tests: `tests/specs/apl-sequence/` + fixture + `APLSequenceFixture`.

## Issues
- None currently tracked.
