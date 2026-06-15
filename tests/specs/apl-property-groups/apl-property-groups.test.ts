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
