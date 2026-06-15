import { browser, expect } from '@wdio/globals';

/**
 * Regression tests for the object-inspector selection fix.
 *
 * Bug: APLObjectInspectorObjectsComponent.addComponent re-read localStorage and
 * re-selected the stored component on EVERY add, so dragging in a new component
 * left the freshly added one inactive. The restore was moved to a one-shot
 * restorePersistedSelection() called after the initial load.
 */
describe('object inspector selection (drag-drop activation fix)', () => {
    before(() => browser.url('/webcomponents-apl/tests/fixtures/apl-inspector-selection.html'));

    it('addComponent does NOT hijack selection to the persisted component', async () => {
        const r = await browser.execute(async () => {
            const objs = await (window as any).__makeObjs();
            // Pretend a previous session selected "CompA".
            localStorage.setItem((window as any).__storageKey(), 'CompA');

            const fired: string[] = [];
            objs.subscribe(BestAppsComponent.EVENT_CHANGED, (p: any) => {
                if (p && p.type) fired.push(p.type);
            });

            const a = await (window as any).__mkComp('CompA');
            const b = await (window as any).__mkComp('CompB');
            objs.addComponent(a);
            objs.addComponent(b);
            await new Promise((res) => setTimeout(res, 50));

            return {
                componentCount: objs.getComponents().length,
                selectedOption: (window as any).__selectedOptionValue(objs), // null = nothing hijacked
                firedChangedComponent: fired.includes('changed.component'),
            };
        });
        expect(r.componentCount).toBe(2);
        expect(r.selectedOption).toBe(null);          // addComponent selected nothing
        expect(r.firedChangedComponent).toBe(false);  // and fired no selection event
    });

    it('restorePersistedSelection() restores the stored component once', async () => {
        const r = await browser.execute(async () => {
            const objs = await (window as any).__makeObjs();
            const a = await (window as any).__mkComp('CompA');
            const b = await (window as any).__mkComp('CompB');
            objs.addComponent(a);
            objs.addComponent(b);

            localStorage.setItem((window as any).__storageKey(), 'CompA');
            const fired: any[] = [];
            objs.subscribe(BestAppsComponent.EVENT_CHANGED, (p: any) => {
                if (p && p.type === 'changed.component') fired.push(p.data?.toComponent?.getAPLName?.());
            });

            objs.restorePersistedSelection();
            await new Promise((res) => setTimeout(res, 250)); // addEvent/processEvents queue

            return {
                selectedOptionValue: (window as any).__selectedOptionValue(objs),
                aGuid: a.getAttribute('guid'),
                header: objs.selectElement.innerText,
                restoredTo: fired,
            };
        });
        expect(r.selectedOptionValue).toBe(r.aGuid);   // CompA's option selected
        expect(r.header).toContain('CompA');
        expect(r.restoredTo).toEqual(['CompA']);       // exactly one restore event for CompA
    });

    it('restorePersistedSelection() is a no-op when nothing was persisted', async () => {
        const r = await browser.execute(async () => {
            const objs = await (window as any).__makeObjs();   // clears localStorage
            const a = await (window as any).__mkComp('CompA');
            objs.addComponent(a);

            const fired: string[] = [];
            objs.subscribe(BestAppsComponent.EVENT_CHANGED, (p: any) => {
                if (p && p.type) fired.push(p.type);
            });
            objs.restorePersistedSelection();
            await new Promise((res) => setTimeout(res, 200));

            return {
                selectedOption: (window as any).__selectedOptionValue(objs),
                firedChangedComponent: fired.includes('changed.component'),
            };
        });
        expect(r.selectedOption).toBe(null);
        expect(r.firedChangedComponent).toBe(false);
    });
});
