class PowerStatus extends PowerTarget {
    constructor(element) {
        super(element);
        const activeAttr = this.element.getAttribute('data-power-active');
        const inactiveAttr = this.element.getAttribute('data-power-inactive');
        this.activeValues = activeAttr ? activeAttr.split(' ') : [];
        this.inactiveValues = inactiveAttr ? inactiveAttr.split(' ') : [];
        this.inactive();
    }

    // Add all CSS selector on active list and remove all css on inactive list
    active() {
        for (const css of this.activeValues) {
            this.element.classList.add(css);
        }
        for (const css of this.inactiveValues) {
            this.element.classList.remove(css);
        }
    }

    // Add all CSS selector on inactive list and remove all css on active list
    inactive() {
        for (const css of this.inactiveValues) {
            this.element.classList.add(css);
        }
        for (const css of this.activeValues) {
            this.element.classList.remove(css);
        }
    }

    toggle() {
        this._$pwActive = !this._$pwActive;
        if (this._$pwActive) {
            this.active();
        } else {
            this.inactive();
        }
    }

    init() {
        let stop = false;
        let element = this.element.parentElement
        const allPowerObjsById = this.$powerUi.powerTree.allPowerObjsById;
        while (!stop) {
            if (element) {
                for (const index in allPowerObjsById[element.id]) {
                    if (allPowerObjsById[element.id][index].powerTarget) {
                        this.targetObj = allPowerObjsById[element.id][index];
                    }
                }
            }
            // Don't let go to parentElement if already found and have the variable 'stop' as true
            // Only select the parentElement if has element but don't found the main class selector
            if (!this.targetObj && !stop) {
                element = element.parentElement;
            } else {
                // If there is no more element set stop
                stop = true;
            }
        }
        if (this.targetObj) {
            this.targetObj.subscribe({event: 'toggle', fn: this.toggle.bind(this)});
        }
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-status'});
