/**
 * Shared base for multi-child components that are also actionable (can receive
 * focus and key events): the scrollables (Sequence/FlexSequence/GridSequence)
 * and the Pager.
 *
 * Extends the multi-child base (gives `data` + `onChildrenChanged`) and merges
 * in the actionable focus/keyboard handlers. Uses the getAPLEvents() merge
 * pattern so base events (onMount, onLayout, ...) and multi-child events are
 * preserved rather than replaced.
 */
class APLActionableMultiChildComponent extends APLMultiChildComponent {
    static tag = 'apl-actionable-multi-child-component';

    getAPLEvents() {
        let events = super.getAPLEvents();
        events = Object.assign(events, {
            onFocus:       { type: 'commands', options: {} },
            onBlur:        { type: 'commands', options: {} },
            handleKeyDown: { type: 'commands', options: {} },
            handleKeyUp:   { type: 'commands', options: {} },
        });
        return events;
    }
}

customElements.define(APLActionableMultiChildComponent.tag, APLActionableMultiChildComponent);
