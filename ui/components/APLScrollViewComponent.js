/**
 * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-scrollview.html
 */
class APLScrollViewComponent extends APLActionableComponent {
    static tag = 'apl-scroll-view-component';

    getAPLProperties() {
        let properties = super.getAPLProperties();
        properties = Object.assign(properties, {

        });
        return properties;
    }

    getAPLEvents() {
        let events = super.getAPLEvents();
        events = Object.assign(events, {
            onScroll: {
                type: 'commands',
                options: {
                }
            },
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

customElements.define(APLScrollViewComponent.tag, APLScrollViewComponent);
registerAPLComponent('ScrollView', APLScrollViewComponent);
