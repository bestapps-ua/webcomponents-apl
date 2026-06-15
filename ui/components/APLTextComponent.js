class APLTextComponent extends APLComponent {
    static tag = 'apl-text-component';

    getAPLProperties() {
        let properties = super.getAPLProperties();
        properties = Object.assign(properties, {
            color: {
                type: 'color',
                options: {
                    css: true,
                }
            },
            fontFamily: {
                type: 'text',
                options: {
                    css: true,
                }
            },
            fontSize: {
                type: 'dimension',
                default: '40dp',
                options: {
                    css: true,
                }
            },
            fontStyle: {
                type: 'list',
                items: [
                    'normal',
                    'italic',
                ],
                default: 'normal',
                options: {
                    css: true,
                }
            },
            fontWeight: {
                type: 'text',
                default: 'normal',
                options: {
                    css: true,
                }
            },
            // BCP-47 language code (e.g. "en-US"); affects glyph selection.
            lang: {
                type: 'text',
                options: {
                    css: true,
                }
            },
            letterSpacing: {
                type: 'text',
                options: {
                    css: true,
                }
            },
            lineHeight: {
                type: 'dimension',
                options: {
                    css: true,
                }
            },
            maxLines: {
                type: 'text',
                options: {

                }
            },
            text: {
                type: 'text',
                options: {

                }
            },
            textAlign: {
                type: 'list',
                items: [
                    'auto',
                    'left',
                    'right',
                    'center',
                    'start',
                    'end',
                ],
                default: 'auto',
                options: {
                    css: true,
                }
            },
            textAlignVertical: {
                type: 'list',
                items: [
                    'auto',
                    'top',
                    'bottom',
                    'center',
                ],
                default: 'auto',
                options: {

                }
            },
        });
        properties = Object.assign(APLProperties.getContainerProperties(), properties);
        properties = Object.assign(APLProperties.getAlignmentAndPositioningProperties(), properties);
        return properties;
    }

    getAPLEvents() {
        let events = super.getAPLEvents();
        events = Object.assign(events, {
            onTextLayout: { type: 'commands', options: {} },
        });
        return events;
    }

    onCSSSet() {
        super.onCSSSet();
        let data = this.getAPLData();
        let screen = this.getFactory().getScreen();
        let div = this.element.wrapper.querySelector('div');
        if (data.height === 'auto' && div && data.fontSize) {
            let fontSize = data.fontSize;
            if (fontSize.includes('dp')) {
                fontSize = parseFloat(fontSize) * screen.getDPSize();
            } else {
                fontSize = parseFloat(fontSize);
            }
            div.style.height = `${fontSize}px`;
            this.style.maxHeight = `${fontSize}px`;
        }
    }

    shouldCaptureClick() { return true; }

    renderContent() {
        const data = this.getAPLData();
        const div = document.createElement('div');
        div.textContent = data.text;
        this.element.wrapper.replaceChildren(div);
    }
}

customElements.define(APLTextComponent.tag, APLTextComponent);
registerAPLComponent('Text', APLTextComponent);