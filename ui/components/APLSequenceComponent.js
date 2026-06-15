/**
 * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-sequence.html
 *
 * A scrolling, multi-child component that lays its children out in a single
 * continuous, non-wrapping strip along one axis. The canonical scrolling list.
 *
 * Sequence adds no properties of its own beyond APLScrollableComponent
 * (scrollDirection, snap, numbered, preserve, onScroll, data, actionable
 * handlers, base properties) — it only differs in layout: a single chain with
 * no wrapping, unlike FlexSequence (wraps) and GridSequence (fixed grid).
 *
 * Axis note: a vertical Sequence stacks children in a column and scrolls down;
 * a horizontal Sequence lays them in a row and scrolls sideways. (This is the
 * opposite flex-direction mapping from FlexSequence, which wraps.)
 */
class APLSequenceComponent extends APLScrollableComponent {
    static tag = 'apl-sequence-component';

    getStyle() {
        let style = super.getStyle();
        style += `
            .wrapper {
                flex-direction: column;
                flex-wrap: nowrap;
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
        wrapper.style.flexWrap = 'nowrap';
        if ((data.scrollDirection || 'vertical') === 'horizontal') {
            wrapper.style.flexDirection = 'row';
            wrapper.style.overflowX = 'auto';
            wrapper.style.overflowY = 'hidden';
        } else {
            wrapper.style.flexDirection = 'column';
            wrapper.style.overflowX = 'hidden';
            wrapper.style.overflowY = 'auto';
        }
    }
}

customElements.define(APLSequenceComponent.tag, APLSequenceComponent);
registerAPLComponent('Sequence', APLSequenceComponent);
