class PowerList extends PowerTarget {
	constructor(element) {
		super(element);

		this._target = this.element.dataset.powerTarget;
		if (!this._target) {
			console.error('power-action/power-list/power-toggle selectors needs a power element target', this.element);
			throw 'Missing power-action/power-list/power-toggle target. Please define it: data-power-target="power_element_id"';
		}
	}

	init() {
		// Add the target element to the list/action
		// It selects the first element with this id that have a powerTarget
		const allPowerObjsById = this.$powerUi.powerTree.allPowerObjsById[this._target];
		for (const index in allPowerObjsById) {
			if (allPowerObjsById[index].powerTarget) {
				this.targetObj = allPowerObjsById[index];
			}
		}
		// Add the action to the target Class
		this.subscribe({event: 'click', fn: this.toggle});
	}

	toggle() {
		if (this._$pwActive) {
			this._$pwActive = false; // powerAction
			this.targetObj._$pwActive = false;
			this.targetObj.element.classList.remove('power-active');
			this.element.classList.remove('power-active');
			// Give menu a z-index to put it on top of any windows
			if (this.$pwMain.isMenu) {
				if (this.$pwMain.order > 0) {
					this.$pwMain.order = this.$pwMain.order - 1;
					if (this.$pwMain.order === 0) {
						this.$pwMain.element.classList.remove('pw-order');
					}
				}
			}
		} else {
			this._$pwActive = true; // powerAction
			this.targetObj._$pwActive = true;
			this.targetObj.element.classList.add('power-active');
			this.element.classList.add('power-active');
			// Give menu its normal z-index
			if (this.$pwMain.isMenu) {
				if (this.$pwMain.order === 0) {
					this.$pwMain.element.classList.add('pw-order');
				}
				this.$pwMain.order = this.$pwMain.order + 1;
			}
		}
		// Broadcast toggle custom event
		this.broadcast('toggle', true);
	}
}

// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-list'});

class PowerAction extends PowerList {
	constructor(element) {
		super(element);
	}

	init() {
		super.init();
		this.targetObj.powerAction = this;
		// this.subscribe({event: 'click', fn: this.toggle});
	}

	// Params allows a flag to "avoidCallAction"
	// Some times the targetObj.action needs to call the action.toggle, but if the action.toggle also calls the targetObj.action a loop will occurs
	// The avoidCallAction flag avoid the loop
	toggle(params={}) {
		if (this.targetObj.action && !params.avoidCallAction) this.targetObj.action();
		super.toggle();
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

		// Do not close if click some power-action
		if ((!elementToCheck.classList.contains('power-action') && !elementToCheck.classList.contains('power-toggle')) && (elementToCheck.parentNode && (!elementToCheck.parentNode.classList.contains('power-action') && !elementToCheck.parentNode.classList.contains('power-toggle')))) {
			this.toggle();
			return;
		}

		do {
			if (elementToCheck === targetElement || elementToCheck === powerActionElement) {
				// This is a click inside the dropmenu, menu or on the buttom/trigger element. So, do nothing, just return
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
