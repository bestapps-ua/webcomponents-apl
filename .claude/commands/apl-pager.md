# APLPagerComponent

Describe the APLPagerComponent.

## Overview

`APLPagerComponent` (`ui/components/APLPagerComponent.js`) shows a series of
child components one page at a time. It is actionable + multi-child but **not**
scrolling, so it extends `APLActionableMultiChildComponent` (not
`APLScrollableComponent`). Registers as `Pager`.

## Tag: `<apl-pager-component>`

## APL Reference
https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-pager.html

## Properties
| Property | Type | Default | Notes |
|---|---|---|---|
| `initialPage` | text | `0` | 0-based index of the first page |
| `pageDirection` | list (horizontal/vertical) | horizontal | Page-change animation direction |
| `navigation` | list (normal/none/wrap/forward-only) | wrap | User navigation mode |
| `preserve` | text | — | Properties saved across reinflation |

Inherited: `data` + `onChildrenChanged`, actionable handlers, base props.

## Events
`onPageChanged`, `handlePageMove` (+ inherited `onFocus`/`onBlur`/`handleKeyDown`/`handleKeyUp` and `onChildrenChanged`).

## Layout / rendering
`.wrapper { overflow: hidden }` — a page fills the bounds. Child pages are
always 100% × 100% in APL. Page transitions, animation, and navigation are
runtime behavior and are **not** simulated in the editor (same stance as
ScrollView's overflow).

## Wiring / Validation / Tests
- `registerAPLComponent('Pager', ...)`; `childrenAllowed.Pager = true` (pages are children).
- Tests: `tests/specs/apl-pager/` + fixture + `APLPagerFixture` (includes a check
  that Pager is NOT scrollable: no `onScroll`/`scrollDirection`/`snap`).

## Issues
- None currently tracked.
