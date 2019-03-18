class PowerAction extends PowerTarget {
    constructor(element) {
        super(element);

        this._target = this.element.dataset.powerTarget;
        if (!this._target) {
            console.error('power-action selector needs a power element target', this.element);
            throw 'Missing power-action target. Please define it: data-power-target="power_element_id"';
        }
    }

    init() {
        // Add the target Class to the Action
        // It selects the first element with this id with is has powerTarget
        const allPowerObjsById = this.$powerUi.powerDOM.allPowerObjsById[this._target];
        for (const index in allPowerObjsById) {
            if (allPowerObjsById[index].powerTarget) {
                this.targetObj = allPowerObjsById[index];
            }
        }
        // Add the action to the target Class
        this.targetObj.powerAction = this;
        this.subscribe({event: 'click', fn: this.toggle});
    }

    // Params allows a flag to "avoidCallAction"
    // Some times the targetObj.action needs to call the action.toggle, but it the action.toggle also calls the targetObj.action a loop will occurs
    // The avoidCallAction flag avoid the loop
    toggle(params={}) {
        if (this.targetObj.action && !params.avoidCallAction) this.targetObj.action();
        if (this._$pwActive) {
            this._$pwActive = false; // powerAction
            this.targetObj._$pwActive = false;
            this.targetObj.element.classList.remove('power-active');
            this.element.classList.remove('power-active');
        } else {
            this._$pwActive = true; // powerAction
            this.targetObj._$pwActive = true;
            this.targetObj.element.classList.add('power-active');
            this.element.classList.add('power-active');
        }
        // Broadcast toggle custom event
        this.broadcast('toggle', true);
    }

    ifClickOut() {
        if (this._$pwActive) {
            // this._$pwActive = false;
            // Remove the listener to detect if click outside
            document.removeEventListener("click", this._clickPowerItemOrOutside);
        } else {
            // this._$pwActive = true;
            // Add the listener to capture when click outside and register the function to allow remove it
            this._clickPowerItemOrOutside = this.clickPowerItemOrOutside.bind(this);
            document.addEventListener("click", this._clickPowerItemOrOutside);
        }
    }

    clickPowerItemOrOutside(event) {
        const targetElement = document.getElementById(this.targetObj.id);
        const powerActionElement = document.getElementById(this.id);
        let elementToCheck = event.target; // clicked element

        // Close if click some power-item
        if (elementToCheck.classList.contains('power-item') || elementToCheck.classList.contains('power-brand')) {
            this.toggle();
            return;
        }

        do {
            if (elementToCheck === targetElement || elementToCheck === powerActionElement) {
                // This is a click inside the dropdown, menu or on the buttom/trigger element. So, do nothing, just return
                return;
            }
            // Go up the DOM
            elementToCheck = elementToCheck.parentNode;
        } while (elementToCheck);

        // This is an outside click
        this.toggle();
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-action'});


class PowerToggle extends PowerAction {
    constructor(element) {
        super(element);
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-toggle'});
