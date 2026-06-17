/**
 * Thin adapter over the vendored jsep parser for APL data-binding ${...}
 * expressions. Phase 1 covers detection + syntax validation only - no
 * evaluation or binding context yet (that is a later phase).
 *
 * APL data-binding syntax:
 * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-data-binding-syntax.html
 * Conditional inflation (the `when` property):
 * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-conditional-component-inflation.html
 */
class APLExpression {
    /** True when a value contains at least one ${...} data-binding segment. */
    static isExpression(value) {
        return typeof value === 'string' && value.indexOf('${') !== -1;
    }

    /**
     * The inner expression string of each ${...} segment. A value can mix
     * literal text and several segments (string interpolation), e.g.
     * "${ordinal}. ${data}" -> ['ordinal', 'data'].
     */
    static extract(value) {
        const out = [];
        if (typeof value !== 'string') return out;
        const re = /\$\{([\s\S]*?)\}/g;
        let m;
        while ((m = re.exec(value)) !== null) out.push(m[1]);
        return out;
    }

    /** Parse a single inner expression. Throws on a syntax error. */
    static parse(inner) {
        if (typeof jsep === 'undefined') {
            throw new Error('jsep parser not loaded');
        }
        const trimmed = String(inner).trim();
        if (trimmed === '') {
            throw new Error('empty expression');
        }
        return jsep(trimmed);
    }

    /** Comparison operators the visual condition builder can round-trip. */
    static COMPARISON_OPS = ['==', '!=', '<', '<=', '>', '>='];

    /** Operand suggestions offered by the condition builder. */
    static OPERAND_SUGGESTIONS = [
        'viewport.width', 'viewport.height', 'viewport.shape', 'viewport.mode',
        'viewport.dpi', 'viewport.theme', 'data', 'index', 'ordinal', 'length',
    ];

    /** A short, human-readable summary of a when value for the inspector row. */
    static summarize(value) {
        if (typeof value !== 'string' || value.trim() === '') return 'Always shown';
        if (!this.isExpression(value)) return value;
        const inner = this.extract(value).join(' ').trim();
        if (inner === '') return 'Always shown';
        return inner
            .replace(/\s*&&\s*/g, ' AND ')
            .replace(/\s*\|\|\s*/g, ' OR ')
            .replace(/\s*===\s*/g, ' == ')
            .replace(/\s*==\s*/g, ' = ');
    }

    /**
     * Build a ${...} expression string from builder clauses.
     * @param {string} join '&&' or '||'
     * @param {Array<{left:string, op:string, right:string}>} clauses
     *   op === '' means a truthiness test (just the left operand).
     */
    static fromClauses(join, clauses) {
        const parts = (clauses || [])
            .filter((c) => c && typeof c.left === 'string' && c.left.trim() !== '')
            .map((c) => {
                const left = c.left.trim();
                if (!c.op || String(c.op).trim() === '') return left;
                return `${left} ${c.op} ${this._formatOperand(c.right)}`;
            });
        if (parts.length === 0) return '';
        return '${' + parts.join(` ${join === '||' ? '||' : '&&'} `) + '}';
    }

    /**
     * Parse a value into builder clauses when it is a single ${...} with a flat
     * chain of comparisons joined by one logical operator; otherwise returns
     * { mode: 'raw' } so the control falls back to a validated text field.
     */
    static toClauses(value) {
        const raw = typeof value === 'string' ? value : '';
        const fallback = { mode: 'raw', join: '&&', clauses: [], raw };
        if (typeof jsep === 'undefined') return fallback;
        const segments = this.extract(value);
        if (segments.length !== 1 || !/^\s*\$\{[\s\S]*\}\s*$/.test(raw)) return fallback;
        let ast;
        try { ast = this.parse(segments[0]); } catch (e) { return fallback; }
        const flat = this._flatten(ast);
        if (!flat) return fallback;
        return { mode: 'builder', join: flat.join, clauses: flat.clauses, raw };
    }

    /**
     * Every comparison ({left, op, right}) found anywhere in the value's ${...}
     * segment(s), regardless of nesting or mixed &&/|| - a superset of toClauses
     * used for semantic (operand-value) validation in the condition builder's
     * raw mode. `right` is unquoted. Returns [] when nothing parses (the syntax
     * validator reports malformed expressions separately).
     */
    static comparisons(value) {
        const out = [];
        if (typeof jsep === 'undefined') return out;
        for (const inner of this.extract(value)) {
            let ast;
            try { ast = this.parse(inner); } catch (e) { continue; }
            this._eachNode(ast, (n) => {
                if (n.type === 'BinaryExpression' && this.COMPARISON_OPS.includes(n.operator)) {
                    const left = this._operandStr(n.left);
                    const right = this._operandStr(n.right);
                    if (left !== null && right !== null) {
                        out.push({ left, op: n.operator, right: this._unquote(right) });
                    }
                }
            });
        }
        return out;
    }

    /** Evaluate a value against a binding context. Returns the typed result for a
     *  single ${...}, or the interpolated string otherwise. Unknown functions
     *  evaluate to undefined (not yet supported). */
    static evaluate(value, context = {}) {
        if (typeof jsep === 'undefined' || typeof value !== 'string') return value;
        const segments = this.extract(value);
        if (segments.length === 0) return value;
        if (segments.length === 1 && /^\s*\$\{[\s\S]*\}\s*$/.test(value)) {
            return this._evalNode(this.parse(segments[0]), context);
        }
        return value.replace(/\$\{([\s\S]*?)\}/g, (_, inner) => {
            const r = this._evalNode(this.parse(inner), context);
            return (r === undefined || r === null) ? '' : String(r);
        });
    }

    // --- internals -------------------------------------------------------

    /** Context roots whose bare names are references, not string literals. */
    static CONTEXT_ROOTS = ['viewport', 'environment', 'data', 'payload', 'index', 'ordinal', 'length'];

    static _formatOperand(raw) {
        const v = (raw === undefined || raw === null) ? '' : String(raw).trim();
        if (v === '') return "''";
        if (/^-?\d+(\.\d+)?$/.test(v)) return v;                 // number
        if (v === 'true' || v === 'false' || v === 'null') return v;
        if (/^'.*'$/.test(v) || /^".*"$/.test(v)) return v;      // already quoted
        // A dotted/indexed path or a known context root is a reference; any other
        // bare word is treated as a string literal (e.g. shape == round).
        const root = v.split(/[.[]/)[0];
        const isPath = /[.[]/.test(v) && /^[A-Za-z_$][\w.$\][']*$/.test(v);
        if (isPath && this.CONTEXT_ROOTS.includes(root)) return v;
        if (this.CONTEXT_ROOTS.includes(v)) return v;
        return `'${v.replace(/'/g, "\\'")}'`;                    // quote as string
    }

    /** Depth-first visit of every node object in a jsep AST (structure-agnostic:
     *  recurses into any object/array child), so callers don't enumerate the
     *  node shapes themselves. */
    static _eachNode(node, visit) {
        if (!node || typeof node !== 'object') return;
        visit(node);
        for (const k of Object.keys(node)) {
            const child = node[k];
            if (Array.isArray(child)) child.forEach((c) => this._eachNode(c, visit));
            else if (child && typeof child === 'object') this._eachNode(child, visit);
        }
    }

    static _isLogical(n) {
        return (n.type === 'LogicalExpression' || n.type === 'BinaryExpression')
            && (n.operator === '&&' || n.operator === '||');
    }

    static _flatten(ast) {
        if (this._isLogical(ast)) {
            const join = ast.operator;
            const clauses = [];
            let ok = true;
            const collect = (n) => {
                if (!ok) return;
                if (this._isLogical(n) && n.operator === join) { collect(n.left); collect(n.right); return; }
                const c = this._clauseOf(n);
                if (!c) { ok = false; return; }
                clauses.push(c);
            };
            collect(ast);
            return ok ? { join, clauses } : null;
        }
        const c = this._clauseOf(ast);
        return c ? { join: '&&', clauses: [c] } : null;
    }

    static _clauseOf(n) {
        if (n.type === 'BinaryExpression' && this.COMPARISON_OPS.includes(n.operator)) {
            const left = this._operandStr(n.left);
            const right = this._operandStr(n.right);
            if (left === null || right === null) return null;
            return { left, op: n.operator, right: this._unquote(right) };
        }
        if (n.type === 'Identifier' || n.type === 'MemberExpression') {
            const left = this._operandStr(n);
            return left === null ? null : { left, op: '', right: '' };
        }
        return null;
    }

    static _operandStr(n) {
        if (n.type === 'Identifier') return n.name;
        if (n.type === 'MemberExpression') {
            const obj = this._operandStr(n.object);
            if (obj === null) return null;
            if (n.computed) {
                const k = this._operandStr(n.property);
                return k === null ? null : `${obj}[${k}]`;
            }
            return `${obj}.${n.property.name}`;
        }
        if (n.type === 'Literal') {
            return (typeof n.value === 'string') ? `'${n.value}'` : String(n.value);
        }
        return null;
    }

    static _unquote(s) {
        const m = /^'(.*)'$/.exec(s) || /^"(.*)"$/.exec(s);
        return m ? m[1] : s;
    }

    static _evalNode(n, ctx) {
        switch (n.type) {
            case 'Literal': return n.value;
            case 'Identifier': return ctx ? ctx[n.name] : undefined;
            case 'MemberExpression': {
                const obj = this._evalNode(n.object, ctx);
                if (obj === undefined || obj === null) return undefined;
                const key = n.computed ? this._evalNode(n.property, ctx) : n.property.name;
                return obj[key];
            }
            case 'UnaryExpression': {
                const v = this._evalNode(n.argument, ctx);
                if (n.operator === '!') return !v;
                if (n.operator === '-') return -v;
                if (n.operator === '+') return +v;
                return undefined;
            }
            case 'LogicalExpression':
            case 'BinaryExpression': {
                const l = this._evalNode(n.left, ctx);
                if (n.operator === '&&') return l ? this._evalNode(n.right, ctx) : l;
                if (n.operator === '||') return l ? l : this._evalNode(n.right, ctx);
                if (n.operator === '??') return (l === undefined || l === null) ? this._evalNode(n.right, ctx) : l;
                const r = this._evalNode(n.right, ctx);
                switch (n.operator) {
                    case '==': return l == r;   // eslint-disable-line eqeqeq
                    case '!=': return l != r;   // eslint-disable-line eqeqeq
                    case '===': return l === r;
                    case '!==': return l !== r;
                    case '<': return l < r;
                    case '<=': return l <= r;
                    case '>': return l > r;
                    case '>=': return l >= r;
                    case '+': return l + r;
                    case '-': return l - r;
                    case '*': return l * r;
                    case '/': return l / r;
                    case '%': return l % r;
                    default: return undefined;
                }
            }
            case 'ConditionalExpression':
                return this._evalNode(n.test, ctx) ? this._evalNode(n.consequent, ctx) : this._evalNode(n.alternate, ctx);
            case 'CallExpression':
                return undefined; // APL built-in functions not supported yet
            default:
                return undefined;
        }
    }

    /**
     * Validate every ${...} segment of a value.
     * @returns {string|null} an error message for the first bad segment, or null
     * when all segments parse (or when the parser is unavailable, so callers
     * never get a false positive).
     */
    static validate(key, value) {
        if (typeof jsep === 'undefined') return null;
        for (const inner of this.extract(value)) {
            try {
                this.parse(inner);
            } catch (err) {
                const reason = (err && err.message) ? err.message : 'syntax error';
                return `'${key}' has an invalid \${} expression: ${reason}`;
            }
        }
        return null;
    }
}

// Register APL operators the jsep core lacks. Null-coalescing (??) is used by
// APL; ternary (?:) is already bundled in the jsep IIFE build.
if (typeof jsep !== 'undefined') {
    try { jsep.addBinaryOp('??', 1); } catch (e) { /* already registered */ }
}
