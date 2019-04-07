class PowerAccordion extends PowerTarget {
	constructor(element) {
		super(element);
		element.getAttribute('data-multiple-sections-open') === 'true' ? this.multipleSectionsOpen = true : this.multipleSectionsOpen = false;
	}
	init() {
		this.childrenSections = this.getChildrenByPowerCss('powerSection');
		this.childrenActions = this.getChildrenByPowerCss('powerAction');
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-accordion'});


class PowerSection extends PowerTarget {
	constructor(element) {
		super(element);
	}

	init() {
		let parent = this.parent;
		// Add the accordion to this powerSection
		do {
			if (parent.$powerName === 'powerAccordion') {
				this.powerAccordion = parent;
			} else {
				parent = parent.parent;
			}
		} while (parent && parent.$powerName !== 'powerAccordion');
	}

	action() {
		// If not allow multipleSectionsOpen, close the other sections
		if (!this.powerAccordion.multipleSectionsOpen) {
			for (const action in this.powerAccordion.childrenActions) {
				// Only closes if is not this section and if is active
				const targetAction = this.powerAccordion.childrenActions[action];
				if (targetAction.targetObj.id !== this.id && targetAction._$pwActive) {
					// This prevent the targetAction.toggle call this action again, so this flag avoid a loop to occurs
					targetAction.toggle({avoidCallAction: true});
				}
			}
		}
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-section'});
