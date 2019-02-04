class PowerUi {
	constructor(inject) {
		for (const item of inject) {
			this.injectPwc(item, this);
		}

		this.powerDOM = new PowerDOM(this);
		this.powerDOM._callInit();
		this.menus = this.powerDOM.powerCss.powerMenu;
		this.mains = this.powerDOM.powerCss.powerMain;
		this.truth = {};
	}

	injectPwc(item, ctx) {
		_pwcAttrsConfig.push(item);
		ctx[`_${asDataSet(item.name)}`] = function (element) {
			return new item.obj(element);
		};
	}

	_powerMenu(element) {
		return new PowerMenu(element, this);
	}

	_powerMain(element) { // TODO need classes?
		return new _PowerBasicElement(element, this);
	}

	_powerBrand(element) {
		return new PowerBrand(element, this);
	}

	_powerItem(element) {
		return new PowerItem(element, this);
	}

	_powerAction(element) {
		return new PowerAction(element, this);
	}

	_powerDropdown(element) {
		return new PowerDropdown(element, this);
	}

	_powerToggle(element) {
		return new PowerToggle(element, this);
	}

	_powerStatus(element) { // TODO need classes?
		return new _PowerBasicElement(element, this);
	}

	_powerBasicElement(element) { // TODO need classes?
		return new _PowerBasicElement(element, this);
	}
}

// Detect click outside from dropdown or menu
function clickOutside(event, targetElement, clickedElement) {
	let elementToCheck = event.target; // clicked element

	do {
		if (elementToCheck === targetElement || elementToCheck === clickedElement) {
			// This is a click inside the dropdown, menu or on the buttom/trigger element. So, do nothing, just return
			return false;
		}
		// Go up the DOM
		elementToCheck = elementToCheck.parentNode;
	} while (elementToCheck);

	return true;
}


class PowerItem extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);
	}
}


class PowerAction extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);

		this._target = this.element.dataset.powerTarget;
		if (!this._target) {
			console.error('power-action selector needs a dropdown target', this.element);
			throw 'Missing power-action target. Please define it: data-power-target="dropdown_id"';
		}
	}

	init() {
		// Add the dropdown to the action
		this.powerDropdown = this.$powerUi.powerDOM.allPowerObjsById[this._target].powerDropdown;
		// Add the action to the dropdown
		this.powerDropdown.powerAction = this;
		this.subscribe({event: 'click', fn: this.powerDropdown.toggle});
	}
}


class PowerToggle extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);

		this._target = this.element.dataset.powerTarget;
		if (!this._target) {
			console.error('power-toggle selector needs a dropdown target', this.element);
			throw 'Missing power-toggle target. Please define it: data-power-target="menu_id"';
		}
	}

	init() {
		// Add the dropdown to the action
		this.powerMenu = this.$powerUi.powerDOM.allPowerObjsById[this._target].powerMenu;
		// Add the action to the dropdown
		this.powerMenu.powerToggle = this;
		this.subscribe({event: 'click', fn: this.powerMenu.toggle});
	}
}


class PowerDropdown extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);
	}

	clickOutside(event) {
		const targetElement = document.getElementById(this.powerDropdown.id);
		const clickedElement = document.getElementById(this.id);
		// This is a click outside, so close the dropdown
		// Before call the toggle function we need pass the element "this"
		if (clickOutside(event, targetElement, clickedElement)) {
			const toggle = this.powerDropdown.toggle.bind(this);
			toggle();
		}
	}

	// Remove left, margin-left and border width from absolute elements
	offsetComputedStyles(styles) {
		return parseInt(styles.left.split('px')[0] || 0) + parseInt(styles['margin-left'].split('px')[0] || 0)  + parseInt(styles['border-left-width'].split('px')[0] || 0);
	}

	offsetComputedBodyStyles(styles) {
		return parseInt(styles['margin-left'].split('px')[0] || 0) + parseInt(styles['border-width'].split('px')[0] || 0);
	}

	getLeftPosition(dropdownAction) {
		const bodyRect = document.body.getBoundingClientRect();
		const elemRect = dropdownAction.element.getBoundingClientRect();
		let offset = elemRect.left - bodyRect.left;
		offset  = offset + this.offsetComputedBodyStyles(window.getComputedStyle(document.body));

		// Select all parent nodes to find the ones positioned as "absolute"
		let curentNode = dropdownAction.element.parentNode;
		const allParents = [];
		while (curentNode && curentNode.tagName !== 'BODY') {
			allParents.push(curentNode);
			curentNode = curentNode.parentNode;
		}

		// Offset all parent "absolute" nodes
		for (const parent of allParents) {
			const parentStyles = window.getComputedStyle(parent);
			if (parentStyles.position === 'absolute') {
				offset  = offset - this.offsetComputedStyles(parentStyles);
			}
		}

		return Math.round(offset) + 'px';
	}
	// The toggle "this" is in reality the "this" of the PowerAction element
	// That's why we use the "this.dropdown" to use the dropdown element and not "this.element"
	toggle() {
		if (this.powerDropdown._$pwActive) {
			this._$pwActive = false; // powerAction
			this.powerDropdown._$pwActive = false;
			this.powerDropdown.element.classList.remove('power-show');
			// Remove the listener to detect if click outside
			document.removeEventListener("click", this.powerDropdown._clickOutside);
		} else {
			this._$pwActive = true; // powerAction
			this.powerDropdown._$pwActive = true;
			this.powerDropdown.element.style.left = this.powerDropdown.getLeftPosition(this);
			this.powerDropdown.element.classList.add('power-show');
			// Add the listener to capture when click outside and register the function to allow remove it
			this.powerDropdown._clickOutside = this.powerDropdown.clickOutside.bind(this);
			document.addEventListener("click", this.powerDropdown._clickOutside);
		}
		// Broadcast toggle custom event
		this.broadcast('toggle');
	}
}


class PowerBrand extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);
		this.id = this.element.getAttribute('id');
		const self = this;
		// $pwMain._mouseover.subscribe(function (ctx) {
		// 	console.log('Ouvindo', self.id, ctx.id);
		// });
	}
}


class PowerMenu {
	constructor(menu, $powerUi) {
		this.$powerUi = $powerUi;
		this.element = menu;
		this.id = this.element.getAttribute('id');
	}

	init() {
		// Add elements do menu
		for (const config of _powerCssConfig.filter(x => !x.isMain)) {
			const className = config.name;
			// power-brand
			for (const element of this.element.getElementsByClassName(className)) {
				let keyName = className.split('-')[1];
				// Find the apropriate key plural (statuses)
				keyName = (keyName === 'status') ? `${keyName}es` : `${keyName}s`;
				if (!this[keyName]) {
					this[keyName] = {};
				}
				// find the camelCase name of the className
				const camelCaseName = powerClassAsCamelCase(className);
				this[keyName][element.id] = this.$powerUi.powerDOM.powerCss[camelCaseName][element.id];
			}
		}
	}

	// The toggle "this" is in reality the "this" of the PowerToggle element
	// That's why we use the "this.powerMenu" to use the dropdown element and not "this.element"
	toggle() {
		if (this.powerMenu._$pwActive) {
			this._$pwActive = false; // powerAction
			this.powerMenu._$pwActive = false;
			this.powerMenu.element.classList.remove('power-show');
			// Remove the listener to detect if click outside
			document.removeEventListener("click", this.powerMenu._clickOutside);
		} else {
			this._$pwActive = true; // powerAction
			this.powerMenu._$pwActive = true;
			this.powerMenu.element.classList.add('power-show');
			// Add the listener to capture when click outside and register the function to allow remove it
			this.powerMenu._clickOutside = this.powerMenu.clickOutside.bind(this);
			document.addEventListener("click", this.powerMenu._clickOutside);
		}
	}

	clickOutside(event) {
		const targetElement = document.getElementById(this.powerMenu.id);
		const clickedElement = document.getElementById(this.id);
		// This is a click outside, so close the dropdown
		// Before call the toggle function we need pass the element "this"
		if (clickOutside(event, targetElement, clickedElement)) {
			const toggle = this.powerMenu.toggle.bind(this);
			toggle();
		}
	}
}
