import { APLPagerFixture } from '../../helpers/Component';

const fixture = new APLPagerFixture('/webcomponents-apl/tests/fixtures/apl-pager.html', '#pager1');

describe('APLPagerComponent', () => {
    before(() => fixture.open());

    fixture.testPager();

    it('wrapper should clip to a single page', async () => {
        expect(await fixture.wrapperStyle('overflow')).toBe('hidden');
    });

    it('navigation should allow normal, none, wrap and forward-only', async () => {
        const def = await fixture.propertyDef('navigation');
        expect(def!.items).toEqual(['normal', 'none', 'wrap', 'forward-only']);
    });

    it('should not be scrollable (no onScroll / scrollDirection / snap)', async () => {
        const props = await fixture.propertyKeys();
        const events = await fixture.eventKeys();
        expect(props).not.toContain('scrollDirection');
        expect(props).not.toContain('snap');
        expect(events).not.toContain('onScroll');
    });

    it('should be registered as the Pager APL type', async () => {
        const registered = await browser.execute(() =>
            (window as any).getAPLComponentClass?.('Pager')?.tag);
        expect(registered).toBe('apl-pager-component');
    });
});
