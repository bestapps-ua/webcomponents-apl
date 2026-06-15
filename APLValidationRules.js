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
