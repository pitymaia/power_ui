// Set two objects: The dropdowns first level child elements, and all dropdowns child elements
function setAllChildElementsAndFirstLevelChildElements(targetElement, powerSelector, firstLevelElements, allChildPowerElements, ctx, allDropdowns) {
	const allChildElements = ctx.element.getElementsByClassName(targetElement);
	const allChildDropdowns = ctx.element.getElementsByClassName('power-dropdown');
	// Hold the id of actions that belongs to children dropdowns
	const elementsIdsBlackList = [];
	for (const currentDropdown of allChildDropdowns) {
		// Get all dropdowns if ask for it
		if (allDropdowns !== undefined) {
			allDropdowns.push(ctx.$powerUi.powerDOM.powerCss.powerDropdown[currentDropdown.getAttribute('id')]);
		}
		const currentDropdownActions = currentDropdown.getElementsByClassName(targetElement);
		for (const currentElement of currentDropdownActions) {
			// If not already in the black list add it
			if (!elementsIdsBlackList.includes(currentElement.id)) {
				elementsIdsBlackList.push(currentElement.id);
			}
		}
	}

	// Only select the power actions not black listed
	for (const currentElement of allChildElements) {
		if (!elementsIdsBlackList.includes(currentElement.id)) {
			firstLevelElements.push(ctx.$powerUi.powerDOM.powerCss[powerSelector][currentElement.id]);
		} else {
			// Add all child elements
			allChildPowerElements.push(ctx.$powerUi.powerDOM.powerCss[powerSelector][currentElement.id]);
		}
	}
}

// Define the powerDropdowns defaultPosition for all the child dropdowns
// The right-bottom is the standard position
function defineChildDropdownsPosition(self, powerElement) {
	if (['right-bottom', 'bottom-right', 'bottom', 'right'].includes(self.defaultPosition)) {
		powerElement.defaultPosition = 'right-bottom';
	} else if (['left-bottom', 'bottom-left', 'left'].includes(self.defaultPosition)) {
		powerElement.defaultPosition = 'left-bottom';
	} else if (['right-top', 'top-right', 'top',  'right'].includes(self.defaultPosition)) {
		powerElement.defaultPosition = 'right-top';
	} else if (['left-top', 'top-left'].includes(self.defaultPosition)) {
		powerElement.defaultPosition = 'left-top';
	} else {
		powerElement.defaultPosition = 'right-bottom'; // Default value;
	}
}

// Define the powerDropdowns defaultPosition for the first level dropdowns
// The right-bottom is the standard position
function defineFirstLevelDropdownsPosition(self, powerElement) {
	if (['right-bottom', 'bottom-right', 'left-bottom', 'bottom-left',
		'right-top', 'top-right', 'left-top', 'top-left'].includes(self.defaultPosition)) {
		powerElement.defaultPosition = self.defaultPosition;
	} else if (self.defaultPosition === 'top') {
		powerElement.defaultPosition = 'top-right';
	} else if (self.defaultPosition === 'bottom') {
		powerElement.defaultPosition = 'bottom-right';
	} else if (self.defaultPosition === 'right') {
		powerElement.defaultPosition = 'bottom-right';
	} else if (self.defaultPosition === 'left') {
		powerElement.defaultPosition = 'bottom-left';
	} else {
		if (self.element.classList.contains('power-horizontal')) {
			self.defaultPosition = 'bottom-right';
		} else {
			self.defaultPosition = 'right-bottom';
		}
	}
}

class PowerUi extends _PowerUiBase {
	constructor(inject) {
		super();

		this._createPowerDOM();
		this.powerDOM._callInit();
		this.menus = this.powerDOM.powerCss.powerMenu;
		this.mains = this.powerDOM.powerCss.powerMain;
		this.truth = {};
		this.tmp = {dropdown: {}};
		// Detect if is touchdevice (Phones, Ipads, etc)
		this.touchdevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement) ? true : false;
	}

	_powerMenu(element) {
		return new PowerMenu(element, this);
	}

	_powerMain(element) { // TODO need classes?
		return new PowerMain(element, this);
	}

	_powerBrand(element) {
		return new PowerBrand(element, this);
	}

	_powerItem(element) {
		return new PowerItem(element, this);
	}

	_powerAccordion(element) {
		return new PowerAccordion(element, this);
	}

	_powerSection(element) {
		return new PowerSection(element, this);
	}

	_powerAction(element) {
		return new PowerAction(element, this);
	}

	_powerToggle(element) {
		return new PowerToggle(element, this);
	}

	_powerDropdown(element) {
		return new PowerDropdown(element, this);
	}

	_powerStatus(element) {
		return new PowerStatus(element, this);
	}

	_powerBasicElement(element) {
		return new _PowerBasicElement(element, this);
	}
}
