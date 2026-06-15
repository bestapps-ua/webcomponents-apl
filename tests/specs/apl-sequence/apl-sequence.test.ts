import { APLSequenceFixture } from '../../helpers/Component';

const fixture = new APLSequenceFixture('/webcomponents-apl/tests/fixtures/apl-sequence.html', '#seq1');

describe('APLSequenceComponent', () => {
    before(() => fixture.open());

    fixture.testSequence();

    it('should lay children out in a single non-wrapping strip', async () => {
        expect(await fixture.wrapperStyle('flexWrap')).toBe('nowrap');
    });

    it('vertical scroll: children stack in a column and scroll vertically', async () => {
        await fixture.applyCSSSet({ scrollDirection: 'vertical' });
        expect(await fixture.wrapperStyle('flexDirection')).toBe('column');
        expect(await fixture.wrapperStyle('overflowY')).toBe('auto');
        expect(await fixture.wrapperStyle('overflowX')).toBe('hidden');
    });

    it('horizontal scroll: children sit in a row and scroll horizontally', async () => {
        await fixture.applyCSSSet({ scrollDirection: 'horizontal' });
        expect(await fixture.wrapperStyle('flexDirection')).toBe('row');
        expect(await fixture.wrapperStyle('overflowX')).toBe('auto');
        expect(await fixture.wrapperStyle('overflowY')).toBe('hidden');
    });

    it('should be registered as the Sequence APL type', async () => {
        const registered = await browser.execute(() =>
            (window as any).getAPLComponentClass?.('Sequence')?.tag);
        expect(registered).toBe('apl-sequence-component');
    });
});
