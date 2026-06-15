/**
 * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-gridsequence.html
 *
 * A scrolling, multi-child component that lays its children out in a fixed grid
 * and scrolls in a single direction. Higher performance than Container for long
 * lists.
 *
 * Vertical grids require `childWidth` (column widths); horizontal grids require
 * `childHeight` (row heights). `auto` is not permitted for these dimensions.
 * scrollDirection/snap/numbered/preserve are inherited from APLScrollableComponent.
 *
 * Note: APL allows childWidth/childHeight to be an array of dimensions (one per
 * column/row). The editor models a single repeating dimension here.
 */
class APLGridSequenceComponent extends APLScrollableComponent {
    static tag = 'apl-grid-sequence-component';

    getAPLProperties() {
        let properties = super.getAPLProperties();
        properties = Object.assign(properties, {
            // Width of each column. Required for vertical grids.
            childWidth: {
                type: 'dimension',
                options: {}
            },
            // Height of each row. Required for horizontal grids.
            childHeight: {
                type: 'dimension',
                options: {}
            },
        });
        return properties;
    }

    getStyle() {
        let style = super.getStyle();
        style += `
            .wrapper {
                display: grid;
                grid-auto-flow: row;
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
        let screen = this.getFactory().getScreen();
        wrapper.style.display = 'grid';
        if ((data.scrollDirection || 'vertical') === 'horizontal') {
            wrapper.style.gridAutoFlow = 'column';
            wrapper.style.gridTemplateColumns = '';
            if (data.childHeight !== undefined) {
                wrapper.style.gridTemplateRows = `repeat(auto-fill, ${screen.getSizePixels(data.childHeight)})`;
            }
            wrapper.style.overflowX = 'auto';
            wrapper.style.overflowY = 'hidden';
        } else {
            wrapper.style.gridAutoFlow = 'row';
            wrapper.style.gridTemplateRows = '';
            if (data.childWidth !== undefined) {
                wrapper.style.gridTemplateColumns = `repeat(auto-fill, ${screen.getSizePixels(data.childWidth)})`;
            }
            wrapper.style.overflowX = 'hidden';
            wrapper.style.overflowY = 'auto';
        }
    }
}

customElements.define(APLGridSequenceComponent.tag, APLGridSequenceComponent);
registerAPLComponent('GridSequence', APLGridSequenceComponent);
