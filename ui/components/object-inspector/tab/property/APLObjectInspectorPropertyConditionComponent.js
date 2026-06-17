/**
 * Inspector row for an APL `when` condition (options.visual === 'condition').
 * Shows a compact, readable summary of the current condition plus an Edit
 * button that opens APLConditionDialogComponent — the actual builder lives in
 * the roomy dialog, not the narrow inspector column. Invalid raw values still
 * turn the row red via the shared checkValue path.
 *
 * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-conditional-component-inflation.html
 */
class APLObjectInspectorPropertyConditionComponent extends BestAppsObjectInspectorPropertyComponent {
    static tag = 'apl-object-inspector-property-condition-component';

    _lastEmitted;

    async renderValue() {
        if (!this.summaryRowEl) this._buildRow();
        this._updateSummary();
    }

    // Re-render only on a genuinely external value change; skip our own commit.
    refreshValue(value) {
        if (!this.valueEl) return;
        if (value === this._lastEmitted) { this.applyValidation(value); return; }
        this.value = value;
        if (!this.summaryRowEl) this._buildRow();
        this._updateSummary();
        this.applyValidation(this.value);
    }

    initField() {}
    onValueFocus() {}

    getFieldValue() {
        return this.value;
    }

    _buildRow() {
        this.valueEl.innerHTML = '';
        this.summaryRowEl = document.createElement('div');
        this.summaryRowEl.classList.add('cond-summary-row');

        this.summaryEl = document.createElement('span');
        this.summaryEl.classList.add('cond-summary');

        this.editBtn = document.createElement('button');
        this.editBtn.type = 'button';
        this.editBtn.classList.add('cond-edit');
        this.editBtn.textContent = 'Edit...';

        const open = (e) => { e.stopPropagation(); this.openDialog(); };
        this.editBtn.addEventListener('click', open);
        this.summaryEl.addEventListener('click', open);

        this.summaryRowEl.append(this.summaryEl, this.editBtn);
        this.valueEl.appendChild(this.summaryRowEl);
    }

    _updateSummary() {
        if (!this.summaryEl) return;
        const summary = (typeof APLExpression !== 'undefined')
            ? APLExpression.summarize(this.value)
            : (this.value || 'Always shown');
        this.summaryEl.textContent = summary;
        this.summaryEl.classList.toggle('cond-summary--empty', summary === 'Always shown');
    }

    openDialog() {
        if (typeof APLConditionDialogComponent === 'undefined') return;
        this.dialog = document.createElement(APLConditionDialogComponent.tag);
        this.element.wrapper.appendChild(this.dialog);
        this.dialog.show({ value: this.value });
        this.dialog.onSuccess = () => {
            this._applyExpression(this.dialog.getExpression());
        };
        this.dialog.onDone = () => {
            if (this.dialog && this.dialog.parentNode) this.dialog.parentNode.removeChild(this.dialog);
            this.dialog = undefined;
        };
    }

    _applyExpression(expr) {
        const value = expr || '';
        this.value = value;
        this._lastEmitted = value;
        this._updateSummary();
        this.applyValidation(value);
        this.sendValueChanged();
    }

    getStyle() {
        let style = super.getStyle();
        style += `
            .wrapper { height: auto; }
            .value-container { height: auto; }
            .value { height: auto; color: inherit; }
            .value .cond-summary-row * { width: auto; height: auto; }

            .cond-summary-row {
                display: flex; align-items: center; gap: 6px; padding: 2px 4px; width: 100%;
            }
            .cond-summary {
                flex: 1 1 auto; min-width: 0; cursor: pointer;
                font-family: monospace; font-size: 11px; color: #1a5;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .cond-summary--empty { color: #999; font-style: italic; font-family: sans-serif; }
            .cond-edit {
                flex: 0 0 auto; cursor: pointer; font-size: 11px; padding: 2px 8px;
                border: 1px solid cornflowerblue; background: #fff; color: cornflowerblue; border-radius: 3px;
            }
            .cond-edit:hover { background: cornflowerblue; color: #fff; }
        `;
        return style;
    }
}

customElements.define(APLObjectInspectorPropertyConditionComponent.tag, APLObjectInspectorPropertyConditionComponent);
