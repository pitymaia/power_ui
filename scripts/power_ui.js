// Layout, design and user interface framework in ES6
'use strict';


function _getId(ctx) {
	return ctx.element.getAttribute('id') || null;
}

function _setId(ctx, id) {
	ctx.element.setAttribute('id', id);
}

function getIdAndCreateIfDontHave(currentNode) {
	let currentId = currentNode.getAttribute('id');
	if (!currentId) {
		currentId = _Unique.domID(currentNode.tagName.toLowerCase());
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

function powerClassAsCamelCase(className) {
	return `${className.split('-')[0]}${className.split('-')[1].charAt(0).toUpperCase()}${className.split('-')[1].slice(1)}`;
}


// Abstract class to create any power elements
class _PowerBasicElement {
	constructor(element) {
		this.element = element;
		this._$pwHover = false;
	}

	get id() {
		return _getId(this);
	}

	set id(id) {
		_setId(this, id);
	}
}


class _PwBasicEvents extends _PowerBasicElement {
	constructor(element) {
		super(element);
		this._events = {};

	}

	subscribe({event, fn, useCapture=false, ...params}) {
		const ctx = this;
		if (!this._events[event]) {
			this._events[event] = new Event(this.id);
			this.addEventListener(event, function(domEvent) {
				ctx._events[event].broadcast(ctx, domEvent, params);
			}, useCapture || false);
		}

		this._events[event].subscribe(fn, ctx, params);
	}

	addEventListener(event, callback, useCapture) {
		this.element.addEventListener(event, callback, useCapture);
	}
}


class _basicPwHover extends _PwBasicEvents {
	constructor(element) {
		super(element);
		this._$pwActive = false;
	}

	init() {
		if (!this.$_pwDefaultValue) {
			this.$_pwDefaultValue =  this.element[this.$_target];
		}
		if (!this.$_pwHoverValue) {
			this.$_pwHoverValue = this.element.getAttribute(this.$_pwAttrName) || '';
		}

		this.subscribe({event: 'mouseover', fn: this.mouseover});
		this.subscribe({event: 'mouseout', fn: this.mouseout});
	}

	mouseover() {
		if (!this._$pwActive) {
			this.element[this.$_target] = this.$_pwHoverValue;
			this._$pwActive = true;
		}
	}

	mouseout() {
		if (this._$pwActive) {
			this.element[this.$_target] = this.$_pwDefaultValue || '';
			this._$pwActive = false;
		}
	}
}


class _basicPwMainHover extends _PwBasicEvents {
	constructor(element, target, pwAttrName) {
		super(element, target, pwAttrName);
	}

	init() {
		if (!this.$_pwDefaultValue) {
			this.$_pwDefaultValue =  this.element[this.$_target];
		}
		if (!this.$_pwHoverValue) {
			this.$_pwHoverValue = this.element.getAttribute(this.$_pwAttrName) || '';
		}

		this.subscribe({event: 'mouseover', fn: this.mouseover});
		this.subscribe({event: 'mouseout', fn: this.mouseout});
	}

	// Atach the listner to que main element
	addEventListener(event, callback, useCapture) {
		this.$pwMain.element.addEventListener(event, callback, useCapture);
	}
	mouseover() {
		if (!this._$pwActive) {
			this.element[this.$_target] = this.$_pwHoverValue;
			this._$pwActive = true;
		}
	}

	mouseout() {
		if (this._$pwActive) {
			this.element[this.$_target] = this.$_pwDefaultValue || '';
			this._$pwActive = false;
		}
	}
}


class PowMainCssHover extends _basicPwMainHover {
	constructor(element) {
		console.log('main attr');
		super(element);
		this.$_pwAttrName = 'data-pow-main-css-hover';
		this.$_target = 'className';
	}
}


class PowCssHover extends _basicPwHover {
	constructor(element) {
		super(element);
		this.$_pwAttrName = 'data-pow-css-hover';
		this.$_target = 'className';
	}
}

class PowSrcHover extends _basicPwHover {
	constructor(element) {
		super(element);
		this.$_pwAttrName = 'data-pow-src-hover';
		this.$_target = 'src';
	}
}

// The list of pow-attributes with the callback to the classes
const _powAttrsConfig = [
	{name: 'data-pow-src-hover', attribute: 'src',
		callback: function(element) {return new PowSrcHover(element);} // TODO
	},
	{name: 'data-pow-main-src-hover', attribute: 'src', isMain: true,
		callback: function(element) {return new PowCssHover(element);} // TODO
	},
	{name: 'data-pow-css-hover', attribute: 'className',
		callback: function(element) {return new PowCssHover(element);}
	},
	{name: 'data-pow-main-css-hover', attribute: 'className', isMain: true,
		callback: function(element) {return new PowMainCssHover(element);} // TODO
	},
	{name: 'data-pow-css-hover-add', attribute: 'className',
		callback: function(element) {return new PowCssHover(element);} // TODO
	},
	{name: 'data-pow-main-css-hover-add', attribute: 'className', isMain: true,
		callback: function(element) {return new PowCssHover(element);} // TODO
	},
	{name: 'data-pow-css-hover-remove', attribute: 'className',
		callback: function(element) {return new PowCssHover(element);} // TODO
	},
	{name: 'data-pow-main-css-hover-remove', attribute: 'className', isMain: true,
		callback: function(element) {return new PowCssHover(element);} // TODO
	},
];

// The list for user custom pwc-attributes
const _pwcAttrsConfig = [];

// The list of power-css-selectors with the config to create the objetc
// The order here is important, keep it on an array
const _powerCssConfig = [
	{name: 'power-menu', isMain: true},
	{name: 'power-main', isMain: true},
	{name: 'power-brand'},
	{name: 'power-heading'},
	{name: 'power-item'},
	{name: 'power-link'},
	{name: 'power-status'},
	{name: 'power-icon'},
];


class PowerDOM {
	constructor($pwMain) {
		this.$pwMain = $pwMain;
		this.powerCss = {};
		this.powAttrs = {};
		this.pwcAttrs = {};
		this.allPwElementsById = {};

		const tempSelectors = {
			powerCss: {},
			powAttrs: {},
			pwcAttrs: {},
		};

		this.sweepDOM(document, tempSelectors, this._buildTempPowerTree);

		// Create the power-css object elements
		for (const attribute in tempSelectors) {
			for (const selector of _powerCssConfig) {
				this._buildObjcsFromTempSelectors(this, attribute, selector, tempSelectors);
			}

			for (const selector of _powAttrsConfig) {
				this._buildObjcsFromTempSelectors(this, attribute, selector, tempSelectors);
			}

			for (const selector of _pwcAttrsConfig) {
				this._buildObjcsFromTempSelectors(this, attribute, selector, tempSelectors);
			}
		}

		this._linkMainClassAndPowAttrs();
		this._addSiblings();
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

	_getMainElementFromChildElement(id, childElement) {
		let mainElement  = this._findMainElementIfHave(childElement);
		if (mainElement) {
			return mainElement;
		}
	}

	_findMainElementIfHave(originalElement) {
		let element = originalElement.parentElement;
		let stop = false;
		while (!stop) {
			if (element && element.className) {
				for (const cssSelector of _powerCssConfig.filter(s => s.isMain === true)) {
					if (element.className.includes(cssSelector.name)) {
						stop = true;
					}
				}
			}
			// Don't let go to parentElement if already found and heve the variable 'stop' as true
			// Only select the parentElement if has element but don't found the main class selector
			if (element && !stop) {
				element = element.parentElement;
			} else {
				// If there is no more element set stop
				stop = true;
			}
		}
		return element || null;
	}

	_callInit() {
		for (const id in this.allPwElementsById) {
			// Call init for all elements
			for (const attr in this.allPwElementsById[id]) {
				if (this.allPwElementsById[id][attr].init) {
					this.allPwElementsById[id][attr].init();
				}
			}
		}
	}

	// Register siblings elements and call init()
	_addSiblings() {
		for (const id in this.allPwElementsById) {
			// if Object.keys(obj).length add the siblings for each objects
			// Also call init(if true or else)
			if (Object.keys(this.allPwElementsById[id]).length > 1) {
				for (const attr in this.allPwElementsById[id]) {
					if (!this.allPwElementsById[id][attr].siblings) {
						this.allPwElementsById[id][attr].siblings = {};
					}
					// To avoid add this element as a sibling of it self we need iterate over attrs again
					for (const siblingAttr in this.allPwElementsById[id]) {
						if (siblingAttr !== attr) {
							this.allPwElementsById[id][attr].siblings[siblingAttr] = this.allPwElementsById[id][siblingAttr];
						}
					}
				}
			}
		}
	}

	_linkMainClassAndPowAttrs() {
		// Loop through the list of possible attributes like data-pow-main-src-hover
		for (const item of _powAttrsConfig.filter(a => a.isMain === true)) {
			const powAttrsList = this.powAttrs[asDataSet(item.name)];
			// Loop through the list of existing powAttrs in dataset format like powMainSrcHover
			// Every element it found is the powerElement it needs find the correspondent main object
			for (const id in powAttrsList) {
				const currentPowElement = powAttrsList[id];
				// Get the simple DOM node main element  of the current powerElement object
				const mainElementCssSelector = this._getMainElementFromChildElement(id, currentPowElement.element);
				if (mainElementCssSelector) {
					// Loop through the list of possible main CSS class selectors like power-menu or power-main
					// With this we will find the main powerElement that holds the simple DOM node main element we have
					for (const cssSelector of _powerCssConfig.filter(a => a.isMain === true)) {
						if (this.powerCss[asDataSet(cssSelector.name)]) {
							// Get the powerElement using the simple DOM node main element (mainElementCssSelector)
							const mainPowerCssObj = this.powerCss[asDataSet(cssSelector.name)][mainElementCssSelector.getAttribute('id')];
							// If we found it let's go to associate the main with the child
							if(mainPowerCssObj) {
								// Add the main object into the child object
								currentPowElement.$pwMain = mainPowerCssObj;
								// create the obj to hold the children of dont have it
								if (mainPowerCssObj.childrenPowAttrs === undefined) {
									mainPowerCssObj.childrenPowAttrs = {};
								}
								// Add the child object into the main object
								// Organize it by attribute dataset name
								const datasetAttrName = asDataSet(currentPowElement.$_pwAttrName);
								if (!mainPowerCssObj.childrenPowAttrs[datasetAttrName]) {
									mainPowerCssObj.childrenPowAttrs[datasetAttrName] = {};
								}
								// Organize it by id inside attribute dataset name
								if (!mainPowerCssObj.childrenPowAttrs[datasetAttrName][currentPowElement.id]) {
									mainPowerCssObj.childrenPowAttrs[datasetAttrName][currentPowElement.id] = {};
								}
								mainPowerCssObj.childrenPowAttrs[datasetAttrName][currentPowElement.id] = currentPowElement;
							}
						}
					}
				}
			}
		}
	}

	// This creates the powerDOM tree with all the objects attached to the DOM
	// It uses the simple elements of _buildTempPowerTree to get only the power elements
	_buildObjcsFromTempSelectors(ctx, attribute, selector, tempSelectors) {
		const datasetKey = asDataSet(selector.name);
		const selectorsSubSet = tempSelectors[attribute][datasetKey];
		for (const id in selectorsSubSet) {
			if (!ctx[attribute][datasetKey]) {
				ctx[attribute][datasetKey] = {};
			}

			// If there is a method like power-menu (allow it to be extended) call the method like _powerMenu()
			// If is some pow-attribute or pwc-attribute use 'powerAttrs' flag to call some class using the callback
			const es6Class = !!ctx.$pwMain[`_${datasetKey}`] ? `_${datasetKey}` : 'powerAttrs';
			if (es6Class === 'powerAttrs') {
				// Add into a list ordered by attribute name
				ctx[attribute][datasetKey][id] = selector.callback(selectorsSubSet[id]);
			} else {
				// Call the method for create objects like _powerMenu with the node elements in tempSelectors
				// uses an underline plus the camelCase selector to call _powerMenu or other similar method on 'ctx'
				// E. G. , ctx.powerCss.powerMenu.topmenu = ctx.$pwMain._powerMenu(topmenuElement);
				ctx[attribute][datasetKey][id] = ctx.$pwMain[es6Class](selectorsSubSet[id]);
			}
			// Add the same element into a list ordered by id
			if (!ctx.allPwElementsById[id]) {
				ctx.allPwElementsById[id] = {};
			}
			ctx.allPwElementsById[id][datasetKey] = ctx[attribute][datasetKey][id];
			// Add to any element some desired variables
			ctx.allPwElementsById[id][datasetKey]._id = id;
			ctx.allPwElementsById[id][datasetKey].$_pwDatasetName = datasetKey;
		}
	}

	// Thist create a temp tree with simple DOM elements that contais 'pwc', 'pow' and 'power-' prefixes
	_buildTempPowerTree(currentNode, ctx) {
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
}


const _Unique = { // produce unique IDs
	n: 0,
	next: () => ++_Unique.n,
	domID: (tagName) => `_pow${tagName ? '_' + tagName : 'er'}_${_Unique.next()}`,
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

	_powerAttrs(element) {
		return new []
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
		// $pwMain._mouseover.subscribe(function (ctx) {
		// 	console.log('Ouvindo', self.id, ctx.id);
		// });
	}
}


class PowerMenu {
	constructor(menu, $pwRoot) {
		this.$pwRoot = $pwRoot;
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
				this[keyName][element.id] = this.$pwRoot.powerDOM.powerCss[camelCaseName][element.id];
			}
		}
	}

	get id() {
		return _getId(this);
	}

	set id(id) {
		_setId(this, id);
	}

	// blockById(id) {
	// 	return _menuBlockById(id, this);
	// }
}


class PwcPity extends PowCssHover {
	constructor(element) {
		super(element);
		this.$_pwAttrName = 'data-pwc-pity';
		this.element = element;
		console.log('pwcPity is live!', this.$_pwAttrName);
	}
}
const inject = [{name: 'data-pwc-pity', obj: PwcPity}];
// TODO: testeExtendName is to find a way to modularize multiple exstensions
// Make a way to this works as links of a chain
// const testeExtendName = function () {return PowerMenu;};
// class TesteMenu extends testeExtendName {
// 	constructor(menu, info) {
// 		super(menu);
// 		this.testMenu = true;
// 		this.descri = info.descri;
// 	}
// }

// class TesteUi extends PowerUi {
// 	constructor() {
// 		super(inject);
// 		this.fake = {};
// 	}
// 	newPowerMenu(menu) {
// 		const info = {descri: 'Descrição do menu'};
// 		return new TesteMenu(menu, info);
// 	}
// }
// let app = new TesteUi(inject);
let app = new PowerUi(inject);

function changeMenu() {

}

function showMenuLabel() {

}

window.console.log('power', app);
