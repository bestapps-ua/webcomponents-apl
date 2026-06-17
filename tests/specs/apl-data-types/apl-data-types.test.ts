import { browser, expect } from '@wdio/globals';

/**
 * Exhaustive valid/invalid tables for every APL data-type predicate in
 * APLValidationRules. These are the single source of truth for "what is a
 * valid Dimension/Color/Number/..." and back the reusable checkValue()
 * dispatcher consumed by APLValidator and (later) APLProperties.encode.
 *
 * APL data types: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-data-types.html
 */

function predicate(method: string, value: any): Promise<boolean> {
    return browser.execute((m: string, v: any) => (window as any).APLRules[m](v), method, value);
}

function checkValue(key: string, value: any, property: any): Promise<string | null> {
    return browser.execute(
        (k: string, v: any, p: any) => (window as any).APLRules.checkValue(k, v, p),
        key, value, property,
    );
}

type Cases = { valid: any[]; invalid: any[] };

const TABLE: Record<string, Cases> = {
    isDimension: {
        valid: ['auto', 0, 100, -5, '100', '100dp', '50%', '10vh', '10vw', '5px', '1.5dp', '-10vh'],
        invalid: ['10potato', '10em', 'px', '', 'abc', '#fff', '10 dp'],
    },
    isColor: {
        valid: ['#fff', '#ffff', '#ff0000', '#ff0000aa', 'red', 'transparent', 'rgb(0,0,0)', 'rgba(0,0,0,0.5)', 'hsl(0,100%,50%)'],
        invalid: ['notacolor', '#fffffff', '#zz', '', 'blurple'],
    },
    isNumber: {
        valid: [0, 1, -3.14, 100, '0', '12', '-3.5', '1e3'],
        invalid: ['', 'abc', '12px', '1,2', true, null, {}],
    },
    isInteger: {
        valid: [0, 1, -42, '0', '12', '-7'],
        invalid: [1.5, '1.5', '12px', '', 'abc', true],
    },
    isBoolean: {
        valid: [true, false, 'true', 'false'],
        invalid: ['yes', 'no', 0, 1, '', 'True'],
    },
    isUrl: {
        valid: ['a.png', 'https://x.com/i.png', 'data:image/png;base64,AAA', '/assets/x.svg'],
        invalid: ['', '   ', 123, null, {}],
    },
    isEasing: {
        valid: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'cubic-bezier(0,0,1,1)', 'path(0.5,0.5)', 'spatial(2,0)'],
        invalid: ['bounce', 'ease-in-out-out', '', 'cubic-bezier', 42],
    },
    isGradient: {
        valid: [
            { colorRange: ['#000', '#fff'] },
            { type: 'linear', colorRange: ['red', 'blue'], inputRange: [0, 1] },
            { type: 'radial', colorRange: ['red'] },
        ],
        invalid: [
            {},
            { type: 'diagonal', colorRange: ['red'] },
            { colorRange: [] },
            { colorRange: 'red' },
            ['#000', '#fff'],
            'linear',
        ],
    },
    isFilter: {
        valid: [{ type: 'Blur' }, [{ type: 'Blur', radius: 5 }], [{ type: 'Grayscale' }, { type: 'Blur' }], []],
        invalid: [{ radius: 5 }, [{ radius: 5 }], 'Blur', [{ type: 'Blur' }, { radius: 1 }]],
    },
    isTransform: {
        valid: [[{ rotate: 90 }], [{ scaleX: 2 }, { translateX: '10dp' }], []],
        invalid: [{ rotate: 90 }, [{ wobble: 1 }], 'rotate(90)', [{}]],
    },
    isCommands: {
        valid: [{ type: 'SendEvent' }, [{ type: 'SetValue' }, { type: 'SendEvent' }], []],
        invalid: [{ arguments: [] }, [{ arguments: [] }], 'SendEvent'],
    },
    isArray: {
        valid: [[], [1, 2, 3], ['a']],
        invalid: [{}, 'a', 1, null],
    },
    isObject: {
        valid: [{}, { a: 1 }],
        invalid: [[], 'a', 1, null],
    },
    isText: {
        valid: ['hello', '', 0, 42, true, false],
        invalid: [[], {}, null],
    },
};

describe('APL data-type predicates', () => {
    before(async () => {
        await browser.url('/webcomponents-apl/tests/fixtures/apl-data-types.html');
        await browser.waitUntil(
            async () => browser.execute(() => !!(window as any)._testReady),
            { timeout: 8000, timeoutMsg: 'Data-types fixture not ready' },
        );
    });

    for (const [method, cases] of Object.entries(TABLE)) {
        describe(method, () => {
            cases.valid.forEach((value, i) => {
                it(`accepts valid #${i}: ${JSON.stringify(value)}`, async () => {
                    expect(await predicate(method, value)).toBe(true);
                });
            });
            cases.invalid.forEach((value, i) => {
                it(`rejects invalid #${i}: ${JSON.stringify(value)}`, async () => {
                    expect(await predicate(method, value)).toBe(false);
                });
            });
        });
    }

    describe('checkValue dispatcher', () => {
        it('returns null for a valid value', async () => {
            expect(await checkValue('width', '100dp', { type: 'dimension' })).toBeNull();
        });

        it('returns a message naming the property for an invalid value', async () => {
            const msg = await checkValue('width', '10potato', { type: 'dimension' });
            expect(msg).toContain("'width'");
            expect(msg).toContain('dimension');
        });

        it('lists allowed values for a bad list value', async () => {
            const msg = await checkValue('scale', 'wrong', { type: 'list', items: ['best-fit', 'fill'] });
            expect(msg).toContain('best-fit');
            expect(msg).toContain('fill');
        });

        it('accepts a list value that maps a css name to an apl value', async () => {
            const ok = await checkValue('direction', 'columnReverse', {
                type: 'list',
                items: [{ 'column-reverse': 'columnReverse' }],
            });
            expect(ok).toBeNull();
        });

        it('treats unknown types as permissive text', async () => {
            expect(await checkValue('foo', 'anything', { type: 'mystery' })).toBeNull();
            expect(await checkValue('foo', [], { type: 'mystery' })).toContain("'foo'");
        });
    });

    describe('${...} data-binding expressions (jsep)', () => {
        const exprValidates = (value: string): Promise<boolean> =>
            browser.execute((v: string) => (window as any).APLExpression.validate('e', v) === null, value);

        it('detects expression values', async () => {
            expect(await browser.execute(() => (window as any).APLExpression.isExpression('${a}'))).toBe(true);
            expect(await browser.execute(() => (window as any).APLExpression.isExpression('plain'))).toBe(false);
        });

        it('accepts a valid when expression', async () => {
            expect(await checkValue('when', '${viewport.width < 600}', { type: 'expression' })).toBeNull();
        });

        it('flags a malformed when expression with an explanation', async () => {
            const msg = await checkValue('when', '${viewport.width <}', { type: 'expression' });
            expect(msg).toContain("'when'");
            expect(msg).toContain('expression');
        });

        it('accepts a ${} value for a concrete-typed property (no false dimension error)', async () => {
            expect(await checkValue('width', '${data.w}', { type: 'dimension' })).toBeNull();
        });

        it('still flags a non-expression bad dimension', async () => {
            expect(await checkValue('width', '10potato', { type: 'dimension' })).toContain('dimension');
        });

        it('parses ternary and ?? operators', async () => {
            expect(await exprValidates('${a ? b : c}')).toBe(true);
            expect(await exprValidates('${a ?? b}')).toBe(true);
        });

        it('validates each segment of an interpolated value', async () => {
            expect(await exprValidates('${ordinal}. ${data}')).toBe(true);
            expect(await exprValidates('${ordinal}. ${data +}')).toBe(false);
        });

        it('treats a plain literal when value as valid', async () => {
            expect(await checkValue('when', 'true', { type: 'expression' })).toBeNull();
        });
    });

    describe('condition builder round-trip + evaluate', () => {
        it('fromClauses builds an expression (quotes bare words, keeps paths/numbers)', async () => {
            const s = await browser.execute(() => (window as any).APLExpression.fromClauses('&&', [
                { left: 'viewport.shape', op: '==', right: 'round' },
                { left: 'viewport.width', op: '<', right: '600' },
                { left: 'data.header', op: '', right: '' },
            ]));
            expect(s).toBe("${viewport.shape == 'round' && viewport.width < 600 && data.header}");
        });

        it('toClauses parses a flat chain back into clauses', async () => {
            const r = await browser.execute(() => (window as any).APLExpression.toClauses(
                "${viewport.width < 600 && viewport.shape == 'round'}"));
            expect(r.mode).toBe('builder');
            expect(r.join).toBe('&&');
            expect(r.clauses).toEqual([
                { left: 'viewport.width', op: '<', right: '600' },
                { left: 'viewport.shape', op: '==', right: 'round' },
            ]);
        });

        it('toClauses falls back to raw for a complex expression', async () => {
            const r = await browser.execute(() => (window as any).APLExpression.toClauses('${a + b * c}'));
            expect(r.mode).toBe('raw');
        });

        it('comparisons extracts every comparison from a flat chain', async () => {
            const r = await browser.execute(() => (window as any).APLExpression.comparisons(
                "${viewport.shape == 'round' && viewport.theme == '1' && viewport.dpi == 11}"));
            expect(r).toEqual([
                { left: 'viewport.shape', op: '==', right: 'round' },
                { left: 'viewport.theme', op: '==', right: '1' },
                { left: 'viewport.dpi', op: '==', right: '11' },
            ]);
        });

        it('comparisons digs into nested/mixed expressions toClauses cannot flatten', async () => {
            const r = await browser.execute(() => (window as any).APLExpression.comparisons(
                "${viewport.theme == '1' || (viewport.dpi == 11 && viewport.shape == 'round')}"));
            expect(r).toEqual([
                { left: 'viewport.theme', op: '==', right: '1' },
                { left: 'viewport.dpi', op: '==', right: '11' },
                { left: 'viewport.shape', op: '==', right: 'round' },
            ]);
        });

        it('comparisons returns [] for a malformed expression', async () => {
            const r = await browser.execute(() => (window as any).APLExpression.comparisons('${viewport.shape ==}'));
            expect(r).toEqual([]);
        });

        it('round-trips fromClauses -> toClauses', async () => {
            const back = await browser.execute(() => {
                const E = (window as any).APLExpression;
                const expr = E.fromClauses('||', [
                    { left: 'index', op: '==', right: '0' },
                    { left: 'data.header', op: '', right: '' },
                ]);
                return E.toClauses(expr).clauses;
            });
            expect(back).toEqual([
                { left: 'index', op: '==', right: '0' },
                { left: 'data.header', op: '', right: '' },
            ]);
        });

        it('summarize produces a readable label', async () => {
            const S = (v: string) => browser.execute((x: string) => (window as any).APLExpression.summarize(x), v);
            expect(await S('')).toBe('Always shown');
            expect(await S("${viewport.width < 600 && viewport.shape == 'round'}"))
                .toBe("viewport.width < 600 AND viewport.shape = 'round'");
            expect(await S('${index != 0 || data.header}')).toBe('index != 0 OR data.header');
        });

        it('evaluate computes against a binding context', async () => {
            const E = (fn: string, ...a: any[]) =>
                browser.execute((f: string, args: any[]) => (window as any).APLExpression[f](...args), fn, a);
            expect(await E('evaluate', '${viewport.width < 600}', { viewport: { width: 500 } })).toBe(true);
            expect(await E('evaluate', "${viewport.shape == 'round'}", { viewport: { shape: 'round' } })).toBe(true);
            expect(await E('evaluate', '${a ?? 7}', {})).toBe(7);
            expect(await E('evaluate', '${ordinal}. ${data}', { ordinal: 2, data: 'X' })).toBe('2. X');
        });
    });
});
