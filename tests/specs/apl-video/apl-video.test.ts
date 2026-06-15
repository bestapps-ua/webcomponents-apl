import { APLVideoFixture } from '../../helpers/Component';

const fixture = new APLVideoFixture('/webcomponents-apl/tests/fixtures/apl-video.html', '#video1');

describe('APLVideoComponent', () => {
    before(() => fixture.open());

    fixture.testVideo();

    it('audioTrack should expose the documented enum values', async () => {
        const def = await fixture.propertyDef('audioTrack');
        expect(def!.items).toEqual(['foreground', 'background', 'none']);
    });

    it('scale should expose the documented enum values', async () => {
        const def = await fixture.propertyDef('scale');
        expect(def!.items).toEqual(['best-fit', 'best-fill']);
    });

    it('should render a video element', async () => {
        const tag = await browser.execute((sel: string) => {
            const el = document.querySelector(sel) as any;
            el.setAPLData({ source: '' });
            el.renderContent();
            return el?.shadowRoot?.querySelector('.wrapper video')?.tagName;
        }, '#video1');
        expect(tag).toBe('VIDEO');
    });

    it('should be a leaf component (no children allowed)', async () => {
        const allowed = await browser.execute(() =>
            (APLValidationRules as any).childrenAllowed.Video);
        expect(allowed).toBe(false);
    });

    it('should be registered as the Video APL type', async () => {
        const registered = await browser.execute(() =>
            (window as any).getAPLComponentClass?.('Video')?.tag);
        expect(registered).toBe('apl-video-component');
    });
});
