# APL Multi-Child & Scrollable Base Classes

Describe the base class family for APL components that hold children.

## Overview

Three abstract base classes sit between `APLComponent` and the concrete
container/scrolling/paging components. None of them call `registerAPLComponent`
(they are not draggable palette items) — they exist purely to share properties,
events, and layout behavior. The split exists because JavaScript is
single-inheritance and `Pager` is an actionable multi-child component that is
**not** scrollable, so it cannot sit under the scrollable base.

## Hierarchy

```
APLComponent
└─ APLMultiChildComponent              (apl-multi-child-component)
   ├─ APLContainerComponent            -> Container   (not actionable)
   └─ APLActionableMultiChildComponent (apl-actionable-multi-child-component)
      ├─ APLPagerComponent             -> Pager       (not scrollable)
      └─ APLScrollableComponent        (apl-scrollable-component)
         ├─ APLSequenceComponent       -> Sequence
         ├─ APLFlexSequenceComponent   -> FlexSequence
         └─ APLGridSequenceComponent   -> GridSequence
```

## APLMultiChildComponent (`apl-multi-child-component`)
Extends `APLComponent`. Adds:
- Property: `data` (data-binding source for inflating children)
- Event: `onChildrenChanged`

Base for any component inflated from a data source. `APLContainerComponent`
extends it directly.

## APLActionableMultiChildComponent (`apl-actionable-multi-child-component`)
Extends `APLMultiChildComponent`. Merges in the actionable handlers via the
`getAPLEvents()` merge pattern (so base `onMount`/`onLayout` and
`onChildrenChanged` are preserved, not replaced):
- Events: `onFocus`, `onBlur`, `handleKeyDown`, `handleKeyUp`

Shared base for `Pager` and the scrollables. (The older `APLActionableComponent`
declares its events as an instance field that *replaces* the base events; this
base deliberately merges instead.)

## APLScrollableComponent (`apl-scrollable-component`)
Extends `APLActionableMultiChildComponent`. Adds the shared scrolling surface:
- Properties: `scrollDirection` (vertical/horizontal, default vertical),
  `snap` (none/start/center/end/forceStart/forceCenter/forceEnd, default none),
  `numbered`, `preserve`
- Event: `onScroll`
- Style: `.wrapper { overflow: auto }`

`scrollDirection` is intentionally **not** a 1:1 CSS map — each subclass
translates it into its own layout inside `onCSSSet()` (Sequence = single strip,
FlexSequence = wrapping flow, GridSequence = CSS grid).

## Why the split
- `Pager` is actionable + multi-child but shows one page at a time — it has no
  `onScroll`/`scrollDirection`/`snap`, so it extends
  `APLActionableMultiChildComponent` directly, not `APLScrollableComponent`.
- `Container` is multi-child but not actionable, so it extends
  `APLMultiChildComponent` directly.

## Wiring
Loaded in `index.html` in dependency order: `APLMultiChildComponent` →
`APLActionableMultiChildComponent` → `APLScrollableComponent` → the concrete
components. Fixtures for the concrete components must load the bases in the same
order.

## Issues
- None currently tracked.
