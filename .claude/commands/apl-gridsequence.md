# APLGridSequenceComponent

Describe the APLGridSequenceComponent.

## Overview

`APLGridSequenceComponent` (`ui/components/APLGridSequenceComponent.js`) lays
children out in a fixed grid and scrolls in a single direction. Extends
`APLScrollableComponent`, registers as `GridSequence`.

## Tag: `<apl-grid-sequence-component>`

## APL Reference
https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-gridsequence.html

## Properties
Own:
| Property | Type | Default | Notes |
|---|---|---|---|
| `childWidth` | dimension | — | Column width(s). Required for vertical grids. |
| `childHeight` | dimension | — | Row height(s). Required for horizontal grids. |

APL allows `childWidth`/`childHeight` to be an **array** of dimensions (one per
track); the editor models a single repeating dimension. Inherited from
`APLScrollableComponent`: `scrollDirection`, `snap`, `numbered`, `preserve`,
`onScroll`, `data`, actionable handlers, base props. See `/apl-multichild`.

## Layout (`getStyle` + `onCSSSet`)
CSS grid (`display: grid`):
- vertical (default): `grid-auto-flow: row`, `grid-template-columns: repeat(auto-fill, <childWidth>)`, `overflow-y: auto`
- horizontal: `grid-auto-flow: column`, `grid-template-rows: repeat(auto-fill, <childHeight>)`, `overflow-x: auto`

## Wiring / Validation / Tests
- `registerAPLComponent('GridSequence', ...)`; `childrenAllowed.GridSequence = true`.
- The conditional requirement (vertical needs `childWidth`, horizontal needs
  `childHeight`) is **not** in `requiredProperties` — that map is unconditional
  per type and would wrongly flag the other axis.
- Tests: `tests/specs/apl-gridsequence/` + fixture + `APLGridSequenceFixture`.

## Issues
- None currently tracked.
