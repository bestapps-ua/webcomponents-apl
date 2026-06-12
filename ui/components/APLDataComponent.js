class APLDataComponent extends BestAppsComponent {
    static tag = 'apl-data-component';

    static EVENT_DOCUMENT_CHANGED = 'event.document.changed';

    aplDocument;

    /**
     * @property {JSONEditor} jsoneditor
     */
    jsoneditor;

    /**
     * @property {APLValidator} validator
     */
    validator;

    setValidator(validator) {
        this.validator = validator;
    }

    async initElements() {
        await super.initElements();
        const slot = document.createElement('slot');
        this.element.wrapper.appendChild(slot);

        this.editorDiv = document.createElement('div');
        this.editorDiv.style.width = '100%';
        this.editorDiv.style.height = '100%';
        this.appendChild(this.editorDiv);
    }

    initJSONEditor() {
        this.jsoneditor = new JSONEditor(this.editorDiv, {
            mode: 'code',
            indentation: 2,
            // jsoneditor maps returned error paths to lines in the edited
            // text and shows them as red gutter annotations + an error list
            onValidate: (json) => this.validator ? this.validator.validate(json) : [],
            onChangeText: (jsonString) => {
                let json;
                try {
                    json = JSON.parse(jsonString);
                } catch (e) {
                    return; // syntax errors are already marked by Ace
                }
                if (this.validator && this.validator.validate(json).length > 0) {
                    // invalid APL: leave the canvas untouched, onValidate shows the errors
                    return;
                }
                this.sendChanged('document', {
                    type: this.constructor.EVENT_DOCUMENT_CHANGED,
                    json,
                });
            },
        });
        // jsoneditor enables Ace wrap mode by default in code mode;
        // disable it so long lines get a horizontal scrollbar instead of wrapping
        this.jsoneditor.aceEditor?.getSession().setUseWrapMode(false);

        // jsoneditor hardcodes its validation annotations to type 'warning';
        // these block the rebuild, so mark them red in the gutter
        let annotations = this.jsoneditor.annotations || [];
        Object.defineProperty(this.jsoneditor, 'annotations', {
            get: () => annotations,
            set: (list) => {
                annotations = (list || []).map((a) =>
                    a.source === 'jsoneditor' ? Object.assign({}, a, {type: 'error'}) : a);
            },
        });
    }

    setDocument(doc) {
        this.aplDocument = doc;
        if (!this.jsoneditor) {
            this.initJSONEditor();
        }
        this.jsoneditor.set(doc);
    }

    refresh() {
        if (this.aplDocument && this.jsoneditor) {
            this.jsoneditor.set(this.aplDocument);
        }
    }

    getStyle() {
        return `
            :host {
                display: block;
                width: 100%;
                height: 100%;
            }
            .wrapper {
                width: 100%;
                height: 100%;
            }
        `;
    }
}

customElements.define(APLDataComponent.tag, APLDataComponent);
