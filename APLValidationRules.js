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
     */
    childrenAllowed: {
        Container: true,
        Frame: true,
        ScrollView: true,
        TouchWrapper: true,
        Text: false,
        Image: false,
        EditText: false,
    },

    /**
     * Required properties per component type.
     * Image.source: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-image.html
     */
    requiredProperties: {
        Image: ['source'],
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
