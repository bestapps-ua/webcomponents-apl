# Project Overview: BestApps APL WebComponents

Provide a comprehensive overview of this project based on the following analysis.

## What This Project Is

This is the **APL (Alexa Presentation Language) web components** layer for the BestApps visual editor. It contains all APL-specific components, orchestration, and tooling for building Alexa device layouts. The source files live at the repo root (flattened from the original `custom/APL/` structure in the base framework).

## Architecture

### Source Files (repo root)

APL-specific classes loaded as plain ES6 via `<script>` tags:

- **APL.js** - main orchestrator that wires screen, factory, DOM, inspector, and palette together
- **APLComponent.js** - base APL component extending `BestAppsComponent` with APL data, properties, and parent-child hierarchy
- **APLFactory.js** - creates/clones/manages APL components, handles drag-and-drop onto the canvas
- **APLDom.js** - virtual tree representation mirroring the APL document structure
- **APLLoader.js** - loads APL JSON schemas and instantiates component trees
- **APLScreen.js / ui/components/APLScreenComponent.js** - device resolution management and UI (Echo Show, Echo Spot)
- **APLProperties.js / APLEvents.js** - encode/decode between APL data format and CSS styles
- **APLPalette.js** - populates the draggable component palette
- **Visual components** - APLContainerComponent, APLFrameComponent, APLImageComponent, APLTextComponent, APLTouchWrapperComponent, APLScrollViewComponent, APLEditTextComponent, APLDocumentComponent
- **Inheritance chain components** - APLActionableComponent, APLTouchableComponent (abstract bases)
- **Commands** - APLCommand.js, APLSendEventCommand.js, APLSetValueCommand.js

### Subdirectories

- **ui/components/object-inspector/** - APL-specific inspector extensions (properties tab, events tab, data tab, objects/tree tab, commands tab)
- **ui/dialogs/** - modal and confirm dialog components
- **Schemas/** - APL JSON schema files for validation and loading
- **vendor/** - third-party libraries (jsoneditor, treeselectjs)

### Base Framework (git submodule)

The `webcomponents/` directory is a **git submodule** pointing to the base framework repo. It provides:
- `BestAppsComponent.js` - base Web Component class with Shadow DOM, lifecycle, pub/sub
- `BestAppsPublishSubscribe.js` - event system
- `BestAppsDeferred.js` - promise/deferred pattern
- `custom/ObjectInspector/` - generic property inspector framework
- `custom/ObjectPalette/` - draggable component palette
- `custom/AppYearMonthComponent.js` - standalone date picker component

Test fixtures reference the base framework via the `/webcomponents/` path prefix.

## Tests

Tests live in `tests/` using **WebdriverIO** with 13 pure-APL test specs covering:
- Component creation, drag-drop, cloning
- Inspector property editing, events, commands
- DOM tree operations
- Schema loading
- Device resolution switching

## Key Design Patterns

- **No build step** - plain ES6 classes loaded via `<script>` tags
- **Shadow DOM everywhere** - each component encapsulates styles
- **Publish/Subscribe** - internal event bus per component, plus global APL-level pubsub
- **Property descriptor system** - declarative property definitions with type, CSS mapping, and APL mapping
- **Git submodule for base framework** - APL layer depends on but doesn't contain the base components

## File Structure

```
APL.js                            -- Main orchestrator
ui/components/APLComponent.js                   -- Base APL component
APLFactory.js                     -- Component creation & drag-drop
APLDom.js                         -- Virtual DOM tree
APLLoader.js                      -- Schema loader
APLScreen.js                      -- Device resolution
ui/components/APLScreenComponent.js             -- Device resolution UI
APLProperties.js                  -- Property encode/decode
APLEvents.js                      -- Event encode/decode
APLPalette.js                     -- Component palette setup
APL*Component.js                  -- Visual components
APLCommand.js                     -- Command base
APLSendEventCommand.js            -- SendEvent command
APLSetValueCommand.js             -- SetValue command
ui/components/object-inspector/                  -- APL-specific inspector extensions
ui/dialogs/                          -- Modal dialogs
Schemas/                          -- APL JSON schemas
vendor/                           -- Third-party (jsoneditor, treeselectjs)
webcomponents/                    -- Git submodule: base framework
tests/                            -- WebdriverIO E2E tests
```

## Pros
- Clean separation from the base framework via git submodule
- All APL source at root level for easy navigation
- Full E2E test coverage with 13 spec files
- Zero framework dependencies - pure Web Components

## Cons
- No build system, bundler, or module system - relies on global script loading order
- No TypeScript - relies on JSDoc and runtime for type safety
- Large vendor files committed directly
- Submodule setup requires extra clone steps for new developers
