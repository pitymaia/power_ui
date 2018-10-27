// Layout, design and user interface framework in ES6

'use strict';

function _getId(ctx) {
	return ctx.element.getAttribute('id') || null;
}

function _setId(ctx, id) {
	ctx.element.setAttribute('id', id);
}

function _validateSingleClassSelectors(elements, selector, ctx) {
	const error = `ERROR: This element can not have more than one class selector "${selector}":`;
	if (elements.length > 1 || (elements.length && ctx.element.className.includes(selector))) {
		window.console.error(error, ctx.element);
		throw `${selector} Error`;
	}
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
	constructor(element) {
		this.element = element;
		this._validateLabelClassSelectors(this.element.getElementsByClassName('power-label'));
	}

	_validateLabelClassSelectors(labelElements) {
		let error = 'ERROR: The menu item have more than one element with the class selector "power-label", so we can not know with one is the real label:';
		let throwError = false;
		if (labelElements.length > 1) {
			throwError = true;
		} else if (this.element.className.includes('power-label') && labelElements.length) {
			throwError = true;
		}
		if (throwError) {
			window.console.error(error, this.element);
			throw 'power-label Error';
		}
	}

	get images() {
		return this.element.getElementsByTagName('IMG');
	}

	get anchors() {
		return this.element.getElementsByTagName('A');
	}

	get icons() {
		return this.element.getElementsByClassName('power-icon');
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

	addEventListener(event, callback) {
		this.element.addEventListener(event, callback.bind(this, this));
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
		const linkSelector = 'power-link';
		_validateSingleClassSelectors(this.element.getElementsByClassName(linkSelector), linkSelector, this);
	}

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
		_validateSingleClassSelectors(links, selector, this);
		let link = links[0] ? links[0] : null;
		// Maybe the power-link class is in the element it self
		if (!link && this.element.className.includes(selector)) {
			link = this.element;
		}
		return link;
	}
}


class PowerItem extends _PowerLinkElement {
	constructor(element) {
		super(element);
		const statusSelector = 'power-status';
		_validateSingleClassSelectors(this.element.getElementsByClassName(statusSelector), statusSelector, this);
	}

	get status() {
		const selector = 'power-status';
		const elements = this.element.getElementsByClassName(selector);
		_validateSingleClassSelectors(elements, selector, this);
		return elements[0] || null;
	}
}


class PowerBrand extends _PowerLinkElement {
	constructor(element) {
		super(element);
	}
}


class PowerMenu {
	constructor(menu) {
		this.element = menu;
		this.items = [];
		this.headings = [];

		// Call newPowerItem allows any extended class implement it on
		// custom PowerItem
		const itemsElements = menu.getElementsByClassName('power-item');
		for (const menuItem of itemsElements) {
			this.items.push(this.newPowerItem(menuItem));
		}

		// Call newPowerHeading allows any extended class implement it on
		// custom PowerHeading
		const headingsElements = this.element.getElementsByClassName('power-heading');
		for (const menuHeading of headingsElements) {
			this.headings.push(this.newPowerHeading(menuHeading));
		}

		// Call newPowerBrand allows any extended class implement it on
		// custom PowerBrand
		this.newPowerBrand();
	}

	newPowerBrand() {
		const selector = 'power-brand';
		const elements = this.element.getElementsByClassName(selector);
		_validateSingleClassSelectors(elements, selector, this);
		this.brand =  elements[0] ? new PowerBrand(elements[0]) : null;
	}

	newPowerHeading(menuHeading) {
		return new PowerHeading(menuHeading);
	}

	newPowerItem(menuItem) {
		return new PowerItem(menuItem);
	}

	get id() {
		return _getId(this);
	}

	set id(id) {
		_setId(this, id);
	}

	addEventListener(event, callback) {
		this.element.addEventListener(event, callback.bind(this, this));
	}
}


class PowerMenus {
	constructor() {
		this.menus = [];

		// Call newPowerMenu allows any extended class implement it on
		// custom PowerMenu
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

	addEventListener(event, callback) {
		this.element.addEventListener(event, callback.bind(this, this));
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
	item.link.href = 'https://google.com';
}

function showMenuLabel() {
	var item = app.menus.menuItemById('sports') || app.menus.menuItemById('novidades');
	window.console.log('click label ' + item.label);
	window.console.log('click id ' + item.id);
	window.console.log('item img: ', item.images);
	window.console.log('item anchors: ', item.anchors);
	window.console.log('item icons: ', item.icons);
	window.console.log('sports link', item.link);
}

window.console.log('power', app);

app.menus.menuItemElById('mais').addEventListener('click', function() {
	const menuItem = app.menus.menuItemById('mais');
	window.console.log('label', menuItem.label);
	window.console.log('id', menuItem.id);
	window.console.log('anchors', menuItem.anchors);
	window.console.log('images', menuItem.images);
	window.console.log('icons', menuItem.icons);
	window.console.log('status', menuItem.status);
	window.console.log('status class list', menuItem.status.classList);
});
app.menus.menuItemElById('menos').addEventListener('mouseover', function() {
	window.console.log('Hover menos', this.innerText);
});
app.menus.menuItemElById('muito').addEventListener('click', function() {
	window.console.log('Click muito', app);
});
app.menus.menuItemElById('pouco').addEventListener('click', function() {
	window.console.log('Click pouco', app.menus);
});
app.menus.menus[0].brand.addEventListener('click', function(brand) {
	window.console.log('Click BRAND', brand);
	if (brand.src === 'https://66.media.tumblr.com/b5a21282d1c97ba91134764d1e219694/tumblr_inline_nl8y67Q95H1t90c7j.gif') {
		brand.src = 'https://image.flaticon.com/icons/png/128/174/174848.png';
	} else {
		brand.src = 'https://66.media.tumblr.com/b5a21282d1c97ba91134764d1e219694/tumblr_inline_nl8y67Q95H1t90c7j.gif';
	}
});
