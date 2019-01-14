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

	_powerHeading(element) {
		return new PowerHeading(element, this);
	}

	_powerItem(element) {
		return new PowerItem(element, this);
	}

	_powerLabel(element) {
		return new PowerLabel(element, this);
	}

	_powerAction(element) {
		return new PowerAction(element, this);
	}

	_powerDropdown(element) {
		return new PowerDropdown(element, this);
	}

	_powerLink(element) { // TODO need classes?
		return new _PowerBasicElement(element, this);
	}

	_powerStatus(element) { // TODO need classes?
		return new _PowerBasicElement(element, this);
	}

	_powerIcon(element) { // TODO need classes?
		return new _PowerBasicElement(element, this);
	}

	_powerBasicElement(element) { // TODO need classes?
		return new _PowerBasicElement(element, this);
	}
}


class PowerHeading extends _PowerBasicElement {
	constructor(element) {
		super(element);
	}
}


class _PowerLinkElement extends _PowerBasicElement {
	constructor(element) {
		super(element);
	}

	// getter for default _PowerLinkElement IMG
	get image() {
		const image = this.images[0];
		return image ? image : null;
	}

	get src() {
		const image = this.image;
		return image ? image.src : null;
	}

	set src(src) {
		const image = this.image;
		if (image) {
			image.src = src;
		}
	}

	get link() {
		const selector = 'power-link';
		const links = this.element.getElementsByClassName(selector);
		let link = links[0] ? links[0] : null;
		// Maybe the power-link class is in the element it self
		if (!link && this.element.className.includes(selector)) {
			link = this.element;
		}
		return link;
	}

	get href() {
		const href = this.link.querySelectorAll('[href]');
		return href[0] ? href[0].getAttribute('href') : null;
	}
}


class PowerItem extends _PowerLinkElement {
	constructor(element) {
		super(element);
	}
}


class PowerLabel extends _PowerBasicElementWithEvents {
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
		this.powerDropdown = this.$powerUi.powerDOM.allPwElementsById[this._target].powerDropdown;
		// Add the action to the dropdown
		this.powerDropdown.powerAction = this;
		this.nativeSubscribe({event: 'click', fn: this.powerDropdown.toggle});
	}
}


class PowerDropdown extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);
	}

	clickOutside(event) {
		const targetElement = document.getElementById(this.powerDropdown.id);
		const powerAction = document.getElementById(this.id);
		let clickedElement = event.target; // clicked element

		do {
			if (clickedElement === targetElement || clickedElement === powerAction) {
				// This is a click inside the dropdown or on power action. Do nothing, just return
				return;
			}
			// Go up the DOM
			clickedElement = clickedElement.parentNode;
		} while (clickedElement);

		// This is a click outside, so close the dropdown
		// Before call the toggle function we need pass the label element "this"
		const toggle = this.powerDropdown.toggle.bind(this);
		toggle();
	}

	// The toggle "this" is in reality the "this" of the label element
	// That's why we use the "this.dropdown" to use the dropdown element and not "this.element"
	toggle() {
		if (this.powerDropdown._$pwActive) {
			this.powerDropdown._$pwActive = false;
			this.powerDropdown.element.classList.remove('power-show');
			// Remove the listener to detect if click outside
			document.removeEventListener("click", this.powerDropdown._clickOutside);
		} else {
			this.powerDropdown._$pwActive = true;
			this.powerDropdown.element.classList.add('power-show');
			// Add the listener to capture when click outside and register the function to allow remove it
			this.powerDropdown._clickOutside = this.powerDropdown.clickOutside.bind(this);
			document.addEventListener("click", this.powerDropdown._clickOutside);
		}
	}

	get status() {
		const selector = 'power-status';
		const elements = this.element.getElementsByClassName(selector);
		return elements[0] || null;
	}
}


class PowerBrand extends _PowerLinkElement {
	constructor(element) {
		super(element);
		this.id = this.element.getAttribute('id');
		const self = this;
		// $pwMain._mouseover.nativeSubscribe(function (ctx) {
		// 	console.log('Ouvindo', self.id, ctx.id);
		// });
	}
}


class PowerMenu {
	constructor(menu, $powerUi) {
		this.$powerUi = $powerUi;
		this.element = menu;
		this._id = this.element.getAttribute('id');
	}

	init() {
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

	get id() {
		return _getId(this);
	}

	set id(id) {
		_setId(this, id);
	}
}
