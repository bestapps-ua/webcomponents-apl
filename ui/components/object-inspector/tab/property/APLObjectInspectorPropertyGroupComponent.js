/**
 * A collapsible group of related property rows in the object inspector's
 * Properties tab (e.g. Size, Padding, Typography).
 *
 * Header: [+]/[-] toggle, the group title, and a live summary of the members
 * whose value is set (non-empty and different from the default). The body holds
 * the member property components and is hidden when collapsed.
 *
 * Collapsed/expanded state is persisted per group title in localStorage so it
 * survives reselecting components and reloads. Groups default to collapsed.
 */
class APLObjectInspectorPropertyGroupComponent extends BestAppsComponent {
    static tag = 'apl-object-inspector-property-group-component';

    title;
    members = [];
    open = false;

    async processOptions(options) {
        options = await super.processOptions(options);
        this.title = options.title;
        this.open = this._readPersistedOpen();
        return options;
    }

    _storageKey() {
        return `${APLObjectInspectorPropertyGroupComponent.tag}.${this.title}.open`;
    }

    _readPersistedOpen() {
        try {
            return localStorage.getItem(this._storageKey()) === '1';
        } catch (e) {
            return false;
        }
    }

    _persistOpen() {
        try {
            localStorage.setItem(this._storageKey(), this.open ? '1' : '0');
        } catch (e) { /* ignore */ }
    }

    async initElements() {
        await super.initElements();

        this.headerEl = document.createElement('div');
        this.headerEl.classList.add('group-header');
        this.headerEl.setAttribute('part', 'group-header');

        this.toggleEl = document.createElement('span');
        this.toggleEl.classList.add('group-toggle');

        this.titleEl = document.createElement('span');
        this.titleEl.classList.add('group-title');
        this.titleEl.innerText = this.title;

        this.summaryEl = document.createElement('span');
        this.summaryEl.classList.add('group-summary');

        this.headerEl.appendChild(this.toggleEl);
        this.headerEl.appendChild(this.titleEl);
        this.headerEl.appendChild(this.summaryEl);

        this.bodyEl = document.createElement('div');
        this.bodyEl.classList.add('group-body');
        this.bodyEl.setAttribute('part', 'group-body');

        this.headerEl.addEventListener('click', () => this.toggle());

        this.element.wrapper.appendChild(this.headerEl);
        this.element.wrapper.appendChild(this.bodyEl);

        this._applyOpenState();
    }

    /**
     * @param {BestAppsObjectInspectorPropertyComponent} propertyEl the row
     * @param {Object} propertyData decoded property (carries .default)
     */
    addProperty(propertyEl, propertyData) {
        this.members.push({ el: propertyEl, default: propertyData?.default });
        this.bodyEl.appendChild(propertyEl);
        propertyEl.subscribe(BestAppsComponent.EVENT_CHANGED, () => this.refreshSummary());
    }

    _isFilled(member) {
        const v = member.el?.value;
        if (v === undefined || v === null || v === '') return false;
        const def = member.default;
        if (def !== undefined && def !== null && String(v) === String(def)) return false;
        return true;
    }

    refreshSummary() {
        if (!this.summaryEl) return;
        const parts = [];
        for (const member of this.members) {
            if (this._isFilled(member)) {
                parts.push(`${member.el.name}: ${member.el.value}`);
            }
        }
        this.summaryEl.innerText = parts.join(', ');
        this.summaryEl.setAttribute('title', this.summaryEl.innerText);
    }

    toggle() {
        this.open = !this.open;
        this._persistOpen();
        this._applyOpenState();
    }

    _applyOpenState() {
        this.toggleEl.innerText = this.open ? '[-]' : '[+]';
        this.bodyEl.style.display = this.open ? 'block' : 'none';
        if (this.open) {
            this.headerEl.classList.add('group-header--open');
        } else {
            this.headerEl.classList.remove('group-header--open');
        }
    }

    async render() {
        this.refreshSummary();
    }

    getStyle() {
        return `
            .wrapper {
                display: block;
                width: 100%;
            }
            .group-header {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 4px;
                height: 1.5rem;
                padding: 2px 4px;
                box-sizing: border-box;
                background-color: #eef3ff;
                border: 1px solid cornflowerblue;
                cursor: pointer;
                user-select: none;
            }
            .group-header--open {
                font-weight: bold;
            }
            .group-toggle {
                color: cornflowerblue;
                width: 2.2ch;
                flex: 0 0 auto;
                font-family: monospace;
            }
            .group-title {
                color: black;
                flex: 0 0 auto;
            }
            .group-summary {
                color: cornflowerblue;
                font-weight: normal;
                flex: 1 1 auto;
                text-align: right;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
                min-width: 0;
            }
            .group-body {
                display: none;
            }
        `;
    }
}

customElements.define(APLObjectInspectorPropertyGroupComponent.tag, APLObjectInspectorPropertyGroupComponent);
