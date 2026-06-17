/**
 * A modal builder for an APL `when` condition. Opened from the inspector's
 * condition property row; returns a ${...} expression on Apply.
 *
 * Reuses the shared dialog chrome (APLConfirmDialogComponent) and the shared
 * expression helpers (APLExpression.fromClauses / toClauses / validate), so the
 * generated expression stays consistent with the inline summary, encode and the
 * document validator.
 */
class APLConditionDialogComponent extends APLConfirmDialogComponent {
    static tag = 'apl-condition-dialog-component';

    static OPERAND_GROUPS = [
        ['Viewport', ['viewport.width', 'viewport.height', 'viewport.shape', 'viewport.mode', 'viewport.dpi', 'viewport.theme']],
        ['Data', ['data']],
        ['Sequence', ['index', 'ordinal', 'length']],
    ];

    static OPERATORS = [
        ['', 'is set'],
        ['==', '= equals'],
        ['!=', '!= not equals'],
        ['<', '< less than'],
        ['<=', '<= at most'],
        ['>', '> greater than'],
        ['>=', '>= at least'],
    ];

    /**
     * Expected value per known operand, so the value field is type-aware:
     * enum -> a dropdown of allowed values (no wrong data possible),
     * number -> a numeric field. Unknown operands accept free text.
     */
    static OPERAND_VALUES = {
        'viewport.width': { type: 'number' },
        'viewport.height': { type: 'number' },
        'viewport.dpi': { type: 'number' },
        'viewport.shape': { type: 'enum', values: ['round', 'rectangle'] },
        'viewport.mode': { type: 'enum', values: ['hub', 'tv', 'mobile', 'auto', 'pc'] },
        'viewport.theme': { type: 'enum', values: ['light', 'dark'] },
        index: { type: 'number' },
        ordinal: { type: 'number' },
        length: { type: 'number' },
    };

    _built = false;
    _rawMode = false;

    async initActionsButtons() {
        await super.initActionsButtons();
        // Relabel the inherited Close/Confirm buttons for this context.
        for (const btn of this.element.buttons) {
            if (btn.classList.contains('closeBtn')) btn.value = 'Cancel';
            if (btn.classList.contains('confirmBtn')) { btn.value = 'Apply'; this.confirmBtnEl = btn; }
        }
    }

    async show(data = {}) {
        await this.loadedDefer.promise;
        if (!this._built) this._buildBuilder();
        this._populate(data.value || '');
        this.classList.add('active');
        this.dialogElement.showModal();
    }

    getExpression() {
        return this._rawMode
            ? this.rawEl.value.trim()
            : APLExpression.fromClauses(this.joinEl.value, this._readClauses());
    }

    _buildBuilder() {
        const content = this.element.content;
        content.innerHTML = '';

        const intro = document.createElement('div');
        intro.classList.add('cd-intro');
        intro.textContent = 'Show this component when';

        const head = document.createElement('div');
        head.classList.add('cd-head');
        this.joinEl = document.createElement('select');
        this.joinEl.classList.add('cd-join');
        for (const [v, l] of [['&&', 'ALL of these are true (AND)'], ['||', 'ANY of these is true (OR)']]) {
            const o = document.createElement('option');
            o.value = v; o.textContent = l;
            this.joinEl.appendChild(o);
        }
        this.joinEl.addEventListener('change', () => this._updatePreview());
        head.appendChild(this.joinEl);

        this.rowsEl = document.createElement('div');
        this.rowsEl.classList.add('cd-rows');

        this.addBtn = document.createElement('button');
        this.addBtn.type = 'button';
        this.addBtn.classList.add('cd-add');
        this.addBtn.textContent = '+ Add condition';
        this.addBtn.addEventListener('click', () => { this._addRow({ left: '', op: '==', right: '' }); this._updatePreview(); });

        // Advanced raw editor
        this.rawToggleEl = document.createElement('button');
        this.rawToggleEl.type = 'button';
        this.rawToggleEl.classList.add('cd-raw-toggle');
        this.rawToggleEl.textContent = 'Edit raw expression';
        this.rawToggleEl.addEventListener('click', () => this._toggleRaw());

        this.rawEl = document.createElement('textarea');
        this.rawEl.classList.add('cd-raw');
        this.rawEl.rows = 2;
        this.rawEl.placeholder = '${...}';
        this.rawEl.style.display = 'none';
        this.rawEl.addEventListener('input', () => this._updatePreview());

        const previewWrap = document.createElement('div');
        previewWrap.classList.add('cd-preview-wrap');
        const previewLabel = document.createElement('span');
        previewLabel.classList.add('cd-preview-label');
        previewLabel.textContent = 'Result';
        this.previewEl = document.createElement('code');
        this.previewEl.classList.add('cd-preview');
        previewWrap.append(previewLabel, this.previewEl);

        this.errorEl = document.createElement('div');
        this.errorEl.classList.add('cd-error');
        this.errorEl.style.display = 'none';

        content.append(intro, head, this.rowsEl, this.addBtn, this.rawToggleEl, this.rawEl, previewWrap, this.errorEl);
        this._built = true;
    }

    _addRow(clause) {
        const row = document.createElement('div');
        row.classList.add('cd-row');

        // Operand: a real <select> (always shows the full list) with grouped
        // suggestions + a "Custom value..." escape that reveals a text input.
        const operand = document.createElement('div');
        operand.classList.add('cd-operand');

        const sel = document.createElement('select');
        sel.classList.add('cd-left-select');
        const ph = document.createElement('option');
        ph.value = ''; ph.textContent = 'Choose property...';
        sel.appendChild(ph);
        for (const [label, items] of this.constructor.OPERAND_GROUPS) {
            const og = document.createElement('optgroup');
            og.label = label;
            for (const it of items) {
                const o = document.createElement('option');
                o.value = it; o.textContent = it;
                og.appendChild(o);
            }
            sel.appendChild(og);
        }
        const customOpt = document.createElement('option');
        customOpt.value = '__custom__'; customOpt.textContent = 'Custom value...';
        sel.appendChild(customOpt);

        const custom = document.createElement('input');
        custom.classList.add('cd-left-custom');
        custom.placeholder = 'custom property (e.g. data.header)';
        custom.style.display = 'none';
        custom.addEventListener('input', () => this._updatePreview());

        const presets = APLExpression.OPERAND_SUGGESTIONS;
        if (clause.left && presets.includes(clause.left)) {
            sel.value = clause.left;
        } else if (clause.left) {
            sel.value = '__custom__';
            custom.value = clause.left;
            custom.style.display = '';
        } else {
            sel.value = '';
        }

        sel.addEventListener('change', () => {
            const isCustom = sel.value === '__custom__';
            custom.style.display = isCustom ? '' : 'none';
            if (isCustom) custom.focus();
            this._rebuildOps(row);   // operand changed: ordering ops only make sense for non-enum
            this._rebuildValue(row); // operand changed: reset value to fit the new type
            this._updatePreview();
        });

        operand.append(sel, custom);

        const op = document.createElement('select');
        op.classList.add('cd-op');
        for (const [v, l] of this.constructor.OPERATORS) {
            const o = document.createElement('option');
            o.value = v; o.textContent = l;
            op.appendChild(o);
        }
        op.value = clause.op || '';
        op.addEventListener('change', () => { this._rebuildValue(row); this._updatePreview(); });

        // Adaptive value cell: filled by _rebuildValue based on operand + op.
        const valueCell = document.createElement('div');
        valueCell.classList.add('cd-value');

        const rm = document.createElement('button');
        rm.type = 'button';
        rm.classList.add('cd-remove');
        rm.title = 'Remove';
        rm.textContent = '[-]';
        rm.addEventListener('click', () => { row.remove(); this._updatePreview(); });

        row.append(operand, op, valueCell, rm);
        this.rowsEl.appendChild(row);
        this._rebuildOps(row);                              // narrow operators to fit the loaded operand
        this._rebuildValue(row, clause.right || '', true); // round-trip: keep the loaded value
        return row;
    }

    /**
     * Limit the operator list to equality tests ("is set" / == / !=) for enum
     * operands - ordering comparisons (<, <=, >, >=) are meaningless for
     * categorical values like 'round' or 'dark'. Numeric and free/custom
     * operands keep the full operator set. Preserves the current operator when
     * it survives the narrowing; otherwise falls back to ==.
     */
    _rebuildOps(row) {
        const opSel = row.querySelector('.cd-op');
        if (!opSel) return;
        const rule = this.constructor.OPERAND_VALUES[this._rowOperand(row)];
        const enumOnly = rule && rule.type === 'enum';
        const allowed = enumOnly
            ? this.constructor.OPERATORS.filter(([v]) => v === '' || v === '==' || v === '!=')
            : this.constructor.OPERATORS;
        const prev = opSel.value;
        opSel.innerHTML = '';
        for (const [v, l] of allowed) {
            const o = document.createElement('option');
            o.value = v; o.textContent = l;
            opSel.appendChild(o);
        }
        opSel.value = allowed.some(([v]) => v === prev) ? prev : '==';
    }

    _rowOperand(row) {
        const sel = row.querySelector('.cd-left-select');
        return sel.value === '__custom__' ? row.querySelector('.cd-left-custom').value : sel.value;
    }

    _rowValue(row) {
        const ctl = row.querySelector('.cd-right');
        return ctl ? ctl.value : '';
    }

    _isNumeric(v) { return /^-?\d+(\.\d+)?$/.test(String(v).trim()); }

    _isContextPath(v) {
        const s = String(v).trim();
        const root = s.split(/[.[]/)[0];
        return /^[A-Za-z_$][\w.$[\]']*$/.test(s) && APLExpression.CONTEXT_ROOTS.includes(root);
    }

    /**
     * Build the right-hand value control to match the chosen operand's type.
     * @param {boolean} roundTrip when true (loading an existing expression) an
     *   incompatible value is preserved in a text field; when false (the user
     *   changed the operand) an incompatible value is discarded so the control
     *   resets to the right type (e.g. width -> shape becomes a dropdown).
     */
    _rebuildValue(row, keepVal, roundTrip = false) {
        const cell = row.querySelector('.cd-value');
        if (!cell) return;
        const op = row.querySelector('.cd-op').value;
        const prev = keepVal !== undefined ? keepVal : this._rowValue(row);
        cell.innerHTML = '';
        if (op === '') { cell.style.display = 'none'; return; } // "is set" needs no value
        cell.style.display = '';

        const rule = this.constructor.OPERAND_VALUES[this._rowOperand(row)];
        let ctl;
        if (rule && rule.type === 'enum' && !(roundTrip && prev !== '' && !rule.values.includes(prev))) {
            ctl = document.createElement('select');
            const ph = document.createElement('option');
            ph.value = ''; ph.textContent = 'choose...';
            ctl.appendChild(ph);
            for (const v of rule.values) {
                const o = document.createElement('option');
                o.value = v; o.textContent = v;
                ctl.appendChild(o);
            }
            ctl.value = rule.values.includes(prev) ? prev : '';
        } else {
            // Text input (not type=number) so a wrong value like "aaa" stays
            // visible and gets flagged, rather than being silently cleared.
            ctl = document.createElement('input');
            ctl.placeholder = (rule && rule.type === 'number') ? 'number' : 'value';
            // Keep the previous value only when it fits the new operand, or when
            // round-tripping (so a path/literal from the document isn't lost).
            const fits = roundTrip
                || !rule
                || (rule.type === 'number' && this._isNumeric(prev))
                || this._isContextPath(prev);
            ctl.value = fits ? prev : '';
        }
        ctl.classList.add('cd-right');
        ctl.addEventListener('input', () => this._updatePreview());
        ctl.addEventListener('change', () => this._updatePreview());
        cell.appendChild(ctl);
    }

    _readClauses() {
        return [...this.rowsEl.querySelectorAll('.cd-row')].map((r) => ({
            left: this._rowOperand(r),
            op: r.querySelector('.cd-op').value,
            right: this._rowValue(r),
        }));
    }

    _populate(value) {
        const parsed = APLExpression.toClauses(value);
        this.joinEl.value = parsed.join === '||' ? '||' : '&&';
        this.rowsEl.innerHTML = '';
        if (parsed.mode === 'builder') {
            for (const c of parsed.clauses) this._addRow(c);
            this._setRawMode(false);
        } else if (typeof value === 'string' && value.trim() !== '') {
            this.rawEl.value = value;
            this._setRawMode(true);
        } else {
            this._addRow({ left: '', op: '==', right: '' });
            this._setRawMode(false);
        }
        this._updatePreview();
    }

    _toggleRaw() {
        if (this._rawMode) {
            const parsed = APLExpression.toClauses(this.rawEl.value);
            if (parsed.mode !== 'builder' && this.rawEl.value.trim() !== '') {
                this.errorEl.textContent = 'This expression is too complex for the builder - edit it as raw text.';
                this.errorEl.style.display = '';
                return;
            }
            this.joinEl.value = parsed.join === '||' ? '||' : '&&';
            this.rowsEl.innerHTML = '';
            (parsed.clauses.length ? parsed.clauses : [{ left: '', op: '==', right: '' }]).forEach((c) => this._addRow(c));
            this._setRawMode(false);
        } else {
            this.rawEl.value = APLExpression.fromClauses(this.joinEl.value, this._readClauses());
            this._setRawMode(true);
        }
        this._updatePreview();
    }

    _setRawMode(on) {
        this._rawMode = on;
        this.rawEl.style.display = on ? '' : 'none';
        this.rowsEl.style.display = on ? 'none' : '';
        this.addBtn.style.display = on ? 'none' : '';
        this.joinEl.style.display = on ? 'none' : '';
        this.rawToggleEl.textContent = on ? 'Use the builder' : 'Edit raw expression';
    }

    _updatePreview() {
        const valueError = this._rawMode ? this._validateRawValues() : this._validateClauseValues();
        const expr = this.getExpression();
        this.previewEl.textContent = expr || '(always shown)';
        const synErr = (typeof APLExpression !== 'undefined') ? APLExpression.validate('condition', expr) : null;
        const msg = valueError || synErr;
        this.errorEl.textContent = msg || '';
        this.errorEl.style.display = msg ? '' : 'none';
        if (this.confirmBtnEl) this.confirmBtnEl.disabled = !!msg;
    }

    /** Check each builder row's value against its operand type. A value that is a
     *  context path (operand-to-operand comparison) is always allowed. */
    _validateClauseValues() {
        for (const c of this._readClauses()) {
            const left = (c.left || '').trim();
            const val = String(c.right || '').trim();
            if (left === '') {
                // a value (or operator) without a property is an incomplete row
                if (val !== '') return 'Choose a property for each condition';
                continue; // fully empty row is ignored
            }
            if (c.op === '') continue; // "is set" needs no value
            if (val === '') return `Enter a value for '${left}'`;
            const err = this._checkOperandValue(left, c.op, val);
            if (err) return err;
        }
        return null;
    }

    /** Semantic check for raw mode: type-check every comparison's value against
     *  its operand (e.g. viewport.theme == '1' is rejected because theme is
     *  light|dark). Syntax is validated separately by APLExpression.validate, so
     *  here we only flag values that parse but don't fit the operand. */
    _validateRawValues() {
        if (typeof APLExpression === 'undefined') return null;
        for (const c of APLExpression.comparisons(this.rawEl.value)) {
            const err = this._checkOperandValue((c.left || '').trim(), c.op, String(c.right || '').trim());
            if (err) return err;
        }
        return null;
    }

    /** Type-check one operand/value pair against OPERAND_VALUES. Returns an error
     *  string, or null when valid (unknown operand, "is set", or a context-path
     *  value used for an operand-to-operand comparison). Shared by builder and
     *  raw validation so both surfaces stay in sync. */
    _checkOperandValue(left, op, val) {
        if (!left || op === '') return null;
        const rule = this.constructor.OPERAND_VALUES[left];
        if (!rule || this._isContextPath(val)) return null;
        if (rule.type === 'number' && !this._isNumeric(val)) return `'${left}' needs a number`;
        if (rule.type === 'enum' && !rule.values.includes(val)) {
            return `'${left}' must be one of: ${rule.values.join(', ')}`;
        }
        return null;
    }

    getStyle() {
        let style = super.getStyle();
        style += `
            .wrapper {
                width: 540px;
                max-width: 92vw;
                height: auto;
                max-height: 84vh;
                margin: 7% auto;
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0,0,0,.35);
                font-family: sans-serif;
            }
            .content { overflow: auto; }

            .cd-intro { font-weight: 600; font-size: 14px; color: #222; margin-bottom: 8px; }
            .cd-head { margin-bottom: 10px; }
            .cd-join { width: 100%; padding: 6px; font-size: 13px; border: 1px solid #bbb; border-radius: 5px; }

            .cd-rows { display: flex; flex-direction: column; gap: 8px; }
            .cd-row { display: flex; align-items: flex-start; gap: 6px; }
            .cd-row .cd-operand { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
            .cd-row .cd-operand select, .cd-row .cd-operand input { width: 100%; }
            .cd-row .cd-op { flex: 0 0 auto; }
            .cd-row .cd-value { flex: 0 0 130px; min-width: 0; }
            .cd-row .cd-value .cd-right { width: 100%; }
            .cd-row input, .cd-row select {
                padding: 6px; font-size: 13px; border: 1px solid #bbb; border-radius: 5px; box-sizing: border-box;
            }
            .cd-row .cd-remove { margin-top: 4px; }
            .cd-row .cd-remove {
                flex: 0 0 auto; border: none; background: transparent; color: #c33;
                font-family: monospace; font-size: 13px; line-height: 1; cursor: pointer; padding: 0 4px;
            }
            .cd-row .cd-remove:hover { color: #900; }

            .cd-add {
                align-self: flex-start; margin-top: 10px; padding: 6px 12px; font-size: 13px; cursor: pointer;
                border: 1px dashed #6a8; background: #f3faf5; color: #275; border-radius: 5px;
            }
            .cd-add:hover { background: #e6f5ec; }

            .cd-raw-toggle {
                display: block; margin-top: 12px; background: none; border: none; color: cornflowerblue;
                font-size: 12px; cursor: pointer; padding: 0; text-decoration: underline;
            }
            .cd-raw { width: 100%; box-sizing: border-box; margin-top: 6px; font-family: monospace; font-size: 12px; padding: 6px; border: 1px solid #bbb; border-radius: 5px; }

            .cd-preview-wrap { display: flex; align-items: baseline; gap: 8px; margin-top: 14px; padding-top: 10px; border-top: 1px solid #eee; }
            .cd-preview-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: .04em; }
            .cd-preview { font-family: monospace; font-size: 12px; color: #1a5; word-break: break-all; }
            .cd-error { color: #c33; font-size: 12px; margin-top: 6px; }

            .actions .btn { padding: 6px 16px; font-size: 13px; cursor: pointer; border-radius: 5px; }
            .actions .confirmBtn { background: cornflowerblue; color: #fff; border: 1px solid cornflowerblue; }
            .actions .confirmBtn:disabled { opacity: .5; cursor: not-allowed; }
        `;
        return style;
    }
}

customElements.define(APLConditionDialogComponent.tag, APLConditionDialogComponent);
