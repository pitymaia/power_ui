// Layout, design and user interface framework in ES6
'use strict';

function splitStringWithUrl(string) {
	const expression = new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\b[.:][a-z0-9@:%_\+.~#?&//=]{2,256}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi);
	// Hold all the matched URLs
	const urls = string ? string.match(expression) || [] : [];
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

// Abstract Power UI Base class
class _PowerUiBase {
	_createPowerTree() {
		this.powerTree = new PowerTree(this, _PowerUiBase);
	}
}
// The list of pow-attributes with the callback to the classes
_PowerUiBase._powAttrsConfig = [];
_PowerUiBase.injectPow = function (powAttr) {
	_PowerUiBase._powAttrsConfig.push(powAttr);
};
// The list for user custom pwc-attributes
_PowerUiBase._pwcAttrsConfig = [];
_PowerUiBase.injectPwc = function (pwcAttr) {
	_PowerUiBase._pwcAttrsConfig.push(pwcAttr);
};
// The list of power-css-selectors with the config to create the objetc
// Keep main elements on top of list
_PowerUiBase._powerCssConfig = [];
_PowerUiBase.injectPowerCss = function (powerCss) {
	if (powerCss.isMain) {
		_PowerUiBase._powerCssConfig.unshift(powerCss);
	} else {
		_PowerUiBase._powerCssConfig.push(powerCss);
	}
};


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

	subscribe(fn, ctx, params) { // *ctx* is what *this* will be inside *fn*.
		this.observers.push({fn, ctx, arguments});
	}

	unsubscribe(fn) {
		this.observers = this.observers.filter((x) => x.fn !== fn);
	}

	broadcast() { // Accepts arguments.
		for (const o of this.observers) {
			o.fn.apply(o.ctx, o.arguments);
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
		// The Events list
		this._events = {};
		// Hold custom events to dispatch
		this._DOMEvents = {};
		// Hold the function to allow remove listeners with the same funciont signature
		this._events_fn = {};
	}

	// All elements have a toggle event that toggle the _$pwActive status
	toggle() {
		this._$pwActive = !this._$pwActive;
		this.broadcast('toggle', true);
	}

	// This is a subscribe for native and custom envents that broadcast when the event is dispached
	// If the event doesn't exists create it and subscribe, if it already exists just subscribe
	subscribe({event, fn, useCapture=true, ...params}) {
		const ctx = this;
		// Create the event
		if (!this._events[event]) {
			this._events[event] = new Event(this.id);

		 	// Only creates if not exists
			if (!this._DOMEvents[event]) {
				this._DOMEvents[event] = new CustomEvent(event, {bubbles: useCapture});
			}
			// Register the function to have the signature to allow remove the listner
			this._events_fn[event] = function(domEvent) {
				ctx._events[event].broadcast(ctx, domEvent, params);
			}
			// This is the listener/broadcast for the native and custom events
			this.addEventListener(event, this._events_fn[event], useCapture);
		}
		// Subscribe to the element
		this._events[event].subscribe(fn, ctx, params);
	}

	unsubscribe({event, fn, useCapture=true, ...params}) {
		if (this._events[event]) {
			// Unsubscribe the element
			this._events[event].unsubscribe(fn);
			if (this._events[event].observers.length === 0) {
				delete this._events[event];
				// If is the last subscriber remove the event and the listener
				this.removeEventListener(event, this._events_fn[event], useCapture);
			}
		}
	}
	// FIX dispatch and the full events system...
	broadcast(eventName, alreadyDispatched) {
		// If the custom event not already called its method
		if (typeof document.body[eventName] === "undefined" && !alreadyDispatched) {
			// Dispatch the DOM event or a class event
			if (this._DOMEvents[eventName]) {
				this.element.dispatchEvent(this._DOMEvents[eventName]);
			}
			// If is a custom event with a method, the broadcast call it
			this.dispatch(eventName);
		} else if (this._DOMEvents[eventName]) {
			this.element.dispatchEvent(this._DOMEvents[eventName]);
		}
	}

	// Run custom events methods when calls the broadcast
	dispatch(eventName) {
		// Only call if a method with the event name exists
		if (this[eventName]) {
			this[eventName]();
		}
	}

	addEventListener(event, callback, useCapture=false) {
		this.element.addEventListener(event, callback, useCapture);
	}

	removeEventListener(event, callback, useCapture=false) {
		this.element.removeEventListener(event, callback, useCapture);
	}
}


class PowerTarget extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);
		this.powerTarget = true;
	}
}


class PowerTree {
	constructor($powerUi, PowerUi) {
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
			for (const selector of PowerUi._powerCssConfig) {
				this._buildObjcsFromTempSelectors(this, attribute, selector, tempSelectors);
			}

			for (const selector of PowerUi._powAttrsConfig) {
				this._buildObjcsFromTempSelectors(this, attribute, selector, tempSelectors);
			}

			for (const selector of PowerUi._pwcAttrsConfig) {
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
				for (const cssSelector of PowerUi._powerCssConfig.filter(s => s.isMain === true)) {
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
		for (const item of PowerUi._powAttrsConfig.filter(a => a.isMain === true)) {
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
					for (const cssSelector of PowerUi._powerCssConfig.filter(a => a.isMain === true)) {
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

	// This creates the powerTree tree with all the objects attached to the DOM
	// It uses the simple elements of _buildTempPowerTree to get only the power elements
	_buildObjcsFromTempSelectors(ctx, attribute, selector, tempSelectors) {
		const datasetKey = asDataSet(selector.name);
		const selectorsSubSet = tempSelectors[attribute][datasetKey];
		if (selectorsSubSet) {
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
				ctx.allPowerObjsById[id][datasetKey].id = id;
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
			for (const selector of PowerUi._powerCssConfig) {
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
		if (!this._$pwActive) {
			this.element[this.$_target] = this.$_pwHoverValue;
			this.toggle();
			// This flag allows hover attrs have priority over attrs like the main attrs
			this.$shared._priorityActive = true;
		}
	}

	mouseout() {
		if (this._$pwActive) {
			this.element[this.$_target] = this.$_pwDefaultValue || '';
			this.toggle();
			this.$shared._priorityActive = false;
		}
	}
}


// Replace a value form an attribute when is mouseover some MAIN element and undo on mouseout
class _pwMainBasicHover extends _pwBasicHover {
	constructor(element, target, pwAttrName) {
		super(element, target, pwAttrName);
	}

	mouseover() {
		if (!this._$pwActive && !this.$shared._priorityActive) {
			this.element[this.$_target] = this.$_pwHoverValue;
			this.toggle();
		}
	}

	mouseout() {
		if (this._$pwActive) {
			this.element[this.$_target] = this.$_pwDefaultValue || '';
			this.toggle();
		}
	}

	// Atach the listner/Event to que main element
	addEventListener(event, callback, useCapture) {
		// this.$pwMain.element.addEventListener(event, callback, useCapture);
		this.$pwMain.subscribe({event: event, fn: callback, useCapture: useCapture});
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
			this.toggle();
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
			this.toggle();
			this.$shared._priorityActive = false;
		}
	}
}
// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-css-hover',
	callback: function(element) {return new PowCssHover(element);}
});


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
			this.toggle();
		}
	}

	mouseout() {
		if (this._$pwActive) {
			this.toggle();
			// Remove the added classes
			for (const css of this.$_pwHoverValues) {
				this.element.classList.remove(css);
			}
		}
	}

	// Atach the listner/Event to que main element
	addEventListener(event, callback, useCapture) {
		// this.$pwMain.element.addEventListener(event, callback, useCapture);
		this.$pwMain.subscribe({event: event, fn: callback, useCapture: useCapture});
	}

}
// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-main-css-hover', isMain: true,
	callback: function(element) {return new PowMainCssHover(element);}
});


// Replace the value of 'src' attribute when is mouseover some element and undo on mouseout
class PowSrcHover extends _pwBasicHover {
	constructor(element) {
		super(element);
		this.$_pwAttrName = 'data-pow-src-hover';
		this.$_target = 'src';
	}
}
// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-src-hover',
	callback: function(element) {return new PowSrcHover(element);}
});


// Replace the value of 'src' attribute when is mouseover some MAIN element and undo on mouseout
class PowMainSrcHover extends _pwMainBasicHover {
	constructor(element) {
		super(element);
		this.$_pwAttrName = 'data-pow-main-src-hover';
		this.$_target = 'src';
	}
}
// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-main-src-hover', isMain: true,
	callback: function(element) {return new PowMainSrcHover(element);}
});


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
			this.toggle();
			this.$shared._priorityActive = true;
		}
	}
	mouseout() {
		if (this._$pwActive) {
			for (const css of this.$_pwHoverValues) {
				this.element.classList.add(css);
			}
			this.toggle();
			this.$shared._priorityActive = false;
		}
	}
}
// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-css-hover-remove',
	callback: function(element) {return new PowCssHoverRemove(element);}
});


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
			this.toggle();
		}
	}
	mouseout() {
		if (this._$pwActive && !this.$shared._priorityActive) {
			for (const css of this.$_pwHoverValues) {
				this.element.classList.add(css);
			}
			this.toggle();
		}
	}
}
// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-main-css-hover-remove', isMain: true,
	callback: function(element) {return new PowMainCssHoverRemove(element);}
});

// Set two objects: The Power dropmenus first level child elements, and all Power dropmenus child elements
function setAllChildElementsAndFirstLevelChildElements(targetElement, powerSelector, firstLevelElements, allChildPowerElements, ctx, allDropdowns) {
	const allChildElements = ctx.element.getElementsByClassName(targetElement);
	const allChildDropmenus = ctx.element.getElementsByClassName('power-dropmenu');
	// Hold the id of actions that belongs to children Power dropmenus
	const elementsIdsBlackList = [];
	for (const currentDropmenu of allChildDropmenus) {
		// Get all Power dropmenus if ask for it
		if (allDropdowns !== undefined) {
			allDropdowns.push(ctx.$powerUi.powerTree.powerCss.powerDropmenu[currentDropmenu.getAttribute('id')]);
		}
		const currentDropmenuActions = currentDropmenu.getElementsByClassName(targetElement);
		for (const currentElement of currentDropmenuActions) {
			// If not already in the black list add it
			if (!elementsIdsBlackList.includes(currentElement.id)) {
				elementsIdsBlackList.push(currentElement.id);
			}
		}
	}

	// Only select the power actions not black listed
	for (const currentElement of allChildElements) {
		if (!elementsIdsBlackList.includes(currentElement.id)) {
			firstLevelElements.push(ctx.$powerUi.powerTree.powerCss[powerSelector][currentElement.id]);
		} else {
			// Add all child elements
			allChildPowerElements.push(ctx.$powerUi.powerTree.powerCss[powerSelector][currentElement.id]);
		}
	}
}

// Define the powerDropmenus defaultPosition for all the child Power dropmenus
// The right-bottom is the standard position
function defineChildDropmenusPosition(self, powerElement) {
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

// Define the powerDropmenus defaultPosition for the first level Power dropmenus
// The right-bottom is the standard position
function defineFirstLevelDropmenusPosition(self, powerElement) {
	if (['right-bottom', 'bottom-right', 'left-bottom', 'bottom-left',
		'right-top', 'top-right', 'left-top', 'top-left'].includes(self.defaultPosition)) {
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


class KeyboardManager {
	constructor() {
		document.onkeydown = this.checkKey.bind(this);
		document.onkeyup = this.checkKey.bind(this);
	}

	checkKey(e) {
		e = e || window.event;
		console.log('e', e);
		// Turn keyboard mode off
		// ESC = 27
		if (e.keyCode === 27) {
			this._17 = false;
			this._48 = false;
			this.keyModeIsOn = false;
		}

		// Monitoring key down and key up
		if (e.type === 'keydown') {
			this[`_${e.keyCode}`] = true;
		} else {
			this[`_${e.keyCode}`] = false;
		}

		// Turn keyboard mode on
		// ctrl = 17, 0 = 48 (ctrl + 0)
		if (this._17 && this._48) {
			this.keyModeIsOn = true;
			window.alert('Keyboard mode');
		}
	}
}


class PowerUi extends _PowerUiBase {
	constructor(inject) {
		super();
		this._createPowerTree();
		this.powerTree._callInit();
		this.menus = this.powerTree.powerCss.powerMenu;
		this.mains = this.powerTree.powerCss.powerMain;
		this.truth = {};
		this.tmp = {dropmenu: {}};
		// Detect if is touchdevice (Phones, Ipads, etc)
		this.touchdevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement) ? true : false;
		// If not touchdevice add keyboardManager
		if (!this.touchdevice) {
			this.keyboardManager = new KeyboardManager();
		}
	}

	_powerMenu(element) {
		return new PowerMenu(element, this);
	}

	_powerMain(element) { // TODO need classes?
		return new PowerMain(element, this);
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

	_powerDropmenu(element) {
		return new PowerDropmenu(element, this);
	}

	_powerStatus(element) {
		return new PowerStatus(element, this);
	}

	_powerBasicElement(element) {
		return new _PowerBasicElement(element, this);
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
            this.powerSection[section.id] = this.$powerUi.powerTree.powerCss.powerSection[section.id];
            // Add accordion to section
            this.powerSection[section.id].powerAccordion = this;
        }
        const powerActions = this.element.getElementsByClassName('power-action');
        for (const action of powerActions) {
            this.powerAction[action.id] = this.$powerUi.powerTree.powerCss.powerAction[action.id];
            // Add accordion to action
            this.powerAction[action.id].powerAccordion = this;
        }
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-accordion'});


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
                if (targetAction.targetObj.id !== this.id && targetAction._$pwActive) {
                    // This prevent the targetAction.toggle call this action again, so this flag avoid a loop to occurs
                    targetAction.toggle({avoidCallAction: true});
                }
            }
        }
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-section'});

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
        const allPowerObjsById = this.$powerUi.powerTree.allPowerObjsById[this._target];
        for (const index in allPowerObjsById) {
            if (allPowerObjsById[index].powerTarget) {
                this.targetObj = allPowerObjsById[index];
            }
        }
        // Add the action to the target Class
        this.targetObj.powerAction = this;
        this.subscribe({event: 'click', fn: this.toggle});
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
            return;
        }

        do {
            if (elementToCheck === targetElement || elementToCheck === powerActionElement) {
                // This is a click inside the dropmenu, menu or on the buttom/trigger element. So, do nothing, just return
                return;
            }
            // Go up the DOM
            elementToCheck = elementToCheck.parentNode;
        } while (elementToCheck);

        // This is an outside click
        this.toggle();
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-action'});


class PowerToggle extends PowerAction {
    constructor(element) {
        super(element);
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-toggle'});

class PowerBrand extends PowerTarget {
    constructor(element) {
        super(element);
        this.id = this.element.getAttribute('id');
        const self = this;
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-brand'});

class PowerDropmenu extends PowerTarget {
    constructor(element) {
        super(element);
        // Hold all the power actions in this dropmenu, but not the ones on the internal Power dropmenus
        this.firstLevelPowerActions = [];
        // Hold all the power actions in the internal Power dropmenus, but not the ones in this dropmenu
        this.allChildPowerActions = [];
        // Hold all the power items in this dropmenu, but not the ones on the internal Power dropmenus
        this.firstLevelPowerItems = [];
        // Hold all the power items in the internal Power dropmenus, but not the ones in this dropmenu
        this.allChildPowerItems = [];
        // Hold all child Power dropmenus
        this.allChildPowerDropmenus = [];
        // The position the dropmenu will try to appear by default
        this.defaultPosition = element.getAttribute('data-power-position') || 'bottom-right';

        // Mark the root of the dropmenu tree, first level element
        let stop = false;
        let parentElement = element.parentElement;
        while (!stop) {
            if (parentElement.classList.contains('power-dropmenu')) {
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
                    // No more parentElements, than this is first level dropmenu
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
            this.allChildPowerDropmenus,
        );
        setAllChildElementsAndFirstLevelChildElements(
            'power-item',
            'powerItem',
            this.firstLevelPowerItems,
            this.allChildPowerItems,
            this
        );

        // Set the default position only for menus not inside a menu
        // The default position of menus Power dropmenus are defined by the menu
        if (this.isRootElement && !this.isMenuElement) {
            defineFirstLevelDropmenusPosition(this, this);
            for (const dropmenu of this.allChildPowerDropmenus) {
                defineChildDropmenusPosition(this, dropmenu);
            }
        }
    }

    // Remove left, margin-left and border width from absolute elements
    offsetComputedStyles(styles) {
        return parseInt(styles.left.split('px')[0] || 0) + parseInt(styles['margin-left'].split('px')[0] || 0)  + parseInt(styles['border-left-width'].split('px')[0] || 0);
    }

    offsetComputedBodyStyles(styles) {
        return parseInt(styles['margin-left'].split('px')[0] || 0) + parseInt(styles['border-width'].split('px')[0] || 0);
    }

    hoverModeOn() {
        // Abort if is moving
        if (this.$powerUi.tmp.dropmenu._mouseIsMovingTo) {
            // Using may moving over the same element, only add new target if not the same target
            if (this.$powerUi.tmp.dropmenu._mouseIsMovingTo.id !== this.id) {
                this.moveOverPossibleNewTarget(this);
            }
            return;
        }
        for (const action of this.firstLevelPowerActions) {
            action.subscribe({event: 'mouseenter', fn: this.onMouseEnterAction, action: action, dropmenu: this});
            action.subscribe({event: 'click', fn: this.onMouseEnterAction, action: action, dropmenu: this});
        }
    }

    onMouseEnterAction(ctx, event, params) {
        // Abort if is moving
        if (this.$powerUi.tmp.dropmenu._mouseIsMovingTo) {
            // User may moving over the same element, only add new target if not the same target
            if (this.$powerUi.tmp.dropmenu._mouseIsMovingTo.id !== params.dropmenu.id) {
                params.dropmenu.moveOverPossibleNewTarget(this);
            }
            return;
        }
        if (params.action._$pwActive) {
            return;
        }
        params.action.toggle();
        params.dropmenu.onMouseEnterItem(ctx, event, params, true);
        for (const item of params.dropmenu.firstLevelPowerItems) {
            item.subscribe({event: 'mouseenter', fn: params.dropmenu.onMouseEnterItem, action: params.action, dropmenu: params.dropmenu, item: item});
        }
        params.dropmenu.startWatchMouseMove(ctx, event, params);
    }

    onMouseEnterItem(ctx, event, params, onMouseEnterAction) {
        // Abort if is moving
        if (this.$powerUi.tmp.dropmenu._mouseIsMovingTo) {
            // User may moving over the same element, only add new target if not the same target
            if (this.$powerUi.tmp.dropmenu._mouseIsMovingTo.id !== params.dropmenu.id) {
                params.dropmenu.moveOverPossibleNewTarget(params.item);
            }
            return;
        }
        // This can be called from onMouseEnterAction and in this case we don't want call the toggle
        if (!onMouseEnterAction) {
            // Only call toggle if is active
            if (params.action._$pwActive) {
                params.action.toggle();
            }

        }

        // Close any child possible active dropmenu
        for (const action of params.dropmenu.allChildPowerActions) {
            if (action._$pwActive) {
                action.toggle();
            }
        }
        // Close any first level possible active dropmenu if not the current dropmenu
        for (const action of params.dropmenu.firstLevelPowerActions) {
            if (action._$pwActive && (action.id !== params.action.id)) {
                action.toggle();
            }
        }

        // Unsubscribe from all the power items mouseenter
        for (const item of params.dropmenu.firstLevelPowerItems) {
            item.unsubscribe({event: 'mouseenter', fn: params.dropmenu.onMouseEnterItem, action: params.action, dropmenu: params.dropmenu});
        }

    }

    hoverModeOff() {
        this.stopWatchMouseMove();
        for (const action of this.firstLevelPowerActions) {
            action.unsubscribe({event: 'mouseenter', fn: this.onMouseEnterAction, action: action, dropmenu: this});
            action.unsubscribe({event: 'click', fn: this.onMouseEnterAction, action: action, dropmenu: this});
        }
    }

    // Bellow functions temporary abort the hover mode to give time to users move to the opened dropmenu
    moveOverPossibleNewTarget(item) {
        this.$powerUi.tmp.dropmenu._possibleNewTarget = item;
    }
    onmousestop() {
        // Only stopWatchMouseMove if the _possibleNewTarget are not already active
        // If it is already active then wait user to mover over it
        if (this.$powerUi.tmp.dropmenu._possibleNewTarget && !this.$powerUi.tmp.dropmenu._possibleNewTarget._$pwActive) {
            const item = this.$powerUi.tmp.dropmenu._possibleNewTarget;
            setTimeout(function () {
                item.broadcast('mouseenter');
            }, 10);
            this.stopWatchMouseMove();
        } else {
            this.$powerUi.tmp.dropmenu._resetMouseTimeout();
        }
    }
    // Called when mouse move
    resetMouseTimeout() {
        clearTimeout(this.$powerUi.tmp.dropmenu.timeout);
        this.$powerUi.tmp.dropmenu.timeout = setTimeout(this.$powerUi.tmp.dropmenu._onmousestop, 120);
    }
    startWatchMouseMove(ctx, event, params) {
        if (this.$powerUi.tmp.dropmenu._mouseIsMovingTo) {
            return;
        }
        params.action.targetObj.subscribe({event: 'mouseenter', fn: this.stopWatchMouseMove, action: params.action, dropmenu: params.dropmenu});
        this.$powerUi.tmp.dropmenu._mouseIsMovingTo = params.action.targetObj;
        this.$powerUi.tmp.dropmenu._onmousestop = this.onmousestop.bind(this);
        this.$powerUi.tmp.dropmenu._resetMouseTimeout = this.resetMouseTimeout.bind(this);
        this.$powerUi.tmp.dropmenu.timeout = setTimeout(this.$powerUi.tmp.dropmenu._onmousestop, 300);
        document.addEventListener('mousemove', this.$powerUi.tmp.dropmenu._resetMouseTimeout, true);
    }
    stopWatchMouseMove() {
        this.$powerUi.tmp.dropmenu._mouseIsMovingTo = false;
        this.$powerUi.tmp.dropmenu._possibleNewTarget = false;
        clearTimeout(this.$powerUi.tmp.dropmenu.timeout);
        document.removeEventListener('mousemove', this.$powerUi.tmp.dropmenu._resetMouseTimeout, true);
        this.unsubscribe({event: 'mouseenter', fn: this.stopWatchMouseMove});
    }


    // Get the dropmenu left positon
    getLeftPosition(powerAction) {
        const bodyRect = document.documentElement.getBoundingClientRect();
        const elemRect = powerAction.element.getBoundingClientRect();
        let offset = elemRect.left - bodyRect.left;
        offset  = offset + this.offsetComputedBodyStyles(getComputedStyle(document.documentElement));

        // Select all parent nodes to find the ones positioned as "absolute"
        let curentNode = powerAction.element.parentNode;
        const allParents = [];
        while (curentNode && curentNode.tagName !== 'BODY') {
            allParents.push(curentNode);
            curentNode = curentNode.parentNode;
        }

        // Offset all parent "absolute" nodes
        for (const parent of allParents) {
            const parentStyles = getComputedStyle(parent);
            if (parentStyles.position === 'absolute') {
                offset  = offset - this.offsetComputedStyles(parentStyles);
            }
        }

        return Math.round(offset);
    }

    setPositionRightBottom() {
        this.element.style.left = this.getLeftPosition(this.powerAction) + this.powerAction.element.offsetWidth - 1 + 'px';
        this.element.style.top = this.powerAction.element.offsetTop + 'px';
    }
    setPositionBottomRight() {
        this.element.style.left = this.getLeftPosition(this.powerAction) + 'px';
    }
    setPositionLeftBottom() {
        this.element.style.left = this.getLeftPosition(this.powerAction) - this.element.offsetWidth + 1 + 'px';
        this.element.style.top = this.powerAction.element.offsetTop + 'px';
    }
    setPositionBottomLeft() {
        const dropmenuActionWidthDiff = this.powerAction.element.offsetWidth - this.element.offsetWidth;
        this.element.style.left = this.getLeftPosition(this.powerAction) + dropmenuActionWidthDiff + 'px';
    }
    setPositionRightTop() {
        this.element.style.left = this.getLeftPosition(this.powerAction) + this.powerAction.element.offsetWidth - 1 + 'px';
        this.element.style.top = this.powerAction.element.offsetTop - (this.element.offsetHeight - this.powerAction.element.offsetHeight)+ 'px';
    }
    setPositionTopRigth() {
        this.element.style.left = this.getLeftPosition(this.powerAction) + 'px';
        this.element.style.top = this.powerAction.element.offsetTop - this.element.offsetHeight + 'px';
    }
    setPositionLeftTop() {
        this.element.style.left = this.getLeftPosition(this.powerAction) - this.element.offsetWidth + 1 + 'px';
        this.element.style.top = this.powerAction.element.offsetTop - (this.element.offsetHeight - this.powerAction.element.offsetHeight)+ 'px';
    }
    setPositionTopLeft() {
        const dropmenuActionWidthDiff = this.powerAction.element.offsetWidth - this.element.offsetWidth;
        this.element.style.left = this.getLeftPosition(this.powerAction) + dropmenuActionWidthDiff + 'px';
        this.element.style.top = this.powerAction.element.offsetTop - this.element.offsetHeight + 'px';
    }

    ifPositionOutOfScreenChangeDirection() {
        const documentRect = document.documentElement.getBoundingClientRect();
        const elementRect = this.element.getBoundingClientRect();

        const pos = {
            topDown: this.defaultPosition.includes('bottom') ? 'bottom' : 'top',
            leftRight: this.defaultPosition.includes('right') ? 'right' : 'left',
        };
        const changes = {topDown: 0, leftRight: 0};

        // Correct position if right is not allowed anymore
        // Change position if right element is bigger than right document
        if (elementRect.right > documentRect.right) {
            pos.leftRight = 'left';
            changes.leftRight++;
        } else if (elementRect.left < documentRect.left) {
        // Correct position if left is not allowed anymore
        // Change position if left element is bigger than left document
            pos.leftRight = 'right';
            changes.leftRight++;
        }

        // Bottom may also not allowed anymore
        // Change position if bottom element is bigger than bottom document
        if (elementRect.bottom > document.defaultView.innerHeight) {
            pos.topDown = 'top';
            changes.topDown++;
        } else if (elementRect.top < 0) {
            pos.topDown = 'bottom';
            changes.topDown++;
        }

        if (changes.topDown > 0 || changes.leftRight > 0) {
            if (pos.topDown === 'top') {
                if (pos.leftRight === 'left') {
                    this.setPositionLeftTop();
                } else {
                    this.setPositionRightTop();
                }
            } else {
                if (pos.leftRight === 'left') {
                    this.setPositionLeftBottom();
                } else {
                    this.setPositionRightBottom();
                }
            }

            // Top and left can't have negative values
            // Fix it if needed
            this.setPositionLimits();
        }
    }

    // Top and left can't have negative values
    setPositionLimits() {
        const elementRect = this.element.getBoundingClientRect();
        if (elementRect.left < 0) {
            this.element.style.left = '0px';
        }
        if (elementRect.top < 0) {
            this.element.style.top = '0px';
        }
    }

    resetDropmenuPosition() {
        this.element.style.top = null;
        this.element.style.left = null;
    }

    toggle() {
        this.resetDropmenuPosition();
        // Hide the element when add to DOM
        // This allow get the dropmenu sizes and position before adjust and show
        this.element.classList.add('power-hide');
        const self = this;
        if (!this._$pwActive) {
            setTimeout(function () {
                // The powerDropmenu base it's position on the powerAction position
                if (self.defaultPosition === 'bottom-right') {
                    self.setPositionBottomRight();
                } else if (self.defaultPosition === 'right-bottom') {
                    self.setPositionRightBottom();
                } else if (self.defaultPosition === 'bottom-left') {
                    self.setPositionBottomLeft();
                } else if (self.defaultPosition === 'left-bottom') {
                    self.setPositionLeftBottom();
                }  else if (self.defaultPosition === 'top-right') {
                    self.setPositionTopRigth();
                } else if (self.defaultPosition === 'right-top') {
                    self.setPositionRightTop();
                } else if (self.defaultPosition === 'left-top') {
                    self.setPositionLeftTop();
                } else if (self.defaultPosition === 'top-left') {
                    self.setPositionTopLeft();
                } else {
                    self.setPositionRightBottom();
                }

                // Find if the position is out of screen and reposition if needed
                self.ifPositionOutOfScreenChangeDirection();
                // After choose the position show the dropmenu
                self.element.classList.remove('power-hide');
            }, 50);
            // Power Drops only behave like windows if the user is not using touch
            if (!this.$powerUi.touchdevice) {
                this.hoverModeOn();
            }
        } else {
            // Power Drops only behave like windows if the user is not using touch
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
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-dropmenu'});

class PowerItem extends PowerTarget {
    constructor(element) {
        super(element);
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-item'});

class PowerMain extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-main', isMain: true});

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
        this.firstLevelPowerDropmenus = [];
        // The position the dropmenu will try to appear by default
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
        for (const config of PowerUi._powerCssConfig.filter(x => !x.isMain)) {
            const className = config.name;
            // power-brand, power-item, power-dropmenu, etc...
            for (const element of this.element.getElementsByClassName(className)) {
                let keyName = className.split('-')[1];
                // Find the apropriate key plural (statuses)
                keyName = (keyName === 'status') ? `${keyName}es` : `${keyName}s`;
                if (!this[keyName]) {
                    this[keyName] = {};
                }
                // find the camelCase name of the className
                const camelCaseName = powerClassAsCamelCase(className);
                const powerElement = this.$powerUi.powerTree.powerCss[camelCaseName][element.id];
                this[keyName][element.id] = powerElement;
                // Add the menu on the powerElement
                powerElement.$powerMenu = this;
                if (camelCaseName === 'powerDropmenu') {
                    if (powerElement.isRootElement) {
                        this.firstLevelPowerDropmenus.push(powerElement);
                        defineFirstLevelDropmenusPosition(this, powerElement);
                    } else {
                        defineChildDropmenusPosition(this, powerElement);
                    }
                }
            }
        }

        // Menu subscribe to any action to allow "windows like" behaviour on Power dropmenus
        // When click the first menu item on Windows and Linux, the other Power dropmenus opens on hover
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
        params.menu.resetAnyDropdownTmpInfo();
        // Only call toggle if is not active
        if (!params.action._$pwActive) {
            params.action.toggle();
        }

        // Close any child possible active dropmenu
        for (const action of params.menu.allChildPowerActions) {
            if (action._$pwActive) {
                action.toggle();
            }
        }
        // Close any first level possible active dropmenu if not the current dropmenu
        for (const action of params.menu.firstLevelPowerActions) {
            if (action._$pwActive && (action.id !== params.action.id)) {
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
        }, 50);
    }

    hoverModeOff(ctx, level, params) {
        for (const action of params.menu.firstLevelPowerActions) {
            action.unsubscribe({event: 'mouseenter', fn: params.menu.onMouseEnterAction, action: action, menu: params.menu});
        }
    }
    resetAnyDropdownTmpInfo() {
        this.$powerUi.tmp.dropmenu._mouseIsMovingTo = false;
        this.$powerUi.tmp.dropmenu._possibleNewTarget = false;
        clearTimeout(this.$powerUi.tmp.dropmenu.timeout);
        document.removeEventListener('mousemove', this.$powerUi.tmp.dropmenu._resetMouseTimeout, true);
        this.unsubscribe({event: 'mouseenter', fn: this.stopWatchMouseMove});
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
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-menu', isMain: true});

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
        const allPowerObjsById = this.$powerUi.powerTree.allPowerObjsById;
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
        if (this.targetObj) {
            this.targetObj.subscribe({event: 'toggle', fn: this.toggle.bind(this)});
        }
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-status'});

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
		console.log('pwcPity is alive!', this.$_pwAttrName);
	}
}
// Inject the attr on PowerUi
_PowerUiBase.injectPwc({name: 'data-pwc-pity', callback: function(element) {return new PwcPity(element);}});
// TODO: testeExtendName is to find a way to modularize multiple extensions
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
//      super();
//      this.fake = {};
//  }
// }
// let app = new TesteUi();
let app = new PowerUi();

// if (app.powerTree.allPowerObjsById['pouco_label']) {
// 	if (app.powerTree.allPowerObjsById['mais-top44']) {
// 		setTimeout(function () {
// 			app.powerTree.allPowerObjsById['mais-top44'].powerAction.broadcast('click');
// 			setTimeout(function () {
// 				app.powerTree.allPowerObjsById['novo_menos-top2m44'].powerAction.broadcast('mouseenter');
// 			}, 300);
// 		}, 500);
// 	}
// }
function clickum() {
	console.log('um');
}
function clickdois() {
	console.log('dois');
}
function mouseoverum() {
	console.log('mouse over 1');
}
function mouseoverdois() {
	console.log('mouse over 2');
}
function mouseoutum() {
	console.log('mouseout 1');
}
function mouseoutdois() {
	console.log('mouseout 2');
}
function clicktres() {
	console.log('três');
	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'click', fn: clickum });
	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'click', fn: clickdois });
	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'click', fn: clicktres });
	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseover', fn: mouseoverum});
	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseover', fn: mouseoverdois});
	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseout', fn: mouseoutum});
	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseout', fn: mouseoutdois});
}
app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'click', fn: clickum });
app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'click', fn: clickdois});
app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'click', fn: clicktres});
app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseover', fn: mouseoverum});
app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseover', fn: mouseoverdois});
app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseout', fn: mouseoutum});
app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseout', fn: mouseoutdois});
window.console.log('power', app);
window.console.log('panel-0-action', app.powerTree.allPowerObjsById['panel-0-action']);
var teste = function(e) {
	console.log('chamou', this);
	this.unsubscribe({event: 'mouseover', fn: teste});
}
app.powerTree.allPowerObjsById['panel-0-action'].powerAction.subscribe({event: 'mouseover', fn: teste});
