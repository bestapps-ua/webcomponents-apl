import { APLTextFixture } from '../../helpers/Component';

const fixture = new APLTextFixture('/webcomponents-apl/tests/fixtures/apl-text.html', '#text1');

describe('APLTextComponent', () => {
    before(() => fixture.open());

    fixture.testText();

    it('typography properties should have CSS mappings', async () => {
        for (const key of ['fontStyle', 'letterSpacing', 'lineHeight', 'textAlign']) {
            expect(await fixture.hasCSSMapping(key)).toBe(true);
        }
    });

    it('color property should have CSS mapping', async () => {
        expect(await fixture.hasCSSMapping('color')).toBe(true);
    });

    it('textAlign should expose the documented enum values', async () => {
        const def = await fixture.propertyDef('textAlign');
        expect(def!.items).toEqual(['auto', 'left', 'right', 'center', 'start', 'end']);
    });

    it('textAlignVertical should expose the documented enum values', async () => {
        const def = await fixture.propertyDef('textAlignVertical');
        expect(def!.items).toEqual(['auto', 'top', 'bottom', 'center']);
    });
});
