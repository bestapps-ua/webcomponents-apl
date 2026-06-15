/**
 * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-flexsequence.html
 *
 * A scrolling, multi-child component that wraps non-uniformly sized children
 * across the cross-axis. Combines a subset of Container layout with Sequence
 * scrolling. Requires APL 2024.3+.
 *
 * Unlike Container, FlexSequence does not support absolute positioning, so the
 * left/top/right/bottom alignment helpers are intentionally not merged in.
 */
class APLFlexSequenceComponent extends APLScrollableComponent {
    static tag = 'apl-flex-sequence-component';

    getAPLProperties() {
        let properties = super.getAPLProperties();
        properties = Object.assign(properties, {
            // Cross-axis alignment of children. (scrollDirection/snap/numbered/preserve
            // are inherited from APLScrollableComponent.)
            alignItems: {
                type: 'list',
                items: [
                    'start',
                    'center',
                    'end',
                ],
                default: 'start',
                options: {
                    css: 'alignItems',
                    wrapper: true,
                }
            },
        });
        return properties;
    }

    getStyle() {
        let style = super.getStyle();
        style += `
            .wrapper {
                flex-direction: row;
                flex-wrap: wrap;
                align-content: flex-start;
                overflow-x: hidden;
                overflow-y: auto;
            }
        `;
        return style;
    }

    onCSSSet() {
        super.onCSSSet();
        let wrapper = this.element?.wrapper;
        if (!wrapper) {
            return;
        }
        let data = this.getAPLData();
        wrapper.style.flexWrap = 'wrap';
        if ((data.scrollDirection || 'vertical') === 'horizontal') {
            wrapper.style.flexDirection = 'column';
            wrapper.style.overflowX = 'auto';
            wrapper.style.overflowY = 'hidden';
        } else {
            wrapper.style.flexDirection = 'row';
            wrapper.style.overflowX = 'hidden';
            wrapper.style.overflowY = 'auto';
        }
    }
}

customElements.define(APLFlexSequenceComponent.tag, APLFlexSequenceComponent);
registerAPLComponent('FlexSequence', APLFlexSequenceComponent);
