import { APLGridSequenceFixture } from '../../helpers/Component';

const fixture = new APLGridSequenceFixture('/webcomponents-apl/tests/fixtures/apl-gridsequence.html', '#grid1');

describe('APLGridSequenceComponent', () => {
    before(() => fixture.open());

    fixture.testGridSequence();

    it('wrapper should lay children out in a grid', async () => {
        expect(await fixture.wrapperStyle('display')).toBe('grid');
    });

    it('vertical scroll: rows flow downward and scroll vertically', async () => {
        await fixture.applyCSSSet({ scrollDirection: 'vertical', childWidth: '100px' });
        expect(await fixture.wrapperStyle('gridAutoFlow')).toBe('row');
        expect(await fixture.wrapperStyle('overflowY')).toBe('auto');
        expect(await fixture.wrapperStyle('overflowX')).toBe('hidden');
    });

    it('horizontal scroll: columns flow rightward and scroll horizontally', async () => {
        await fixture.applyCSSSet({ scrollDirection: 'horizontal', childHeight: '100px' });
        expect(await fixture.wrapperStyle('gridAutoFlow')).toBe('column');
        expect(await fixture.wrapperStyle('overflowX')).toBe('auto');
        expect(await fixture.wrapperStyle('overflowY')).toBe('hidden');
    });

    it('should be registered as the GridSequence APL type', async () => {
        const registered = await browser.execute(() =>
            (window as any).getAPLComponentClass?.('GridSequence')?.tag);
        expect(registered).toBe('apl-grid-sequence-component');
    });
});
