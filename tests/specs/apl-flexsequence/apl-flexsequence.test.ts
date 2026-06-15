import { APLFlexSequenceFixture } from '../../helpers/Component';

const fixture = new APLFlexSequenceFixture('/webcomponents-apl/tests/fixtures/apl-flexsequence.html', '#flex1');

describe('APLFlexSequenceComponent', () => {
    before(() => fixture.open());

    fixture.testFlexSequence();

    it('wrapper should wrap children', async () => {
        expect(await fixture.wrapperStyle('flexWrap')).toBe('wrap');
    });

    it('vertical scroll: wrapper flows in rows and scrolls vertically', async () => {
        await fixture.applyCSSSet({ scrollDirection: 'vertical' });
        expect(await fixture.wrapperStyle('flexDirection')).toBe('row');
        expect(await fixture.wrapperStyle('overflowY')).toBe('auto');
        expect(await fixture.wrapperStyle('overflowX')).toBe('hidden');
    });

    it('horizontal scroll: wrapper flows in columns and scrolls horizontally', async () => {
        await fixture.applyCSSSet({ scrollDirection: 'horizontal' });
        expect(await fixture.wrapperStyle('flexDirection')).toBe('column');
        expect(await fixture.wrapperStyle('overflowX')).toBe('auto');
        expect(await fixture.wrapperStyle('overflowY')).toBe('hidden');
    });

    it('should be registered as the FlexSequence APL type', async () => {
        const registered = await browser.execute(() =>
            (window as any).getAPLComponentClass?.('FlexSequence')?.tag);
        expect(registered).toBe('apl-flex-sequence-component');
    });
});
