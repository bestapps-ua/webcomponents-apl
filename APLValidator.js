/**
 * Validates an APL document against the components this editor supports.
 *
 * Property types and enum values are introspected from each registered
 * component's APLProperties, so they cannot drift from the components;
 * structural rules and required properties come from APLValidationRules
 * (encoded from the official APL documentation).
 *
 * validate() returns errors in the shape jsoneditor's onValidate expects:
 * [{path: Array<string|number>, message: string}] - jsoneditor maps the
 * paths to lines in the edited text and renders red gutter annotations.
 *
 * Unknown property NAMES are allowed silently: official APL is a superset
 * of what this editor models (style, bind, when, onMount, ...). Unknown
 * component TYPES and invalid VALUES of known properties are errors.
 */
class APLValidator {
    _specs;

    /**
     * Per-type property specs keyed by the JSON property name
     * (APLProperties keys are editor names; options.apl overrides
     * the JSON name, e.g. name -> id).
     */
    getSpecs() {
        if (!this._specs) {
            this._specs = {};
            for (const type of getRegisteredAPLTypes()) {
                const cls = getAPLComponentClass(type);
                const el = document.createElement(cls.tag);
                const properties = el.getAPLProperties();
                const byJsonKey = {};
                for (const key in properties) {
                    const jsonKey = properties[key].options?.apl || key;
                    byJsonKey[jsonKey] = properties[key];
                }
                this._specs[type] = byJsonKey;
            }
        }
        return this._specs;
    }

    validate(json) {
        try {
            return this._validate(json);
        } catch (err) {
            console.warn('APLValidator failed', err);
            return [];
        }
    }

    /**
     * Validate either a full APL document (has mainTemplate) or a single
     * component node (e.g. {type: 'Text', height: '...'}), returning errors in
     * jsoneditor's onValidate shape: [{path, message}]. Used by the inspector
     * Data tab, whose JSON is the selected component's node, not a whole
     * document. Returns [] for JSON we can't classify so arbitrary edits aren't
     * spuriously flagged.
     */
    validateNode(node) {
        try {
            if (!node || typeof node !== 'object' || Array.isArray(node)) {
                return [];
            }
            if (node.mainTemplate) {
                return this._validate(node);
            }
            if (typeof node.type === 'string' && this.getSpecs()[node.type]) {
                const errors = [];
                this._validateComponent(node, [], errors);
                return errors;
            }
            return [];
        } catch (err) {
            console.warn('APLValidator.validateNode failed', err);
            return [];
        }
    }

    _validate(json) {
        const errors = [];
        if (!json || typeof json !== 'object' || Array.isArray(json)) {
            return [{path: [], message: 'APL document must be a JSON object'}];
        }
        const mainTemplate = json.mainTemplate;
        if (!mainTemplate || typeof mainTemplate !== 'object' || Array.isArray(mainTemplate)) {
            return [{path: [], message: "APL document requires a 'mainTemplate' object"}];
        }
        this._validateChildren(mainTemplate, ['mainTemplate'], errors, true);
        return errors;
    }

    _validateChildren(node, path, errors, required = false) {
        const hasItems = node.items !== undefined;
        const hasItem = node.item !== undefined;
        if (!hasItems && !hasItem) {
            if (required) {
                errors.push({path, message: "'items' or 'item' with at least one component is required"});
            }
            return;
        }
        if (hasItems) {
            if (!Array.isArray(node.items)) {
                errors.push({path: [...path, 'items'], message: "'items' must be an array of components"});
            } else {
                node.items.forEach((child, i) => this._validateComponent(child, [...path, 'items', i], errors));
            }
        }
        if (hasItem) {
            if (Array.isArray(node.item)) {
                node.item.forEach((child, i) => this._validateComponent(child, [...path, 'item', i], errors));
            } else {
                this._validateComponent(node.item, [...path, 'item'], errors);
            }
        }
    }

    _validateComponent(node, path, errors) {
        if (!node || typeof node !== 'object' || Array.isArray(node)) {
            errors.push({path, message: 'component must be a JSON object'});
            return;
        }
        const type = node.type;
        if (typeof type !== 'string' || type === '') {
            errors.push({path, message: "component requires a 'type'"});
            return;
        }
        const specs = this.getSpecs();
        const spec = specs[type];
        if (!spec) {
            errors.push({
                path: [...path, 'type'],
                message: `unknown component type '${type}' (supported: ${Object.keys(specs).join(', ')})`,
            });
            return;
        }

        for (const required of APLValidationRules.requiredProperties[type] || []) {
            if (node[required] === undefined) {
                errors.push({path, message: `${type} requires '${required}'`});
            }
        }

        for (const key in node) {
            if (key === 'type' || key === 'items' || key === 'item') continue;
            // APLProperties.encode writes absent properties into component data
            // as undefined; JSON cannot express undefined, so treat as absent
            if (node[key] === undefined) continue;
            const property = spec[key];
            if (!property) continue; // official APL is a superset of the editor-known properties
            this._validateValue(key, node[key], property, [...path, key], errors);
        }

        const childKey = node.items !== undefined ? 'items' : (node.item !== undefined ? 'item' : null);
        if (childKey && APLValidationRules.childrenAllowed[type] === false) {
            errors.push({path: [...path, childKey], message: `${type} cannot contain child components`});
            return;
        }
        this._validateChildren(node, path, errors);
    }

    _validateValue(key, value, property, path, errors) {
        const message = APLValidationRules.checkValue(key, value, property);
        if (message) {
            errors.push({path, message});
        }
    }
}
