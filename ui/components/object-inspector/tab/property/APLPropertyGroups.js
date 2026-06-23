/**
 * Property grouping taxonomy for the object inspector's Properties tab.
 *
 * Every APL property across every component is assigned to exactly one group
 * (see GROUPS below). Properties not listed here render standalone. `name` is
 * intentionally left ungrouped (it is pinned to the top by the tab).
 *
 * A group is only materialized when at least MIN_GROUP_SIZE of its members are
 * present for the currently selected component; otherwise its members render as
 * standalone rows. Within a group and among standalone rows, properties are
 * sorted alphabetically by the tab.
 */
const APLPropertyGroups = {
    MIN_GROUP_SIZE: 2,

    GROUPS: {
        Size: ['width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight', 'childWidth', 'childHeight'],
        Padding: ['padding', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'paddingStart', 'paddingEnd'],
        Position: ['position', 'left', 'top', 'right', 'bottom', 'start', 'end'],
        Layout: ['alignItems', 'alignSelf', 'justifyContent', 'direction', 'wrap', 'grow', 'shrink', 'spacing', 'layoutDirection'],
        Border: ['borderColor', 'borderWidth', 'borderStrokeWidth', 'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius'],
        Shadow: ['shadowColor', 'shadowHorizontalOffset', 'shadowVerticalOffset', 'shadowRadius'],
        Typography: ['text', 'color', 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'letterSpacing', 'lineHeight', 'maxLines', 'textAlign', 'textAlignVertical', 'lang'],
        Hint: ['hint', 'hintColor', 'hintStyle', 'hintWeight'],
        Input: ['keyboardType', 'maxLength', 'secureInput', 'selectOnFocus', 'size', 'submitKeyType', 'validCharacters', 'highlightColor'],
        Media: ['source', 'sources', 'align', 'scale', 'filters', 'overlayColor', 'overlayGradient', 'parameters', 'audioTrack', 'autoplay', 'muted', 'screenLock'],
        Appearance: ['background', 'backgroundColor', 'opacity', 'display', 'transform'],
        Scrolling: ['scrollDirection', 'snap', 'initialPage', 'pageDirection', 'navigation'],
        Accessibility: ['accessibilityLabel', 'role', 'description'],
        State: ['disabled', 'checked', 'inheritParentState', 'when', 'pointerEvents'],
        Data: ['data', 'numbered', 'numbering', 'preserve'],
        // Authoring-only styling for OUR renderer (Tailwind classes + raw CSS).
        // Stripped from the exported APL document (see APLProperties.stripAuthoringKeys).
        'Custom Styles': ['className', 'style'],
    },

    /**
     * Reverse lookup property name -> group title. Built once and cached.
     */
    _index: null,

    _buildIndex() {
        const index = {};
        for (const [title, keys] of Object.entries(this.GROUPS)) {
            for (const key of keys) {
                index[key] = title;
            }
        }
        return index;
    },

    /**
     * @param {string} key property name
     * @returns {string|undefined} the group title, or undefined if ungrouped
     */
    groupOf(key) {
        if (!this._index) {
            this._index = this._buildIndex();
        }
        return this._index[key];
    },
};
