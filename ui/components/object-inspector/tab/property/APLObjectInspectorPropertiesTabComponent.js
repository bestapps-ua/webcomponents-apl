class APLObjectInspectorPropertiesTabComponent extends BestAppsObjectInspectorPropertiesTabComponent {
    static tag = 'apl-object-inspector-properties-tab-component';

    groups = [];

    getClassByProperty(property) {
        let cls = super.getClassByProperty(property);
        if (property.options?.visual === 'scale-picker') {
            cls = APLObjectInspectorPropertyScaleComponent;
        }
        if (property.options?.visual === 'condition') {
            cls = APLObjectInspectorPropertyConditionComponent;
        }
        return cls;
    }

    /**
     * Validate property values against the APL data-type rules so invalid
     * entries (e.g. width 'potato', a malformed color) show red in the
     * inspector with an explanation. Reuses APLValidationRules.checkValue, the
     * same path as document validation and APLProperties.encode. Returns null
     * when the rules aren't loaded so the inspector degrades gracefully.
     */
    getValidator() {
        if (typeof APLValidationRules === 'undefined') {
            return null;
        }
        return (name, value, property) => APLValidationRules.checkValue(name, value, property);
    }

    /**
     * Render properties sorted alphabetically and partitioned into collapsible
     * groups (see APLPropertyGroups). `name` is pinned first, then group
     * sections (titles A-Z, members A-Z), then remaining standalone rows (A-Z).
     * A group needs MIN_GROUP_SIZE present members to form; otherwise its members
     * fall back to standalone rows.
     */
    async layoutProperties(items) {
        this.groups = [];
        const keys = Object.keys(items).sort();

        // Bucket keys by group title.
        const buckets = new Map();
        const standalone = [];
        for (const key of keys) {
            if (key === 'name') continue; // pinned separately
            const title = APLPropertyGroups.groupOf(key);
            if (title) {
                if (!buckets.has(title)) buckets.set(title, []);
                buckets.get(title).push(key);
            } else {
                standalone.push(key);
            }
        }

        // Groups with too few present members degrade to standalone rows.
        for (const [title, groupKeys] of [...buckets]) {
            if (groupKeys.length < APLPropertyGroups.MIN_GROUP_SIZE) {
                standalone.push(...groupKeys);
                buckets.delete(title);
            }
        }

        // 1. name (pinned top)
        if (items.name) {
            const nameEl = await this.createPropertyComponent('name', items.name);
            if (nameEl) this.element.wrapper.appendChild(nameEl);
        }

        // 2. groups (titles A-Z, members already sorted)
        for (const title of [...buckets.keys()].sort()) {
            const group = document.createElement(APLObjectInspectorPropertyGroupComponent.tag);
            await group.setOptions({ title });
            this.element.wrapper.appendChild(group);
            // Wait for the group's own initElements (bodyEl) before adding rows.
            await group.loadedDefer.promise;
            for (const key of buckets.get(title)) {
                const propEl = await this.createPropertyComponent(key, items[key]);
                if (propEl) group.addProperty(propEl, items[key]);
            }
            group.refreshSummary();
            this.groups.push(group);
        }

        // 3. remaining standalone rows (A-Z)
        for (const key of standalone.sort()) {
            const propEl = await this.createPropertyComponent(key, items[key]);
            if (propEl) this.element.wrapper.appendChild(propEl);
        }
    }

    async update(data) {
        await super.update(data);
        for (const group of this.groups) {
            group.refreshSummary();
        }
    }
}

customElements.define(APLObjectInspectorPropertiesTabComponent.tag, APLObjectInspectorPropertiesTabComponent);
