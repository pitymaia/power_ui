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

function _menuBlockById(id, menu) {
	let menuBlock = menu.items.find(item => item.id === id); // jshint ignore:line
	if (!menuBlock) {
		menuBlock = menu.brand.id === id ? menu.brand : null;
	}
	if (!menuBlock) {
		menuBlock = menu.headings.find(header => header.id === id); // jshint ignore:line
	}
	return menuBlock;
}

function _addCssCallBack(element, selectorValue) {
	console.log('_addCssCallBack', selectorValue);
	return `${element.className} ${selectorValue}`;
}

function _removeCssCallBack(element, selectorValue) {
	console.log('_removeCssCallBack', selectorValue);
	for (const className of selectorValue.split(' ')) {
		element.classList.remove(className);
	}
	return element.className;
}

// The list of pw-attributes with the config for _addPowerBlockMainPwHoverListners and _addPowerBlockPwHoverListners
const _powerAttributesConfig = [
	{context: 'this', defaultSelector: 'data-pw-default-src', selector: 'data-pw-hover-src', attribute: 'src'},
	{context: 'main', defaultSelector: 'data-pw-default-src', selector: 'data-pw-main-hover-src', attribute: 'src'},
	{context: 'this', defaultSelector: 'data-pw-default', selector: 'data-pw-hover', attribute: 'className'},
	{context: 'main', defaultSelector: 'data-pw-default', selector: 'data-pw-main-hover', attribute: 'className'},
	{context: 'this', defaultSelector: 'data-pw-default', selector: 'data-pw-hover-add', attribute: 'className', callback: _addCssCallBack},
	{context: 'main', defaultSelector: 'data-pw-default', selector: 'data-pw-main-hover-add', attribute: 'className', callback: _addCssCallBack},
	{context: 'this', defaultSelector: 'data-pw-default', selector: 'data-pw-hover-remove', attribute: 'className', callback: _removeCssCallBack},
	{context: 'main', defaultSelector: 'data-pw-default', selector: 'data-pw-main-hover-remove', attribute: 'className', callback: _removeCssCallBack},
];


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

		// Set data-pw-default for all _powerAttributesConfig
		for (const item of _powerAttributesConfig) {
			// Set data-pw-default if have some data-pw-selector
			for (const element of document.querySelectorAll(`[${item.selector}]`)) {
				if (!element.getAttribute(`${item.defaultSelector}`)) {
					element.setAttribute(item.defaultSelector, element[item.attribute]);
				}
			}
		}
	}

	newPowerMenus() {
		return new PowerMenus();
	}
}


// Abstract class to create menu elements
class _PowerBasicElement {
	constructor(element, main) {
		this.element = element;
		this._hover = false;
		this._validateLabelClassSelectors(this.element.getElementsByClassName('power-label'));

		// Add all the listners
		for (const config of _powerAttributesConfig) {
			if (config.context === 'main') {
				this._addPowerBlockMainPwHoverListners(config, main, this);
			} else {
				this._addPowerBlockPwHoverListners(config, this);
			}
		}
	}

	// THIS
	// Add pw-default attribute and addEventListener if there is pw hover selector like data-pw-hover-src
	_addPowerBlockPwHoverListners(config, ctx) {
		// Check if children have elements with the pw-selector, or it the element it self has it
		if (ctx.element.querySelectorAll(`[${config.selector}]`).length || ctx.element.getAttribute(config.selector)) {
			ctx.addEventListener("mouseover", function() {
				if (!ctx._hover) {
					ctx._changeNodes(config.selector, config.attribute, config.callback || null);
					ctx._hover = true;
				}
			}, false);
			ctx.addEventListener("mouseout", function() {
				if (ctx._hover) {
					ctx._changeNodes(config.defaultSelector, config.attribute);
					ctx._hover = false;
				}
			}, false);
		}
	}

	// MAIN
	// Add addEventListener if there is main and pw hover selector like data-pw-main-hover-src
	_addPowerBlockMainPwHoverListners(config, main, ctx) {
		// Get only elements with the pw-selector
		if (main && ctx.element.querySelectorAll(`[${config.selector}]`).length || ctx.element.getAttribute(config.selector)) {
			main.addEventListener("mouseover", function() {
				if (ctx._hover === false) {
					ctx._changeNodes(config.selector, config.attribute, config.callback || null);
				}
			}, false);
			main.addEventListener("mouseout", function() {
				if (ctx._hover === false) {
					ctx._changeNodes(config.defaultSelector, config.attribute);
				}
			}, false);
		}
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

	// If have pw-selectors it replaces the default values with the data in the pw-selector
	_changeNodes(selector, attribute, callback) {
		// Change the element it self if have the selector
		const selectorValue = this.element.getAttribute(selector);
		if (selectorValue) {
			// Replace the attribute value with the data in the selector
			this.element[attribute] = callback ? callback(this.element, selectorValue) : selectorValue;
		}
		// Change any children node
		const nodes = this.element.querySelectorAll(`[${selector}]`);
		if (nodes.length > 0) {
			for (let index = 0; nodes.length != index; index++) {
				const selectorValue = nodes[index].getAttribute(selector);
				if (selectorValue) {
					// Replace the attribute value with the data in the selector
					nodes[index][attribute] = callback ? callback(nodes[index], selectorValue) : selectorValue;
				}
			}
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
	constructor(element, main) {
		super(element, main);
	}
}


class _PowerLinkElement extends _PowerBasicElement {
	constructor(element, main) {
		super(element, main);
		const linkSelector = 'power-link';
		_validateSingleClassSelectors(this.element.getElementsByClassName(linkSelector), linkSelector, this);
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
		_validateSingleClassSelectors(links, selector, this);
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
	constructor(element, main) {
		super(element, main);
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
	constructor(element, main) {
		super(element, main);
	}
}


class PowerMenu {
	constructor(menu) {
		this.element = menu;
		this.items = [];
		this.itemsById = {};
		this.headings = [];
		this.headingsById = {};

		// Call newPowerItem allows any extended class implement it on
		// custom PowerItem
		const itemsElements = menu.getElementsByClassName('power-item');
		for (const menuItem of itemsElements) {
			const newItem = this.newPowerItem(menuItem);
			if (newItem.id) {
				this.itemsById[newItem.id] = newItem;
			}
			this.items.push(newItem);
		}

		// Call newPowerHeading allows any extended class implement it on
		// custom PowerHeading
		const headingsElements = this.element.getElementsByClassName('power-heading');
		for (const menuHeading of headingsElements) {
			const newHeading = this.newPowerHeading(menuHeading);
			if (newHeading.id) {
				this.headingsById[newHeading.id] = newHeading;
			}
			this.headings.push(newHeading);
		}

		// Call newPowerBrand allows any extended class implement it on
		// custom PowerBrand
		this.newPowerBrand();
	}

	newPowerBrand() {
		const selector = 'power-brand';
		const elements = this.element.getElementsByClassName(selector);
		_validateSingleClassSelectors(elements, selector, this);
		this.brand =  elements[0] ? new PowerBrand(elements[0], this) : null;
	}

	newPowerHeading(menuHeading) {
		return new PowerHeading(menuHeading, this);
	}

	newPowerItem(menuItem) {
		return new PowerItem(menuItem, this);
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

	blockById(id) {
		return _menuBlockById(id, this);
	}
}


class PowerMenus {
	constructor() {
		this.menusIds = [];
		// Call newPowerMenu allows any extended class implement it on
		// custom PowerMenu
		const menus = document.getElementsByClassName('power-menu');
		for (const menu of menus) {
			this[menu.getAttribute('id')] = this.newPowerMenu(menu);
			this.menusIds.push(menu.getAttribute('id'));
		}
	}

	newPowerMenu(menu) {
		return new PowerMenu(menu);
	}

	menuById(id) {
		return this[id];
	}

	// Search for a menu block in all menus
	blockById(id) {
		for (const menuId of this.menusIds) {
			const menuBlock = _menuBlockById(id, this[menuId]);
			if (menuBlock) {
				return menuBlock;
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
	var item = app.menus.blockById('sports') || app.menus.blockById('novidades');
	item.label = 'Novidades';
	item.id = 'novidades';
	window.console.log('click label ' + item.label, app);
	window.console.log('click id ' + item.id, app);
	item.link.href = 'https://google.com';

	app.menus.another.itemsById.mais.label = 'Nossa';
}

function showMenuLabel() {
	var item = app.menus.blockById('sports') || app.menus.blockById('novidades');
	window.console.log('click label ' + item.label);
	window.console.log('click id ' + item.id);
	window.console.log('item img: ', item.images);
	window.console.log('item anchors: ', item.anchors);
	window.console.log('item icons: ', item.icons);
	window.console.log(item.label + ' link', item.link);
	window.console.log(item.label + ' href', item.href);
	window.console.log('brand', app.menus.blockById('first-brand'));
	window.console.log('news', app.menus.top.blockById('news'));

	window.console.log('mais by id', app.menus.another.itemsById.mais.label);
	window.console.log('mais by index', app.menus.another.items[0].label);
}

window.console.log('power', app);

app.menus.blockById('mais').addEventListener('click', function() {
	const menuItem = app.menus.blockById('mais');
	window.console.log('label', menuItem.label);
	window.console.log('id', menuItem.id);
	window.console.log('anchors', menuItem.anchors);
	window.console.log('images', menuItem.images);
	window.console.log('icons', menuItem.icons);
	window.console.log('status', menuItem.status);
	window.console.log('status class list', menuItem.status.classList);
});
app.menus.blockById('menos').addEventListener('mouseover', function() {
	window.console.log('Hover menos', this.label);
});
app.menus.blockById('muito').addEventListener('click', function() {
	window.console.log('Click muito', app);
});
app.menus.top.brand.addEventListener('click', function(brand) {
	window.console.log('Click BRAND', brand);
	if (brand.src === 'https://66.media.tumblr.com/b5a21282d1c97ba91134764d1e219694/tumblr_inline_nl8y67Q95H1t90c7j.gif') {
		brand.src = 'https://image.flaticon.com/icons/png/128/174/174848.png';
	} else {
		brand.src = 'https://66.media.tumblr.com/b5a21282d1c97ba91134764d1e219694/tumblr_inline_nl8y67Q95H1t90c7j.gif';
	}
});
