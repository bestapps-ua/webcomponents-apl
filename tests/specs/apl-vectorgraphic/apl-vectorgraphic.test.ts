import { APLVectorGraphicFixture } from '../../helpers/Component';

const fixture = new APLVectorGraphicFixture('/webcomponents-apl/tests/fixtures/apl-vectorgraphic.html', '#vg1');

describe('APLVectorGraphicComponent', () => {
    before(() => fixture.open());

    fixture.testVectorGraphic();

    it('align should expose the documented enum values', async () => {
        const def = await fixture.propertyDef('align');
        expect(def!.items).toEqual([
            'bottom', 'bottom-left', 'bottom-right',
            'center', 'left', 'right',
            'top', 'top-left', 'top-right',
        ]);
    });

    it('scale should expose the documented enum values', async () => {
        const def = await fixture.propertyDef('scale');
        expect(def!.items).toEqual(['none', 'fill', 'best-fill', 'best-fit']);
    });

    it('should be a leaf component (no children allowed)', async () => {
        const allowed = await browser.execute(() =>
            (APLValidationRules as any).childrenAllowed.VectorGraphic);
        expect(allowed).toBe(false);
    });

    it('should be registered as the VectorGraphic APL type', async () => {
        const registered = await browser.execute(() =>
            (window as any).getAPLComponentClass?.('VectorGraphic')?.tag);
        expect(registered).toBe('apl-vector-graphic-component');
    });
});
