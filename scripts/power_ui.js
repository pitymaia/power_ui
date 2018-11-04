// Layout, design and user interface framework in ES6
'use strict';


function _getId(ctx) {
	return ctx.element.getAttribute('id') || null;
}

function _setId(ctx, id) {
	ctx.element.setAttribute('id', id);
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
	return `${element.className} ${selectorValue}`;
}

function _removeCssCallBack(element, selectorValue) {
	for (const className of selectorValue.split(' ')) {
		element.classList.remove(className);
	}
	return element.className;
}

function getIdAndCreateIfDontHave(currentNode) {
	let currentId = currentNode.getAttribute('id');
	if (!currentId) {
		currentId = Unique.domID(currentNode.tagName.toLowerCase());
	}
	currentNode.setAttribute('id', currentId);
	return currentId;
}

// Dataset converts "data-something-nice" formats to camel case without data,
// the result is like "somethingNice"
function asDataSet(selector) {
	// Get the parts without the 'data' part
	const originalParts = selector.split('-').filter(part => part != 'data');
	let newstring = '';
	for (let count = 0; count < originalParts.length; count++) {
		if (count === 0) {
			newstring = newstring + originalParts[count];
		} else {
			newstring = newstring + originalParts[count].replace(/\b\w/g, l => l.toUpperCase());
		}
	}
	return newstring;
}

// The list of pw-attributes with the config for _addPowerBlockMainPwHoverListners and _addPowerBlockPwHoverListners
const _pwAttrsConfig = [
	{context: 'this', defaultSelector: 'data-pow-src-default', selector: 'data-pow-src-hover', attribute: 'src'},
	{context: 'main', defaultSelector: 'data-pow-src-default', selector: 'data-pow-main-src-hover', attribute: 'src'},
	{context: 'this', defaultSelector: 'data-pow-css-default', selector: 'data-pow-css-hover', attribute: 'className'},
	{context: 'main', defaultSelector: 'data-pow-css-default', selector: 'data-pow-main-css-hover', attribute: 'className'},
	{context: 'this', defaultSelector: 'data-pow-css-default', selector: 'data-pow-css-hover-add', attribute: 'className', callback: _addCssCallBack},
	{context: 'main', defaultSelector: 'data-pow-css-default', selector: 'data-pow-main-css-hover-add', attribute: 'className', callback: _addCssCallBack},
	{context: 'this', defaultSelector: 'data-pow-css-default', selector: 'data-pow-css-hover-remove', attribute: 'className', callback: _removeCssCallBack},
	{context: 'main', defaultSelector: 'data-pow-css-default', selector: 'data-pow-main-css-hover-remove', attribute: 'className', callback: _removeCssCallBack},
];

// The list of power-css-selectors with the config to create the objetc
const _powerCssConfig = [
	{name: 'power-main', isMain: true},
	{name: 'power-menu', isMain: true},
	{name: 'power-brand'},
	{name: 'power-heading'},
	{name: 'power-item'},
	{name: 'power-link'},
	{name: 'power-status'},
	{name: 'power-icon'},
];


class PowerDOM {
	constructor() {
		this.powerCss = {};
		this.powAttrs = {};
		this.pwcAttrs = {};

		const tempSelectors = {
			powerCss: {},
			powAttrs: {},
			pwcAttrs: {},
		};

		this.sweepDOM(document, tempSelectors, this._buildPorwerSelectors);

		// Create the power-css object elements
		for (const selector of _powerCssConfig) {
			for (const id in tempSelectors.powerCss[asDataSet(selector.name)]) {
				if (!this.powerCss[asDataSet(selector.name)]) {
					this.powerCss[asDataSet(selector.name)] = {};
				}
				// Call the method for create objects like _powerMenu with the node elements in tempSelectors
				// uses an underline plus the camelCase selector to call _powerMenu or other similar method on 'this'
				// E.G. 1, this.powerCss.powerMenu.topmenu = this._powerMenu(topmenuElement);
				// E.G. 2, this.powerCss.powerMenu.topmenu = this._powerMenu(tempSelectors.powerCss.powerMenu.topmenu);
				// E.G. 3, this.powerCss[powerMenu][topmenu] = this[_powerMenu](tempSelectors.powerCss[powerMenu][topmenu]);
				this.powerCss[asDataSet(selector.name)][id] = this[`_${asDataSet(selector.name)}`](tempSelectors.powerCss[asDataSet(selector.name)][id]);
			}
		}

		// Create the pow-attrs object elements
		for (const selector of _powerCssConfig) {
			for (const id in tempSelectors.powerCss[asDataSet(selector.name)]) {
				if (!this.powerCss[asDataSet(selector.name)]) {
					this.powerCss[asDataSet(selector.name)] = {};
				}
				// Call the method for create objects like _powerMenu with the node elements in tempSelectors
				// uses an underline plus the camelCase selector to call _powerMenu or other similar method on 'this'
				// E.G. 1, this.powerCss.powerMenu.topmenu = this._powerMenu(topmenuElement);
				// E.G. 2, this.powerCss.powerMenu.topmenu = this._powerMenu(tempSelectors.powerCss.powerMenu.topmenu);
				// E.G. 3, this.powerCss[powerMenu][topmenu] = this[_powerMenu](tempSelectors.powerCss[powerMenu][topmenu]);
				this.powerCss[asDataSet(selector.name)][id] = this[`_${asDataSet(selector.name)}`](tempSelectors.powerCss[asDataSet(selector.name)][id]);
			}
		}

		window.console.log('Unique', Unique.domID());
		window.console.log('tempSelectors', tempSelectors);
		window.console.log('PowerDOM', this);
	}

	_powerMenu(element) {
		return new PowerMenu(element);
	}

	_powerMain(element) { // TODO need classes?
		return new _PowerBasicElement(element);
	}

	_powerBrand(element) {
		return new PowerBrand(element);
	}

	_powerHeading(element) {
		return new PowerHeading(element);
	}

	_powerItem(element) {
		return new PowerItem(element);
	}

	_powerLink(element) { // TODO need classes?
		return new _PowerBasicElement(element);
	}

	_powerStatus(element) { // TODO need classes?
		return new _PowerBasicElement(element);
	}

	_powerIcon(element) { // TODO need classes?
		return new _PowerBasicElement(element);
	}

	_buildPorwerSelectors(currentNode, ctx) {
		// Check if has the custom data-pwc and data-pow attributes
		if (currentNode.dataset) {
			for (const data in currentNode.dataset) {
				for(const prefixe of ['pwc', 'pow']) {
					const hasPrefixe = data.startsWith(prefixe);
					if (hasPrefixe) {
						const attributeName = `${prefixe}Attrs`; // pwcAttrs or powAttrs
						const currentId = getIdAndCreateIfDontHave(currentNode);
						if (!ctx[attributeName][data]) {
							ctx[attributeName][data] = {};
						}
						ctx[attributeName][data][currentId] = currentNode;
					}
				}
			}
		}
		// Check for power css class selectors
		if (currentNode.className && currentNode.className.includes('power-')) {
			for (const selector of _powerCssConfig) {
				if (currentNode.className.includes(selector.name)) {
					const currentId = getIdAndCreateIfDontHave(currentNode);
					if (!ctx.powerCss[asDataSet(selector.name)]) {
						ctx.powerCss[asDataSet(selector.name)] = {};
					}
					ctx.powerCss[asDataSet(selector.name)][currentId] = currentNode;
				}
			}
		}
	}

	// Sweep through each node and pass the node to the callback
	sweepDOM(entryNode, ctx, callback) {
		const isNode = !!entryNode && !!entryNode.nodeType;
		const hasChildren = !!entryNode.childNodes && !!entryNode.childNodes.length;

		if (isNode && hasChildren) {
			const nodes = entryNode.childNodes;
			for (let i=0; i < nodes.length; i++) {
				const currentNode = nodes[i];
				const currentNodeHasChindren = !!currentNode.childNodes && !!currentNode.childNodes.length;

				// Call back with the condition to apply any condition
				callback(currentNode, ctx);

				if(currentNodeHasChindren) {
					// Recursively sweep through currentNode children
					this.sweepDOM(currentNode, ctx, callback);
				}
			}
		}
	}
}


const Unique = { // produce unique IDs
	n: 0,
	next: () => ++Unique.n,
	domID: (tagName) => `_pow${tagName ? '_' + tagName : 'er'}_${Unique.next()}`,
};


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
		this.powerDOM = new PowerDOM();
		this.menus = this.newPowerMenus();
		this.ui = {};
		this.truth = {};

		// Set data-pow-css-default for all _pwAttrsConfig
		for (const item of _pwAttrsConfig) {
			// Set data-pow-css-default if have some data-pow-selector
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

		// // Add all the listners
		// for (const config of _pwAttrsConfig) {
		// 	if (config.context === 'main') {
		// 		this._addPowerBlockMainPwHoverListners(config, main, this);
		// 	} else {
		// 		this._addPowerBlockPwHoverListners(config, this);
		// 	}
		// }
	}

	// // THIS
	// // Add pw-default attribute and addEventListener if there is pw hover selector like data-pow-src-hover
	// _addPowerBlockPwHoverListners(config, ctx) {
	// 	// Check if children have elements with the pw-selector, or it the element it self has it
	// 	if (ctx.element.querySelectorAll(`[${config.selector}]`).length || ctx.element.getAttribute(config.selector)) {
	// 		ctx.addEventListener("mouseover", function() {
	// 			if (!ctx._hover) {
	// 				ctx._changeNodes(config.selector, config.attribute, config.callback || null);
	// 				ctx._hover = true;
	// 			}
	// 		}, false);
	// 		ctx.addEventListener("mouseout", function() {
	// 			if (ctx._hover) {
	// 				ctx._changeNodes(config.defaultSelector, config.attribute);
	// 				ctx._hover = false;
	// 			}
	// 		}, false);
	// 	}
	// }

	// // MAIN
	// // Add addEventListener if there is main and pw hover selector like data-pow-main-src-hover
	// _addPowerBlockMainPwHoverListners(config, main, ctx) {
	// 	// Get only elements with the pw-selector
	// 	if (main && ctx.element.querySelectorAll(`[${config.selector}]`).length || ctx.element.getAttribute(config.selector)) {
	// 		main.addEventListener("mouseover", function() {
	// 			if (ctx._hover === false) {
	// 				ctx._changeNodes(config.selector, config.attribute, config.callback || null);
	// 			}
	// 		}, false);
	// 		main.addEventListener("mouseout", function() {
	// 			if (ctx._hover === false) {
	// 				ctx._changeNodes(config.defaultSelector, config.attribute);
	// 			}
	// 		}, false);
	// 	}
	// }

	// // If have pw-selectors it replaces the default values with the data in the pw-selector
	// _changeNodes(selector, attribute, callback) {
	// 	// Change the element it self if have the selector
	// 	const selectorValue = this.element.getAttribute(selector);
	// 	if (selectorValue) {
	// 		// Replace the attribute value with the data in the selector
	// 		this.element[attribute] = callback ? callback(this.element, selectorValue) : selectorValue;
	// 	}
	// 	// Change any children currentNode
	// 	const nodes = this.element.querySelectorAll(`[${selector}]`);
	// 	if (nodes.length > 0) {
	// 		for (let index = 0; nodes.length != index; index++) {
	// 			const selectorValue = nodes[index].getAttribute(selector);
	// 			if (selectorValue) {
	// 				// Replace the attribute value with the data in the selector
	// 				nodes[index][attribute] = callback ? callback(nodes[index], selectorValue) : selectorValue;
	// 			}
	// 		}
	// 	}
	// }

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
		// the label is the innerText of the menu item or
		// children element with 'power-label' class selector
		// If there is no 'power-label' class, assume the label is this.element.innerText
		return this.element.className.includes('power-label') ?
			this.element.innerText : (labelElements[0] ? labelElements[0].innerText : this.element.innerText);
	}

	set label(label) {
		const labelElements = this.element.getElementsByClassName('power-label');
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
	constructor(element, main) {
		super(element, main);
		const statusSelector = 'power-status';
	}

	get status() {
		const selector = 'power-status';
		const elements = this.element.getElementsByClassName(selector);
		return elements[0] || null;
	}
}


class PowerBrand extends _PowerLinkElement {
	constructor(element, main) {
		super(element, main);
		this.id = this.element.getAttribute('id');
		const self = this;
		// main._mouseover.subscribe(function (ctx) {
		// 	console.log('Ouvindo', self.id, ctx.id);
		// });
	}
}


class PowerMenu {
	constructor(menu) {
		this.element = menu;
		this.items = [];
		this.itemsById = {};
		this.headings = [];
		this.headingsById = {};
		this.id = this.element.getAttribute('id');
		this._mouseover = new Event(this.id);

		const ctx = this;
		this.addEventListener('mouseover', function() {
			ctx._mouseover.broadcast(ctx);
		}, false);

		this._mouseover.subscribe(function (ctx) {
			console.log('aaa', ctx.id, ctx.id);
		});

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
	const brand = app.menus.blockById('first-brand').element;
	window.console.log('brand', brand);
	window.console.log('brand p1', brand.parentElement);
	window.console.log('brand p2', brand.parentElement.parentElement);
	window.console.log('document', document.getElementsByClassName('power-p')[0]);
	const originalElement = document.getElementsByClassName('power-p')[0];
	let element = originalElement.parentElement;
	let found = false;
	while (!found) {
		if (element.className.includes('power-main')) {
			console.log('Main is: ', element);
			found = true;
		} else {
			element = element.parentElement;
			if (!element) {
				console.log('The element has no Main: ', originalElement);
				found = true;
			}
		}
	}
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
