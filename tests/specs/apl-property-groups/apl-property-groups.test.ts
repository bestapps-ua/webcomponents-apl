import { browser, expect } from '@wdio/globals';

const SAMPLE = {
    name: { type: 'text', value: 'Frame1', options: {} },
    // Size: 4 present members -> forms a group
    width: { type: 'dimension', value: '50%', default: '100%', options: {} },   // filled (differs from default)
    height: { type: 'dimension', value: '100%', default: '100%', options: {} }, // NOT filled (== default)
    minWidth: { type: 'dimension', value: '', options: {} },
    maxWidth: { type: 'dimension', value: '', options: {} },
    // Padding: 3 present members -> forms a group
    padding: { type: 'dimension', value: '10dp', options: {} },                 // filled (no default, non-empty)
    paddingLeft: { type: 'dimension', value: '', options: {} },
    paddingTop: { type: 'dimension', value: '', options: {} },
    // Lone group members -> fall back to standalone
    borderRadius: { type: 'dimension', value: '', options: {} },                // Border (only member)
    opacity: { type: 'text', value: '0.5', options: {} },                       // Appearance (only member)
    when: { type: 'text', value: '', options: {} },                            // State (only member)
};

async function build() {
    return browser.execute(async (sample: any) => {
        localStorage.clear();
        const tab = await (window as any).__makeTab(sample);
        const wrapper = tab.shadowRoot.querySelector('.wrapper');
        const children = [...wrapper.children];
        const describe = (el: any) => {
            if (el.tagName.toLowerCase() === 'apl-object-inspector-property-group-component') {
                return {
                    kind: 'group',
                    title: el.title,
                    open: el.open,
                    toggle: el.toggleEl.innerText,
                    summary: el.summaryEl.innerText,
                    bodyDisplay: el.bodyEl.style.display,
                    members: el.members.map((m: any) => m.el.name),
                };
            }
            return { kind: 'row', name: el.name };
        };
        return children.map(describe);
    }, SAMPLE);
}

describe('APL property groups (object inspector)', () => {
    before(() => browser.url('/webcomponents-apl/tests/fixtures/apl-property-groups.html'));

    it('pins name, then groups (A-Z), then standalone rows (A-Z)', async () => {
        const layout = await build();
        const order = layout.map((x: any) => x.kind === 'group' ? `group:${x.title}` : `row:${x.name}`);
        expect(order).toEqual([
            'row:name',
            'group:Padding',
            'group:Size',
            'row:borderRadius',
            'row:opacity',
            'row:when',
        ]);
    });

    it('sorts members alphabetically within a group', async () => {
        const layout = await build();
        const size = layout.find((x: any) => x.kind === 'group' && x.title === 'Size');
        expect(size.members).toEqual(['height', 'maxWidth', 'minWidth', 'width']);
    });

    it('actually attaches member rows into the group body DOM', async () => {
        const bodyNames = await browser.execute(() => {
            const tab = document.getElementById('tab1') as any;
            const group = [...tab.shadowRoot.querySelectorAll('apl-object-inspector-property-group-component')]
                .find((g: any) => g.title === 'Size') as any;
            return [...group.bodyEl.children].map((c: any) => c.name);
        });
        expect(bodyNames).toEqual(['height', 'maxWidth', 'minWidth', 'width']);
    });

    it('a group with a single present member degrades to a standalone row', async () => {
        const layout = await build();
        const groupTitles = layout.filter((x: any) => x.kind === 'group').map((x: any) => x.title);
        expect(groupTitles).not.toContain('Border');
        expect(layout.some((x: any) => x.kind === 'row' && x.name === 'borderRadius')).toBe(true);
    });

    it('groups default to collapsed with a [+] toggle', async () => {
        const layout = await build();
        const padding = layout.find((x: any) => x.kind === 'group' && x.title === 'Padding');
        expect(padding.open).toBe(false);
        expect(padding.toggle).toBe('[+]');
        expect(padding.bodyDisplay).toBe('none');
    });

    it('summarizes only filled members (non-empty and not equal to default)', async () => {
        const layout = await build();
        const size = layout.find((x: any) => x.kind === 'group' && x.title === 'Size');
        const padding = layout.find((x: any) => x.kind === 'group' && x.title === 'Padding');
        expect(size.summary).toBe('width: 50%');     // height==default, min/maxWidth empty
        expect(padding.summary).toBe('padding: 10dp');
    });

    it('toggling a group expands it and shows [-]', async () => {
        const result = await browser.execute(() => {
            const tab = document.getElementById('tab1') as any;
            const group = [...tab.shadowRoot.querySelectorAll('apl-object-inspector-property-group-component')]
                .find((g: any) => g.title === 'Size') as any;
            group.toggle();
            return { open: group.open, toggle: group.toggleEl.innerText, bodyDisplay: group.bodyEl.style.display };
        });
        expect(result.open).toBe(true);
        expect(result.toggle).toBe('[-]');
        expect(result.bodyDisplay).toBe('block');
    });
});

describe('property input editing', () => {
    before(() => browser.url('/webcomponents-apl/tests/fixtures/apl-property-groups.html'));

    it('clicking an empty (undefined) property shows an empty field, not "undefined"', async () => {
        const r = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({ role: { type: 'text', options: {} } });
            const row = [...tab.shadowRoot.querySelectorAll('ba-object-inspector-property-input-component')]
                .find((x: any) => x.name === 'role') as any;
            row.element.wrapper.onclick();              // activate + build field
            const shown = row.fieldEl.value;
            row.onDeactivate();                         // blur without editing
            return { shown, value: row.value === undefined ? '<undef>' : row.value, cell: row.valueEl.innerHTML };
        });
        expect(r.shown).toBe('');           // not the string "undefined"
        expect(r.value).toBe('<undef>');    // not committed
        expect(r.cell).toBe('');            // cell empty, no leftover input
    });

    it('typing a value commits it on blur', async () => {
        const r = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({ role: { type: 'text', options: {} } });
            const row = [...tab.shadowRoot.querySelectorAll('ba-object-inspector-property-input-component')]
                .find((x: any) => x.name === 'role') as any;
            row.element.wrapper.onclick();
            row.fieldEl.value = 'button';
            row.onDeactivate();
            return { value: row.value, cell: row.valueEl.innerHTML };
        });
        expect(r.value).toBe('button');
        expect(r.cell).toBe('button');
    });

    it('clicking a filled property and blurring leaves it unchanged', async () => {
        const r = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({ role: { type: 'text', value: 'button', options: {} } });
            const row = [...tab.shadowRoot.querySelectorAll('ba-object-inspector-property-input-component')]
                .find((x: any) => x.name === 'role') as any;
            row.element.wrapper.onclick();
            row.onDeactivate();
            return { value: row.value, cell: row.valueEl.innerHTML };
        });
        expect(r.value).toBe('button');
        expect(r.cell).toBe('button');
    });
});

describe('property value validation (red + explanation)', () => {
    before(() => browser.url('/webcomponents-apl/tests/fixtures/apl-property-groups.html'));

    it('marks an invalid value red with an explanatory tooltip', async () => {
        const r = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({
                width: { type: 'dimension', value: '10potato', options: {} },
                color: { type: 'color', value: 'red', options: {} },
            });
            const find = (name: string) => tab.properties.find((p: any) => p.name === name);
            const w = find('width');
            const c = find('color');
            return {
                widthInvalid: w.valueContainerEl.classList.contains('value-container--invalid'),
                widthTitle: w.valueContainerEl.title,
                widthMessage: w.validationMessage,
                colorInvalid: c.valueContainerEl.classList.contains('value-container--invalid'),
            };
        });
        expect(r.widthInvalid).toBe(true);
        expect(r.widthTitle).toContain('dimension');
        expect(r.widthMessage).toContain("'width'");
        expect(r.colorInvalid).toBe(false);
    });

    it('does not flag empty values as invalid', async () => {
        const invalid = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({ width: { type: 'dimension', value: '', options: {} } });
            const w = tab.properties.find((p: any) => p.name === 'width');
            return w.valueContainerEl.classList.contains('value-container--invalid');
        });
        expect(invalid).toBe(false);
    });

    it('stays red after a raw-value update (the update flow passes {key: value})', async () => {
        const r = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({ width: { type: 'dimension', value: '100%', options: {} } });
            const w = tab.properties.find((p: any) => p.name === 'width');
            // mimic APL.js updateTabs -> tab.update -> property.processData(rawValue, true)
            w.processData('aaa', true);
            return {
                type: w.type,
                invalid: w.valueContainerEl.classList.contains('value-container--invalid'),
                title: w.valueContainerEl.title,
            };
        });
        expect(r.type).toBe('dimension');           // not degraded to 'text'
        expect(r.invalid).toBe(true);
        expect(r.title).toContain('dimension');
    });

    it('marks a malformed when expression red in the inspector', async () => {
        const r = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({
                when: { type: 'expression', value: '${viewport.width <}', options: {} },
            });
            const w = tab.properties.find((p: any) => p.name === 'when');
            return {
                invalid: w.valueContainerEl.classList.contains('value-container--invalid'),
                title: w.valueContainerEl.title,
            };
        });
        expect(r.invalid).toBe(true);
        expect(r.title).toContain('expression');
    });

    it('does not flag a valid when expression', async () => {
        const invalid = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({
                when: { type: 'expression', value: '${viewport.width < 600}', options: {} },
            });
            const w = tab.properties.find((p: any) => p.name === 'when');
            return w.valueContainerEl.classList.contains('value-container--invalid');
        });
        expect(invalid).toBe(false);
    });

    it('uses the condition control and shows a readable summary', async () => {
        const r = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({
                when: { type: 'expression', value: "${viewport.width < 600 && viewport.shape == 'round'}", options: { visual: 'condition' } },
            });
            const row = tab.properties.find((p: any) => p.name === 'when');
            return { tag: row.tagName.toLowerCase(), summary: row.summaryEl.textContent };
        });
        expect(r.tag).toBe('apl-object-inspector-property-condition-component');
        expect(r.summary).toBe("viewport.width < 600 AND viewport.shape = 'round'");
    });

    it('shows "Always shown" for an empty condition', async () => {
        const summary = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({
                when: { type: 'expression', value: '', options: { visual: 'condition' } },
            });
            return tab.properties.find((p: any) => p.name === 'when').summaryEl.textContent;
        });
        expect(summary).toBe('Always shown');
    });

    it('opens a dialog that builds rows from the value', async () => {
        const r = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({
                when: { type: 'expression', value: '${viewport.width < 600}', options: { visual: 'condition' } },
            });
            const row = tab.properties.find((p: any) => p.name === 'when');
            row.openDialog();
            await row.dialog.loadedDefer.promise;
            await new Promise((res) => setTimeout(res, 150));
            const out = { rows: row.dialog.rowsEl.querySelectorAll('.cd-row').length, preview: row.dialog.previewEl.textContent };
            row.dialog.hide();
            return out;
        });
        expect(r.rows).toBe(1);
        expect(r.preview).toBe('${viewport.width < 600}');
    });

    it('applies the built expression from the dialog back to the row', async () => {
        const value = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({
                when: { type: 'expression', value: '', options: { visual: 'condition' } },
            });
            const row = tab.properties.find((p: any) => p.name === 'when');
            row.openDialog();
            await row.dialog.loadedDefer.promise;
            await new Promise((res) => setTimeout(res, 150));
            const r0 = row.dialog.rowsEl.querySelector('.cd-row');
            r0.querySelector('.cd-left-select').value = 'viewport.shape';
            r0.querySelector('.cd-op').value = '==';
            r0.querySelector('.cd-right').value = 'round';
            row.dialog.doConfirm();
            return row.value;
        });
        expect(value).toBe("${viewport.shape == 'round'}");
    });

    it('round-trips a non-preset operand into the custom input', async () => {
        const r = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({
                when: { type: 'expression', value: '${data.header}', options: { visual: 'condition' } },
            });
            const row = tab.properties.find((p: any) => p.name === 'when');
            row.openDialog();
            await row.dialog.loadedDefer.promise;
            await new Promise((res) => setTimeout(res, 150));
            const r0 = row.dialog.rowsEl.querySelector('.cd-row');
            const out = {
                sel: r0.querySelector('.cd-left-select').value,
                custom: r0.querySelector('.cd-left-custom').value,
                customShown: r0.querySelector('.cd-left-custom').style.display !== 'none',
            };
            row.dialog.hide();
            return out;
        });
        expect(r.sel).toBe('__custom__');
        expect(r.custom).toBe('data.header');
        expect(r.customShown).toBe(true);
    });

    it('validates the value against the operand type (enum becomes a dropdown)', async () => {
        const r = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({
                when: { type: 'expression', value: '', options: { visual: 'condition' } },
            });
            const row = tab.properties.find((p: any) => p.name === 'when');
            row.openDialog();
            await row.dialog.loadedDefer.promise;
            await new Promise((res) => setTimeout(res, 150));
            const d = row.dialog;
            const r0 = d.rowsEl.querySelector('.cd-row');
            const sel = r0.querySelector('.cd-left-select');
            sel.value = 'viewport.shape';
            sel.dispatchEvent(new Event('change'));            // -> value becomes an enum dropdown, empty
            const missing = { disabled: d.confirmBtnEl.disabled, error: d.errorEl.textContent, tag: r0.querySelector('.cd-right').tagName.toLowerCase() };
            const vsel = r0.querySelector('.cd-right');
            vsel.value = 'round';
            vsel.dispatchEvent(new Event('change'));
            const ok = { disabled: d.confirmBtnEl.disabled };
            d.hide();
            return { missing, ok };
        });
        expect(r.missing.tag).toBe('select');          // can't type arbitrary data
        expect(r.missing.disabled).toBe(true);         // empty value blocks Apply
        expect(r.missing.error).toContain('value');
        expect(r.ok.disabled).toBe(false);             // valid choice enables Apply
    });

    const dialogValidate = (value: string, rightValue: string): Promise<string> =>
        browser.execute(async (v: string, rv: string) => {
            const d = document.createElement('apl-condition-dialog-component') as any;
            document.body.appendChild(d);
            await d.loadedDefer.promise;
            d._buildBuilder();
            d._populate(v);
            const ctl = d.rowsEl.querySelector('.cd-right');
            ctl.value = rv;
            const msg = d._validateClauseValues();
            d.remove();
            return msg || '';
        }, value, rightValue);

    it('switches the value control to a dropdown when the operand changes to an enum', async () => {
        const r = await browser.execute(async () => {
            const d = document.createElement('apl-condition-dialog-component') as any;
            document.body.appendChild(d);
            await d.loadedDefer.promise;
            d._buildBuilder();
            d._populate('${viewport.width < 600}');           // numeric operand -> text value '600'
            const row = d.rowsEl.querySelector('.cd-row');
            const before = row.querySelector('.cd-right').tagName.toLowerCase();
            row.querySelector('.cd-left-select').value = 'viewport.shape';
            d._rebuildValue(row);                              // operand changed by the user
            const after = row.querySelector('.cd-right');
            const out = { before, afterTag: after.tagName.toLowerCase(), afterValue: after.value };
            d.remove();
            return out;
        });
        expect(r.before).toBe('input');       // number -> text field
        expect(r.afterTag).toBe('select');    // enum -> dropdown
        expect(r.afterValue).toBe('');        // incompatible '600' discarded
    });

    it('narrows the operator list to equality tests for an enum operand', async () => {
        const r = await browser.execute(async () => {
            const d = document.createElement('apl-condition-dialog-component') as any;
            document.body.appendChild(d);
            await d.loadedDefer.promise;
            d._buildBuilder();
            d._populate('${viewport.width < 600}');           // numeric operand -> full operator set
            const row = d.rowsEl.querySelector('.cd-row');
            const op = row.querySelector('.cd-op');
            const numericOps = [...op.options].map((o: any) => o.value);
            row.querySelector('.cd-left-select').value = 'viewport.shape';
            row.querySelector('.cd-left-select').dispatchEvent(new Event('change')); // user picks an enum operand
            const enumOps = [...op.options].map((o: any) => o.value);
            const enumOpAfter = op.value;
            d.remove();
            return { numericOps, enumOps, enumOpAfter };
        });
        expect(r.numericOps).toEqual(['', '==', '!=', '<', '<=', '>', '>=']); // full set for numbers
        expect(r.enumOps).toEqual(['', '==', '!=']);                          // ordering ops dropped
        expect(r.enumOpAfter).toBe('==');                                     // '<' fell back to '=='
    });

    it('validates raw-mode values semantically and blocks/clears Apply on change', async () => {
        const r = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({
                when: { type: 'expression', value: '', options: { visual: 'condition' } },
            });
            const row = tab.properties.find((p: any) => p.name === 'when');
            row.openDialog();
            await row.dialog.loadedDefer.promise;
            await new Promise((res) => setTimeout(res, 150));
            const d = row.dialog;
            d._toggleRaw();                                  // builder -> raw editor
            const setRaw = (v: string) => { d.rawEl.value = v; d.rawEl.dispatchEvent(new Event('input')); };
            // theme must be light|dark, so '1' is invalid even though the syntax is fine
            setRaw("${viewport.shape == 'round' && viewport.theme == '1' && viewport.dpi == 11}");
            const bad = { disabled: d.confirmBtnEl.disabled, error: d.errorEl.textContent };
            // fixing the value live re-enables Apply (reacts on change)
            setRaw("${viewport.shape == 'round' && viewport.theme == 'dark' && viewport.dpi == 11}");
            const good = { disabled: d.confirmBtnEl.disabled, error: d.errorEl.textContent };
            d.hide();
            return { bad, good };
        });
        expect(r.bad.disabled).toBe(true);          // invalid enum value blocks Apply
        expect(r.bad.error).toContain('theme');     // and explains which operand
        expect(r.good.disabled).toBe(false);        // corrected value re-enables Apply
        expect(r.good.error).toBe('');
    });

    it('flags a number typed for an enum operand in raw mode', async () => {
        const r = await browser.execute(async () => {
            const d = document.createElement('apl-condition-dialog-component') as any;
            document.body.appendChild(d);
            await d.loadedDefer.promise;
            d._buildBuilder();
            d._populate('');
            d._toggleRaw();
            d.rawEl.value = "${viewport.dpi == 11 || viewport.mode == 'desktop'}"; // mode is hub|tv|mobile|auto|pc
            const msg = d._validateRawValues();
            d.remove();
            return msg;
        });
        expect(r).toContain('mode');
    });

    it('flags a non-number value (aaa) for a numeric operand', async () => {
        expect(await dialogValidate('${viewport.width < 600}', 'aaa')).toContain('number');
    });

    it('accepts a number value for a numeric operand', async () => {
        expect(await dialogValidate('${viewport.width < 600}', '480')).toBe('');
    });

    it('blocks apply when a value is entered without choosing a property', async () => {
        expect(await dialogValidate('', 'aaa')).toContain('property');
    });

    it('dialog falls back to raw mode for a complex expression', async () => {
        const raw = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({
                when: { type: 'expression', value: '${a + b * c}', options: { visual: 'condition' } },
            });
            const row = tab.properties.find((p: any) => p.name === 'when');
            row.openDialog();
            await row.dialog.loadedDefer.promise;
            await new Promise((res) => setTimeout(res, 150));
            const out = row.dialog._rawMode;
            row.dialog.hide();
            return out;
        });
        expect(raw).toBe(true);
    });

    it('clears the red state once a valid value is entered', async () => {
        const r = await browser.execute(async () => {
            const tab = await (window as any).__makeTab({ width: { type: 'dimension', value: '10potato', options: {} } });
            const w = tab.properties.find((p: any) => p.name === 'width');
            const before = w.valueContainerEl.classList.contains('value-container--invalid');
            w.setValue('100dp');
            const after = w.valueContainerEl.classList.contains('value-container--invalid');
            return { before, after, title: w.valueContainerEl.title };
        });
        expect(r.before).toBe(true);
        expect(r.after).toBe(false);
        expect(r.title).toBe('');
    });
});
