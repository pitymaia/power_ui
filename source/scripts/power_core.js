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

// converts "data-something-nice" formats to camel case without data,
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
	powAttr.datasetKey = asDataSet(powAttr.name);
	_PowerUiBase._powAttrsConfig.push(powAttr);
};
// The list for user custom pwc-attributes
_PowerUiBase._pwcAttrsConfig = [];
_PowerUiBase.injectPwc = function (pwcAttr) {
	powAttr.datasetKey = asDataSet(powAttr.name);
	_PowerUiBase._pwcAttrsConfig.push(pwcAttr);
};
// The list of power-css-selectors with the config to create the objetc
// Keep main elements on top of list
_PowerUiBase._powerElementsConfig = [];
_PowerUiBase.injectPowerCss = function (powerCss) {
	powerCss.datasetKey = asDataSet(powerCss.name);
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
		this.objetcsWithCompile = this.findObjetcsWithCompile();

		// Sweep DOM to create a temp tree with 'pwc', 'pow' and 'power-' DOM elements and create objects from it
		this.buildTempTreeAndObjects(document);

		// Add navigation element like "main", "parentObj" and "children"
		this.linkElements();
	}

	findObjetcsWithCompile() {
		const objetcsWithCompile = [];
		for (const index of Object.keys(_PowerUiBase._powAttrsConfig || {})) {
			const test = _PowerUiBase._powAttrsConfig[index].callback(document.createElement('div'));
			if (test.compile) {
				objetcsWithCompile.push(_PowerUiBase._powAttrsConfig[index]);
			}
		}
		for (const index of Object.keys(_PowerUiBase._pwcAttrsConfig || {})) {
			const test = _PowerUiBase._pwcAttrsConfig[index].callback(document.createElement('div'));
			if (test.compile) {
				objetcsWithCompile.push(_PowerUiBase._pwcAttrsConfig[index]);
			}
		}

		return objetcsWithCompile;
	}

	buildTempTreeAndObjects(node) {
		const tempTree = {
			powerCss: {},
			powAttrs: {},
			pwcAttrs: {},
			pending: [],
		};
		// Sweep FOM to create a temp tree with simple DOM elements that contais 'pwc', 'pow' and 'power-' prefixes
		this.sweepDOM(node, tempTree, this._buildTempPowerTree.bind(this), false);

		// Interpolate the body: Replace any remaing {{ interpolation }} with <span data=pow-bind="interpolation">interpolation</span> and add it to tempTree
		const body = document.getElementsByTagName('BODY')[0];
		body.innerHTML = this.$powerUi.interpolation.interpolationToPowBind(body.innerHTML, tempTree);

		// Add eny pending element created by the interpolationToPowBind method
		for (const id of tempTree.pending) {
			if (!tempTree.powAttrs.powBind) {
				tempTree.powAttrs.powBind = {};
			}
			tempTree.powAttrs.powBind[id] = document.getElementById(id);
		}
		tempTree.pending = [];

		// Create the power-css and pow/pwc attrs objects from DOM elements
		for (const attribute of Object.keys(tempTree || {})) {
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

	linkElements() {
		this._addSharingElement();

		// Sweep allPowerObjsById to add parent and childrens to each power element
		this._likeInDOM();
	}

	// Sweep allPowerObjsById to add parent and childrens to each power element
	_likeInDOM() {
		for (const id of Object.keys(this.allPowerObjsById || {})) {
			for (const powerSelector of Object.keys(this.allPowerObjsById[id] || {})) {
				const currentObj = this.allPowerObjsById[id][powerSelector];
				if (powerSelector !== '$shared' && !currentObj.parent) {
					// Search a powerElement parent of currentObj up DOM if exists
					const searchParentResult = PowerTree._searchUpDOM(currentObj.element, PowerTree._checkIfhavePowerParentElement);
					// Get the main and view elements of the currentObj
					const currentMainElement = this._getMainElementFromChildElement(currentObj.element);
					const currentViewElement = this._getViewElementFromChildElement(currentObj.element);
					// Loop through the list of possible main CSS power class names like power-menu or power-main
					// With this we will find the main powerElement that holds the simple DOM node main element
					if (currentMainElement) {
						for (const mainPowerElementConfig of PowerUi._powerElementsConfig.filter(a => a.isMain === true)) {
							const powerMain = this.powerCss[mainPowerElementConfig.datasetKey][currentMainElement.id];
							if (this.powerCss[mainPowerElementConfig.datasetKey] && powerMain) {
								currentObj.$pwMain = powerMain;
							}
						}
					}

					// Add the mainView to element
					if (currentViewElement) {
						const powerView = this.powerCss['powerView'][currentViewElement.id];
						currentObj.$pwView = powerView;
					}

					// If searchParentResult is true and not returns the same element add parent and child
					// Else it is a rootElement
					if (searchParentResult.conditionResult && searchParentResult.powerElement.id !== currentObj.element.id) {
						const parentElement = searchParentResult.powerElement;
						for (const parentIndex of Object.keys(this.allPowerObjsById[parentElement.id] || {})) {
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
				const obj = this.allPowerObjsById[element.id][selector.datasetKey];
				innerPowerCss.push(obj);
			}
		}
		return innerPowerCss;
	}

	// Sweep through each node and pass the node to the callback
	sweepDOM(entryNode, ctx, callback, isInnerOfTarget) {
		const isNode = !!entryNode && !!entryNode.nodeType;
		const hasChildren = !!entryNode.childNodes && !!entryNode.childNodes.length;

		if (isNode && hasChildren) {
			const nodes = entryNode.childNodes;
			for (let i=0; i < nodes.length; i++) {
				const currentNode = nodes[i];

				// Call back with any condition to apply
				// The callback Recursively call seepDOM for it's children nodes
				callback(currentNode, ctx, isInnerOfTarget);
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

	// Check is this powerElement is child of some power view
	_getViewElementFromChildElement(element) {
		const searchResult  = PowerTree._searchUpDOM(element, this._checkIfIsViewElement);
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

	// testCondition to find element is a power-view
	_checkIfIsViewElement(currentElement) {
		return (currentElement && currentElement.className && currentElement.classList.contains('power-view'));
	}

	// Compile the current node if the element powerObject have a compile() method
	_compile(currentNode, datasetKey) {
		let compiled = false;
		// Create a temp version of all powerObjects with compile methods
		for (const selector of this.objetcsWithCompile) {
			if (selector.datasetKey === datasetKey) {
				// Check if not already compiled
				if (!currentNode.getAttribute('data-pwcompiled')) {
					const id = getIdAndCreateIfDontHave(currentNode);
					const newObj = selector.callback(currentNode);
					// Add to any element some desired variables
					newObj.id = id;
					newObj.$powerUi = this.$powerUi;
					newObj.compile();
					newObj.element.setAttribute('data-pwcompiled', true);
					compiled = true;
				}
			}
		}
		return compiled;
	}

	// Recursively call all children and inner (children of children) powerObject compile()
	_removeChildrenObjects({children=[], tempPowerObjsById}) {
		for (const child of children) {
			if (tempPowerObjsById[child.id]) {
				// call this for the children
				this._removeChildrenObjects(child.children || []);
				// Remove this
				tempPowerObjsById[child.id] = null;
			}
		}
	}

	_callInit() {
		for (const id of Object.keys(this.allPowerObjsById || {})) {
			// Call init for all elements
			for (const attr of Object.keys(this.allPowerObjsById[id] || {})) {
				if (this.allPowerObjsById[id][attr].init) {
					this.allPowerObjsById[id][attr].init();
				}
			}
		}
	}

	// Register power attrs and classes sharing the same element
	_addSharingElement() {
		for (const id of Object.keys(this.allPowerObjsById || {})) {
			// if Object.keys(obj).length add the inSameElement for each objects
			if (Object.keys(this.allPowerObjsById[id] || {}).length > 1) {
				for (const attr of Object.keys(this.allPowerObjsById[id] || {})) {
					// Don't add inSameElement to $shared
					if (attr != '$shared') {
						if (!this.allPowerObjsById[id][attr].inSameElement) {
							this.allPowerObjsById[id][attr].inSameElement = {};
						}
						// To avoid add this element as a sibling of it self we need iterate over attrs again
						for (const siblingAttr of Object.keys(this.allPowerObjsById[id] || {})) {
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

	// This creates the powerTree with all the power objects attached to the DOM
	// It uses the simple elements of _buildTempPowerTree to get only the power elements
	_buildObjcsFromTempTree(ctx, attribute, selector, tempTree) {
		const datasetKey = selector.datasetKey;
		// Hold all element of a power kind (powerCss, powAttr or pwcAttr)
		const currentTempElementsById = tempTree[attribute][datasetKey];
		if (currentTempElementsById) {
			for (const id of Object.keys(currentTempElementsById || {})) {
				if (!ctx[attribute][datasetKey]) {
					ctx[attribute][datasetKey] = {};
				}

				// If there is a method like _powerMenu allow it to be extended, call the method like _powerMenu()
				// If is some pow-attribute or pwc-attribute use 'powerAttrs' flag to call some class using the callback
				const functionName = !!ctx.$powerUi[`_${datasetKey}`] ? `_${datasetKey}` : 'powerAttrs';
				if (functionName === 'powerAttrs') {
					// Add into a list ordered by attribute name
					// ctx[attribute][datasetKey][id] = selector.callback(currentTempElementsById[id]);
					ctx[attribute][datasetKey][id] = selector.callback(document.getElementById(id));
				} else {
					// Call the method for create objects like _powerMenu with the node elements in tempTree
					// uses an underline plus the camelCase selector to call _powerMenu or other similar method on 'ctx'
					// E. G. , ctx.powerCss.powerMenu.topmenu = ctx.$powerUi._powerMenu(topmenuElement);
					// ctx[attribute][datasetKey][id] = ctx.$powerUi[functionName](currentTempElementsById[id]);
					ctx[attribute][datasetKey][id] = ctx.$powerUi[functionName](document.getElementById(id));
				}
				// Add the same element into a list ordered by id
				if (!ctx.allPowerObjsById[id]) {
					ctx.allPowerObjsById[id] = {};
				} else {
					// It only test if id exists in DOM when it already exists in allPowerObjsById, so this is not a slow code
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
	_buildTempPowerTree(currentNode, ctx, isInnerOfTarget) {
		isInnerOfTarget = isInnerOfTarget || false;
		let hasCompiled = false;
		// Check if has the custom data-pwc and data-pow attributes
		if (currentNode.dataset) {
			for (const datasetKey of Object.keys(currentNode.dataset || {})) {
				for(const prefixe of ['pwc', 'pow']) {
					const hasPrefixe = datasetKey.startsWith(prefixe);
					if (hasPrefixe) {
						// Call powerObject compile that may create new children nodes
						hasCompiled = this._compile(currentNode, datasetKey);

						const attributeName = `${prefixe}Attrs`; // pwcAttrs or powAttrs
						const currentId = getIdAndCreateIfDontHave(currentNode);
						if (!ctx[attributeName][datasetKey]) {
							ctx[attributeName][datasetKey] = {};
						}
						ctx[attributeName][datasetKey][currentId] = currentNode;
					}
				}
			}
		}
		// Check for power css class selectors like "power-menu" or "power-label"
		if (currentNode.className && currentNode.className.includes('power-')) {
			for (const selector of PowerUi._powerElementsConfig) {
				if (currentNode.classList.contains(selector.name)) {
					const currentId = getIdAndCreateIfDontHave(currentNode);
					if (!ctx.powerCss[selector.datasetKey]) {
						ctx.powerCss[selector.datasetKey] = {};
					}
					ctx.powerCss[selector.datasetKey][currentId] = currentNode;
				}
			}
		}

		const currentNodeHaschildren = !!currentNode.childNodes && !!currentNode.childNodes.length;
		// Recursively sweep through currentNode children
		if (currentNodeHaschildren) {
			// isInnerOfTarget detects if this is the root object with compile()
			if (hasCompiled || isInnerOfTarget) {
				this.sweepDOM(currentNode, ctx, this._buildTempPowerTree.bind(this), true);
			} else {
				this.sweepDOM(currentNode, ctx, this._buildTempPowerTree.bind(this), false);
			}
		}
		// If hasCompiled and is the root element with a compile() method call interpolation compile
		// This will make the interpolation of elements with compile without replace {{}} to <span data-pow-bind></span>
		if (hasCompiled && !isInnerOfTarget) {
			currentNode.innerHTML = this.$powerUi.interpolation.compile(currentNode.innerHTML);
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
