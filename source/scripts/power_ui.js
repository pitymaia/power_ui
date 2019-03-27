// Set two objects: The Power dropmenus first level child elements, and all Power dropmenus child elements
function setAllChildElementsAndFirstLevelChildElements(targetElement, powerSelector, firstLevelElements, allChildPowerElements, ctx, allDropdowns) {
	const allChildElements = ctx.element.getElementsByClassName(targetElement);
	const allChildDropmenus = ctx.element.getElementsByClassName('power-dropmenu');
	// Hold the id of actions that belongs to children Power dropmenus
	const elementsIdsBlackList = [];
	for (const currentDropmenu of allChildDropmenus) {
		// Get all Power dropmenus if ask for it
		if (allDropdowns !== undefined) {
			allDropdowns.push(ctx.$powerUi.powerTree.powerCss.powerDropmenu[currentDropmenu.getAttribute('id')]);
		}
		const currentDropmenuActions = currentDropmenu.getElementsByClassName(targetElement);
		for (const currentElement of currentDropmenuActions) {
			// If not already in the black list add it
			if (!elementsIdsBlackList.includes(currentElement.id)) {
				elementsIdsBlackList.push(currentElement.id);
			}
		}
	}

	// Only select the power actions not black listed
	for (const currentElement of allChildElements) {
		if (!elementsIdsBlackList.includes(currentElement.id)) {
			firstLevelElements.push(ctx.$powerUi.powerTree.powerCss[powerSelector][currentElement.id]);
		} else {
			// Add all child elements
			allChildPowerElements.push(ctx.$powerUi.powerTree.powerCss[powerSelector][currentElement.id]);
		}
	}
}

// Define the powerDropmenus defaultPosition for all the child Power dropmenus
// The right-bottom is the standard position
function defineChildDropmenusPosition(self, powerElement) {
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

// Define the powerDropmenus defaultPosition for the first level Power dropmenus
// The right-bottom is the standard position
function defineFirstLevelDropmenusPosition(self, powerElement) {
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


class KeyboardManager {
	constructor() {
		document.onkeydown = this.checkKey.bind(this);
		document.onkeyup = this.checkKey.bind(this);
	}

	checkKey(e) {
		e = e || window.event;
		console.log('e', e);
		// Turn keyboard mode off
		// ESC = 27
		if (e.keyCode === 27) {
			this._17 = false;
			this._48 = false;
			this.keyModeIsOn = false;
		}

		// Monitoring key down and key up
		if (e.type === 'keydown') {
			this[`_${e.keyCode}`] = true;
		} else {
			this[`_${e.keyCode}`] = false;
		}

		// Turn keyboard mode on
		// ctrl = 17, 0 = 48 (ctrl + 0)
		if (this._17 && this._48) {
			this.keyModeIsOn = true;
			window.alert('Keyboard mode');
		}
	}
}


class PowerUi extends _PowerUiBase {
	constructor(inject) {
		super();
		this._createPowerTree();
		this.powerTree._callInit();
		this.menus = this.powerTree.powerCss.powerMenu;
		this.mains = this.powerTree.powerCss.powerMain;
		this.truth = {};
		this.tmp = {dropmenu: {}};
		// Detect if is touchdevice (Phones, Ipads, etc)
		this.touchdevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement) ? true : false;
		// If not touchdevice add keyboardManager
		if (!this.touchdevice) {
			this.keyboardManager = new KeyboardManager();
		}
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

	_powerDropmenu(element) {
		return new PowerDropmenu(element, this);
	}

	_powerStatus(element) {
		return new PowerStatus(element, this);
	}

	_powerBasicElement(element) {
		return new _PowerBasicElement(element, this);
	}
}
