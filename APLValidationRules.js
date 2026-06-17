/**
 * Value-format and structural rules for APL documents, encoded from the
 * official APL documentation:
 * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-component.html
 */
const APLValidationRules = {
    /**
     * Which component types may contain children (item/items).
     * Container: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-container.html
     * Frame: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-frame.html
     * ScrollView: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-scrollview.html
     * TouchWrapper: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-touchwrapper.html
     * FlexSequence: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-flexsequence.html
     * GridSequence: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-gridsequence.html
     * Pager: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-pager.html
     * Sequence: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-sequence.html
     * VectorGraphic: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-vectorgraphic.html
     * Video: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-video.html
     */
    childrenAllowed: {
        Container: true,
        Frame: true,
        ScrollView: true,
        TouchWrapper: true,
        FlexSequence: true,
        GridSequence: true,
        Pager: true,
        Sequence: true,
        Text: false,
        Image: false,
        EditText: false,
        VectorGraphic: false,
        Video: false,
    },

    /**
     * Required properties per component type.
     * Image.source: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-image.html
     * VectorGraphic.source: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-vectorgraphic.html
     * Video.source: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-video.html
     */
    requiredProperties: {
        Image: ['source'],
        VectorGraphic: ['source'],
        Video: ['source'],
    },

    /**
     * Absolute or relative dimension: a number, 'auto', or '<n>dp|px|vw|vh|%'.
     * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-dimension.html
     */
    isDimension(value) {
        if (typeof value === 'number') return isFinite(value);
        if (typeof value !== 'string') return false;
        if (value.trim() === 'auto') return true;
        return /^-?\d+(\.\d+)?(dp|px|vh|vw|%)?$/.test(value.trim());
    },

    /**
     * APL colors follow CSS color syntax (#hex, rgb()/rgba(), hsl()/hsla(), named).
     * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-data-types.html#color
     */
    isColor(value) {
        if (typeof value !== 'string' || value.trim() === '') return false;
        if (typeof CSS !== 'undefined' && CSS.supports) {
            return CSS.supports('color', value.trim());
        }
        // no platform color parser available - do not block
        return true;
    },

    isText(value) {
        return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
    },

    /**
     * APL Number: a finite float. Numeric strings are accepted because the
     * inspector and document JSON often carry numbers as strings.
     * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-data-types.html#number
     */
    isNumber(value) {
        if (typeof value === 'number') return isFinite(value);
        if (typeof value === 'string' && value.trim() !== '') return isFinite(Number(value));
        return false;
    },

    /** APL Integer: a whole number (or its string form). */
    isInteger(value) {
        if (typeof value === 'number') return Number.isInteger(value);
        if (typeof value === 'string') return /^-?\d+$/.test(value.trim());
        return false;
    },

    /** APL Boolean: true/false (or their string forms). */
    isBoolean(value) {
        return typeof value === 'boolean' || value === 'true' || value === 'false';
    },

    /** A URL / image source: any non-empty string (relative paths like 'a.png' are valid). */
    isUrl(value) {
        return typeof value === 'string' && value.trim() !== '';
    },

    /**
     * APL Easing function: a predefined name, cubic-bezier()/path(), or a
     * piecewise/spatial segment grammar.
     * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-data-types.html#easing
     */
    isEasing(value) {
        if (typeof value !== 'string') return false;
        const v = value.trim();
        if (/^(linear|ease|ease-in|ease-out|ease-in-out)$/.test(v)) return true;
        return /^(cubic-bezier|path|line|curve|end|spatial|scurve|send)\s*\(/.test(v);
    },

    /**
     * APL Gradient: an object with a required 'colorRange' array and an
     * optional 'type' of 'linear' or 'radial'.
     * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-data-types.html#gradient
     */
    isGradient(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
        if (value.type !== undefined && value.type !== 'linear' && value.type !== 'radial') return false;
        return Array.isArray(value.colorRange) && value.colorRange.length > 0;
    },

    /** APL Filter: a filter object (or array of them), each with a 'type' string. */
    isFilter(value) {
        const isOne = (f) => !!f && typeof f === 'object' && !Array.isArray(f) && typeof f.type === 'string';
        return Array.isArray(value) ? value.every(isOne) : isOne(value);
    },

    /**
     * APL Transform: an array of single-purpose transform objects.
     * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-data-types.html#transform
     */
    isTransform(value) {
        const KEYS = ['rotate', 'scale', 'scaleX', 'scaleY', 'skewX', 'skewY', 'translateX', 'translateY'];
        const isOne = (t) => {
            if (!t || typeof t !== 'object' || Array.isArray(t)) return false;
            const keys = Object.keys(t);
            return keys.length >= 1 && keys.every((k) => KEYS.includes(k));
        };
        return Array.isArray(value) && value.every(isOne);
    },

    /** APL Command(s): a command object (or array of them), each with a 'type' string. */
    isCommands(value) {
        const isOne = (c) => !!c && typeof c === 'object' && !Array.isArray(c) && typeof c.type === 'string';
        return Array.isArray(value) ? value.every(isOne) : isOne(value);
    },

    isArray(value) {
        return Array.isArray(value);
    },

    isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    },

    /**
     * Single source of truth for "is this value valid for this property type?".
     * Returns null when valid, or a human-readable error message otherwise.
     * Reused by APLValidator (document validation) and by APLProperties.encode
     * (value-entry validation) so the two can never drift.
     */
    checkValue(key, value, property) {
        // In APL any property value may be a ${...} data-binding expression
        // (e.g. width: "${data.w}", when: "${viewport.width < 600}"). Validate
        // those by expression syntax rather than the concrete type, so binding
        // expressions aren't wrongly flagged and a malformed ${} shows red.
        if (typeof value === 'string' && value.indexOf('${') !== -1) {
            if (typeof APLExpression !== 'undefined') {
                return APLExpression.validate(key, value);
            }
            return null; // expressions can't be validated here; don't false-flag
        }
        switch (property?.type) {
            case 'dimension':
                return this.isDimension(value) ? null
                    : `'${key}' must be a dimension: a number, 'auto' or '<n>dp|px|vw|vh|%'`;
            case 'color':
                return this.isColor(value) ? null
                    : `'${key}' must be a color (#hex, rgb(), hsl() or a named color)`;
            case 'list': {
                const allowed = this.listValues(property);
                return allowed.includes(value) ? null : `'${key}' must be one of: ${allowed.join(', ')}`;
            }
            case 'boolean':
                return this.isBoolean(value) ? null : `'${key}' must be a boolean (true or false)`;
            case 'number':
                return this.isNumber(value) ? null : `'${key}' must be a number`;
            case 'integer':
            case 'time':
                return this.isInteger(value) ? null : `'${key}' must be an integer`;
            case 'url':
                return this.isUrl(value) ? null : `'${key}' must be a non-empty URL or source string`;
            case 'easing':
                return this.isEasing(value) ? null
                    : `'${key}' must be an easing function (e.g. 'ease-in-out', 'cubic-bezier(...)')`;
            case 'gradient':
                return this.isGradient(value) ? null : `'${key}' must be a gradient object with a 'colorRange' array`;
            case 'filter':
                return this.isFilter(value) ? null : `'${key}' must be a filter object or array of filter objects`;
            case 'transform':
                return this.isTransform(value) ? null : `'${key}' must be an array of transform objects`;
            case 'commands':
                return this.isCommands(value) ? null : `'${key}' must be a command object or array of commands`;
            case 'array':
                return this.isArray(value) ? null : `'${key}' must be an array`;
            case 'object':
                return this.isObject(value) ? null : `'${key}' must be an object`;
            case 'expression':
                // a non-${} value is a literal (always-true for `when`); the
                // ${} syntax check is handled by the deferral above.
                return this.isText(value) ? null : `'${key}' must be a string expression`;
            case 'text':
            case 'string':
            default:
                return this.isText(value) ? null : `'${key}' must be a string, number or boolean`;
        }
    },

    /**
     * Allowed APL values of a 'list' property. Items are either plain strings
     * (the APL value) or {cssValue: aplValue} objects - see APLProperties.encode.
     */
    listValues(property) {
        const values = [];
        for (const item of property.items || []) {
            if (typeof item === 'object' && item !== null) {
                values.push(Object.values(item)[0]);
            } else {
                values.push(item);
            }
        }
        return values;
    },
};
