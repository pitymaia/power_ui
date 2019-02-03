// Layout, design and user interface framework in ES6
'use strict';

function splitStringWithUrl(string) {
	const expression = new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\b[.:][a-z0-9@:%_\+.~#?&//=]{2,256}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi);
	// Hold all the matched URLs
	const urls = string.match(expression) || [];
	const finalUrls = [];
	// The final parts to return
	const stringParts = [];
	if (urls.length) {
		// Create the url list of dicts with the href with http://
		for (let count = 0; count < urls.length; count++) {
			let newUrl = urls[count];
			if (!newUrl.includes('http://') && !newUrl.includes('https://')) {
				newUrl = `http:\/\/${newUrl}`;
			}
			finalUrls.push({string: urls[count], href: newUrl});

			string = string.replace(urls[count], '«url»');
		}
		// Hold all string parts without URLs
		const splitedString = string.split('«url»');
		// Create the final array with all url parts with the flag isUrl = true
		for (let count = 0; count < splitedString.length; count++) {
			// If item is undefined replace it with the URL
			if (splitedString[count]) {
				stringParts.push({string: splitedString[count]});
			}

			if (finalUrls[0]) {
				stringParts.push(finalUrls[0]);
				// Remove this url from array
				finalUrls.shift();
			}
		}
		return stringParts;
	} else {
		return [{string: string}];
	}
}

function getIdAndCreateIfDontHave(currentNode) {
	let currentId = currentNode.id;
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


// Abstract class to create any power elements
class _PowerBasicElement {
	constructor(element) {
		this.element = element;
		this._$pwActive = false;
	}

	get id() {
		return this.element.id || null;
	}

	set id(id) {
		this.element.id = id;
	}
}


class _PowerBasicElementWithEvents extends _PowerBasicElement {
	constructor(element) {
		super(element);
		this._events = {};

	}

	// // This is the normal subscribe for custom events
	// // If the event doesn't exists create it and subscribe
	// // If it already exists just subscribe
	// subscribe({event, fn, useCapture=false, ...params}) {
	// 	const ctx = this;
	// 	// Create the event
	// 	if (!this._events[event]) {
	// 		this._events[event] = new Event(this.id);
	// 	}
	// 	// Subscribe to the element
	// 	this._events[event].subscribe(fn, ctx, params);
	// }

	// This is a subscribe for native envents that broadcast when the event is dispached
	// If the event doesn't exists create it and subscribe
	// If it already exists just subscribe
	subscribe({event, fn, useCapture=false, ...params}) {
		const ctx = this;
		// Create the event
		if (!this._events[event]) {
			this._events[event] = new Event(this.id);
			// This is the listener/broadcast for the native events
			this.addEventListener(event, function(domEvent) {
				ctx._events[event].broadcast(ctx, domEvent, params);
			}, useCapture);
		}
		// Subscribe to the element
		this._events[event].subscribe(fn, ctx, params);
	}

	addEventListener(event, callback, useCapture=false) {
		this.element.addEventListener(event, callback, useCapture);
	}
}


// The list for user custom pwc-attributes
const _pwcAttrsConfig = [];

// The list of pow-attributes with the callback to the classes
const _powAttrsConfig = [
	{name: 'data-pow-src-hover',
		callback: function(element) {return new PowSrcHover(element);}
	},
	{name: 'data-pow-main-src-hover', isMain: true,
		callback: function(element) {return new PowMainSrcHover(element);}
	},
	{name: 'data-pow-css-hover',
		callback: function(element) {return new PowCssHover(element);}
	},
	{name: 'data-pow-main-css-hover', isMain: true,
		callback: function(element) {return new PowMainCssHover(element);}
	},
	{name: 'data-pow-css-hover-remove',
		callback: function(element) {return new PowCssHoverRemove(element);}
	},
	{name: 'data-pow-main-css-hover-remove', isMain: true,
		callback: function(element) {return new PowMainCssHoverRemove(element);}
	},
];

// The list of power-css-selectors with the config to create the objetc
// The order here is important, keep it on an array
const _powerCssConfig = [
	{name: 'power-menu', isMain: true},
	{name: 'power-main', isMain: true},
	{name: 'power-brand'},
	{name: 'power-item'},
	{name: 'power-action'},
	{name: 'power-toggle'},
	{name: 'power-dropdown'},
	{name: 'power-status'},
];


class PowerDOM {
	constructor($powerUi) {
		this.$powerUi = $powerUi;
		this.powerCss = {};
		this.powAttrs = {};
		this.pwcAttrs = {};
		this.allPowerObjsById = {};

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
		for (const id in this.allPowerObjsById) {
			// Call init for all elements
			for (const attr in this.allPowerObjsById[id]) {
				if (this.allPowerObjsById[id][attr].init) {
					this.allPowerObjsById[id][attr].init();
				}
			}
		}
	}

	// Register siblings elements and call init()
	_addSiblings() {
		for (const id in this.allPowerObjsById) {
			// if Object.keys(obj).length add the siblings for each objects
			// Also call init(if true or else)
			if (Object.keys(this.allPowerObjsById[id]).length > 1) {
				for (const attr in this.allPowerObjsById[id]) {
					// Don't add siblings to $shared
					if (attr != '$shared') {
						if (!this.allPowerObjsById[id][attr].siblings) {
							this.allPowerObjsById[id][attr].siblings = {};
						}
						// To avoid add this element as a sibling of it self we need iterate over attrs again
						for (const siblingAttr in this.allPowerObjsById[id]) {
							// Also don't add $shared siblings
							if (siblingAttr !== attr && siblingAttr != '$shared') {
								this.allPowerObjsById[id][attr].siblings[siblingAttr] = this.allPowerObjsById[id][siblingAttr];
							}
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
								// create the obj to hold the children if dont have it
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
			const es6Class = !!ctx.$powerUi[`_${datasetKey}`] ? `_${datasetKey}` : 'powerAttrs';
			if (es6Class === 'powerAttrs') {
				// Add into a list ordered by attribute name
				ctx[attribute][datasetKey][id] = selector.callback(selectorsSubSet[id]);
			} else {
				// Call the method for create objects like _powerMenu with the node elements in tempSelectors
				// uses an underline plus the camelCase selector to call _powerMenu or other similar method on 'ctx'
				// E. G. , ctx.powerCss.powerMenu.topmenu = ctx.$powerUi._powerMenu(topmenuElement);
				ctx[attribute][datasetKey][id] = ctx.$powerUi[es6Class](selectorsSubSet[id]);
			}
			// Add the same element into a list ordered by id
			if (!ctx.allPowerObjsById[id]) {
				ctx.allPowerObjsById[id] = {};
			} else {
				const selectorToTest = document.querySelectorAll(`[id=${id}]`);
				if (selectorToTest.length > 1) {
					// Check if there is some duplicated ID
					console.error('DUPLICATED IDs:', selectorToTest);
					throw `HTML element can't have duplicated IDs: ${id}`;
				}
			}
			ctx.allPowerObjsById[id][datasetKey] = ctx[attribute][datasetKey][id];
			// Add to any element some desired variables
			ctx.allPowerObjsById[id][datasetKey]._id = id;
			ctx.allPowerObjsById[id][datasetKey].$_pwName = datasetKey;
			ctx.allPowerObjsById[id][datasetKey].$powerUi = ctx.$powerUi;
			// Create a $shared scope for each element
			if (!ctx.allPowerObjsById[id].$shared) {
				ctx.allPowerObjsById[id].$shared = {};
			}
			// add the shered scope to all elements
			ctx.allPowerObjsById[id][datasetKey].$shared = ctx.allPowerObjsById[id].$shared;
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
		// Check for power css class selectors like "power-menu" or "power-label"
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

// Replace a value form an attribute when is mouseover some element and undo on mouseout
class _pwBasicHover extends _PowerBasicElementWithEvents {
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
		if (!this._$pwActive && !this.$shared._priorityActive) {
			this.element[this.$_target] = this.$_pwHoverValue;
			this._$pwActive = true;
			// This flag allows hover attrs have priority over attrs like the main attrs
			this.$shared._priorityActive = true;
		}
	}

	mouseout() {
		if (this._$pwActive) {
			this.element[this.$_target] = this.$_pwDefaultValue || '';
			this._$pwActive = false;
			this.$shared._priorityActive = false;
		}
	}
}


// Replace a value form an attribute when is mouseover some MAIN element and undo on mouseout
class _pwMainBasicHover extends _pwBasicHover {
	constructor(element, target, pwAttrName) {
		super(element, target, pwAttrName);
	}

	// Atach the listner/Event to que main element
	addEventListener(event, callback, useCapture) {
		this.$pwMain.element.addEventListener(event, callback, useCapture);
	}
}


// Add to some element a list of CSS classes selectors when is mouseover some element and remove it on mouseout
class PowCssHover extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);
		this._$pwActive = false;
		this.$_pwAttrName = 'data-pow-css-hover';
	}

	init() {
		if (!this.$_pwHoverValues) {
			this.$_pwHoverValues = this.element.getAttribute(this.$_pwAttrName).split(' ') || [];
		}
		this.subscribe({event: 'mouseover', fn: this.mouseover});
		this.subscribe({event: 'mouseout', fn: this.mouseout});
	}

	mouseover() {
		if (!this._$pwActive && !this.$shared._priorityActive) {
			// Add all CSS selector on list
			for (const css of this.$_pwHoverValues) {
				this.element.classList.add(css);
			}
			this._$pwActive = true;
			// This flag allows hover attrs have priority over attrs like the main attrs
			this.$shared._priorityActive = true;
		}
	}

	mouseout() {
		if (this._$pwActive) {
			// Remove the added classes
			for (const css of this.$_pwHoverValues) {
				this.element.classList.remove(css);
			}
			this._$pwActive = false;
			this.$shared._priorityActive = false;
		}
	}
}


// Add to some element a list of CSS classes selectors when is mouseover some MAIN element and remove it on mouseout
class PowMainCssHover extends PowCssHover {
	constructor(element) {
		super(element);
		this.$_pwAttrName = 'data-pow-main-css-hover';
	}

	mouseover() {
		if (!this._$pwActive && !this.$shared._priorityActive) {
			// Add all CSS selector on list
			for (const css of this.$_pwHoverValues) {
				this.element.classList.add(css);
			}
			this._$pwActive = true;
		}
	}

	mouseout() {
		if (this._$pwActive) {
			this._$pwActive = false;
			// Remove the added classes
			for (const css of this.$_pwHoverValues) {
				this.element.classList.remove(css);
			}
		}
	}

	// Atach the listner/Event to que main element
	addEventListener(event, callback, useCapture) {
		this.$pwMain.element.addEventListener(event, callback, useCapture);
	}
}


// Replace the value of 'src' attribute when is mouseover some element and undo on mouseout
class PowSrcHover extends _pwBasicHover {
	constructor(element) {
		super(element);
		this.$_pwAttrName = 'data-pow-src-hover';
		this.$_target = 'src';
	}
}


// Replace the value of 'src' attribute when is mouseover some MAIN element and undo on mouseout
class PowMainSrcHover extends _pwMainBasicHover {
	constructor(element) {
		super(element);
		this.$_pwAttrName = 'data-pow-main-src-hover';
		this.$_target = 'src';
	}
}


// Remove the a CSS list when mouseover some element and undo on mouseout
class PowCssHoverRemove extends PowCssHover {
	constructor(element) {
		super(element);
		this.$_pwAttrName = 'data-pow-css-hover-remove';
	}

	mouseover() {
		if (!this._$pwActive) {
			for (const css of this.$_pwHoverValues) {
				this.element.classList.remove(css);
			}
			this._$pwActive = true;
			this.$shared._priorityActive = true;
		}
	}
	mouseout() {
		if (this._$pwActive) {
			for (const css of this.$_pwHoverValues) {
				this.element.classList.add(css);
			}
			this._$pwActive = false;
			this.$shared._priorityActive = false;
		}
	}
}


// Remove the a CSS list when mouseover some MAIN element and undo on mouseout
class PowMainCssHoverRemove extends PowMainCssHover {
	constructor(element) {
		super(element);
		this.$_pwAttrName = 'data-pow-main-css-hover-remove';
	}

	mouseover() {
		if (!this._$pwActive && !this.$shared._priorityActive) {
			for (const css of this.$_pwHoverValues) {
				this.element.classList.remove(css);
			}
			this._$pwActive = true;
		}
	}
	mouseout() {
		if (this._$pwActive && !this.$shared._priorityActive) {
			for (const css of this.$_pwHoverValues) {
				this.element.classList.add(css);
			}
			this._$pwActive = false;
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
		return parseInt(styles.left.split('px')[0] || 0) + parseInt(styles['margin-left'].split('px')[0] || 0) + parseInt(styles['border-width'].split('px')[0] || 0);
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

function powerOnly() {
	window.location.href = '/power_only.html';
}
function gotoIndex() {
	window.location.href = '/';
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
//  constructor(menu, info) {
//      super(menu);
//      this.testMenu = true;
//      this.descri = info.descri;
//  }
// }

// class TesteUi extends PowerUi {
//  constructor() {
//      super(inject);
//      this.fake = {};
//  }
//  newPowerMenu(menu) {
//      const info = {descri: 'Descrição do menu'};
//      return new TesteMenu(menu, info);
//  }
// }
// let app = new TesteUi(inject);
let app = new PowerUi(inject);

if (app.powerDOM.allPowerObjsById['even-more']) {
	app.powerDOM.allPowerObjsById['even-more'].powerAction.subscribe({event: 'click', fn: function () {
		console.log('Clicou', this);
	}});
}
window.console.log('power', app, app.powerDOM.allPowerObjsById['even-more']);