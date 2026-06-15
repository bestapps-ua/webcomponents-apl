# APLFlexSequenceComponent

Describe the APLFlexSequenceComponent.

## Overview

`APLFlexSequenceComponent` (`ui/components/APLFlexSequenceComponent.js`) is a
scrolling, multi-child component that wraps non-uniformly sized children across
the cross-axis. Extends `APLScrollableComponent`, registers as `FlexSequence`.
Requires APL 2024.3+.

## Tag: `<apl-flex-sequence-component>`

## APL Reference
https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-flexsequence.html

## Properties
Own:
| Property | Type | Default | Notes |
|---|---|---|---|
| `alignItems` | list (start/center/end) | start | Cross-axis alignment, CSS `alignItems` on wrapper |

Inherited from `APLScrollableComponent`: `scrollDirection`, `snap`, `numbered`,
`preserve`, `onScroll`, `data`, actionable handlers, base props. See
`/apl-multichild`.

Deliberately **excludes** absolute positioning (`left/top/right/bottom`) — the
APL docs state FlexSequence has no absolute positioning. Child-item props
(`grow/shrink/spacing`) belong on the children, not on FlexSequence.

## Layout (`getStyle` + `onCSSSet`)
Wrapping flow (`flex-wrap: wrap`, `align-content: flex-start`):
- vertical (default): `flex-direction: row`, `overflow-y: auto`
- horizontal: `flex-direction: column`, `overflow-x: auto`

(Opposite flex-direction mapping from Sequence, which does not wrap.)

## Wiring / Validation / Tests
- `registerAPLComponent('FlexSequence', ...)`; `childrenAllowed.FlexSequence = true`.
- Tests: `tests/specs/apl-flexsequence/` + fixture + `APLFlexSequenceFixture`.

## Issues
- None currently tracked.
