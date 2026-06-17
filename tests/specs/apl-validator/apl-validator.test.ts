import { browser, expect } from '@wdio/globals';

async function validate(doc: any): Promise<Array<{ path: string; message: string }>> {
    return browser.execute((d: any) => {
        return (window as any).validator.validate(d)
            .map((e: any) => ({ path: e.path.join('.'), message: e.message }));
    }, doc);
}

describe('APLValidator', () => {
    before(async () => {
        await browser.url('/webcomponents-apl/tests/fixtures/apl-validator.html');
        await browser.waitUntil(
            async () => browser.execute(() => !!(window as any)._testReady),
            { timeout: 8000, timeoutMsg: 'Validator fixture not ready' },
        );
    });

    it('should accept a valid document', async () => {
        const errors = await validate({
            mainTemplate: {
                items: [{
                    type: 'Container', direction: 'row',
                    items: [
                        { type: 'Image', source: 'a.png', scale: 'best-fit', width: 0 },
                        { type: 'Text', text: 'hello', color: '#ff0000', fontSize: '20dp' },
                    ],
                }],
            },
        });
        expect(errors).toEqual([]);
    });

    it('should allow unknown property names (official APL superset)', async () => {
        const errors = await validate({
            mainTemplate: { items: [{ type: 'Text', text: 'x', bind: [], when: '${1}', style: 'base' }] },
        });
        expect(errors).toEqual([]);
    });

    it('should require a mainTemplate object', async () => {
        const errors = await validate({ foo: 1 });
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toContain('mainTemplate');
    });

    it('should require items or item in mainTemplate', async () => {
        const errors = await validate({ mainTemplate: {} });
        expect(errors).toHaveLength(1);
        expect(errors[0].path).toBe('mainTemplate');
    });

    it('should reject unknown component types with the supported list', async () => {
        const errors = await validate({ mainTemplate: { items: [{ type: 'Banana' }] } });
        expect(errors).toHaveLength(1);
        expect(errors[0].path).toBe('mainTemplate.items.0.type');
        expect(errors[0].message).toContain("unknown component type 'Banana'");
        expect(errors[0].message).toContain('Container');
    });

    it('should require a type on every component', async () => {
        const errors = await validate({ mainTemplate: { items: [{ text: 'no type' }] } });
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toContain("requires a 'type'");
    });

    it('should reject invalid enum values with the allowed list', async () => {
        const errors = await validate({
            mainTemplate: { items: [{ type: 'Image', source: 'x.png', scale: 'wrong' }] },
        });
        expect(errors).toHaveLength(1);
        expect(errors[0].path).toBe('mainTemplate.items.0.scale');
        expect(errors[0].message).toContain('best-fit');
    });

    it('should validate enum values that map to css names', async () => {
        const ok = await validate({
            mainTemplate: { items: [{ type: 'Container', direction: 'columnReverse', wrap: 'noWrap' }] },
        });
        expect(ok).toEqual([]);
        const bad = await validate({
            mainTemplate: { items: [{ type: 'Container', direction: 'column-reverse' }] },
        });
        expect(bad).toHaveLength(1);
        expect(bad[0].path).toBe('mainTemplate.items.0.direction');
    });

    it('should reject invalid dimensions and accept valid ones', async () => {
        const bad = await validate({ mainTemplate: { items: [{ type: 'Frame', width: '10potato' }] } });
        expect(bad).toHaveLength(1);
        expect(bad[0].path).toBe('mainTemplate.items.0.width');

        const ok = await validate({
            mainTemplate: {
                items: [{ type: 'Frame', width: '50%', height: 'auto', minWidth: 0, maxWidth: '100dp', paddingLeft: '5px', top: '-10vh' }],
            },
        });
        expect(ok).toEqual([]);
    });

    it('should reject invalid colors and accept valid ones', async () => {
        const bad = await validate({ mainTemplate: { items: [{ type: 'Text', text: 'x', color: 'notacolor' }] } });
        expect(bad).toHaveLength(1);
        expect(bad[0].path).toBe('mainTemplate.items.0.color');

        const ok = await validate({
            mainTemplate: {
                items: [
                    { type: 'Text', text: 'x', color: '#ff0000' },
                    { type: 'Frame', backgroundColor: 'rgba(0, 0, 0, 0.5)', borderColor: 'red' },
                ],
            },
        });
        expect(ok).toEqual([]);
    });

    it('should reject a 7-digit hex color (the bug shipped in home.js)', async () => {
        const errors = await validate({ mainTemplate: { items: [{ type: 'Frame', borderColor: '#fffffff' }] } });
        expect(errors).toHaveLength(1);
        expect(errors[0].path).toBe('mainTemplate.items.0.borderColor');
    });

    it('should require Image source', async () => {
        const errors = await validate({ mainTemplate: { items: [{ type: 'Image' }] } });
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toContain("Image requires 'source'");
    });

    it('should reject children on leaf components', async () => {
        const errors = await validate({
            mainTemplate: { items: [{ type: 'Text', text: 'x', items: [{ type: 'Frame' }] }] },
        });
        expect(errors).toHaveLength(1);
        expect(errors[0].path).toBe('mainTemplate.items.0.items');
        expect(errors[0].message).toContain('cannot contain child components');
    });

    it('should reject items that is not an array', async () => {
        const errors = await validate({ mainTemplate: { items: [{ type: 'Container', items: {} }] } });
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toContain('must be an array');
    });

    it('should validate nested item (single child) structures', async () => {
        const errors = await validate({
            mainTemplate: {
                items: [{
                    type: 'Frame',
                    item: { type: 'Image', source: 'x.png', scale: 'nope' },
                }],
            },
        });
        expect(errors).toHaveLength(1);
        expect(errors[0].path).toBe('mainTemplate.items.0.item.scale');
    });

    it('should report multiple errors with distinct paths', async () => {
        const errors = await validate({
            mainTemplate: {
                items: [
                    { type: 'Image' },
                    { type: 'Wrong' },
                    { type: 'Text', text: 'x', color: 'nope' },
                ],
            },
        });
        const paths = errors.map(e => e.path);
        expect(paths).toContain('mainTemplate.items.0');
        expect(paths).toContain('mainTemplate.items.1.type');
        expect(paths).toContain('mainTemplate.items.2.color');
    });

    it('validateNode flags a bad value on a bare component node (inspector Data tab)', async () => {
        const errors = await browser.execute(() => {
            return (window as any).validator.validateNode({ type: 'Text', text: 'x', height: 'aaa' });
        });
        expect(errors).toHaveLength(1);
        expect(errors[0].path).toEqual(['height']);
        expect(errors[0].message).toContain('dimension');
    });

    it('validateNode accepts a valid bare component node', async () => {
        const errors = await browser.execute(() => {
            return (window as any).validator.validateNode({ type: 'Text', text: 'x', height: '100%', color: '#fff' });
        });
        expect(errors).toEqual([]);
    });

    it('validateNode validates a full document too', async () => {
        const errors = await browser.execute(() => {
            return (window as any).validator.validateNode({
                mainTemplate: { items: [{ type: 'Frame', width: '10potato' }] },
            });
        });
        expect(errors).toHaveLength(1);
        expect(errors[0].path).toEqual(['mainTemplate', 'items', 0, 'width']);
    });

    it('validateNode ignores JSON it cannot classify', async () => {
        const errors = await browser.execute(() => {
            return (window as any).validator.validateNode({ foo: 'bar', height: 'aaa' });
        });
        expect(errors).toEqual([]);
    });

    it('flags a malformed when expression on a node', async () => {
        const errors = await browser.execute(() => {
            return (window as any).validator.validateNode({ type: 'Text', text: 'x', when: '${viewport.width <}' });
        });
        expect(errors).toHaveLength(1);
        expect(errors[0].path).toEqual(['when']);
        expect(errors[0].message).toContain('expression');
    });

    it('accepts a valid when and ${} property values (data binding)', async () => {
        const errors = await browser.execute(() => {
            return (window as any).validator.validateNode({
                type: 'Frame', width: '${data.w}', when: '${viewport.width < 600}',
            });
        });
        expect(errors).toEqual([]);
    });

    it('should ignore undefined values (in-memory documents)', async () => {
        const errors = await browser.execute(() => {
            const doc: any = { mainTemplate: { items: [{ type: 'Frame' }] } };
            doc.mainTemplate.items[0].width = undefined;
            return (window as any).validator.validate(doc);
        });
        expect(errors).toEqual([]);
    });
});
