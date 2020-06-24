class PowerTabs extends PowerTarget {
	constructor(element) {
		super(element);
	}

	init() {
		this.childrenSections = this.getChildrenByPowerCss('powerTabSection');
		this.childrenActions = this.getChildrenByPowerCss('powerAction');

		this.childrenSections[0].powerAction.element.classList.add('power-active');
		this.childrenSections[0].element.classList.add('power-active');
		this.childrenSections[0].powerAction._$pwActive = true;
		this.childrenSections[0]._$pwActive = true;
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-tabs'});


class PowerTabSection extends PowerTarget {
	constructor(element) {
		super(element);
	}

	init() {
		let parent = this.parent;
		// Add the header to this powerSection
		do {
			if (parent.$powerCss === 'powerTabs') {
				this.powerTabs = parent;
			} else {
				parent = parent.parent;
			}
		} while (parent && parent.$powerCss !== 'powerTabs');
	}

	// Open and close the tab section
	action() {
		// Cancel if already active
		if (this._$pwActive === true) {
			this.powerAction._$pwActive = false;
			// Reset this action and section to active
			this.powerAction.broadcast('toggle', true);
			return;
		}

		// close the other sections
		for (const action of Object.keys(this.powerTabs.childrenActions || {})) {
			// Only toggle if is not this section and or is active
			const targetAction = this.powerTabs.childrenActions[action];
			if ((targetAction.targetObj.id !== this.powerTabs.id) && targetAction._$pwActive && (this !== targetAction.targetObj)) {
				// This prevent the targetAction.toggle call this action again, so this flag avoid a loop to occurs
				targetAction.toggle({avoidCallAction: true});
				targetAction.targetObj.active = !targetAction.targetObj.active;
			}
		}
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-tab-section'});
