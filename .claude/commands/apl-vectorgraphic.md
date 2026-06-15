# APLVectorGraphicComponent

Describe the APLVectorGraphicComponent.

## Overview

`APLVectorGraphicComponent` (`ui/components/APLVectorGraphicComponent.js`)
displays a scalable Alexa Vector Graphic (AVG). A leaf component (no children)
that is both actionable and touchable, so it extends `APLTouchableComponent`.
Registers as `VectorGraphic`.

## Tag: `<apl-vector-graphic-component>`

## APL Reference
https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-vectorgraphic.html

## Properties
| Property | Type | Default | Notes |
|---|---|---|---|
| `source` | text | — | Primary content: AVG resource name or URL |
| `align` | list (9 values: bottom, bottom-left, …, top-right) | center | Placement within bounds |
| `scale` | list (none/fill/best-fill/best-fit) | none | Scaling; `scale-picker` visual |
| `parameters` | text | — | AVG binding map |

Plus the shared container/alignment/positioning props and base props.

## Events
`onLoad`, `onFail` (+ inherited actionable `onFocus`/`onBlur`/`handleKeyDown`/`handleKeyUp` and touchable `onDown`/`onMove`/`onPress`/`onUp`).

## Rendering
`renderContent()` embeds URL/`data:`/`.svg` sources as an SVG `<image>`;
otherwise shows the source/name as a placeholder label. A full AVG (Alexa's JSON
vector format) renderer is out of scope.

## Wiring / Validation / Tests
- `registerAPLComponent('VectorGraphic', ...)`.
- `childrenAllowed.VectorGraphic = false` (leaf); `requiredProperties.VectorGraphic = ['source']`.
- Tests: `tests/specs/apl-vectorgraphic/` + fixture + `APLVectorGraphicFixture`.

## Issues
- None currently tracked.
