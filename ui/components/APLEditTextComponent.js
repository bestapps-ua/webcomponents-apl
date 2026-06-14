/**
 * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-edittext.html
 */
class APLEditTextComponent extends APLActionableComponent {
    static tag = 'apl-edit-text-component';

    getAPLProperties() {
        let properties = super.getAPLProperties();
        properties = Object.assign(properties, {
            text: {
                type: 'text',
                options: {}
            },
            color: {
                type: 'color',
                options: { css: true }
            },
            fontFamily: {
                type: 'text',
                default: 'sans-serif',
                options: { css: true }
            },
            fontSize: {
                type: 'dimension',
                default: '40dp',
                options: { css: true }
            },
            fontStyle: {
                type: 'list',
                items: ['normal', 'italic'],
                default: 'normal',
                options: { css: true }
            },
            fontWeight: {
                type: 'text',
                default: 'normal',
                options: { css: true }
            },
            borderColor: {
                type: 'color',
                options: { css: true }
            },
            borderWidth: {
                type: 'dimension',
                options: {}
            },
            borderStrokeWidth: {
                type: 'dimension',
                options: {}
            },
            hint: {
                type: 'text',
                options: {}
            },
            maxLength: {
                type: 'text',
                options: {}
            },
            secureInput: {
                type: 'text',
                options: {}
            },
            size: {
                type: 'text',
                default: '8',
                options: {}
            },
            submitKeyType: {
                type: 'list',
                items: ['done', 'go', 'next', 'search', 'send'],
                default: 'done',
                options: {}
            },
            keyboardType: {
                type: 'list',
                items: ['decimalPad', 'emailAddress', 'normal', 'numberPad', 'phonePad', 'url'],
                default: 'normal',
                options: {}
            },
            selectOnFocus: {
                type: 'text',
                options: {}
            },
            lang: {
                type: 'text',
                options: {}
            },
            highlightColor: {
                type: 'color',
                options: {}
            },
            hintColor: {
                type: 'color',
                options: {}
            },
            hintStyle: {
                type: 'list',
                items: ['normal', 'italic'],
                default: 'normal',
                options: {}
            },
            hintWeight: {
                type: 'text',
                default: 'normal',
                options: {}
            },
            validCharacters: {
                type: 'text',
                options: {}
            },
        });
        return properties;
    }

    getAPLEvents() {
        let events = super.getAPLEvents();
        events = Object.assign(events, {
            onTextChange: { type: 'commands', options: {} },
            onSubmit: { type: 'commands', options: {} },
        });
        return events;
    }

    onCSSSet() {
        super.onCSSSet();
        if (!this.inputEl) return;
        let data = this.getAPLData();

        if (data.borderWidth) {
            let bw = this.getFactory()?.getScreen()?.getSizePixels(data.borderWidth) || data.borderWidth;
            if (!isNaN(parseFloat(bw)) && !`${bw}`.includes('px')) {
                bw = `${parseFloat(bw)}px`;
            }
            this.style.borderWidth = bw;
            this.style.borderStyle = 'solid';
        }

        if (data.hint !== undefined) {
            this.inputEl.placeholder = data.hint;
        }

        this.inputEl.type = (data.secureInput === true || data.secureInput === 'true') ? 'password' : 'text';

        let ml = parseInt(data.maxLength);
        if (ml > 0) {
            this.inputEl.maxLength = ml;
        } else {
            this.inputEl.removeAttribute('maxlength');
        }

        let sz = parseInt(data.size);
        if (sz > 0) this.inputEl.size = sz;

        if (data.submitKeyType) {
            this.inputEl.enterKeyHint = data.submitKeyType;
        }

        const modeMap = { decimalPad: 'decimal', emailAddress: 'email', normal: 'text', numberPad: 'numeric', phonePad: 'tel', url: 'url' };
        if (data.keyboardType && modeMap[data.keyboardType]) {
            this.inputEl.inputMode = modeMap[data.keyboardType];
        }
    }

    async initElements() {
        await super.initElements();
        this.inputEl = document.createElement('input');
        this.inputEl.type = 'text';
        this.inputEl.style.width = '100%';
        this.inputEl.style.height = '100%';
        this.inputEl.style.boxSizing = 'border-box';
        this.inputEl.style.border = 'none';
        this.inputEl.style.outline = 'none';
        this.element.wrapper.appendChild(this.inputEl);
    }

    getStyle() {
        let style = super.getStyle();
        style += `
            .wrapper {
                display: flex;
                align-items: center;
            }
        `;
        return style;
    }
}

customElements.define(APLEditTextComponent.tag, APLEditTextComponent);
registerAPLComponent('EditText', APLEditTextComponent);
