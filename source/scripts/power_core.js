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
		this.element = element;
		this._$pwActive = false;
	}

	get id() {
		return this.element.id || null;
	}

	set id(id) {
		this.element.id = id;
	}

	// get element() {
	// 	const element = document.getElementById(this.id);
	// 	console.log('element', element, this.id, this);
	// 	return element;
	// }

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
		this.objetcsWithCompile = this.findObjetcsWithCompile();
		this.attrsConfig = {};

		for (const attr of _PowerUiBase._powAttrsConfig) {
			this.attrsConfig[attr.datasetKey] = attr;
		}
		for (const attr of _PowerUiBase._pwcAttrsConfig) {
			this.attrsConfig[attr.datasetKey] = attr;
		}

		// Sweep DOM to create a temp tree with 'pwc', 'pow' and 'power-' DOM elements and create objects from it
		// this.buildTempTreeAndObjects(document);
		this.buildAll(document);

		// Add navigation element like "main", "view" and "parent"
		this._likeInDOM();
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

	buildAll(node) {
		node = node || document;

		this.newSweepDOM({
			entryNode: node,
			callback: this.buildPowerObjects.bind(this),
			isInnerCompiler: false,
		});

		const tempTree = {pending: []};
		const body = document.getElementsByTagName('BODY')[0];
		body.innerHTML = this.$powerUi.interpolation.interpolationToPowBind(body.innerHTML, tempTree);
		for (const id of tempTree.pending) {
			const powerObject = this.attrsConfig['powBind'].callback(document.getElementById(id));
			// Add the same element into a list ordered by id
			this._addToObjectsById({powerObject: powerObject, id: id, datasetKey: 'powBind'});
		}

		for (const id of Object.keys(this.allPowerObjsById || {})) {
			for (const datasetKey of Object.keys(this.allPowerObjsById[id] || {})) {
				if (this.allPowerObjsById[id][datasetKey].element) {
					this.allPowerObjsById[id][datasetKey].element = document.getElementById(id);
				}
			}
		}
	}

	buildPowerObjects({currentNode, main, view, isInnerCompiler, pending}) {
		let hasCompiled = false;
		let isMain = false;
		let currentObjects = [];
		isInnerCompiler = isInnerCompiler || false;
		pending = [];

		// Check for power css class selectors like "power-menu" or "power-label"
		if (currentNode.className && currentNode.className.includes('power-')) {
			for (const selector of PowerUi._powerElementsConfig) {
				if (currentNode.classList.contains(selector.name)) {
					if (selector.isMain) {
						isMain = true;
						main = currentNode;
					}
					// Select this datasetKey to create a powerObject with currentNode
					currentObjects.push({datasetKey: selector.datasetKey, node: currentNode});
				}
			}
		}
		// Check if has the custom data-pwc and data-pow attributes
		if (currentNode.dataset) {
			for (const datasetKey of Object.keys(currentNode.dataset || {})) {
				for(const prefixe of ['pwc', 'pow']) {
					const hasPrefixe = datasetKey.startsWith(prefixe);
					if (hasPrefixe) {
						// Call powerObject compile that may create new children nodes
						hasCompiled = this._newCompile({
							currentNode: currentNode,
							datasetKey: datasetKey,
							isInnerCompiler: isInnerCompiler,
						});
						// Select this datasetKey to create a powerObject with currentNode
						currentObjects.push({datasetKey: datasetKey, node: currentNode});
					}
				}
			}
		}

		const currentNodeHaschildren = !!currentNode.childNodes && !!currentNode.childNodes.length;
		// Recursively sweep through currentNode children
		if (currentNodeHaschildren) {
			// params.isInnerCompiler detects if this is NOT the root object with compile()
			if (hasCompiled || isInnerCompiler) {
				this.newSweepDOM({
					entryNode: currentNode,
					callback: this.buildPowerObjects.bind(this),
					isInnerCompiler: true,
					main: main,
					view: view,
					pending: pending,
				});
			} else {
				this.newSweepDOM({
					entryNode: currentNode,
					callback: this.buildPowerObjects.bind(this),
					isInnerCompiler: false,
					main: main,
					view: view,
					pending: pending,
				});
			}
		}

		// If hasCompiled and is the root element with a compile() method call interpolation compile
		// This will make the interpolation of elements with compile without replace {{}} to <span data-pow-bind></span>
		if (hasCompiled && !isInnerCompiler) {
			// Has compiled contains the original node.innerHTML and we need save it
			this.rootCompilers[currentNode.id] = hasCompiled;
			// console.log('ESSE currentNode.innerHTML', currentNode.innerHTML);
			currentNode.innerHTML = this.$powerUi.interpolation.compile(currentNode.innerHTML);
		} else if (hasCompiled) {
		}
		if ((currentObjects.length > 0 && !hasCompiled) || (hasCompiled && isInnerCompiler)) {
			for (const item of currentObjects) {
				this._instanciateObj({
					ctx: this,
					currentElement: item.node,
					datasetKey: item.datasetKey,
				});
			}
			currentObjects = [];
		} else {
			// If is some inner compiler save it for last
			for (const item of currentObjects) {
				pending.push(item);
			}
		}
	}

	_newCompile({currentNode, datasetKey, isInnerCompiler}) {
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
					// If is the root element save the original innerHTML, if not only return true
					compiled = !isInnerCompiler ? currentNode.innerHTML : true;
					newObj.compile();
					newObj.element.setAttribute('data-pwcompiled', true);
				}
			}
		}
		return compiled;
	}

	_instanciateObj({ctx, currentElement, datasetKey}) {
		const id = getIdAndCreateIfDontHave(currentElement);
		// If there is a method like _powerMenu allow it to be extended, call the method like _powerMenu()
		// If is some pow-attribute or pwc-attribute use 'powerAttrs' flag to call some class using the callback
		const functionName = !!ctx.$powerUi[`_${datasetKey}`] ? `_${datasetKey}` : 'powerAttrs';
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
			// uses an underline plus the camelCase selector to call _powerMenu or other similar method on 'ctx'
			// E. G. , ctx.powerCss.powerMenu.topmenu = ctx.$powerUi._powerMenu(topmenuElement);
			// Create powerObject from pow or pwc attrs it will create powerObject from class name like power-menu or power-view
			powerObject = ctx.$powerUi[functionName](document.getElementById(id));
		}
		// Add the same element into a list ordered by id
		this._addToObjectsById({powerObject: powerObject, id: id, datasetKey: datasetKey});
	}

	_addToObjectsById({powerObject, id, datasetKey}) {
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
			this.allPowerObjsById[id].$shared = {};
		}
		// add the shared scope to all elements
		this.allPowerObjsById[id][datasetKey].$shared = this.allPowerObjsById[id].$shared;
	}

	newSweepDOM({entryNode, callback, isInnerCompiler, main, view, pending}) {
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
				pending: pending,
			});
		}
	}

	buildTempTreeAndObjects(node) {
		const tempTree = {
			powerCss: {},
			powAttrs: {},
			pwcAttrs: {},
			rootCompilers: {},
			pending: [],
		};
		// Sweep DOM to create a temp tree with simple DOM elements that contais 'pwc', 'pow' and 'power-' prefixes
		this.sweepDOM({entryNode: node, ctx: tempTree, callback: this._buildTempPowerTree.bind(this), isInnerOfTarget: false});

		// Interpolate the body: Replace any remaing {{ interpolation }} with <span data=pow-bind="interpolation">interpolation</span> and add it to tempTree
		const body = document.getElementsByTagName('BODY')[0];
		body.innerHTML = this.$powerUi.interpolation.interpolationToPowBind(body.innerHTML, tempTree);

		// Add any pending element created by the interpolationToPowBind method
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

		// Move the original innerHTML of compiler elements with the powerObjects
		for (const id of Object.keys(tempTree.rootCompilers || {})) {
			this.allPowerObjsById[id]['$rootCompiler'] = tempTree.rootCompilers[id];
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
								currentObj.$pwMain = powerMain;
							}
						}
					}

					// Add the mainView to element
					if (currentViewElement) {
						const powerView = this.allPowerObjsById[currentViewElement.id]['powerView'];
						currentObj.$pwView = powerView;
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

	// Sweep through each node and pass the node to the callback
	sweepDOM({entryNode, ctx, callback, isInnerOfTarget}) {
		const isNode = !!entryNode && !!entryNode.nodeType;
		const hasChildren = !!entryNode.childNodes && !!entryNode.childNodes.length;

		if (isNode && hasChildren) {
			const nodes = entryNode.childNodes;
			for (let i=0; i < nodes.length; i++) {
				const currentNode = nodes[i];

				// Call back with any condition to apply
				// The callback Recursively call seepDOM for it's children nodes
				callback({currentNode: currentNode, ctx: ctx, isInnerOfTarget: isInnerOfTarget});
			}
		}
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

	// Compile the current node if the element powerObject have a compile() method
	_compile({currentNode, datasetKey, isInnerOfRoot}) {
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
					// If is the root element save the original innerHTML, if not only return true
					compiled = !isInnerOfRoot ? currentNode.innerHTML : true;
					newObj.compile();
					newObj.element.setAttribute('data-pwcompiled', true);
				}
			}
		}
		return compiled;
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

	// This creates the powerTree with all the power objects attached to the DOM
	// It uses the simple elements of _buildTempPowerTree to get only the power elements
	_buildObjcsFromTempTree(ctx, attribute, selector, tempTree) {
		const datasetKey = selector.datasetKey;
		// Hold all element of a power kind (powerCss, powAttr or pwcAttr)
		const currentTempElementsById = tempTree[attribute][datasetKey];
		if (currentTempElementsById) {
			for (const id of Object.keys(currentTempElementsById || {})) {
				// If there is a method like _powerMenu allow it to be extended, call the method like _powerMenu()
				// If is some pow-attribute or pwc-attribute use 'powerAttrs' flag to call some class using the callback
				const functionName = !!ctx.$powerUi[`_${datasetKey}`] ? `_${datasetKey}` : 'powerAttrs';
				let powerObject;
				if (functionName === 'powerAttrs') {
					// Create powerObject from pow or pwc attrs
					powerObject = selector.callback(document.getElementById(id));
				} else {
					// Call the method for create objects like _powerMenu with the node elements in tempTree
					// uses an underline plus the camelCase selector to call _powerMenu or other similar method on 'ctx'
					// E. G. , ctx.powerCss.powerMenu.topmenu = ctx.$powerUi._powerMenu(topmenuElement);
					// Create powerObject from pow or pwc attrs it will create powerObject from class name like power-menu or power-view
					powerObject = ctx.$powerUi[functionName](document.getElementById(id));
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
				ctx.allPowerObjsById[id][datasetKey] = powerObject;
				// Add to any element some desired variables
				ctx.allPowerObjsById[id][datasetKey].id = id;
				ctx.allPowerObjsById[id][datasetKey].$powerCss = datasetKey;
				ctx.allPowerObjsById[id][datasetKey].$powerUi = ctx.$powerUi;
				// Create a $shared scope for each element
				if (!ctx.allPowerObjsById[id].$shared) {
					ctx.allPowerObjsById[id].$shared = {};
				}
				// add the shared scope to all elements
				ctx.allPowerObjsById[id][datasetKey].$shared = ctx.allPowerObjsById[id].$shared;
			}
		}
	}

	// Thist create a temp tree with simple DOM elements that contais 'pwc', 'pow' and 'power-' prefixes
	_buildTempPowerTree({currentNode, ctx, isInnerOfTarget}) {
		isInnerOfTarget = isInnerOfTarget || false;
		let hasCompiled = false;
		// Check if has the custom data-pwc and data-pow attributes
		if (currentNode.dataset) {
			for (const datasetKey of Object.keys(currentNode.dataset || {})) {
				for(const prefixe of ['pwc', 'pow']) {
					const hasPrefixe = datasetKey.startsWith(prefixe);
					if (hasPrefixe) {
						// Call powerObject compile that may create new children nodes
						hasCompiled = this._compile({currentNode: currentNode, datasetKey: datasetKey, isInnerOfRoot: isInnerOfTarget});

						const attributeName = `${prefixe}Attrs`; // pwcAttrs or powAttrs
						currentNode.id = getIdAndCreateIfDontHave(currentNode);
						if (!ctx[attributeName][datasetKey]) {
							ctx[attributeName][datasetKey] = {};
						}
						ctx[attributeName][datasetKey][currentNode.id] = currentNode;
					}
				}
			}
		}
		// Check for power css class selectors like "power-menu" or "power-label"
		if (currentNode.className && currentNode.className.includes('power-')) {
			for (const selector of PowerUi._powerElementsConfig) {
				if (currentNode.classList.contains(selector.name)) {
					currentNode.id = getIdAndCreateIfDontHave(currentNode);
					if (!ctx.powerCss[selector.datasetKey]) {
						ctx.powerCss[selector.datasetKey] = {};
					}
					ctx.powerCss[selector.datasetKey][currentNode.id] = currentNode;
				}
			}
		}

		const currentNodeHaschildren = !!currentNode.childNodes && !!currentNode.childNodes.length;
		// Recursively sweep through currentNode children
		if (currentNodeHaschildren) {
			// isInnerOfTarget detects if this is NOT the root object with compile()
			if (hasCompiled || isInnerOfTarget) {
				this.sweepDOM({entryNode: currentNode, ctx: ctx, callback: this._buildTempPowerTree.bind(this), isInnerOfTarget: true});
			} else {
				this.sweepDOM({entryNode: currentNode, ctx: ctx, callback: this._buildTempPowerTree.bind(this), isInnerOfTarget: false});
			}
		}
		// If hasCompiled and is the root element with a compile() method call interpolation compile
		// This will make the interpolation of elements with compile without replace {{}} to <span data-pow-bind></span>
		if (hasCompiled && !isInnerOfTarget) {
			// Has compiled contains the original node.innerHTML and we nned save it
			ctx.rootCompilers[currentNode.id] = hasCompiled;
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
