/**
 * Shared base for scrollable, multi-child, actionable APL components
 * (Sequence, FlexSequence, GridSequence).
 *
 * Extends the actionable multi-child base (gives `data`, `onChildrenChanged`,
 * and the focus/keyboard handlers) and adds the `onScroll` handler, overflow,
 * and the common scrolling properties (scrollDirection, snap, numbered,
 * preserve). Subclasses translate scrollDirection into their own layout in
 * onCSSSet. (Pager is actionable multi-child but not scrollable, so it extends
 * APLActionableMultiChildComponent directly.)
 */
class APLScrollableComponent extends APLActionableMultiChildComponent {
    static tag = 'apl-scrollable-component';

    getAPLProperties() {
        let properties = super.getAPLProperties();
        properties = Object.assign(properties, {
            // Scroll axis. Subclasses translate this into their own layout/overflow in onCSSSet.
            scrollDirection: {
                type: 'list',
                items: [
                    'vertical',
                    'horizontal',
                ],
                default: 'vertical',
                options: {}
            },
            // Child alignment when scrolling stops.
            snap: {
                type: 'list',
                items: [
                    'none',
                    'start',
                    'center',
                    'end',
                    'forceStart',
                    'forceCenter',
                    'forceEnd',
                ],
                default: 'none',
                options: {}
            },
            // Assigns ordinal numbers to children in the data-binding context.
            numbered: {
                type: 'text',
                options: {}
            },
            // Properties preserved across reinflation.
            preserve: {
                type: 'text',
                options: {}
            },
        });
        return properties;
    }

    getAPLEvents() {
        let events = super.getAPLEvents();
        events = Object.assign(events, {
            onScroll: { type: 'commands', options: {} },
        });
        return events;
    }

    getStyle() {
        let style = super.getStyle();
        style += `
            .wrapper {
                overflow: auto;
            }
        `;
        return style;
    }
}

customElements.define(APLScrollableComponent.tag, APLScrollableComponent);
