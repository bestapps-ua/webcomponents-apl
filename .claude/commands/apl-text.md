# APLTextComponent

Describe the APLTextComponent based on the following analysis.

## Overview

`APLTextComponent` (`custom/APL/ui/components/APLTextComponent.js`) represents the APL Text component for displaying styled text. It extends `APLComponent` and adds typography properties (font, color, alignment) with custom height calculation for `auto`-height text.

## Tag: `<apl-text-component>`

## APL Reference
https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-text.html

## Additional Properties (beyond APLComponent base)

Brought to full spec parity: `textAlign`/`textAlignVertical`/`fontStyle` are now
`list` (enum) types with proper CSS mappings, `lang` and the `onTextLayout`
handler were added, and documented defaults are set.

| Property | Type | Default | CSS Mapping | Notes |
|---|---|---|---|---|
| `color` | color | - | `color` | Theme-dependent default left unset |
| `fontFamily` | text | - | `fontFamily` | |
| `fontSize` | dimension | `40dp` | `fontSize` | dp support |
| `fontStyle` | list (normal/italic) | `normal` | `fontStyle` | |
| `fontWeight` | text | `normal` | `fontWeight` | normal/bold/100-900 (kept text for numeric) |
| `lang` | text | - | `lang` | BCP-47 language code |
| `letterSpacing` | text | - | `letterSpacing` | |
| `lineHeight` | dimension | - | `lineHeight` | 125% default left unset (dim path) |
| `maxLines` | text | - | - | |
| `text` | text | - | - | The actual text content |
| `textAlign` | list (auto/left/right/center/start/end) | `auto` | `textAlign` | |
| `textAlignVertical` | list (auto/top/bottom/center) | `auto` | - | data-only |
| `position` | list | - | `position` | From `getContainerProperties()` |
| `left/top/right/bottom` | dimension | - | - | From `getAlignmentAndPositioningProperties()` |

## Events
Adds `onTextLayout` (via a `getAPLEvents()` merge that preserves base events).

## Custom `onCSSSet` Logic

Handles `height: auto` by:
1. Getting `fontSize` from APL data (guarded: skips when `fontSize` is undefined — previously `data.fontSize.includes('dp')` could throw)
2. Converting dp to pixels using `screen.getDPSize()`
3. Setting the inner `<div>` height and host `maxHeight` to the computed font size

## Text Rendering

The component's `renderContent()` method creates a `<div>` with `textContent` and uses `replaceChildren()` — safe from XSS.

## Pros
- Merges position and alignment properties for absolute positioning support
- `fontSize` as dimension type gets automatic dp conversion via the property system
- Custom `auto` height handling adapts text to its font size

## Cons
- `textAlignVertical` has no CSS mapping (no single CSS property fits) — defined but does not affect rendering
- `color`/`lineHeight` defaults left unset on purpose (theme-dependent color; lineHeight's % multiplier doesn't fit the dimension pixel-conversion path) — setting them would materialize values into the document JSON
- `auto` height calculation assumes single-line text (uses fontSize as height)
- No rich text / HTML rendering support (Feature Gap: APL supports limited HTML in text)

## Issues
- None currently tracked
