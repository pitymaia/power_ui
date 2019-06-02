class AccordionModel {
	constructor(ctx) {
		this.ctx = ctx;
		this.multipleSectionsOpen = ctx.element.getAttribute('data-multiple-sections-open') === 'true';
	}
}


class AccordionHtmlView {
	constructor(ctx) {
		this.ctx = ctx;
		this.childrenSections = ctx.getChildrenByPowerCss('powerAccordionSection');
		this.childrenActions = ctx.getChildrenByPowerCss('powerAction');
	}
}


class AccordionHtmlCtrl {
	constructor(ctx) {
		this.ctx = ctx;
	}

	// Open and close the accordion panel
	toggle() {
		// If not allow multipleSectionsOpen, close the other sections
		if (!this.ctx.model.multipleSectionsOpen) {
			for (const action in this.ctx.htmlView.childrenActions) {
				// Only closes if is not this section and if is active
				const targetAction = this.ctx.htmlView.childrenActions[action];
				if (targetAction.targetObj.id !== this.ctx.id && targetAction._$pwActive) {
					// This prevent the targetAction.toggle call this action again, so this flag avoid a loop to occurs
					targetAction.toggle({avoidCallAction: true});
				}
			}
		}
	}
}


class PowerAccordion extends PowerTarget {
	constructor(element) {
		super(element);
		this.model = new AccordionModel(this);
	}

	init() {
		this.htmlView = new AccordionHtmlView(this);
		this.htmlCtrl = new AccordionHtmlCtrl(this);
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-accordion'});


class PowerAccordionSection extends PowerTarget {
	constructor(element) {
		super(element);
	}

	init() {
		let parent = this.parent;
		// Add the accordion to this powerSection
		do {
			if (parent.$powerCss === 'powerAccordion') {
				this.powerAccordion = parent;
			} else {
				parent = parent.parent;
			}
		} while (parent && parent.$powerCss !== 'powerAccordion');
	}

	action() {
		this.powerAccordion.htmlCtrl.toggle();
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-accordion-section'});
