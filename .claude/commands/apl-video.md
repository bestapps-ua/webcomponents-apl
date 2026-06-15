# APLVideoComponent

Describe the APLVideoComponent.

## Overview

`APLVideoComponent` (`ui/components/APLVideoComponent.js`) plays one or more
video streams. A leaf component (no children) that is actionable, so it extends
`APLActionableComponent`. Registers as `Video`.

## Tag: `<apl-video-component>`

## APL Reference
https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-video.html

## Properties
| Property | Type | Default | Notes |
|---|---|---|---|
| `source` | text | — | Primary content: URL or array of sources |
| `audioTrack` | list (foreground/background/none) | foreground | Audio mixing |
| `autoplay` | text (boolean) | `false` | |
| `muted` | text (boolean) | `false` | |
| `scale` | list (best-fit/best-fill) | best-fit | `scale-picker` visual; maps to `object-fit` |
| `screenLock` | text (boolean) | `true` | Keep screen awake while playing |
| `preserve` | text | — | Saved across reinflation |

Plus shared container/alignment/positioning props and base props. Boolean props
use `text` type with string defaults (`'true'`/`'false'`), matching the
codebase's convention for `disabled`/`checked`/`numbered`.

## Events
`onEnd`, `onPause`, `onPlay`, `onTimeUpdate`, `onTrackUpdate`, `onTrackReady`,
`onTrackFail` (+ inherited actionable handlers).

## Rendering
`renderContent()` builds a real `<video controls>`; `scale` maps to `object-fit`
(`best-fill`→cover, else contain); honors `muted`. `source` is resolved whether
it is a string, an array, or an array of `{url}` objects.

## Wiring / Validation / Tests
- `registerAPLComponent('Video', ...)`.
- `childrenAllowed.Video = false` (leaf); `requiredProperties.Video = ['source']`.
- Tests: `tests/specs/apl-video/` + fixture + `APLVideoFixture`.

## Issues
- None currently tracked.
