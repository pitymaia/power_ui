// Layout, design and user interface framework in ES6

'use strict';

function _getId(ctx) {
	return ctx.element.getAttribute('id') || null;
}

function _setId(ctx, id) {
	ctx.element.setAttribute('id', id);
}


class Event {
	constructor(name) {
		this.observers = [];
		if (name)  Event.index[name] = this;
	}
	subscribe(fn, ctx) { // *ctx* is what *this* will be inside *fn*.
		this.observers.push({fn, ctx});
	}
	unsubscribe(fn) {
		this.observers = this.observers.filter((x) => x !== fn);
	}
	broadcast() { // Accepts arguments.
		for (const o of this.observers) {
			o.fn.apply(o.ctx, arguments);
		}
	}
}
Event.index = {}; // storage for all named events


class PowerUi {
	constructor() {
		this.menus = this.newPowerMenus();
		this.ui = {};
		this.truth = {};
	}
	newPowerMenus() {
		return new PowerMenus();
	}
}


// Abstract class to create menu elements
class _PowerBasicElement {
	constructor(element, kind) {
		this.__kind__ = kind;
		this.element = element;
	}

	_validateLabelClassSelectors(labelElements) {
		let error = 'ERROR: The menu item have more than one element with the class selector "power-label", so we can not know with one is the real label:';
		let throwError = false;
		if (labelElements.length > 1) {
			throwError = true;
		} else if (this.element.className.includes('power-label') && labelElements.length) {
			throwError = true;
		} else if (!this.element.className.includes('power-label') && !labelElements.length) {
			// Better if items always have a label
			this.__labelUndefined__ = `It is better if all ${this.__kind__}s on menu have the class selector "power-label", now assuming the label is the element innerText with the class selector ${this.__kind__}`;
		}
		if (throwError) {
			window.console.error(error, this.element);
			throw 'power-label Error';
		}
	}

	get label() {
		const labelElements = this.element.getElementsByClassName('power-label');
		this._validateLabelClassSelectors(labelElements);
		// the label is the innerText of the menu item or
		// children element with 'power-label' class selector
		// If there is no 'power-label' class, assume the label is this.element.innerText
		return this.element.className.includes('power-label') ?
			this.element.innerText : (labelElements[0] ? labelElements[0].innerText : this.element.innerText);
	}

	set label(label) {
		const labelElements = this.element.getElementsByClassName('power-label');
		this._validateLabelClassSelectors(labelElements);
		if (this.element.className.includes('power-label')) {
			this.element.innerText = label;
		} else if (labelElements[0]) {
			labelElements[0].innerText = label;
		} else {
			this.element.innerText = label;
		}
	}

	get id() {
		return _getId(this);
	}

	set id(id) {
		_setId(this, id);
	}
}


class PowerMenuHeading extends _PowerBasicElement {
	constructor(element) {
		super(element, 'power-heading');
	}
}

class PowerMenuItem extends _PowerBasicElement {
	constructor(element) {
		super(element, 'power-item');
	}
}

class PowerMenuBrand extends _PowerBasicElement {
	constructor(element) {
		super(element, 'power-brand');
	}
}


class PowerMenu {
	constructor(menu) {
		this.element = menu;
		this.items = [];
		this.headings = [];

		const itemsElements = menu.getElementsByClassName('power-item');
		for (const menuItem of itemsElements) {
			this.items.push(this.newPowerMenuItem(menuItem));
		}

		const headingsElements = this.element.getElementsByClassName('power-heading');
		for (const menuHeading of headingsElements) {
			this.headings.push(this.newPowerMenuHeading(menuHeading));
		}

		this.newPowerMenuBrand();
	}

	newPowerMenuBrand() {
		const elements = this.element.getElementsByClassName('power-brand');
		this._validateSingleClassSelectors(elements);
		this.brand =  elements[0] ? new PowerMenuBrand(elements[0]) : null;
	}

	newPowerMenuHeading(menuHeading) {
		return new PowerMenuHeading(menuHeading);
	}

	newPowerMenuItem(menuItem) {
		return new PowerMenuItem(menuItem);
	}

	get id() {
		return _getId(this);
	}

	set id(id) {
		_setId(this, id);
	}

	_validateSingleClassSelectors(elements, selector) {
		const error = `ERROR: The menu can not have more than one class selector "${selector}":`;
		if (elements.length > 1) {
			window.console.error(error, this.element);
			throw `${selector} Error`;
		}
	}
}


class PowerMenus {
	constructor() {
		this.menus = [];

		const menus = document.getElementsByClassName('power-menu');
		for (const menu of menus) {
			this.menus.push(this.newPowerMenu(menu));
		}
	}
	newPowerMenu(menu) {
		return new PowerMenu(menu);
	}
	menuById(id) {
		return this.menus.find(menu => menu.id === id);
	}
	menuItemById(id) {
		for (const menu of this.menus) {
			const menuItem = menu.items.find(item => item.id === id); // jshint ignore:line
			if (menuItem) {
				return menuItem;
			}
		}
	}
	menuElById(id) {
		return this.menus.find(menu => menu.id === id).element;
	}
	menuItemElById(id) {
		for (const menu of this.menus) {
			const menuItem = menu.items.find(item => item.id === id); // jshint ignore:line
			if (menuItem) {
				return menuItem.element;
			}
		}
	}
}


// class TesteMenu extends PowerMenu {
// 	constructor(menu, info) {
// 		super(menu);
// 		this.testMenu = true;
// 		this.descri = info.descri;
// 	}
// }
// class TesteMenus extends PowerMenus {
// 	constructor() {
// 		super();
// 		this.testMenus = true;
// 		this.descri = 'Esse é o menu de testes';
// 	}

// 	newPowerMenu(menu) {
// 		const info = {descri: 'Descrição do menu'};
// 		return new TesteMenu(menu, info);
// 	}
// }
// class TesteUi extends PowerUi {
// 	constructor() {
// 		super();
// 		this.fake = {};
// 	}
// 	newPowerMenus() {
// 		return new TesteMenus();
// 	}
// }
// let app = new TesteUi();

let app = new PowerUi();

function changeMenu() {
	var item = app.menus.menuItemById('sports') || app.menus.menuItemById('novidades');
	item.label = 'Novidades';
	item.id = 'novidades';
	window.console.log('click label ' + item.label, app);
	window.console.log('click id ' + item.id, app);
}

function showMenuLabel() {
	var item = app.menus.menuItemById('sports') || app.menus.menuItemById('novidades');
	window.console.log('click label ' + item.label);
	window.console.log('click id ' + item.id);
}

window.console.log('power', app);

app.menus.menuItemElById('news').addEventListener('click', function() {
	window.console.log('Click news', app);
});
app.menus.menuItemElById('news').addEventListener('mouseover', function() {
	window.console.log('Hover ', this.innerText);
});
app.menus.menuItemElById('esporte').addEventListener('click', function() {
	window.console.log('Click esporte', app);
});
app.menus.menuItemElById('outro').addEventListener('click', function() {
	window.console.log('Click outro', app.menus);
});
