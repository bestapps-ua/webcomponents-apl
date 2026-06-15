/**
 * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-vectorgraphic.html
 *
 * Displays a scalable Alexa Vector Graphic (AVG). A leaf component (no
 * children) that is both actionable and touchable, so it extends
 * APLTouchableComponent (actionable + touch handlers) and adds onLoad/onFail.
 *
 * Editor note: AVG is Alexa's JSON vector format. A full AVG renderer is out of
 * scope here — renderContent embeds URL/SVG sources as an <image> and otherwise
 * shows the source/name as a placeholder label.
 */
class APLVectorGraphicComponent extends APLTouchableComponent {
    static tag = 'apl-vector-graphic-component';

    static SVG_NS = 'http://www.w3.org/2000/svg';
    static XLINK_NS = 'http://www.w3.org/1999/xlink';

    getAPLProperties() {
        let properties = super.getAPLProperties();
        properties = Object.assign(properties, {
            // Primary content: an AVG resource name or URL.
            source: {
                type: 'text',
                options: {}
            },
            // Where the graphic sits within the component bounds.
            align: {
                type: 'list',
                items: [
                    'bottom',
                    'bottom-left',
                    'bottom-right',
                    'center',
                    'left',
                    'right',
                    'top',
                    'top-left',
                    'top-right',
                ],
                default: 'center',
                options: {}
            },
            // How the graphic scales to fill the component bounds.
            scale: {
                type: 'list',
                items: [
                    'none',
                    'fill',
                    'best-fill',
                    'best-fit',
                ],
                default: 'none',
                options: {
                    visual: 'scale-picker',
                }
            },
            // Bound parameters passed into the AVG (map of name -> value).
            parameters: {
                type: 'text',
                options: {}
            },
        });
        properties = Object.assign(APLProperties.getContainerProperties(), properties);
        properties = Object.assign(APLProperties.getAlignmentAndPositioningProperties(), properties);
        return properties;
    }

    getAPLEvents() {
        let events = super.getAPLEvents();
        events = Object.assign(events, {
            onLoad: { type: 'commands', options: {} },
            onFail: { type: 'commands', options: {} },
        });
        return events;
    }

    shouldCaptureClick() { return true; }

    renderContent() {
        const data = this.getAPLData();
        const NS = this.constructor.SVG_NS;

        const svg = document.createElementNS(NS, 'svg');
        svg.style.display = 'block';
        svg.style.width = '100%';
        svg.style.height = '100%';

        const src = data.source;
        if (src && /^(https?:|data:)/i.test(src) || /\.svg($|\?)/i.test(src || '')) {
            const image = document.createElementNS(NS, 'image');
            image.setAttribute('href', src);
            image.setAttributeNS(this.constructor.XLINK_NS, 'xlink:href', src);
            image.setAttribute('width', '100%');
            image.setAttribute('height', '100%');
            image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svg.appendChild(image);
        } else {
            const text = document.createElementNS(NS, 'text');
            text.setAttribute('x', '50%');
            text.setAttribute('y', '50%');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.textContent = src || this.getAPLName();
            svg.appendChild(text);
        }

        this.element.wrapper.replaceChildren(svg);
    }
}

customElements.define(APLVectorGraphicComponent.tag, APLVectorGraphicComponent);
registerAPLComponent('VectorGraphic', APLVectorGraphicComponent);
