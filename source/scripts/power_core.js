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


class SharedScope {
	constructor({id, main, view, rootCompiler, powerUi}) {
		this.id = id;
		this.tempMainEl = main;
		this.tempViewEl = view;
		this.tempRootCompilerEl = rootCompiler;
		this.$powerUi = powerUi;
		this.cached = {};
	}

	get element() {
		return document.getElementById(this.id);
	}

	get main() {
		return this.tempMainEl ? document.getElementById(this.tempMainEl.id) : null;
	}

	get view() {
		return this.tempViewEl ? document.getElementById(this.tempViewEl.id) : null;
	}

	get rootCompiler() {
		return document.getElementById(this.tempRootCompilerEl.id);
	}

	get mainObj() {
		const flag = 'isMain';
		return this.cached[flag] || this.getTarget(this.main.id, flag);
	}
	get viewObj() {
		const flag = 'isView';
		return this.cached[flag] || this.getTarget(this.view.id, flag);
	}
	getTarget(id, flag) {
		if (!id) {
			return false;
		}
		if (this.cached[flag] === undefined) {
			for (const key of Object.keys(this.$powerUi.powerTree.allPowerObjsById[id] || {})) {
				if (this.$powerUi.powerTree.allPowerObjsById[id][key][flag]) {
					this.cached[flag] = this.$powerUi.powerTree.allPowerObjsById[id][key];
					return this.cached[flag];
				}
			}
			this.cached[flag] = false;
		} else {
			return this.cached[flag];
		}
	}
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
// Keep main elements on top of the list
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
		// During startup (class constructor and compile method) we use the tempEl
		// After this the DOM changes so we get the element direct from DOM using this.$shared.element getter
		this.tempEl = element;
		this._$pwActive = false;
	}

	get id() {
		return this.element.id || null;
	}

	set id(id) {
		this.element.id = id;
	}

	get element() {
		return this.$shared ? this.$shared.element : this.tempEl;
	}

	get $pwMain() {
		return this.$shared ? this.$shared.mainObj : null;
	}

	get $pwView() {
		return this.$shared ? this.$shared.viewObj : null;
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
	// Remove all power inner elements from this.$powerUi.powerTree.allPowerObjsById
	removeInnerElements() {
		const childNodes = this.element.childNodes;
		for (const child of childNodes) {
			if (child.id && this.$powerUi.powerTree.allPowerObjsById[child.id]) {
				this.$powerUi.powerTree.allPowerObjsById[child.id] = null;
			}
		}
		this.element.innerHTML = '';
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
		this.allPowerObjsById = {};
		this.rootElements = [];
		this.rootCompilers = {};
		this.attrsConfig = {};

		for (const attr of _PowerUiBase._powAttrsConfig) {
			const test = attr.callback(document.createElement('div'));
			if (test.compile) {
				attr.isCompiler = true;
			}
			this.attrsConfig[attr.datasetKey] = attr;
		}
		for (const attr of _PowerUiBase._pwcAttrsConfig) {
			const test = attr.callback(document.createElement('div'));
			if (test.compile) {
				attr.isCompiler = true;
			}
			this.attrsConfig[attr.datasetKey] = attr;
		}

		// Sweep DOM to create a temp tree with 'pwc', 'pow' and 'power-' DOM elements and create objects from it
		this.buildAll(document);

		// Add navigation element like "main", "view" and "parent"
		this._likeInDOM();
	}

	buildAll(node) {
		node = node || document;

		this.sweepDOM({
			entryNode: node,
			callback: this.buildPowerObjects.bind(this),
			isInnerCompiler: false,
		});

		const tempTree = {pending: []};
		const body = document.getElementsByTagName('BODY')[0];
		body.innerHTML = this.$powerUi.interpolation.interpolationToPowBind(body.innerHTML, tempTree);
		for (const id of tempTree.pending) {
			const powerObject = this.attrsConfig['powBind'].callback(document.getElementById(id));
			// Add the powerObject into a list ordered by id
			this._addToObjectsById({powerObject: powerObject, id: id, datasetKey: 'powBind'});
		}
	}

	buildPowerObjects({currentNode, main, view, isInnerCompiler, pending, rootCompiler}) {
		let hasCompiled = false;
		let currentObjects = [];
		isInnerCompiler = isInnerCompiler || false;
		pending = [];

		main = main || false;
		// If currentNode is main the main variable may change to the children and we need save the main for this node in oldMain
		const oldMain = main;
		view = view || false;
		// If currentNode is a view the view variable may change to the children and we need save the view for this node in oldView
		const oldView = view;
		let isMain = false;

		// Check if has the custom data-pwc and data-pow attributes
		if (currentNode.dataset) {
			for (const datasetKey of Object.keys(currentNode.dataset || {})) {
				for(const prefixe of ['pwc', 'pow']) {
					const hasPrefixe = datasetKey.startsWith(prefixe);
					if (hasPrefixe) {
						// Call powerObject compile that may create new children nodes
						hasCompiled = this._compile({
							currentNode: currentNode,
							datasetKey: datasetKey,
							isInnerCompiler: isInnerCompiler,
						});
						if (hasCompiled && !rootCompiler) {
							rootCompiler = currentNode;
						}
						// Save this node as main of it's children
						if (this.attrsConfig[datasetKey] && this.attrsConfig[datasetKey].isMain) {
							main = currentNode;
							isMain = true;
						}
						// Select this datasetKey to create a powerObject with currentNode
						currentObjects.push({
							datasetKey: datasetKey,
							node: currentNode,
							main: oldMain,
							view: oldView,
							rootCompiler: isInnerCompiler ? rootCompiler : null,
							isMain: isMain
						});
					}
				}
			}
		}

		// Check for power css class selectors like "power-menu" or "power-label"
		if (currentNode.className && currentNode.className.includes('power-')) {
			for (const selector of PowerUi._powerElementsConfig) {
				if (currentNode.classList.contains(selector.name)) {
					if (selector.isMain) {
						main = currentNode;
						isMain = true;
					}
					if (selector.datasetKey === 'powerView') {
						view = currentNode;
					}
					// Select this datasetKey to create a powerObject with currentNode
					currentObjects.push({
						datasetKey: selector.datasetKey,
						node: currentNode,
						main: oldMain,
						view: oldView,
						rootCompiler: isInnerCompiler ? rootCompiler : null,
						isMain: isMain,
					});
				}
			}
		}

		const currentNodeHaschildren = !!currentNode.childNodes && !!currentNode.childNodes.length;
		// Recursively sweep through currentNode children
		if (currentNodeHaschildren) {
			// params.isInnerCompiler detects if this is NOT the root object with compile()
			if (hasCompiled || isInnerCompiler) {
				this.sweepDOM({
					entryNode: currentNode,
					callback: this.buildPowerObjects.bind(this),
					isInnerCompiler: true,
					main: main,
					view: view,
					rootCompiler: rootCompiler,
					pending: pending,
				});
			} else {
				this.sweepDOM({
					entryNode: currentNode,
					callback: this.buildPowerObjects.bind(this),
					isInnerCompiler: false,
					main: main,
					view: view,
					rootCompiler: rootCompiler,
					pending: pending,
				});
			}
		}

		// If hasCompiled and is the root element with a compile() method call interpolation compile
		// This will make the interpolation of elements with compile without replace {{}} to <span data-pow-bind></span>
		if (hasCompiled && !isInnerCompiler) {
			// Has compiled contains the original node.innerHTML and we need save it
			this.rootCompilers[currentNode.id] = hasCompiled;
			currentNode.innerHTML = this.$powerUi.interpolation.compile(currentNode.innerHTML);
		}
		if ((currentObjects.length > 0 && !hasCompiled) || (hasCompiled && isInnerCompiler)) {
			for (const item of currentObjects) {
				this._instanciateObj({
					currentElement: item.node,
					datasetKey: item.datasetKey,
					main: item.main,
					view: item.view,
					rootCompiler: item.rootCompiler,
					isMain: item.isMain,
				});
			}
			currentObjects = [];
		} else {
			// If is some inner compiler save it for instanciate later
			for (const item of currentObjects) {
				pending.push(item);
			}
		}
	}

	_compile({currentNode, datasetKey, isInnerCompiler}) {
		let compiled = false;
		// Create a temp version of all powerObjects with compile methods
		if (this.attrsConfig[datasetKey] && this.attrsConfig[datasetKey].isCompiler) {
			// Check if not already compiled
			if (!currentNode.getAttribute('data-pwcompiled')) {
				const id = getIdAndCreateIfDontHave(currentNode);
				const newObj = this.attrsConfig[datasetKey].callback(currentNode);
				// Add to any element some desired variables
				newObj.id = id;
				newObj.$powerUi = this.$powerUi;
				// If is the root element save the original innerHTML, if not only return true
				compiled = !isInnerCompiler ? currentNode.innerHTML : true;
				newObj.compile();
				newObj.element.setAttribute('data-pwcompiled', true);
			}
		}
		return compiled;
	}

	_instanciateObj({currentElement, datasetKey, main, view, rootCompiler, isMain}) {
		const id = getIdAndCreateIfDontHave(currentElement);
		// If there is a method like _powerMenu allow it to be extended, call the method like _powerMenu()
		// If is some pow-attribute or pwc-attribute use 'powerAttrs' flag to call some class using the callback
		const functionName = !!this.$powerUi[`_${datasetKey}`] ? `_${datasetKey}` : 'powerAttrs';
		let powerObject;
		if (functionName === 'powerAttrs') {
			if (this.attrsConfig[datasetKey]) {
				// Create powerObject from pow or pwc attrs
				powerObject = this.attrsConfig[datasetKey].callback(document.getElementById(id));
			} else {
				// If this is not a real power-someting class or pow/pwc attr, just return
				// A current example of this id the powerTarget css with is not a Power class object
				return;
			}
		} else {
			// Call the method for create objects like _powerMenu with the node elements in tempTree
			// uses an underline plus the camelCase selector to call _powerMenu or other similar method on 'this.$powerUi'
			// E. G. , this.powerCss.powerMenu.topmenu = this.$powerUi._powerMenu(topmenuElement);
			// Create powerObject from pow or pwc attrs it will create powerObject from class name like power-menu or power-view
			powerObject = this.$powerUi[functionName](document.getElementById(id));
		}
		// Register if object is main object
		powerObject.isMain = isMain || null;
		// Add the powerObject into a list ordered by id
		this._addToObjectsById({
			powerObject: powerObject,
			id: id,
			datasetKey: datasetKey,
			main: main,
			view: view,
			rootCompiler: rootCompiler,
		});
	}

	// Add the powerObject into a list ordered by id
	_addToObjectsById({powerObject, id, datasetKey, main, view, rootCompiler}) {
		if (!this.allPowerObjsById[id]) {
			this.allPowerObjsById[id] = {};
		} else {
			// It only test if id exists in DOM when it already exists in allPowerObjsById, so this is not a slow code
			const selectorToTest = document.querySelectorAll(`[id=${id}]`);
			if (selectorToTest.length > 1) {
				// Check if there is some duplicated ID
				console.error('DUPLICATED IDs:', selectorToTest);
				throw `HTML element can't have duplicated IDs: ${id}`;
			}
		}
		if (!this.allPowerObjsById[id][datasetKey]) {
			this.allPowerObjsById[id][datasetKey] = {};
		}
		this.allPowerObjsById[id][datasetKey] = powerObject;
		// Add to any element some desired variables
		this.allPowerObjsById[id][datasetKey].id = id;
		this.allPowerObjsById[id][datasetKey].datasetKey = datasetKey;
		this.allPowerObjsById[id][datasetKey].$powerCss = datasetKey;
		this.allPowerObjsById[id][datasetKey].$powerUi = this.$powerUi;
		// Create a $shared scope for each element
		if (!this.allPowerObjsById[id].$shared) {
			this.allPowerObjsById[id].$shared = new SharedScope({
				id: id,
				main: main,
				view: view,
				rootCompiler: rootCompiler,
				powerUi: this.$powerUi,
			});
		}
		// add the shared scope to all elements
		this.allPowerObjsById[id][datasetKey].$shared = this.allPowerObjsById[id].$shared;
	}

	sweepDOM({entryNode, callback, isInnerCompiler, main, view, rootCompiler, pending}) {
		const isNode = !!entryNode && !!entryNode.nodeType;
		const hasChildren = !!entryNode.childNodes && !!entryNode.childNodes.length;

		if (isNode && hasChildren) {
			const nodes = entryNode.childNodes;
			for (const currentNode of entryNode.childNodes) {
				// Call back with any condition to apply
				// The callback Recursively call seepDOM for it's children nodes
				callback({
					currentNode: currentNode,
					callback: callback,
					isInnerCompiler: isInnerCompiler,
					main: main,
					view: view,
					rootCompiler: rootCompiler,
					pending: pending,
				});
			}
		} else {
			callback({
				currentNode: entryNode,
				callback: callback,
				isInnerCompiler: isInnerCompiler,
				main: main,
				view: view,
				rootCompiler: rootCompiler,
				pending: pending,
			});
		}
	}

	// Sweep allPowerObjsById to add parent and childrens to each power element
	_likeInDOM() {
		for (const id of Object.keys(this.allPowerObjsById || {})) {
			for (const powerSelector of Object.keys(this.allPowerObjsById[id] || {})) {
				// If have multiple powerSelectors need add shared scope
				if (Object.keys(this.allPowerObjsById[id] || {}).length > 1) {
					// Register power attrs and classes sharing the same element
					this._addSharingScope(id, powerSelector);
				}
				const currentObj = this.allPowerObjsById[id][powerSelector];
				if ((powerSelector !== '$shared' && powerSelector !== '$rootCompiler') && !currentObj.parent) {
					// Search a powerElement parent of currentObj up DOM if exists
					const currentParentElement = this._getParentElementFromChildElement(currentObj.element);
					// Get the main and view elements of the currentObj
					const currentMainElement = this._getMainElementFromChildElement(currentObj.element);
					const currentViewElement = this._getViewElementFromChildElement(currentObj.element);
					// Loop through the list of possible main CSS power class names like power-menu or power-main
					// With this we will find the main powerElement that holds the simple DOM node main element
					if (currentMainElement) {
						for (const mainPowerElementConfig of PowerUi._powerElementsConfig.filter(a => a.isMain === true)) {
							const powerMain = this.allPowerObjsById[currentMainElement.id][mainPowerElementConfig.datasetKey];
							if (powerMain) {
								// currentObj.$pwMain = powerMain;
							}
						}
					}

					// Add the mainView to element
					if (currentViewElement) {
						const powerView = this.allPowerObjsById[currentViewElement.id]['powerView'];
						// currentObj.$pwView = powerView;
					}

					// If searchParentResult is true and not returns the same element add parent and child
					// Else it is a rootElement
					if (currentParentElement && (currentParentElement.id !== currentObj.element.id)) {
						for (const parentIndex of Object.keys(this.allPowerObjsById[currentParentElement.id] || {})) {
							// Only add if this is a power class (not some pow or pwc attr)
							if (parentIndex.includes('power')) {
								// Add parent element to current power object
								const parentObj = this.allPowerObjsById[currentParentElement.id][parentIndex];
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

	_getParentElementFromChildElement(element) {
		const searchResult = PowerTree._searchUpDOM(element, PowerTree._checkIfhavePowerParentElement);
		if (searchResult.conditionResult) {
			return searchResult.powerElement;
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

	// TODO: Remove this shit and replace with a "inSameElement" get method
	// Register power attrs and classes sharing the same element
	_addSharingScope(id, attr) {
		// Don't add inSameElement to $shared
		if (attr !== '$shared' && attr !== '$rootCompiler') {
			if (!this.allPowerObjsById[id][attr].inSameElement) {
				this.allPowerObjsById[id][attr].inSameElement = {};
			}
			// To avoid add this element as a sibling of it self we need iterate over attrs again
			for (const siblingAttr of Object.keys(this.allPowerObjsById[id] || {})) {
				// Also don't add $shared inSameElement
				if (siblingAttr !== attr && (siblingAttr !== '$shared' && siblingAttr !== '$rootCompiler')) {
					this.allPowerObjsById[id][attr].inSameElement[siblingAttr] = this.allPowerObjsById[id][siblingAttr];
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
	let stop = currentElement ? false : true;
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
