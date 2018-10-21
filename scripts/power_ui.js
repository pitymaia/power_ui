// Layout, design and user interface framework in ES6

'use strict';

function _getId(ctx) {
	return ctx.element.getAttribute('id') || null;
}

function _setId(ctx, id) {
	ctx.element.setAttribute('id', id);
	ctx._id = id;
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


// Create the menu item
class PowerMenuItem {
	constructor(item) {
		this.element = item;
		this._id = this.id;
		this._label = this.label;
	}

	_validateLabelClassSelectors(labelElements) {
		let error = 'ERROR: The menu item have more than one element with the class selector "power-label", so we can not know with one is the real label:';
		let throwError = false;
		if (labelElements.length > 1) {
			throwError = true;
		} else if (this.element.className.includes('power-label') && labelElements.length) {
			throwError = true;
		} else if (!this.element.className.includes('power-label') && !labelElements.length) {
			// Menu item always needs a label
			error = 'ERROR: All menu items needs at least one element with the class selector "power-label":';
			throwError = true;
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
		return this.element.className.includes('power-label') ?
			this.element.innerText : labelElements[0].innerText;
	}

	set label(label) {
		const labelElements = this.element.getElementsByClassName('power-label');
		this._validateLabelClassSelectors(labelElements);
		if (this.element.className.includes('power-label')) {
			this.element.innerText = label;
		} else if (labelElements[0]) {
			labelElements[0].innerText = label;
		}
		this._label = label;
	}

	get id() {
		return _getId(this);
	}

	set id(id) {
		_setId(this, id);
	}
}


class PowerMenu {
	constructor(menu) {
		this.element = menu;
		this._id = this.id;
		this.items = [];
		this._brand = this.brand;

		const itemsElements = menu.getElementsByClassName('power-item');
		for (const menuItem of itemsElements) {
			this.items.push(this.newPowerMenuItem(menuItem));
		}
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

	get brand() {
		const brandElements = this.element.getElementsByClassName('power-menu-brand');
		this._validateBrandClassSelectors(brandElements);
		return brandElements[0] || null;
	}

	_validateBrandClassSelectors(brandElements) {
		const error = 'ERROR: The menu can not have more than one class selector "power-menu-brand":';
		if (brandElements.length > 1) {
			window.console.error(error, this.element);
			throw 'power-menu-brand Error';
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



class TesteMenu extends PowerMenu {
	constructor(menu, info) {
		super(menu);
		this.testMenu = true;
		this.descri = info.descri;
	}
}

class TesteMenus extends PowerMenus {
	constructor() {
		super();
		this.testMenus = true;
		this.descri = 'Esse é o menu de testes';
	}

	newPowerMenu(menu) {
		const info = {descri: 'Descrição do menu'};
		return new TesteMenu(menu, info);
	}
}
class TesteUi extends PowerUi {
	constructor() {
		super();
		this.fake = {};
	}
	newPowerMenus() {
		return new TesteMenus();
	}
}

let app = new TesteUi();
// let app = new PowerUi();

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
