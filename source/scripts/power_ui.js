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
	if (['right-bottom', 'bottom-right', 'right-top', 'top-right'].includes(self.defaultPosition)) {
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
		// Detect if is touchdevice (Phones, Ipads, etc)
		this.touchdevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement) ? true : false;
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


class PowerItem extends PowerTarget {
	constructor(element) {
		super(element);
	}
}


class PowerAccordion extends PowerTarget {
	constructor(element) {
		super(element);
		element.getAttribute('data-multiple-sections-open') === 'true' ? this.multipleSectionsOpen = true : this.multipleSectionsOpen = false;
		this.powerSection = {};
		this.powerAction = {};
	}
	init() {
		// Add all sections and actions to Power Accordion
		const powerSections = this.element.getElementsByClassName('power-section');
		for (const section of powerSections) {
			this.powerSection[section.id] = this.$powerUi.powerDOM.powerCss.powerSection[section.id];
			// Add accordion to section
			this.powerSection[section.id].powerAccordion = this;
		}
		const powerActions = this.element.getElementsByClassName('power-action');
		for (const action of powerActions) {
			this.powerAction[action.id] = this.$powerUi.powerDOM.powerCss.powerAction[action.id];
			// Add accordion to action
			this.powerAction[action.id].powerAccordion = this;
		}
	}
}


class PowerSection extends PowerTarget {
	constructor(element) {
		super(element);
	}

	action() {
		// If not allow multipleSectionsOpen, close the other sections
		if (!this.powerAccordion.multipleSectionsOpen) {
			for (const action in this.powerAccordion.powerAction) {
				// Only closes if is not this section and if is active
				const targetAction = this.powerAccordion.powerAction[action];
				if (targetAction.targetObj.id !== this._id && targetAction._$pwActive) {
					// This prevent the targetAction.toggle call this action again, so this flag avoid a loop to occurs
					targetAction.toggle({avoidCallAction: true});
				}
			}
		}
	}
}


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

		// Allow the target add events to PowerAction dispatch
		if (this.targetObj.customEventsToDispatch) this.targetObj.customEventsToDispatch();
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
			return false;
		}

		do {
			if (elementToCheck === targetElement || elementToCheck === powerActionElement) {
				// This is a click inside the dropdown, menu or on the buttom/trigger element. So, do nothing, just return
				return false;
			}
			// Go up the DOM
			elementToCheck = elementToCheck.parentNode;
		} while (elementToCheck);

		// This is an outside click
		this.toggle();
	}
}


class PowerToggle extends PowerAction {
	constructor(element) {
		super(element);
	}
}


class PowerDropdown extends PowerTarget {
	constructor(element) {
		super(element);
		// Hold all the power actions in this dropdown, buto not the ones on the internal dropdowns
		this.firstLevelPowerActions = [];
		// Hold all the power actions in the internal dropdowns, but not the ones in this dropdown
		this.allChildPowerActions = [];
		// Hold all the power items in this dropdown, buto not the ones on the internal dropdowns
		this.firstLevelPowerItems = [];
		// Hold all the power items in the internal dropdowns, but not the ones in this dropdown
		this.allChildPowerItems = [];
		// Hold all child dropdowns
		this.allChildPowerDropdowns = [];
		// The position the dropdown will try to appear by default
		this.defaultPosition = element.getAttribute('data-power-position') || 'bottom-right';

		// Mark the root of the dropdown tree, first element
		let stop = false;
		let parentElement = element.parentElement;
		while (!stop) {
			if (parentElement.classList.contains('power-dropdown')) {
				this.isRootElement = false;
				return;
			} else if (parentElement.classList.contains('power-menu')) {
				this.isRootElement = true;
				this.isMenuElement = true;
				stop = true;
			} else {
				// Don't let go to parentElement if already found and have the variable 'stop' as true
				// Only select the parentElement if has element but don't found the main class selector
				parentElement = parentElement.parentElement;
				if (!parentElement) {
					// No more parentElements, than this is first level dropdown
					this.isRootElement = true;
					// If there is no more element set stop
					stop = true;
				}
			}
		}
	}

	init() {
		setAllChildElementsAndFirstLevelChildElements(
			'power-action',
			'powerAction',
			this.firstLevelPowerActions,
			this.allChildPowerActions,
			this,
			this.allChildPowerDropdowns,
		);
		setAllChildElementsAndFirstLevelChildElements(
			'power-item',
			'powerItem',
			this.firstLevelPowerItems,
			this.allChildPowerItems,
			this
		);

		// Set the default position only for menus not inside a menu
		// The default position of menus dropdowns are defined by the menu
		if (this.isRootElement && !this.isMenuElement) {
			defineFirstLevelDropdownsPosition(this, this);
			for (const dropdown of this.allChildPowerDropdowns) {
				defineChildDropdownsPosition(this, dropdown);
			}
		}
	}

	// This add the toggle as the dispatch for the custom event "toggle" by adding a method with the event name to the powerAction
	customEventsToDispatch() {
		this.powerAction.toggle = this.powerAction.toggle;
	}

	// Remove left, margin-left and border width from absolute elements
	offsetComputedStyles(styles) {
		return parseInt(styles.left.split('px')[0] || 0) + parseInt(styles['margin-left'].split('px')[0] || 0)  + parseInt(styles['border-left-width'].split('px')[0] || 0);
	}

	offsetComputedBodyStyles(styles) {
		return parseInt(styles['margin-left'].split('px')[0] || 0) + parseInt(styles['border-width'].split('px')[0] || 0);
	}

	// Get the dropdown left positon
	getLeftPosition(powerAction) {
		const bodyRect = document.body.getBoundingClientRect();
		const elemRect = powerAction.element.getBoundingClientRect();
		let offset = elemRect.left - bodyRect.left;
		offset  = offset + this.offsetComputedBodyStyles(window.getComputedStyle(document.body));

		// Select all parent nodes to find the ones positioned as "absolute"
		let curentNode = powerAction.element.parentNode;
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

		return Math.round(offset);
	}

	hoverModeOn() {
		for (const action of this.firstLevelPowerActions) {
			action.subscribe({event: 'mouseenter', fn: this.onMouseEnterAction, action: action, dropdown: this});
		}
	}

	onMouseEnterAction(ctx, event, params) {
		if (params.action._$pwActive) {
			return;
		}
		params.action.toggle();
		params.dropdown.onMouseEnterItem(ctx, event, params, true);
		for (const item of params.dropdown.firstLevelPowerItems) {
			item.subscribe({event: 'mouseenter', fn: params.dropdown.onMouseEnterItem, action: params.action, dropdown: params.dropdown});
		}
	}

	onMouseEnterItem(ctx, event, params, onMouseEnterAction) {
		// This can be called from inMouseEnterAction and in this case we don't want call the toggle
		if (!onMouseEnterAction) {
			// Only call toggle if is active
			if (params.action._$pwActive) {
				params.action.toggle();
			}

		}

		// Close any child possible active dropdown
		for (const action of params.dropdown.allChildPowerActions) {
			if (action._$pwActive) {
				action.toggle();
			}
		}
		// Close any first level possible active dropdown if not the current dropdown
		for (const action of params.dropdown.firstLevelPowerActions) {
			if (action._$pwActive && (action._id !== params.action._id)) {
				action.toggle();
			}
		}

		// Unsubscribe from all the power items mouseenter
		for (const item of params.dropdown.firstLevelPowerItems) {
			item.unsubscribe({event: 'mouseenter', fn: params.dropdown.onMouseEnterItem, action: params.action, dropdown: params.dropdown});
		}

	}

	hoverModeOff() {
		for (const action of this.firstLevelPowerActions) {
			action.unsubscribe({event: 'mouseenter', fn: this.onMouseEnterAction, action: action, dropdown: this});
		}
	}

	setPositionRightBottom() {
		this.element.style.left = this.getLeftPosition(this.powerAction) + this.powerAction.element.offsetWidth - 1 + 'px';
		this.element.style.top = this.powerAction.element.offsetTop + 'px';
	}

	setPositionRightTop() {
		this.element.style.left = this.getLeftPosition(this.powerAction) + this.powerAction.element.offsetWidth - 1 + 'px';
		this.element.style.top = this.powerAction.element.offsetTop - (this.element.offsetHeight - this.powerAction.element.offsetHeight)+ 'px';
	}

	setPositionBottomOnly() {
		this.element.style.left = this.getLeftPosition(this.powerAction) + 'px';
	}

	setPositionTopOnly() {
		this.element.style.left = this.getLeftPosition(this.powerAction) + 'px';
		this.element.style.top = this.powerAction.element.offsetTop - this.element.offsetHeight + 'px';
	}

	toggle() {
		console.log('this', this);
		// Hide the element when add to DOM
		// This allow get the dropdown sizes and position before adjust and show
		this.element.classList.add('power-hide');
		const self = this;
		if (!this._$pwActive) {
			setTimeout(function () {
				// The powerDropdown base it's position on the powerAction position
				if (self.defaultPosition === 'bottom-right') {
					self.setPositionBottomOnly();
				} else if (self.defaultPosition === 'right-bottom') {
					self.setPositionRightBottom();
				} else if (self.defaultPosition === 'top-right') {
					self.setPositionTopOnly();
				} else if (self.defaultPosition === 'right-top') {
					self.setPositionRightTop();
				} else {
					console.log("else: don't find position");
					self.setPositionRightBottom();
				}
				// After choose the position show the dropdown
				self.element.classList.remove('power-hide');
			}, 50);

			// Dropdowns only behave like windows if the user is not using touch
			if (!this.$powerUi.touchdevice) {
				this.hoverModeOn();
			}
		} else {
			// Dropdowns only behave like windows if the user is not using touch
			if (!this.$powerUi.touchdevice) {
				this.hoverModeOff();
			}
		}
		// PowerAction implements an optional "click out" system to allow toggles to hide
		this.powerAction.ifClickOut();
		// Broadcast toggle custom event
		this.broadcast('toggle', true);
	}

	// The powerAction call this action method
	action() {
		this.toggle();
	}
}


class PowerBrand extends PowerTarget {
	constructor(element) {
		super(element);
		this.id = this.element.getAttribute('id');
		const self = this;
	}
}


class PowerMenu extends PowerTarget {
	constructor(menu, $powerUi) {
		super(menu);
		this.$powerUi = $powerUi;
		this._$pwActive = false;
		this.element = menu;
		this.id = this.element.getAttribute('id');
		this.powerTarget = true;
		this.firstLevelPowerActions = [];
		this.allChildPowerActions = [];
		this.firstLevelPowerDropdowns = [];
		// The position the dropdown will try to appear by default
		this.defaultPosition = this.element.getAttribute('data-power-position');
		// If user does not define a default position, see if is horizontal or vertical menu and set a defeult value
		if (!this.defaultPosition) {
			if (this.element.classList.contains('power-horizontal')) {
				this.defaultPosition = 'bottom-right';
			} else {
				this.defaultPosition = 'right-bottom';
			}
		}
	}

	init() {
		// Add elements to menu and the menu to the elements
		for (const config of _powerCssConfig.filter(x => !x.isMain)) {
			const className = config.name;
			// power-brand, power-item, power-dropdown, etc...
			for (const element of this.element.getElementsByClassName(className)) {
				let keyName = className.split('-')[1];
				// Find the apropriate key plural (statuses)
				keyName = (keyName === 'status') ? `${keyName}es` : `${keyName}s`;
				if (!this[keyName]) {
					this[keyName] = {};
				}
				// find the camelCase name of the className
				const camelCaseName = powerClassAsCamelCase(className);
				const powerElement = this.$powerUi.powerDOM.powerCss[camelCaseName][element.id];
				this[keyName][element.id] = powerElement;
				// Add the menu on the powerElement
				powerElement.$powerMenu = this;
				if (camelCaseName === 'powerDropdown') {
					if (powerElement.isRootElement) {
						this.firstLevelPowerDropdowns.push(powerElement);
						defineFirstLevelDropdownsPosition(this, powerElement);
					} else {
						defineChildDropdownsPosition(this, powerElement);
					}
				}
			}
		}

		// Menu subscribe to any action to allow "windows like" behaviour on dropdowns
		// When click the first menu item on Windows and Linux, the other dropdowns opens on hover
		setAllChildElementsAndFirstLevelChildElements('power-action', 'powerAction', this.firstLevelPowerActions, this.allChildPowerActions, this);

		for (const action of this.firstLevelPowerActions) {
			// Only atach the windows like behaviour if not a touchdevice
			if (!this.$powerUi.touchdevice) {
				action.subscribe({event: 'click', fn: this.hoverModeOn, menu: this});
				action.subscribe({event: 'toggle', fn: this.maySetHoverModeOff, menu: this});
			}
		}
	}

	hoverModeOn(ctx, event, params) {
		for (const action of params.menu.firstLevelPowerActions) {
			action.subscribe({event: 'mouseenter', fn: params.menu.onMouseEnterAction, action: action, menu: params.menu});
		}
	}

	onMouseEnterAction(ctx, event, params) {
		// Only call toggle if is not active
		if (!params.action._$pwActive) {
			params.action.toggle();
		}

		// Close any child possible active dropdown
		for (const action of params.menu.allChildPowerActions) {
			if (action._$pwActive) {
				action.toggle();
			}
		}
		// Close any first level possible active dropdown if not the current dropdown
		for (const action of params.menu.firstLevelPowerActions) {
			if (action._$pwActive && (action._id !== params.action._id)) {
				action.toggle();
			}
		}
	}

	maySetHoverModeOff(ctx, event, params) {
		setTimeout(function() {
			let someDropdownIsOpen = false;
			// See if there is any firstLevelPowerAction active
			for (const action of params.menu.firstLevelPowerActions) {
				if (action._$pwActive) {
					someDropdownIsOpen = true;
				}
			}

			// If there is no active action, set hover mode to off
			if (someDropdownIsOpen === false) {
				params.menu.hoverModeOff(ctx, event, params);
			}
		}, 333);
	}

	hoverModeOff(ctx, level, params) {
		for (const action of params.menu.firstLevelPowerActions) {
			action.unsubscribe({event: 'mouseenter', fn: params.menu.onMouseEnterAction, action: action, menu: params.menu});
		}
	}

	toggle() {
		// PowerAction implements an optional "click out" system to allow toggles to hide
		this.powerAction.ifClickOut();
		// Broadcast toggle custom event
		this.powerAction.broadcast('toggle', true);
	}

	// The powerToggle call this action method
	action() {
		this.toggle();
	}

	// This add the toggle as the dispatch for the custom event "toggle" by adding a method with the event name to the powerAction
	customEventsToDispatch() {
		this.powerAction.toggle = this.powerAction.toggle;
	}
}

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
		const allPowerObjsById = this.$powerUi.powerDOM.allPowerObjsById;
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
		if (this.targetObj) this.targetObj.subscribe({event: 'toggle', fn: this.toggle.bind(this)});
	}
}
