class APLMultiChildComponent extends APLComponent {
    static tag = 'apl-multi-child-component';

    getAPLProperties() {
        let properties = super.getAPLProperties();
        properties = Object.assign(properties, {
            data:      { type: 'text', options: {} },
        });
        return properties;
    }

    getAPLEvents() {
        let events = super.getAPLEvents();
        events = Object.assign(events, {
            onChildrenChanged: { type: 'commands', options: {} },
        });
        return events;
    }
}
