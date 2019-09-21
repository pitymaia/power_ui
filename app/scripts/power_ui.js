// Layout, design and user interface framework in ES6
'use strict';

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
// Hold temp scopes during templating
_PowerUiBase.tempScope = {};
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
_PowerUiBase._powerElementsConfig = [];
_PowerUiBase.injectPowerCss = function (powerCss) {
	if (powerCss.isMain) {
		_PowerUiBase._powerElementsConfig.unshift(powerCss);
	} else {
		_PowerUiBase._powerElementsConfig.push(powerCss);
	}
};


const _Unique = { // produce unique IDs
	n: 0,
	next: () => ++_Unique.n,
	domID: (tagName) => `_pow${tagName ? '_' + tagName : 'er'}_${_Unique.next()}`,
	scopeID: () => `_scope_${_Unique.next()}`,
};


class UEvent {
	constructor(name) {
		this.observers = [];
		if (name)  UEvent.index[name] = this;
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
UEvent.index = {}; // storage for all named events


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
			this._events[event] = new UEvent(this.id);
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
	// The elements in the same level of this element
	getSiblings() {
		return (this.parent ? this.parent.children : this.$powerUi.powerTree.rootElements).filter(obj => obj.id !== this.id);
	}
	// Only the first level elements
	getChildrenByPowerCss(powerCss) {
		return this.children.filter(child => child.$powerCss === powerCss);
	}
	// All elements inside this element
	getInnerByPowerCss(powerCss) {
		return this.innerPowerCss.filter(child => child.$powerCss === powerCss);
	}
	// Inner elements without the children elements
	getInnerWithoutChildrenByPowerCss(powerCss) {
		return this.innerPowerCss.filter(child => child.$powerCss === powerCss && child.parent.id !== this.id);
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
		this.rootElements = [];

		// Sweep FOM to create a temp tree with 'pwc', 'pow' and 'power-' DOM elements and create objects from it
		this.buildTempTreeAndObjects(document);

		// May add new DOM elements
		this._compile();

		// Add navigation element like "main", "parentObj" and "children"
		this.linkElement();

	}

	buildTempTreeAndObjects(node) {
		const tempTree = {
			powerCss: {},
			powAttrs: {},
			pwcAttrs: {},
		};
		// Sweep FOM to create a temp tree with simple DOM elements that contais 'pwc', 'pow' and 'power-' prefixes
		this.sweepDOM(node, tempTree, this._buildTempPowerTree);

		// Create the power-css and pow/pwc attrs objects from DOM elements
		for (const attribute in tempTree) {
			for (const selector of PowerUi._powerElementsConfig) {
				this._buildObjcsFromTempTree(this, attribute, selector, tempTree);
			}

			for (const selector of PowerUi._powAttrsConfig) {
				this._buildObjcsFromTempTree(this, attribute, selector, tempTree);
			}

			for (const selector of PowerUi._pwcAttrsConfig) {
				this._buildObjcsFromTempTree(this, attribute, selector, tempTree);
			}
		}
	}

	linkElement() {
		this._linkMainClassAndPowAttrs();
		this._addSharingElement();

		// Sweep allPowerObjsById to add parent and childrens to each power element
		this._likeInDOM();
	}

	// Sweep allPowerObjsById to add parent and childrens to each power element
	_likeInDOM() {
		for (const id in this.allPowerObjsById) {
			for (const powerSelector in this.allPowerObjsById[id]) {
				const currentObj = this.allPowerObjsById[id][powerSelector];
				if (powerSelector !== '$shared' && !currentObj.parent) {
					// Search a powerElement parent of currentObj up DOM if exists
					const searchResult = PowerTree._searchUpDOM(currentObj.element, PowerTree._checkIfhavePowerParentElement);
					// If searchResult is true and not returns the same element add parent and child
					// Else it is a rootElement
					if (searchResult.conditionResult && searchResult.powerElement.id !== currentObj.element.id) {
						const parentElement = searchResult.powerElement;
						for (const parentIndex in this.allPowerObjsById[parentElement.id]) {
							// Only add if this is a power class (not some pow or pwc attr)
							if (parentIndex.includes('power')) {
								// Add parent element to current power object
								const parentObj = this.allPowerObjsById[parentElement.id][parentIndex];
								currentObj.parent = parentObj;
								// Add current object as child of parentObj
								if (!parentObj.children) {
									parentObj.children = [];
								}
								// Only add if this is a power class (not some pow or pwc attr)
								// And only if not already added
								if (currentObj.element.className.includes('power-') && !parentObj.children.find(obj => obj.id === currentObj.id)) {
									parentObj.children.push(currentObj);
								}
							}
						}
					} else { // This is a rootElement
						// Only add if this is a power class (not some pow or pwc attr)
						// And only if not already added
						if (currentObj.element.className.includes('power-') && !this.rootElements.find(obj => obj.id === currentObj.id)) {
							this.rootElements.push(currentObj);
							currentObj.parent = null;
						}
					}
				}
				// Add current object as child of parentObj
				if (currentObj.element && currentObj.element.className.includes('power-') && !currentObj.innerPowerCss) {
					currentObj.innerPowerCss = this._getAllInnerPowerCss(currentObj.element);
				}
			}
		}
	}

	// Get all inner powerObjects of any kind (any powerCss)
	_getAllInnerPowerCss(currentNode) {
		const innerPowerCss = [];
		for (const selector of _PowerUiBase._powerElementsConfig) {
			const elements = currentNode.getElementsByClassName(selector.name);
			for (const element of elements) {
				const obj = this.allPowerObjsById[element.id][asDataSet(selector.name)];
				innerPowerCss.push(obj);
			}
		}
		return innerPowerCss;
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

				// Call back with any condition to apply
				callback(currentNode, ctx);

				if(currentNodeHasChindren) {
					// Recursively sweep through currentNode children
					this.sweepDOM(currentNode, ctx, callback);
				}
			}
		}
	}

	// Check is this powerElement is child of some main powerElement (like powerMenu, powerMain, powerAccordion, etc)
	_getMainElementFromChildElement(element) {
		const searchResult  = PowerTree._searchUpDOM(element, this._checkIfIsMainElement);
		if (searchResult.conditionResult) {
			return searchResult.powerElement;
		}
	}

	// testCondition to find the main powerElement of a given powerElement
	_checkIfIsMainElement(currentElement) {
		let found = false;
		if (currentElement && currentElement.className) {
			for (const mainPowerElementConfig of PowerUi._powerElementsConfig.filter(s => s.isMain === true)) {
				if (currentElement.classList.contains(mainPowerElementConfig.name)) {
					found = true;
					break;
				}
			}
		}
		return found;
	}

	_compile() {
		for (const id in this.allPowerObjsById) {
			// Call compile for all elements
			for (const attr in this.allPowerObjsById[id]) {
				if (this.allPowerObjsById[id][attr].compile) {
					this.allPowerObjsById[id][attr].compile();
				}
			}
		}
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

	// Register power attrs and classes sharing the same element
	_addSharingElement() {
		for (const id in this.allPowerObjsById) {
			// if Object.keys(obj).length add the inSameElement for each objects
			// Also call init(if true or else)
			if (Object.keys(this.allPowerObjsById[id]).length > 1) {
				for (const attr in this.allPowerObjsById[id]) {
					// Don't add inSameElement to $shared
					if (attr != '$shared') {
						if (!this.allPowerObjsById[id][attr].inSameElement) {
							this.allPowerObjsById[id][attr].inSameElement = {};
						}
						// To avoid add this element as a sibling of it self we need iterate over attrs again
						for (const siblingAttr in this.allPowerObjsById[id]) {
							// Also don't add $shared inSameElement
							if (siblingAttr !== attr && siblingAttr != '$shared') {
								this.allPowerObjsById[id][attr].inSameElement[siblingAttr] = this.allPowerObjsById[id][siblingAttr];
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
			// Hold elements that have pow-attrs
			const powAttrsList = this.powAttrs[asDataSet(item.name)];
			// Loop through the list of existing powAttrs in dataset format like powMainSrcHover
			// Every element it found is the powerElement it needs find the correspondent main object
			for (const id in powAttrsList) {
				const currentPowElement = powAttrsList[id];
				// Get the simple DOM node main element  of the current powerElement object
				const currentMainElement = this._getMainElementFromChildElement(currentPowElement.element);
				if (currentMainElement) {
					// Loop through the list of possible main CSS power class names like power-menu or power-main
					// With this we will find the main powerElement that holds the simple DOM node main element
					for (const mainPowerElementConfig of PowerUi._powerElementsConfig.filter(a => a.isMain === true)) {
						if (this.powerCss[asDataSet(mainPowerElementConfig.name)]) {
							// Get the powerElement using the simple DOM node main element (currentMainElement)
							const mainPowerObj = this.powerCss[asDataSet(mainPowerElementConfig.name)][currentMainElement.getAttribute('id')];
							// If we found it let's go to associate the main with the child
							if(mainPowerObj) {
								// Add the main object into the child object
								currentPowElement.$pwMain = mainPowerObj;
								// create the obj to hold the children if dont have it
								if (mainPowerObj.innerPowAttrs === undefined) {
									mainPowerObj.innerPowAttrs = {};
								}
								// Add the child object into the main object
								// Organize it by attribute dataset name
								const datasetAttrName = asDataSet(currentPowElement.$_pwAttrName);
								if (!mainPowerObj.innerPowAttrs[datasetAttrName]) {
									mainPowerObj.innerPowAttrs[datasetAttrName] = {};
								}
								// Organize it by id inside attribute dataset name
								if (!mainPowerObj.innerPowAttrs[datasetAttrName][currentPowElement.id]) {
									mainPowerObj.innerPowAttrs[datasetAttrName][currentPowElement.id] = {};
								}
								mainPowerObj.innerPowAttrs[datasetAttrName][currentPowElement.id] = currentPowElement;
							}
						}
					}
				}
			}
		}
	}

	// This creates the powerTree with all the power objects attached to the DOM
	// It uses the simple elements of _buildTempPowerTree to get only the power elements
	_buildObjcsFromTempTree(ctx, attribute, selector, tempTree) {
		const datasetKey = asDataSet(selector.name);
		// Hold all element of a power kind (powerCss, powAttr or pwcAttr)
		const currentTempElementsById = tempTree[attribute][datasetKey];
		if (currentTempElementsById) {
			for (const id in currentTempElementsById) {
				if (!ctx[attribute][datasetKey]) {
					ctx[attribute][datasetKey] = {};
				}

				// If there is a method like _powerMenu allow it to be extended, call the method like _powerMenu()
				// If is some pow-attribute or pwc-attribute use 'powerAttrs' flag to call some class using the callback
				const functionName = !!ctx.$powerUi[`_${datasetKey}`] ? `_${datasetKey}` : 'powerAttrs';
				if (functionName === 'powerAttrs') {
					// Add into a list ordered by attribute name
					ctx[attribute][datasetKey][id] = selector.callback(currentTempElementsById[id]);
				} else {
					// Call the method for create objects like _powerMenu with the node elements in tempTree
					// uses an underline plus the camelCase selector to call _powerMenu or other similar method on 'ctx'
					// E. G. , ctx.powerCss.powerMenu.topmenu = ctx.$powerUi._powerMenu(topmenuElement);
					ctx[attribute][datasetKey][id] = ctx.$powerUi[functionName](currentTempElementsById[id]);
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
				ctx.allPowerObjsById[id][datasetKey].$powerCss = datasetKey;
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
			for (const selector of PowerUi._powerElementsConfig) {
				if (currentNode.classList.contains(selector.name)) {
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
// Search powerElement UP on DOM and return the element when testCondition is true or the last powerElement on the tree
// testCondition is a function to find the element we want, if the condition is false the root/top powerElement is returned
PowerTree._searchUpDOM = function (element, testCondition) {
	let lastPowerElement = element.className.includes('power-') ? element : null;
	let currentElement = element.parentElement;
	let conditionResult = false;
	let stop = false;
	while (!stop) {

		conditionResult = testCondition(currentElement);
		if (conditionResult) {
			stop = true;
		}
		if (currentElement.className.includes('power-')) {
			lastPowerElement = currentElement;
		}
		// Don't let go to parentElement if already found it and heve the variable 'stop' as true
		// Only select the parentElement if has element but don't found the main class selector
		if (currentElement.parentElement && !stop) {
			currentElement = currentElement.parentElement;
		} else {
			// If there is no more element set stop
			stop = true;
		}
	}
	return {powerElement: lastPowerElement, conditionResult: conditionResult};
};
// testCondition to return the parent power element if exists
PowerTree._checkIfhavePowerParentElement = function (currentElement) {
	let found = false;
	if (currentElement.className.includes('power-')) {
		found = true;
	}
	return found;
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

// Define the powerDropmenus defaultPosition for all the child Power dropmenus
// The right-bottom is the standard position
function defineInnerDropmenusPosition(self, powerElement) {
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
function defineRootDropmenusPosition(self, powerElement) {
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
	constructor($powerUi) {
		document.onkeydown = this.checkKey.bind(this);
		document.onkeyup = this.checkKey.bind(this);
		this.$powerUi = $powerUi;
		this.keyModeIsOn = false;
	}

	getRootElements() {
		return this.$powerUi.powerTree.rootElements;
	}

	setKeyModeOn() {
		if (this.keyModeIsOn === false) {
			this.keyModeIsOn = true;
			this.createBackDrop();
			for (const obj of this.getRootElements()) {
				const styles = getComputedStyle(obj.element);
				console.log('styles', styles.position);
				if (styles.position === 'static') {
					obj.element.classList.add('power-keyboard-position');
				}
				obj.element.classList.add('power-keyboard-mode');
			}
			console.log('Keyboard mode ON');
		}
	}

	createBackDrop() {
		this.backdrop = document.createElement("DIV");
		this.backdrop.classList.add('power-keyboard-backdrop');
		document.body.appendChild(this.backdrop);
	}

	removeBackdrop() {
		document.body.removeChild(this.backdrop);
	}

	setKeyModeOff() {
		if (this.keyModeIsOn) {
			this.removeBackdrop();
			this._17 = false;
			this._48 = false;
			this._96 = false;
			this.keyModeIsOn = false;
			console.log('Keyboard mode OFF');
			for (const obj of this.getRootElements()) {
				obj.element.classList.remove('power-keyboard-mode');
				obj.element.classList.remove('power-keyboard-position');
				console.log('element', obj);
			}
		}
	}

	checkKey(e) {
		e = e || window.event;
		// ESC = 27
		if (e.keyCode === 27) {
			// Turn keyboard mode off
			this.setKeyModeOff();
		}

		// Monitoring key down and key up
		if (e.type === 'keydown') {
			this[`_${e.keyCode}`] = true;
		} else {
			this[`_${e.keyCode}`] = false;
		}

		// ctrl = 17, 0 = 48, numpad 0 = 96 (ctrl + 0)
		if (this._17 && (this._48 || this._96)) {
			// Turn keyboard mode on (ctrl + 0)
			this.setKeyModeOn();
		}
	}
}


class PowerUi extends _PowerUiBase {
	constructor(config) {
		super();
		this.interpolation = new PowerInterpolation(config, this);
		this.request = new Request(config);
		this.router = new Router(config, this); // Router calls this.init();
	}

	init() {
		console.log('PowerUi init');
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
			this.keyboardManager = new KeyboardManager(this);
		}
		window.scrollTo(0, 0);
	}

	loadHtmlView(url, viewId) {
		const self = this;
		this.request({
				url: url,
				method: 'GET',
				status: "Loading page",
				withCredentials: false,
		}).then(function (response, xhr) {
			// We decide to only compile views becouse it avoid uncompiled data display to users

			document.getElementById(viewId).innerHTML = self.interpolation.compile(xhr.responseText);
			self.init();
		}).catch(function (response, xhr) {
			console.log('loadHtmlView error', response, xhr);
		});
	}

	sanitizeHTML(str) {
		const temp = document.createElement('div');
		temp.textContent = str;
		return temp.innerHTML;
	};

	_powerView(element) {
		return new PowerView(element, this);
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

	_powerAccordionSection(element) {
		return new PowerAccordionSection(element, this);
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

	// Remove left, margin-left and border width from absolute elements
	_offsetComputedStyles(styles) {
		return parseInt(styles.left.split('px')[0] || 0) + parseInt(styles['margin-left'].split('px')[0] || 0)  + parseInt(styles['border-left-width'].split('px')[0] || 0);
	}
	// The Root element have some aditional offset on margin-left
	_offsetComputedRootElementStyles(styles) {
		return parseInt(styles['margin-left'].split('px')[0] || 0);// + parseInt(styles['border-width'].split('px')[0] || 0);
	}
}

// Replace a value form an attribute when is mouseover some element and undo on mouseout
class PowFor extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
    }

    // element attr allow to recursivelly call it with another element
    compile(element) {
        const el = element || this.element;
        const parts = el.dataset.powFor.split(' ');
        const obj = eval(this.$powerUi.interpolation.sanitizeEntry(parts[2]));
        const scope = {};
        if (parts[1] === 'of') {
            this.forOf(scope, parts[0], obj, el);
        } else {
            forIn(scope, parts[0], obj, el);
        }
    }

    forOf(scope, selector, obj, el) {
        let newHtml = '';
        for (const item of obj) {
            const scope = _Unique.scopeID();
            var regex = new RegExp(selector, 'gm');
            _PowerUiBase.tempScope[scope] = item;
            newHtml = newHtml + el.innerHTML.replace(regex, `_PowerUiBase.tempScope['${scope}']`);
        }
        el.innerHTML = newHtml;
        el.removeAttribute('data-pow-for');
    }

    forIn(scope, selector, obj) {

    }
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'pow-for',
    callback: function(element) {return new PowFor(element);}
});

// Replace a value form an attribute when is mouseover some element and undo on mouseout
class PowIf extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
    }

    init() {
        console.log('POW-IF: ', this.element.dataset.powIf);
        const value = this.$powerUi.interpolation.compileAttrs(this.element.dataset.powIf) == 'true';
        // Hide if element is false
        if (value === false) {
            this.element.style.display = 'none';
        } else {
            this.element.style.display = null;
        }
    }
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'pow-if',
    callback: function(element) {return new PowIf(element);}
});

class AccordionModel {
	constructor(ctx) {
		this.ctx = ctx;
		this.multipleSectionsOpen = ctx.element.getAttribute('data-multiple-sections-open') === 'true';
	}
}


class AccordionSectionModel {
	constructor(ctx) {
		this.ctx = ctx;
		this.active = false;
	}
}


class AccordionSectionHtmlCtrl {
	constructor(ctx) {
		this.ctx = ctx;
	}

	// Open and close the accordion panel
	toggle() {
		// If not allow multipleSectionsOpen, close the other sections
		if (!this.ctx.powerAccordion.model.multipleSectionsOpen) {
			for (const action in this.ctx.powerAccordion.childrenActions) {
				// Only toggle if is not this section and or is active
				const targetAction = this.ctx.powerAccordion.childrenActions[action];
				if ((targetAction.targetObj.id !== this.ctx.powerAccordion.id) && targetAction._$pwActive && (this.ctx !== targetAction.targetObj)) {
					// This prevent the targetAction.toggle call this action again, so this flag avoid a loop to occurs
					targetAction.toggle({avoidCallAction: true});
					targetAction.targetObj.model.active = !targetAction.targetObj.model.active;
				}
			}
		}
	}
}


class PowerAccordion extends PowerTarget {
	constructor(element) {
		super(element);
		this.model = new AccordionModel(this);
	}

	init() {
		this.childrenSections = this.getChildrenByPowerCss('powerAccordionSection');
		this.childrenActions = this.getChildrenByPowerCss('powerAction');
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-accordion'});


class PowerAccordionSection extends PowerTarget {
	constructor(element) {
		super(element);
		this.model = new AccordionSectionModel(this);
		this.ctrl = 'htmlCtrl'; // default controller
	}

	init() {
		this.htmlCtrl = new AccordionSectionHtmlCtrl(this);
		let parent = this.parent;
		// Add the accordion to this powerSection
		do {
			if (parent.$powerCss === 'powerAccordion') {
				this.powerAccordion = parent;
			} else {
				parent = parent.parent;
			}
		} while (parent && parent.$powerCss !== 'powerAccordion');
	}

	action() {
		this[this.ctrl].toggle();
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-accordion-section'});

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

		// The position the dropmenu will try to appear by default
		this.defaultPosition = this.element.getAttribute('data-power-position') || 'bottom-right';
		// Mark the root of the dropmenu tree, first level element
		this._markRootAndMenuDropmenu();
	}

	init() {
		// Child powerActions - Hold all the power actions in this dropmenu, but not the children of childrens (the ones on the internal Power dropmenus)
		this.childrenPowerActions = this.getChildrenByPowerCss('powerAction');
		// Inner powerActions - Hold all the power actions in the internal Power dropmenus, but not the childrens directly in this dropmenu
		this.innerPowerActionsWithoutChildren = this.getInnerWithoutChildrenByPowerCss('powerAction');
		// Child powerItem - Hold all the power items in this dropmenu, but not the ones on the internal Power dropmenus
		this.childrenPowerItems = this.getChildrenByPowerCss('powerItem');
		// Inner powerItem - Hold all the power items in the internal Power dropmenus, but not the childrens directly in this dropmenu
		this.innerPowerItemsWithoutChildren = this.getInnerWithoutChildrenByPowerCss('powerItem');
		// Hold all inner Power dropmenus, including children elements
		this.innerPowerDropmenus = this.getInnerByPowerCss('powerDropmenu');

		// Set the default position only for menus not inside a menu
		// The default position of menus Power dropmenus are defined by the menu
		if (this.isRootElement && !this.isMenuElement) {
			defineRootDropmenusPosition(this, this);
			for (const dropmenu of this.innerPowerDropmenus) {
				defineInnerDropmenusPosition(this, dropmenu);
			}
		}
	}

	// Mark the root of the dropmenu tree, first level element
	// The first dropmenu have a differente position than the others
	// The first element in general start up or down, and the children elements start left or right
	_markRootAndMenuDropmenu() {
		const searchResult  = PowerTree._searchUpDOM(this.element, PowerTree._checkIfhavePowerParentElement);
		if (searchResult.conditionResult) {
			// If parent element is another dropmenu this is not a root element
			if (searchResult.powerElement.className.includes('power-dropmenu')) {
				this.isRootElement = false;
			} else {
				this.isRootElement = true;
			}
			if (searchResult.powerElement.className.includes('power-menu')) {
				this.isMenuElement = true;
			}
		} else {
			// If doesn't found power parentElements, than this is first level dropmenu
			this.isRootElement = true;
		}
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
		for (const action of this.childrenPowerActions) {
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
		for (const item of params.dropmenu.childrenPowerItems) {
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
		for (const action of params.dropmenu.innerPowerActionsWithoutChildren) {
			if (action._$pwActive) {
				action.toggle();
			}
		}
		// Close any first level possible active dropmenu if not the current dropmenu
		for (const action of params.dropmenu.childrenPowerActions) {
			if (action._$pwActive && (action.id !== params.action.id)) {
				action.toggle();
			}
		}

		// Unsubscribe from all the power items mouseenter
		for (const item of params.dropmenu.childrenPowerItems) {
			item.unsubscribe({event: 'mouseenter', fn: params.dropmenu.onMouseEnterItem, action: params.action, dropmenu: params.dropmenu});
		}

	}

	// Deactivate hover mode
	hoverModeOff() {
		this.stopWatchMouseMove();
		for (const action of this.childrenPowerActions) {
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

	setPositionRightBottom(position) {
		this.element.style.left = this.powerAction.element.offsetLeft + this.powerAction.element.offsetWidth + 'px';
		this.element.style.top = this.powerAction.element.offsetTop + 'px';
	}
	setPositionBottomRight(position) {
		this.element.style.top = this.powerAction.element.offsetTop + this.powerAction.element.offsetHeight + 'px';
		this.element.style.left = this.powerAction.element.offsetLeft + 'px';
	}
	setPositionLeftBottom(position) {
		this.element.style.left = this.powerAction.element.offsetLeft - this.element.offsetWidth + 'px';
		this.element.style.top = this.powerAction.element.offsetTop + 'px';
	}
	setPositionBottomLeft(position) {
		const dropmenuActionWidthDiff = this.powerAction.element.offsetWidth - this.element.offsetWidth;
		this.element.style.left = this.powerAction.element.offsetLeft + dropmenuActionWidthDiff + 'px';
	}
	setPositionRightTop(position) {
		this.element.style.left = this.powerAction.element.offsetLeft + this.powerAction.element.offsetWidth + 'px';
		this.element.style.top = this.powerAction.element.offsetTop - (this.element.offsetHeight - this.powerAction.element.offsetHeight) + 'px';
	}
	setPositionTopRight(position) {
		this.element.style.left = this.powerAction.element.offsetLeft + 'px';
		this.element.style.top = this.powerAction.element.offsetTop - this.element.offsetHeight + 'px';
	}
	setPositionLeftTop(position) {
		this.element.style.left = this.powerAction.element.offsetLeft - this.element.offsetWidth  + 'px';
		this.element.style.top = this.powerAction.element.offsetTop - (this.element.offsetHeight - this.powerAction.element.offsetHeight) + 'px';
	}
	setPositionTopLeft(position) {
		const dropmenuActionWidthDiff = this.powerAction.element.offsetWidth - this.element.offsetWidth;
		this.element.style.left = this.powerAction.element.offsetLeft + dropmenuActionWidthDiff + 'px';
		this.element.style.top = this.powerAction.element.offsetTop - this.element.offsetHeight + 'px';
	}

	ifPositionOutOfScreenChangeDirection() {
		const elementRect = this.element.getBoundingClientRect();

		// This offset the top when scroll to bottom
		const pos = {
			topDown: this.defaultPosition.includes('bottom') ? 'bottom' : 'top',
			leftRight: this.defaultPosition.includes('right') ? 'right' : 'left',
		};
		const changes = {topDown: 0, leftRight: 0};

		// Correct position if right is not allowed anymore
		// Change position if right element is bigger than right document
		if (elementRect.right > document.defaultView.innerWidth) {
			pos.leftRight = 'left';
			changes.leftRight++;
		} else if (elementRect.left < 0) {
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
					self.setPositionTopRight();
				} else if (self.defaultPosition === 'right-top') {
					self.setPositionRightTop();
				} else if (self.defaultPosition === 'left-top') {
					self.setPositionLeftTop();
				} else if (self.defaultPosition === 'top-left') {
					self.setPositionTopLeft();
				} else {
					self.setPositionRightBottom();
				}

				// If the action is fixed, the dropdown also needs to be fixed
				if (getComputedStyle(self.powerAction.element).position === 'fixed') {
					self.element.style.position = 'fixed';
					self.element.style.left = getComputedStyle(self.powerAction.element).left;
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
		// Child powerActions - Hold all the power actions in this dropmenu, but not the children of childrens (the ones on the internal Power dropmenus)
		this.childrenPowerActions = this.getChildrenByPowerCss('powerAction');
		// Inner powerActions without the childrens - Hold all the power actions in the internal Power dropmenus, but not the childrens directly in this menu
		this.innerPowerActionsWithoutChildren = this.getInnerWithoutChildrenByPowerCss('powerAction');
		// Child powerDropmenus - Hold all the power Dropmenus in this menu, but not the children of childrens (the ones on the internal Power dropmenus)
		this.childrenPowerDropmenus = this.getChildrenByPowerCss('powerDropmenu');
		// Inner powerDropmenus - Hold all the power Dropmenus in this menu, including the childrens directly in this menu
		this.innerPowerDropmenus = this.getInnerByPowerCss('powerDropmenu');

		// Define the position to show all the dropmenus
		// The dropmenus directly on the menu may start as a dropdown or dropup and the children dropmenus may start on left or right
		for (const dropmenu of this.innerPowerDropmenus) {
			if (dropmenu.isRootElement) {
				defineRootDropmenusPosition(this, dropmenu);
			} else {
				defineInnerDropmenusPosition(this, dropmenu);
			}
		}

		// Menu subscribe to any action to allow "windows like" behaviour on Power dropmenus
		// When click the first menu item on Windows and Linux, the other Power dropmenus opens on hover
		for (const action of this.childrenPowerActions) {
			// Only atach the windows like behaviour if not a touchdevice
			if (!this.$powerUi.touchdevice) {
				action.subscribe({event: 'click', fn: this.hoverModeOn, menu: this});
				action.subscribe({event: 'toggle', fn: this.maySetHoverModeOff, menu: this});
			}
		}
	}

	hoverModeOn(ctx, event, params) {
		for (const action of params.menu.childrenPowerActions) {
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
		for (const action of params.menu.innerPowerActionsWithoutChildren) {
			if (action._$pwActive) {
				action.toggle();
			}
		}
		// Close any first level possible active dropmenu if not the current dropmenu
		for (const action of params.menu.childrenPowerActions) {
			if (action._$pwActive && (action.id !== params.action.id)) {
				action.toggle();
			}
		}
	}

	maySetHoverModeOff(ctx, event, params) {
		setTimeout(function() {
			let someDropdownIsOpen = false;
			// See if there is any childrenPowerActions active
			for (const action of params.menu.childrenPowerActions) {
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
		for (const action of params.menu.childrenPowerActions) {
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

class Request {
	constructor(config) {
		const self = this;
		return function (d) {
			d.withCredentials = d.withCredentials === undefined ? true : d.withCredentials;
			d.headers = d.headers || config.headers || {};
			if (config.authCookie) {
				d.headers['Authorization'] = getCookie(config.authCookie) || null;
			}
			console.log('headers', d.headers);
			const promise = {
				then: function (onsucess) {
					this.onsucess = onsucess;
					return this;
				}, catch: function (onerror) {
					this.onerror = onerror;
					return this;
				}
			};
			self.ajaxRequest({
				method: d.method,
				url: d.url,
				data: d,
				onsucess: function (xhr) {
					if (promise.onsucess) {
						try {
							return promise.onsucess(JSON.parse(xhr.response), xhr);
						} catch {
							return promise.onsucess(xhr.response, xhr);
						}
					}
					return promise;
				},
				onerror: function (xhr) {
					if (promise.onerror) {
						try {
							return promise.onerror(JSON.parse(xhr.response), xhr);
						} catch {
							return promise.onerror(xhr.response, xhr);
						}
					}
				},
			});
			return promise;
		}
	}

	encodedParams(object) {
		var encodedString = '';
		for (var prop in object) {
			if (object.hasOwnProperty(prop)) {
				if (encodedString.length > 0) {
					encodedString += '&';
				}
				encodedString += encodeURI(prop + '=' + object[prop]);
			}
		}
		return encodedString;
	}

	ajaxRequest({method, url, onsucess, onerror, async, data}) {
		if (async === undefined || async === null) {
			async = true;
		}
		const xhr = new XMLHttpRequest();
		xhr.open(method, url, async);
		xhr.onload = function() {
			if (xhr.status === 200 && onsucess) {
				onsucess(xhr);
			} else if (xhr.status !== 200 && onerror) {
				onerror(xhr);
			} else {
				window.console('Request failed.  Returned status of ' + xhr.status);
			}
		}
		if (method && method.toUpperCase() === 'POST')
			xhr.setRequestHeader('Content-Type', 'application/json');
		else {
			xhr.setRequestHeader('Content-Type', 'text/html');
		}
		if (data.headers && data.headers['Content-Type'])
			xhr.setRequestHeader('Content-Type', data.headers['Content-Type']);
		if (data && data.body) {
			xhr.send(JSON.stringify(data.body));
		} else {
			xhr.send();
		}
		return xhr;
	}
}

class Router {
	constructor(config={}, powerUi) {
		this.config = config;
		this.$powerUi = powerUi;
		this.routes = {};
		this.oldComponentRoutes = [];
		this.currentRoute = {
			params: [],
			id: '',
			componentRoutes: [],
		};
		if (!this.config.rootRoute) {
			this.config.rootRoute = '#!/';
		}
		if (config.routes) {
			for (const route of config.routes) {
				this.add(route);
			}
		}
		this.init();

		// call init if hash change
		window.onhashchange = this.hashChange.bind(this);
	}

	add({id, route, template, callback, viewId}) {
		// Ensure user have a element to render the main view
		// If the user doesn't define an id to use as main view, "main-view" will be used as id
		if (!this.config.routerMainViewId && this.config.routerMainViewId !== false) {
			this.config.routerMainViewId = 'main-view';
			// If there are no element with the id defined to render the main view throw an error
			if (!document.getElementById(this.config.routerMainViewId)) {
				throw new Error('The router needs a element with an ID to render views, you can define some HTML element with the id "main-view" or set your on id in the config using the key "routerMainViewId" with the choosen id. If you not want render any view in a main view, set the config key "routerMainViewId" to false and a "viewId" flag to each route with a view.');
			}
		}
		// If the user doesn't define an id to use as component view, "component-view" will be used as id
		if (!this.config.routerComponentViewId && this.config.routerComponentViewId !== false) {
			this.config.routerComponentViewId = 'component-view';
			// If there are no element with the id defined to render the component view throw an error
			if (!document.getElementById(this.config.routerComponentViewId)) {
				throw new Error('The router needs a element with an ID to render views, you can define some HTML element with the id "component-view" or set your on id in the config using the key "routerComponentViewId" with the choosen id. If you not want render any view in a component view, set the config key "routerComponentViewId" to false and a "viewId" flag to each route with a view.');
			}
		}
		// Ensure that the parameters are not empty
		if (!id) {
			throw new Error('A route ID must be given');
		}
		if (!route && !template && !callback) {
			throw new Error('route, template or callback must be given');
		}
		if (this.config.routerMainViewId === false && template && !viewId) {
			throw new Error(`You set the config flag "routerMainViewId" to false, but do not provide a custom "viewId" to the route "${route}" and id "${id}". Please define some element with some id to render the template, and pass it as "viewId" paramenter to the router.`);
		}
		if (this.config.routerComponentViewId === false && template && !viewId) {
			throw new Error(`You set the config flag "routerComponentViewId" to false, but do not provide a custom "viewId" to the route "${route}" and id "${id}". Please define some element with some id to render the template, and pass it as "viewId" paramenter to the router.`);
		}
		// Ensure that the parameters have the correct types
		if (typeof route !== "string") {
			throw new TypeError('typeof route must be a string');
		}
		if (callback && (typeof callback !== "function")) {
			throw new TypeError('typeof callback must be a function');
		}

		// Rewrite root route difined as '/' to an empty string so the final route can be '#!/'
		if (route === '/') {
			route = '';
		}

		const entry = {
			route: this.config.rootRoute + route,
			callback: callback || null,
			template: template || null,
			viewId: viewId || null,
		};
		// throw an error if the route already exists to avoid confilicting routes
		// the "otherwise" route can be duplicated only if it do not have a template
		if (id !== 'otherwise' || template) {
			for (const routeId in this.routes) {
				// the "otherwise" route can be duplicated only if it do not have a template
				if (this.routes[routeId].route === entry.route && (routeId !== 'otherwise' || this.routes[routeId].template)) {
					if (routeId === 'otherwise' || id === 'otherwise') {
						throw new Error(`the route "${route || '/'}" already exists, so "${id}" can't use it if you use a template. You can remove the template or use another route.`);
					} else {
						throw new Error(`the route "${route || '/'}" already exists, so "${id}" can't use it.`);
					}
				}
			}
		}
		// throw an error if the route id already exists to avoid confilicting routes
		if (this.routes[id]) {
			throw new Error(`the id ${route.id} already exists`);
		} else {
			this.routes[id] = entry;
		}
	}

	// Copy the current open component route, and init the router with the new route
	hashChange(event) {
		this.oldComponentRoutes = [];
		for (const route of this.currentRoute.componentRoutes) {
			this.oldComponentRoutes.push(route);
		}
		this.currentRoute.componentRoutes = []; // Clean current routes
		this.init({onHashChange: event});
	}
	// Match the current window.location to a route and call the necessary template and callback
	// If location doesn't have a hash, redirect to rootRoute
	// the componentRoute param allows to manually match component routes
	init({componentRoute, onHashChange}={}) {
		const routeParts = this.extractRouteParts(componentRoute || window.location.hash || this.config.rootRoute);

		for (const routeId in this.routes) {
			// Only run if not otherwise or if the otherwise have a template
			if (routeId !== 'otherwise' || this.routes[routeId].template) {
				// If the route have some parameters get it /some_page/:page_id/syfy/:title
				const paramKeys = this.getRouteParamKeys(this.routes[routeId].route);
				let regEx = this.buildRegExPatternToRoute(routeId, paramKeys);
				// our route logic is true,
				if (routeParts.path.match(regEx)) {
					if (!componentRoute) {
						// Load main route
						this.loadRoute({routeId: routeId, paramKeys: paramKeys, viewId: this.config.routerMainViewId});
						this.setMainRouteState({routeId: routeId, paramKeys: paramKeys});
						// Recursively run the init for each possible componentRoute
						for (const compRoute of routeParts.componentRoutes) {
							this.init({componentRoute: compRoute});
						}
						// After create all new component views remove the old ones if needed
						this.closeOldComponentViews();
						return true;
					} else {
						// Load component route if not already open
						// Check if the route already open as old route or as new route
						const thisRoute = componentRoute.replace(this.config.rootRoute, '');
						const oldComponentRoute = this.oldComponentRoutes.find(r=>r && r.route === thisRoute);
						const newComponentRoute = this.currentRoute.componentRoutes.find(r=>r && r.route === thisRoute);
						if (!oldComponentRoute && !newComponentRoute) {
							const componentViewId = this.loadComponentRoute({routeId: routeId, paramKeys: paramKeys, routerComponentViewId: this.config.routerComponentViewId});
							this.setComponentRouteState({routeId: routeId, paramKeys: paramKeys, componentRoute: componentRoute, componentViewId: componentViewId});
						} else {
							// If the newComponentRoute it already on the list do nothing
							// Only add if it is only on oldComponentRoute list
							if (!newComponentRoute) {
								this.currentRoute.componentRoutes.push(oldComponentRoute);
							}
						}
						console.log('router', this);
					}
				}
			}
		}
		// otherwise
		// (doesn't run otherwise for component routes)
		if (!componentRoute) {
			const newRoute = this.routes['otherwise'] ? this.routes['otherwise'].route : this.config.rootRoute;
			window.location.replace(newRoute);
		}
	}

	// Only close the old component views that are not also in the currentRoute.componentRoutes
	closeOldComponentViews() {
		for (const route of this.oldComponentRoutes) {
			if (!this.currentRoute.componentRoutes.find(r=>r.route === route.route)) {
				this.removeComponentView({componentViewId: route.componentViewId});
			}
		}
	}

	removeComponentView({componentViewId}) {
		const node = document.getElementById(componentViewId);
		node.parentNode.removeChild(node);
	}

	loadRoute({routeId, paramKeys, viewId}) {
		// If have a template to load let's do it
		if (this.routes[routeId].template && !this.config.noRouterViews) {
			// If user defines a custom vieId to this route, but the router don't find it alert the user
			if (this.routes[routeId].viewId && !document.getElementById(this.routes[routeId].viewId)) {
				throw new Error(`You defined a custom viewId "${this.routes[routeId].viewId}" to the route "${this.routes[routeId].route}" but there is no element on DOM with that id.`);
			}
			this.$powerUi.loadHtmlView(this.routes[routeId].template, this.routes[routeId].viewId || viewId);
		}
		// If have a callback run it
		if (this.routes[routeId].callback) {
			return this.routes[routeId].callback.call(this, this.routes[routeId]);
		}
	}
	loadComponentRoute({routeId, paramKeys, routerComponentViewId}) {
		// Create a new element to this view and add it to component-view element (where all component views are)
		const newViewNode = document.createElement('div');
		const viewId = getIdAndCreateIfDontHave(newViewNode);
		newViewNode.id = viewId;
		document.getElementById(routerComponentViewId).appendChild(newViewNode);
		// Load the route inside the new element view
		this.loadRoute({routeId: routeId, paramKeys: paramKeys, viewId: viewId});
		return viewId;
	}

	setMainRouteState({routeId, paramKeys}) {
		// Register current route id
		this.currentRoute.id = routeId;
		// Register current route parameters keys and values
		if (paramKeys) {
			this.currentRoute.params = this.getRouteParamValues({routeId: routeId, paramKeys: paramKeys});
		}
	}
	setComponentRouteState({routeId, paramKeys, componentRoute, componentViewId}) {
		const route = {
			params: [],
			id: '',
			route: componentRoute.replace(this.config.rootRoute, ''),
			componentViewId: componentViewId,
		}
		// Register current route id
		route.id = routeId;
		// Register current route parameters keys and values
		if (paramKeys) {
			route.params = this.getRouteParamValues({routeId: routeId, paramKeys: paramKeys, componentRoute: componentRoute});
		}
		this.currentRoute.componentRoutes.push(route);
	}

	extractRouteParts(path) {
		const routeParts = {
			path: path,
			componentRoutes: [],
		};
		if (path.includes('?')) {
			const splited = path.split('?');
			routeParts.path = splited[0];
			for (const part of splited) {
				if (part.includes('cr=')) {
					for (const fragment of part.split('cr=')) {
						if (fragment) {
							routeParts.componentRoutes.push(this.config.rootRoute + fragment);
						}
					}
				}
			}
		}
		return routeParts;
	}

	buildRegExPatternToRoute(routeId, paramKeys) {
		// This regular expression below avoid detect /some_page_2 and /some_page as the same route
		// allow all [^]*
		let regEx = new RegExp(`^${this.routes[routeId].route}$`);
		// If the route have some parameters like in /some_page/:page_id/syfy/:title
		// the code bellow modify the regEx pattern to allow (alphanumeric plus _ and -) values by
		// replacing the param keys :page_id and :title with the regex [a-zA-Z0-9_-]+
		if (paramKeys) {
			// replace the keys on regEx with a kegex to allow any character
			let newRegEx = regEx.toString();
			// Trim first and last char from regex string
			newRegEx = newRegEx.substring(1);
			newRegEx = newRegEx.slice(0, -1);

			for (const key of paramKeys) {
				// [a-zA-Z0-9_-]+ (alphanumeric plus _ and -)
				newRegEx = newRegEx.replace(key, '[a-zA-Z0-9_-]+');
			}
			regEx = new RegExp(newRegEx);
		}
		return regEx;
	}

	getRouteParamKeys(route) {
		const regex = new RegExp(/:[^\s/]+/g);
		return route.match(regex);
	}

	getRouteParamValues({routeId, paramKeys, componentRoute}) {
		const routeParts = this.routes[routeId].route.split('/');
		const hashParts = (componentRoute || window.location.hash || this.config.rootRoute).split('/');
		const params = [];
		for (const key of paramKeys) {
			// Get key and value
			// Also remove any ?cr=route from the value
			params.push({key: key.substring(1), value: hashParts[routeParts.indexOf(key)].replace(/(\?cr=[^]*)/, '')});
		}
		return params;
	}

	getParamValue(key) {
		const param = this.currentRoute.params.find(p => p.key === key);
		return param ? param.value : null;
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

class PowerInterpolation {
	constructor(config={}, powerUi) {
		this.config = config;
		this.$powerUi = powerUi;
		this.startSymbol = config.interpolateStartSymbol || '{{';
		this.endSymbol = config.interpolateEndSymbol || '}}';
	}

	compile(template) {
		return this.replaceInterpolation(template);
	}
	// Add the {{ }} to pow interpolation values
	compileAttrs(template) {
		return this.compile(`{{ ${template } }}`);
	}
	// REGEX {{[^]*?}} INTERPOLETE THIS {{ }}
	standardRegex() {
		const REGEX = `${this.startSymbol}[^]*?${this.endSymbol}`;
		return new RegExp(REGEX, 'gm');
	}

	replaceInterpolation(template) {
		const match = template.match(this.standardRegex());
		if (match) {
			for (const entry of match) {
				const value = this.getInterpolationValue(entry);
				template = template.replace(entry, value);
			}
		}
		return template;
	}

	stripWhiteChars(entry) {
		// Replace multiple spaces with a single one
		let newEntry = entry.replace(/ +(?= )/g,'');
		// Remove all other white chars like tabs and newlines
		newEntry = newEntry.replace(/[\t\n\r]/g,'');
		return newEntry;
	}

	stripInterpolation(entry) {
		// remove interpolation startSymbol
		let newEntry = entry.replace(this.startSymbol,'');
		// Remove interpolation endSymbol
		newEntry = newEntry.replace(this.endSymbol,'');
		return newEntry;
	}

	getInterpolationValue(entry) {
		let newEntry = this.stripWhiteChars(entry);
		newEntry = this.stripInterpolation(newEntry);
		return this.safeEvaluate(newEntry);
	}

	// TODO: This is not really safe, just good to use during ALPHA phase of development
	// remove functions, arrow functions, document.*() and window.*(), script and more
	sanitizeEntry(entry) {
		const REGEXLIST = [
			/function[^]*?\)/gm,
			/function/gm,
			/=>[^]*?/gm,
			/=>/gm,
			/localStorage\.[^]*?\)/gm,
			/localStorage/gm,
			/window\.[^]*?\)/gm,
			/window/gm,
			/document\.[^]*?\)/gm,
			/document/gm,
			/write/gm,
			/console\.[^]*?\)/gm,
			/console/gm,
			/alert[^]*?\)/gm,
			/alert/gm,
			/eval[^]*?\)/gm,
			/eval/gm,
			/request/gm,
			/ajaxRequest/gm,
			/loadHtmlView/gm,
			/XMLHttpRequest/gm,
			/new[^]*?\)/gm,
			/new /gm,
			/<[^]*?script[^]*?>[^]*?<[^]*?\/[^]*?script[^]*?>/gm,
			/script/gm,
			/var [^]*?\=/gm,
			/var /gm,
			/let [^]*?\=/gm,
			/let /gm,
			/const [^]*?\=/gm,
			/const /gm,
		];

		let newEntry = entry;

		for (const regex of REGEXLIST) {
			const match = newEntry.match(new RegExp(regex));
			if (match && match.length) {
				console.log('The template interpolation removes some danger or not allowed entry: ', newEntry);
				newEntry = '';
			}
		}
		return this.safeString(newEntry);
	}

	safeEvaluate(entry) {
		let func;
		let result;
		try {
			func = new Function("return " + this.sanitizeEntry(entry));
			result = func();
		} catch(e) {
			result = '';
		}
		if (result === undefined) {
			return '';
		} else {
			return result;
		}
	}

	safeString(content) {
		const tmp = document.createElement('div');
		tmp.textContent = content;
		return tmp.innerHTML;
	};
}

class PowerView extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-view', isMain: true});

// class PwcPity extends PowCssHover {
// 	constructor(element) {
// 		super(element);
// 		this.$_pwAttrName = 'data-pwc-pity';
// 		this.element = element;
// 		console.log('pwcPity is alive!', this.$_pwAttrName);
// 	}
// }
// Inject the attr on PowerUi
// _PowerUiBase.injectPwc({name: 'data-pwc-pity', callback: function(element) {return new PwcPity(element);}});
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
let app = new PowerUi({
	routes: [
		{
			id: 'front-page',
			route: '/',
			template: 'front_page.html',
		},
		{
			id: 'power-only',
			route: 'power_only',
			template: 'power_only.html',
		},
		{
			id: 'power-only2',
			route: 'power_only/:id/:name',
			template: 'power_only.html',
		},
		{
			id: 'component1',
			route: 'component/:name/:title',
			template: 'somecomponent.html',
		},
		{
			id: 'otherwise',
			route: '404',
			template: '404.html',
		}
	],
});
console.log('app', app);
let myName = 'Eu sou o Pity o bom!';
function pity() {
    return myName;
}
let currentIf = false;
function showIf() {
	currentIf = !currentIf;
	return currentIf;
}
const cats = [
	{name: 'Riquinho', gender: 'male'},
	{name: 'Tico', gender: 'male'},
	{name: 'Drew', gender: 'male'},
	{name: 'Kid', gender: 'male'},
	{name: 'Neo', gender: 'male'},
	{name: 'Pingo', gender: 'male'},
	{name: 'Princesa', gender: 'female'},
	{name: 'Lady', gender: 'female'},
	{name: 'Lindinha', gender: 'female'},
	{name: 'Docinho', gender: 'female'},
	{name: 'Florzinha', gender: 'female'},
	{name: 'Laylita', gender: 'female'},
];
function changeModel() {
	myName = 'My name is Bond, James Bond!';
	console.log(myName, pity(), 'currentIf', currentIf);
	// app.router.hashChange();
	app.init();
}
function powerOnly() {
	window.location.replace(app.router.config.rootRoute + 'power_only');
}
function gotoIndex() {
	window.location.replace(app.router.config.rootRoute);
}
function closeModal() {
	window.location.replace(window.location.hash.split('?')[0]);
}
function openModal() {
	let newHash = '?cr=component/andre/aqueda';
	if (!window.location.hash) {
		newHash = '#!/' + newHash;
	}
	window.location.replace(window.location.hash + newHash);
}

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
// function clickum() {
// 	console.log('um');
// }
// function clickdois() {
// 	console.log('dois');
// }
// function mouseoverum() {
// 	console.log('mouse over 1');
// }
// function mouseoverdois() {
// 	console.log('mouse over 2');
// }
// function mouseoutum() {
// 	console.log('mouseout 1');
// }
// function mouseoutdois() {
// 	console.log('mouseout 2');
// }
// function clicktres() {
// 	console.log('três');
// 	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'click', fn: clickum });
// 	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'click', fn: clickdois });
// 	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'click', fn: clicktres });
// 	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseover', fn: mouseoverum});
// 	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseover', fn: mouseoverdois});
// 	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseout', fn: mouseoutum});
// 	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseout', fn: mouseoutdois});
// }
// app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'click', fn: clickum });
// app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'click', fn: clickdois});
// app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'click', fn: clicktres});
// app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseover', fn: mouseoverum});
// app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseover', fn: mouseoverdois});
// app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseout', fn: mouseoutum});
// app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseout', fn: mouseoutdois});
// window.console.log('power', app);
// window.console.log('panel-0-action', app.powerTree.allPowerObjsById['panel-0-action']);
// var teste = function(e) {
// 	console.log('chamou', this);
// 	this.unsubscribe({event: 'mouseover', fn: teste});
// }
// app.powerTree.allPowerObjsById['panel-0-action'].powerAction.subscribe({event: 'mouseover', fn: teste});
