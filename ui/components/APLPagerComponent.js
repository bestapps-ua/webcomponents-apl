/**
 * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-pager.html
 *
 * Displays a series of child components one page at a time; each page fully
 * replaces the previous one. Unlike the scrollables, a Pager is not continuous
 * scrolling content, so it extends APLActionableMultiChildComponent rather than
 * APLScrollableComponent (no onScroll / scrollDirection / snap).
 *
 * Child pages always fill the Pager bounds (100% x 100%). Page transitions,
 * animation, and navigation are runtime behavior and are not simulated in the
 * editor — the wrapper simply clips to a single page.
 */
class APLPagerComponent extends APLActionableMultiChildComponent {
    static tag = 'apl-pager-component';

    getAPLProperties() {
        let properties = super.getAPLProperties();
        properties = Object.assign(properties, {
            // 0-based index of the page shown first.
            initialPage: {
                type: 'text',
                default: '0',
                options: {}
            },
            // Direction pages animate when changing.
            pageDirection: {
                type: 'list',
                items: [
                    'horizontal',
                    'vertical',
                ],
                default: 'horizontal',
                options: {}
            },
            // How the user may navigate between pages.
            navigation: {
                type: 'list',
                items: [
                    'normal',
                    'none',
                    'wrap',
                    'forward-only',
                ],
                default: 'wrap',
                options: {}
            },
            // Properties preserved across reinflation (e.g. pageId, pageIndex).
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
            onPageChanged:  { type: 'commands', options: {} },
            handlePageMove: { type: 'commands', options: {} },
        });
        return events;
    }

    getStyle() {
        let style = super.getStyle();
        style += `
            .wrapper {
                overflow: hidden;
            }
        `;
        return style;
    }
}

customElements.define(APLPagerComponent.tag, APLPagerComponent);
registerAPLComponent('Pager', APLPagerComponent);
