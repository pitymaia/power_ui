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
	constructor({id, main, view, rootCompiler, parent, ctx}) {
		this.id = id;
		this.tempMainEl = main;
		this.tempViewEl = view;
		this.tempRootCompilerEl = rootCompiler;
		this.tempParent = parent || {node: null, datasetKey: null};
		this.ctx = ctx;
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
		return this.tempRootCompilerEl ? document.getElementById(this.tempRootCompilerEl.id) : null;
	}

	get parentNode() {
		return this.tempParent.node ? document.getElementById(this.tempParent.node.id) : null;
	}

	get parentDatasetKey() {
		return this.tempParent.datasetKey;
	}

	get parentObj() {
		if (!this.parentNode) {
			return null;
		}
		const id = this.parentNode.id;
		const datasetKey = this.parentDatasetKey;
		if (this.ctx.allPowerObjsById[id] && this.ctx.allPowerObjsById[id][datasetKey]) {
			return this.ctx.allPowerObjsById[id][datasetKey];
		} else {
			return null;
		}
	}

	get mainObj() {
		const flag = 'isMain';
		return this.cached[flag] || this.getTarget(this.main.id, flag);
	}
	get viewObj() {
		const flag = 'isView';
		return this.cached[flag] || this.getTarget(this.view.id, flag);
	}
	get rootCompilerObj() {
		const flag = 'isRootCompiler';
		return this.cached[flag] || this.getTarget(this.rootCompiler.id, flag);
	}
	getTarget(id, flag) {
		if (!id) {
			return false;
		}
		if (this.cached[flag] == undefined) {
			for (const key of Object.keys(this.ctx.allPowerObjsById[id] || {})) {
				if (this.ctx.allPowerObjsById[id][key][flag]) {
					this.cached[flag] = this.ctx.allPowerObjsById[id][key];
					return this.cached[flag];
				}
			}
			this.cached[flag] = false;
		} else {
			return this.cached[flag];
		}
	}
	// Remove all power inner elements from this.$powerUi.powerTree.allPowerObjsById
	removeInnerElementsFromPower() {
		const children = this.element.children;
		for (const child of children) {
			this.removeElementAndInnersFromPower(child);
		}
		this.element.innerHTML = '';
		delete this.element.dataset.pwhascomp;
	}

	removeElementAndInnersFromPower(element) {
		element = element || this.element;
		if (element.id && this.ctx.allPowerObjsById[element.id]) {
			// Remove events of this objects
			this.ctx.removeEventsOfObject(element.id);
			for (const key of Object.keys(this.ctx.allPowerObjsById[element.id])) {
				if (key !== '$shared' && this.ctx.allPowerObjsById[element.id][key].onRemove) {
					this.ctx.allPowerObjsById[element.id][key].onRemove();
				}
			}
			delete this.ctx.allPowerObjsById[element.id];
		}

		const children = element.children;
		for (const child of children) {
			this.removeElementAndInnersFromPower(child);
		}
	}
}


// Abstract Power UI Base class
class _PowerUiBase {
	constructor() {
		// Hold temp scopes during templating
		this._tempScope = {};
	}

	_createPowerTree() {
		this.powerTree = new PowerTree(this, _PowerUiBase);
		this.powerTree._callInit();
	}
}
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
	last: () => _Unique.n,
};


class UEvent {
	constructor(name) {
		this.observers = [];
		if (name)  UEvent.index[name] = this;
	}

	subscribe(fn, ctx) { // *ctx* is what *this* will be inside *fn*.
		this.observers.push({fn, ctx, arguments});
	}

	unsubscribe(fn, ctx) {
		if (ctx) {
			this.observers = this.observers.filter((x) => x.ctx !== ctx);
		} else {
			this.observers = this.observers.filter((x) => x.fn !== fn);
		}
	}

	broadcast() { // Accepts arguments.
		for (const o of this.observers) {
			o.fn.apply(o.ctx, o.arguments);
		}
	}
	// Broadcast only to the last item in array
	popBroadcast() { // Accepts arguments.
		if (this.observers.length > 0) {
			const o = this.observers[this.observers.length - 1];
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
		return this.element ? this.element.id || null : null;
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

	get parent() {
		return this.$shared ? this.$shared.parentObj : null;
	}
	// Only powerCss objects are children, not pow or pwc attrs
	get children() {
		return this._cachedChildren || this._getChildren();
	}
	_getChildren() {
		this._cachedChildren = [];
		const element = this.element;
		for (const child of element.children) {
			if (child.className.includes('power-')) {
				for (const datasetKey of Object.keys(this.$powerUi.powerTree.allPowerObjsById[child.id] || {})) {
					if (datasetKey.startsWith('power')) {
						this._cachedChildren.push(this.$powerUi.powerTree.allPowerObjsById[child.id][datasetKey]);
					}
				}
			}
		}
		return this._cachedChildren;
	}

	get innerPowerCss() {
		return this._cachedInnerPowerCss || this._getInnerPowerCss();
	}

	_getInnerPowerCss() {
		this._cachedInnerPowerCss = this.$powerUi.powerTree._getAllInnerPowerCss(this.element);
		return this._cachedInnerPowerCss;
	}
}


class _PowerBasicElementWithEvents extends _PowerBasicElement {
	constructor(element) {
		super(element);
		// The Events list
		this._events = {};
		// Hold custom events to dispatch
		this._DOMEvents = {};
		// Hold the function to allow remove listeners with the same function signature
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
		this.unsubscribe({event: event, fn: fn, useCapture: useCapture, params: params});
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
		if (this.element) {
			this.element.removeEventListener(event, callback, useCapture);
		}
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
		this.allPowerObjsById = {};
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

		this.rootDatasetKeys = Object.keys(this.attrsConfig || {}).filter(i => this.attrsConfig[i].isCompiler);
		this.mainDatasetKeys = this.getMainDatasetKeys();

		// Sweep DOM to create a temp tree with 'pwc', 'pow' and 'power-' DOM elements and create objects from it
		this.buildAndInterpolate(document);
	}

	removeAllEvents() {
		for (const id of Object.keys(this.allPowerObjsById || {})) {
			this.removeEventsOfObject(id);
		}
		UEvent.index = {};
	}

	removeEventsOfObject(id) {
		for (const datasetKey of Object.keys(this.allPowerObjsById[id] || {})) {
			if (datasetKey !== '$shared') {
				for (const eventName of Object.keys(this.allPowerObjsById[id][datasetKey]._events)) {
					for (const observer of this.allPowerObjsById[id][datasetKey]._events[eventName].observers) {
						observer.ctx.unsubscribe({event: eventName, fn: observer.fn});
					}
				}
			}
		}
	}

	getMainDatasetKeys() {
		const mainDatasetKeys = [];
		for (const item of PowerUi._powerElementsConfig) {
			if (item.isMain) {
				mainDatasetKeys.push(item.datasetKey);
			}
		}
		for (const key of Object.keys(this.attrsConfig || {})) {
			if (this.attrsConfig[key].isMain) {
				mainDatasetKeys.push(this.attrsConfig[key].datasetKey);
			}
		}
		return mainDatasetKeys;
	}

	datasetIsCompiler(dataset) {
		for (const datasetKey of Object.keys(dataset || {})) {
			if (this.rootDatasetKeys.includes(datasetKey)) {
				return true;
			}
		}
		return false;
	}

	datasetIsMain(dataset) {
		for (const datasetKey of Object.keys(dataset || {})) {
			if (this.mainDatasetKeys.includes(datasetKey)) {
				return true;
			}
		}
		return false;
	}
	// This is the main function to sweep the DOM and instanciate powerObjetcs from it
	buildAndInterpolate(node) {
		this.sweepDOM({
			entryNode: node,
			callback: this.buildPowerObjects.bind(this),
			isInnerCompiler: false,
		});

		// Evaluate and replace any {{}} from template
		// Interpolete views and root scope in the right order
		this.$powerUi.interpolation.interpolateInOrder();

		const body = document.getElementsByTagName('BODY')[0];
		body.innerHTML = this.$powerUi.interpolation.replaceInterpolation(body.innerHTML, this.$powerUi);
	}

	buildPowerObjects({currentNode, main, view, isInnerCompiler, saved, rootCompiler, parent}) {
		// let canInstanciatePendings = false;
		let hasCompiled = false;
		let currentObjects = [];
		isInnerCompiler = isInnerCompiler || false;
		parent = parent || false;
		let childParent = parent;
		saved = saved || {pending: []};
		main = main || false;
		// If currentNode is main the main variable may change to the children and we need save the main for this node in oldMain
		const oldMain = main;
		view = view || false;
		// If currentNode is a view the view variable may change to the children and we need save the view for this node in oldView
		const oldView = view;
		let isMain = false;
		let isRootCompiler = false;

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
							view: view,
						});
						if (hasCompiled && !isInnerCompiler) {
							rootCompiler = currentNode;
							isRootCompiler = true;
						}
						// Save this node as main of it's children
						if (this.attrsConfig[datasetKey] && this.attrsConfig[datasetKey].isMain) {
							main = currentNode;
							isMain = true;
						}
						// Select this datasetKey to create a powerObject with currentNode
						currentObjects.push({
							datasetKey: datasetKey,
							currentElement: currentNode,
							main: oldMain,
							view: oldView,
							rootCompiler: isInnerCompiler ? rootCompiler : null,
							isMain: isMain,
							isRootCompiler: isRootCompiler,
							parent: parent,
							originalInnerHTML: hasCompiled,
						});
						// For now only powerCss objects have .parent
						// childParent = {node: currentNode, datasetKey: datasetKey};
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
						currentElement: currentNode,
						main: oldMain,
						view: oldView,
						rootCompiler: isInnerCompiler ? rootCompiler : null,
						isMain: isMain,
						parent: parent,
					});
					childParent = {node: currentNode, datasetKey: selector.datasetKey};
				}
			}
		}

		const currentNodeHaschildren = !!currentNode.children && !!currentNode.children.length;
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
					saved: saved,
					parent: childParent,
				});
			} else {
				this.sweepDOM({
					entryNode: currentNode,
					callback: this.buildPowerObjects.bind(this),
					isInnerCompiler: false,
					main: main,
					view: view,
					rootCompiler: rootCompiler,
					saved: saved,
					parent: childParent,
				});
			}
		}

		// If hasCompiled and is the root element with a compile() method call interpolation compile
		if (hasCompiled && !isInnerCompiler) {
			currentNode.innerHTML = this.$powerUi.interpolation.compile({template: currentNode.innerHTML, view: view});
			for (const item of saved.pending) {
				this._instanciateObj(item);
			}
			// After instanciate clean the pending list
			saved.pending = [];
		}
		if ((currentObjects.length > 0 && !hasCompiled) || (hasCompiled && !isInnerCompiler)) {
			for (const item of currentObjects) {
				this._instanciateObj(item);
			}
			currentObjects = [];
		} else {
			// If is some inner compiler save it for instanciate later
			for (const item of currentObjects) {
				saved.pending.push(item);
			}
		}
	}

	// Get node from id with some parent elements like viewElement and config info like isMain
	getEntryNodeWithParentsAndConfig(id) {
		const currentNode = document.getElementById(id);
		const parentElement = this._getParentElementFromChildElement(currentNode);
		// Get the main and view elements of the currentObj
		const mainElement = this._getMainElementFromChildElement(currentNode);
		const isMain = this.datasetIsMain(currentNode.dataset);
		const viewElement = this._getViewElementFromChildElement(currentNode);
		// Get any possible rootCompiler
		const currentRootCompilerElement = this._getRootCompilerElementFromChildElement(currentNode, this);
		const isInnerCompiler = (currentRootCompilerElement && this.datasetIsCompiler(currentNode.dataset));

		return {
			currentNode: currentNode,
			parent: parentElement,
			main: mainElement,
			isMain: isMain,
			view: viewElement,
			isInnerCompiler: isInnerCompiler,
			rootCompiler: currentRootCompilerElement,
		};
	}

	createAndInitObjectsFromCurrentNode({id}) {
		const entryAndConfig = this.getEntryNodeWithParentsAndConfig(id);
		this.buildPowerObjects(entryAndConfig);
		// Evaluate and replace any {{}} from template
		const node = document.getElementById(id);
		// Interpolate a multiple inner power-view first if have it
		if (node.innerHTML.includes('power-view')) {
			this.$powerUi.interpolation.interpolateInOrder(node);
		}

		// Interpolate using controller scope
		const scope = this.$powerUi.controllers[node.id] ? this.$powerUi.controllers[node.id].instance : this.$powerUi;
		node.innerHTML = this.$powerUi.interpolation.replaceInterpolation(node.innerHTML, scope);

		// Call init for this object and all inner objects
		this._callInitForObjectAndInners(document.getElementById(id));
	}

	_compile({currentNode, datasetKey, isInnerCompiler, view}) {
		let compiled = false;
		// Create a temp version of all powerObjects with compile methods
		if (this.attrsConfig[datasetKey] && this.attrsConfig[datasetKey].isCompiler) {
			// Check if not already compiled
			if (!currentNode.getAttribute('data-pwhascomp') === true) {
				const id = getIdAndCreateIfDontHave(currentNode);
				const newObj = this.attrsConfig[datasetKey].callback(currentNode);
				// Add to any element some desired variables
				newObj.id = id;
				newObj.$powerUi = this.$powerUi;
				// If is the root element save the original innerHTML, if not only return true
				// pow-eval have a compiler with empty value: '' So we need return true if no/empty innerHTML
				compiled = !isInnerCompiler ? (currentNode.innerHTML || true) : true;
				newObj.compile({view: view});
				newObj.element.setAttribute('data-pwhascomp', true);
			}
		}
		return compiled;
	}

	_instanciateObj({currentElement, datasetKey, main, view, rootCompiler, isMain, isRootCompiler, parent, originalInnerHTML}) {
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
		// Register if object is main object or a rootCompiler
		powerObject.isMain = isMain || null;
		powerObject.isRootCompiler = isRootCompiler || null;
		powerObject.originalInnerHTML = (originalInnerHTML && originalInnerHTML !== true) ? originalInnerHTML : '';
		// Add the powerObject into a list ordered by id
		this._addToObjectsById({
			powerObject: powerObject,
			id: id,
			datasetKey: datasetKey,
			main: main,
			view: view,
			rootCompiler: rootCompiler,
			parent: parent,
		});
	}

	// Add the powerObject into a list ordered by id
	_addToObjectsById({powerObject, id, datasetKey, main, view, rootCompiler, parent}) {
		if (!this.allPowerObjsById[id]) {
			this.allPowerObjsById[id] = {};
		} else {
			// It only test if id exists in DOM when it already exists in allPowerObjsById, so this is not a slow code
			const selectorToTest = document.querySelectorAll(`[id=${id}]`);
			if (selectorToTest.length > 1) {
				// Check if there is some duplicated ID
				window.console.error('DUPLICATED IDs:', selectorToTest);
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
				parent: parent,
				ctx: this,
			});
		}
		if (powerObject.isRootCompiler) {
			this.allPowerObjsById[id].$shared.isRootCompiler = powerObject.isRootCompiler;
			this.allPowerObjsById[id].$shared.originalInnerHTML = powerObject.originalInnerHTML;
		}
		// add the shared scope to all elements
		this.allPowerObjsById[id][datasetKey].$shared = this.allPowerObjsById[id].$shared;
	}

	sweepDOM({entryNode, callback, isInnerCompiler, main, view, rootCompiler, saved, parent}) {
		const isNode = !!entryNode && !!entryNode.nodeType;
		const hasChildren = !!entryNode.children && !!entryNode.children.length;

		if (isNode && hasChildren) {
			const nodes = entryNode.children;
			for (const currentNode of entryNode.children) {
				// Call back with any condition to apply
				// The callback Recursively call seepDOM for it's children nodes
				callback({
					currentNode: currentNode,
					callback: callback,
					isInnerCompiler: isInnerCompiler,
					main: main,
					view: view,
					rootCompiler: rootCompiler,
					saved: saved,
					parent: parent,
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
				saved: saved,
				parent: parent,
			});
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

	_getRootCompilerElementFromChildElement(element, ctx) {
		const searchResult  = PowerTree._searchUpDOM(element, this._checkIfIsCompilerElement, ctx);
		if (searchResult.conditionResult) {
			return searchResult.powerElement;
		}
	}

	_checkIfIsCompilerElement(element, powerTree) {
		let found = false;
		if (element && element.dataset) {
			if (powerTree.datasetIsCompiler(element.dataset)) {
				found = true;
			}
		}
		return found;
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
			this._callInitOfObject(id);
		}
	}
	_callInitOfObject(id) {
		for (const datasetKey of Object.keys(this.allPowerObjsById[id] || {})) {
			if (this.allPowerObjsById[id][datasetKey].init) {
				this.allPowerObjsById[id][datasetKey].init();
			}
		}
	}
	_callInitForObjectAndInners(element) {
		// Call init for this object
		if (element.id) {
			this._callInitOfObject(element.id);
		}
		// Call init for any child object
		const children = element ? element.children : [];
		for (const child of children) {
			this._callInitForObjectAndInners(child);
		}
	}
}
// Search powerElement UP on DOM and return the element when testCondition is true or the last powerElement on the tree
// testCondition is a function to find the element we want, if the condition is false the root/top powerElement is returned
PowerTree._searchUpDOM = function (element, testCondition, ctx) {
	let lastPowerElement = element.className.includes('power-') ? element : null;
	let currentElement = element.parentElement;
	let conditionResult = false;
	let stop = currentElement ? false : true;
	while (!stop) {

		conditionResult = testCondition(currentElement, ctx);
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

	mouseout(params) {
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
		this.$pwMain.subscribe({event: event, fn: callback, useCapture: useCapture});
	}

	// Atach the listner/Event to que main element
	removeEventListener(event, callback, useCapture) {
		this.$pwMain.unsubscribe({event: event, fn: callback, useCapture: useCapture});
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
		this.$pwMain.subscribe({event: event, fn: callback, useCapture: useCapture});
	}

	// Atach the listner/Event to que main element
	removeEventListener(event, callback, useCapture) {
		this.$pwMain.unsubscribe({event: event, fn: callback, useCapture: useCapture});
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

// All ohter inputs type (text, range, tel, password, textarea, color, date, etc)
function othersInit(self) {
    const el = self.element;
    el.value = self.currentValue;
    self.subscribe({event: 'change', fn: self.onchange });
}

function othersChange(self) {
    self.currentValue = self.element.value;
}

function checkboxInit(self) {
    const el = self.element;
    if (self.currentValue === true) {
        el.checked = 'checked';
    } else {
        delete el.checked;
    }
    self.subscribe({event: 'change', fn: self.onchange });
}

function checkboxChange(self) {
    self.currentValue = !self.currentValue; // Invert the value
}

function radioInit(self) {
    const el = self.element;
    if (self.currentValue === el.value) {
        el.checked = true;
    } else {
        el.checked = false;
    }
    self.subscribe({event: 'change', fn: self.onchange });
}

function radioChange(self) {
    if (self.element.checked === true){
        self.currentValue = self.element.value;
    }
}

function selectMultipleInit(self) {
    const el = self.element;
    for (const child of el.children) {
        if (self.currentValue.includes(child.value)) {
            child.selected = true;
        } else {
            child.selected = false;
        }
    }
    self.subscribe({event: 'change', fn: self.onchange });
}

function selectOneInit(self) {
    const el = self.element;
    for (const child of el.children) {
        if (self.currentValue === child.value) {
            child.selected = true;
        } else {
            child.selected = false;
        }
    }
    self.subscribe({event: 'change', fn: self.onchange });
}

function selectMultipleChange(self) {
    const el = self.element;
    for (const child of el.children) {
        if (child.selected) {
            // Only add if not already have it
            if (!self.currentValue.includes(child.value)) {
                self.currentValue.push(child.value);
            }
        } else {
            const index = self.currentValue.indexOf(child.value);
            if (index > -1) {
              self.currentValue.splice(index, 1);
            }
        }
    }
}

class PowBind extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
        this.originalHTML = element.innerHTML;

    }

    init() {
        const view = this.$pwView;
        // The scope of the controller of the view of this element
        this.ctrlScope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;

        this.type = this.element.type;
        if (this.type === 'checkbox') {
            checkboxInit(this);
        } else if (this.type === 'radio') {
            radioInit(this);
        } else if (this.type ==='select-one') {
            selectOneInit(this);
        } else if (this.type ==='select-multiple') {
            selectMultipleInit(this);
        } else {
            othersInit(this);
        }
    }

    onchange(event) {
        if (this.type === 'checkbox') {
            checkboxChange(this);
        } else if (this.type === 'radio') {
            radioChange(this);
        } else if (this.type ==='select-multiple') {
            selectMultipleChange(this);
        } else {
            othersChange(this);
        }
    }

    // The current scope value of pow-bind model
    get currentValue() {
        return this.$powerUi.safeEval({text: this.$powerUi.interpolation.decodeHtml(
            this.element.dataset.powBind), $powerUi: this.$powerUi, scope: this.ctrlScope});
    }

    set currentValue(valueToSet) {
        this.$powerUi.setValueOnScope({text: this.$powerUi.interpolation.decodeHtml(this.element.dataset.powBind), $powerUi: this.$powerUi, scope: this.ctrlScope, valueToSet: valueToSet});
    }
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-bind',
    callback: function(element) {return new PowBind(element);}
});

// Replace a value form an attribute when is mouseover some element and undo on mouseout
class PowEval extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
    }

    compile({view}) {
        // The scope of the controller of the view of this element
        const ctrlScope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;
        this.element.innerHTML = this.$powerUi.interpolation.getDatasetResult(this.element.dataset.powEval, ctrlScope);
    }
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-eval',
    callback: function(element) {return new PowEval(element);}
});

class PowEvent extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
    }

    compile({view}) {
        // The controller scope of this view
        const ctrlScope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;
        for (const attr of this.element.attributes) {
            if (attr.name.includes('on') && !attr.name.includes('data')) {
                const name = attr.name.slice(2, attr.name.length);
                this.element.setAttribute(`data-pow-${name}`, this.$powerUi.interpolation.encodeHtml(attr.value));
                // attr.value = `document.dispatchEvent(new CustomEvent('pwScope', {detail: {viewId: '${view.id}', elementId: '${this.element.id}', attrName: '${name}'}}))`;
                attr.value = `window._$dispatchPowerEvent(event, this, '${view.id}', '${name}')`;
            }
        }
    }
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-event',
    callback: function(element) {return new PowEvent(element);}
});

// Create DOM elements with all ineerHTML for each "for in" or "for of"
class PowFor extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);
		this._$pwActive = false;
		this._pwEvaluateValue = '';
	}

	// element attr allow to recursivelly call it with another element
	compile({view}) {
		if (!this.element.dataset.powFor) {
			return;
		}

		const parts = this.$powerUi.interpolation.decodeHtml(this.element.dataset.powFor).split(' ');
		const item = `\\b(${parts[0]})\\b`;
		const operation = parts[1];
		// Remove parts[0]
		parts.shift();
		// Remove parts[1]
		parts.shift();
		// Recreate the final string to evaluate with the remaining parts
		let obj = parts.join(' ');

		// The scope of the controller of the view of this element
		const ctrlScope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;
		obj = this.$powerUi.safeEval({text: obj, $powerUi: this.$powerUi, scope: ctrlScope});

		if (operation === 'of') {
			this.forOf(item, obj);
		} else {
			this.forIn(item, obj);
		}
	}

	forOf(selector, obj) {
		let newHtml = '';
		let $pwIndex = 0;
		for (const item of obj || []) {
			const scope = _Unique.scopeID();
			// Replace any $pwIndex
			let currentHtml = this.$powerUi.interpolation.replaceWith({
				entry: this.element.innerHTML,
				oldValue: '\\$pwIndex',
				newValue: $pwIndex,
			});
			$pwIndex = $pwIndex + 1;
			// Replace any value
			this.$powerUi._tempScope[scope] = item;
			newHtml = newHtml + this.$powerUi.interpolation.replaceWith({
				entry: currentHtml,
				oldValue: selector,
				newValue: this.$powerUi.interpolation.encodeHtml(`_tempScope['${scope}']`),
			});

		}
		this.element.innerHTML = newHtml;
	}

	forIn(selector, obj) {
		let newHtml = '';
		let $pwIndex = 0;
		for (const $pwKey of Object.keys(obj || {})) {
			const scope = _Unique.scopeID();
			// Replace any $pwKey
			let currentHtml = this.$powerUi.interpolation.replaceWith({
				entry: this.element.innerHTML,
				oldValue: '\\$pwKey',
				newValue: `'${$pwKey}'`,
			});
			// Replace any $pwIndex
			currentHtml = this.$powerUi.interpolation.replaceWith({
				entry: currentHtml,
				oldValue: '\\$pwIndex',
				newValue: $pwIndex,
			});
			$pwIndex = $pwIndex + 1;
			// Replace any value
			this.$powerUi._tempScope[scope] = obj[$pwKey];
			newHtml = newHtml + this.$powerUi.interpolation.replaceWith({
				entry: currentHtml,
				oldValue: selector,
				newValue: this.$powerUi.interpolation.encodeHtml(`_tempScope['${scope}']`),
			});
		}
		this.element.innerHTML = newHtml;
	}
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-for',
	callback: function(element) {return new PowFor(element);}
});

// Hide DOM element if value is false
class PowIf extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);
		this._$pwActive = false;
		this.originalHTML = element.innerHTML;
	}

	compile({view}) {
		// The scope of the controller of the view of this element
		const ctrlScope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;
		const value = this.$powerUi.safeEval({text: this.$powerUi.interpolation.decodeHtml(this.element.dataset.powIf), $powerUi: this.$powerUi, scope: ctrlScope});
		// Hide if element is false
		if (value === false) {
			this.element.style.display = 'none';
			this.element.innerHTML = '';
		} else {
			this.element.style.display = null;
			this.element.innerHTML = this.originalHTML;
		}
	}
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-if',
	callback: function(element) {return new PowIf(element);}
});

// Define the powerDropmenus defaultPosition for all the child Power dropmenus
// The right-bottom is the standard position
function defineInnerDropmenusPosition(self, powerElement) {
	if (powerElement.defaultPosition) {
		return;
	}
	if (self.element.classList.contains('pw-bottom')) {
		powerElement.defaultPosition = 'right-top';
	} else if (self.element.classList.contains('pw-right')) {
		powerElement.defaultPosition = 'left-bottom';
	} else if (self.element.classList.contains('pw-left')) {
		powerElement.defaultPosition = 'right-bottom';
	} else {
		powerElement.defaultPosition = 'right-bottom';
	}
}

// Define the powerDropmenus defaultPosition for the first level Power dropmenus
// The right-bottom is the standard position
function defineRootDropmenusPosition(self, powerElement) {
	if (powerElement.defaultPosition) {
		return;
	} else if (self.defaultPosition) {
		powerElement.defaultPosition = self.defaultPosition;
	} else {
		if (self.element.classList.contains('pw-bottom')) {
			powerElement.defaultPosition = 'top-right';
		} else if (self.element.classList.contains('pw-right')) {
			powerElement.defaultPosition = 'left-bottom';
		} else if (self.element.classList.contains('pw-left')) {
			powerElement.defaultPosition = 'right-bottom';
		} else {
			powerElement.defaultPosition = 'bottom-right';
		}
	}
}


// Watch a input element intil some condition is false, when it's become true run a callback and stop watching
class watchInputUntilThen {
	constructor(element, conditionFn, thanFn) {
		this.element = element;
		this.condition = conditionFn;
		this.than = thanFn;
		this.whatch();
	}

	whatch() {
		const self = this;
		// Set a interval with condition, than and clear
		self.interval = setInterval(function () {
			if (self.condition(self.element)) {
				self.than(self.element);
				clearInterval(self.interval);
			}
		}, 300);
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
				if (styles.position === 'static') {
					obj.element.classList.add('power-keyboard-position');
				}
				obj.element.classList.add('power-keyboard-mode');
			}
			window.console.log('Keyboard mode ON');
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
			window.console.log('Keyboard mode OFF');
			for (const obj of this.getRootElements()) {
				obj.element.classList.remove('power-keyboard-mode');
				obj.element.classList.remove('power-keyboard-position');
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

class ComponentsManager {
	constructor($powerUi) {
		this.$powerUi = $powerUi;
		this.bars = [];
		this.observing = {};
		this.startObserver();
	}

	observe(bar) {
		this.observing[bar.id] = bar;
		this.observing[bar.id].lastWidth = bar.element.offsetWidth;
		this.observing[bar.id].lastHeight = bar.element.offsetHeight;
	}

	stopObserve(element) {
		this.observing[element.id] = null;
		delete this.observing[element.id];
	}

	restartObserver() {
		if (this.interval >= 500) {
			this.interval = 300;
		} else {
			return;
		}
		this.startObserver();
	}

	runObserverFewTimes(initInterval) {
		this.interval = initInterval || 300;
		this.startObserver();
		this.interval = 400;
	}

	observerInterval() {
		const self = this;
		self.interval = self.interval || 10;


		return setInterval(function () {
			self.runObserver();
			clearInterval(self._observerInterval);
			self.interval = self.interval + 25;
			if (self.interval <= 500) {
				self.startObserver();
			}
		}, self.interval);
	}

	startObserver() {
		this.hasChange = false;
		clearInterval(this._observerInterval);
		this._observerInterval = this.observerInterval();
	}

	runObserver() {
		for (const key of Object.keys(this.observing)) {
			const active = this.observing[key]._$pwActive;
			const lastWidth = this.observing[key].lastWidth;
			const currentWidth = this.observing[key].element.offsetWidth;
			const lastHeight = this.observing[key].lastHeight;
			const currentHeight = this.observing[key].element.offsetHeight;
			if (!active) {
				if (lastWidth && lastHeight && ((lastWidth !== currentWidth) || (lastHeight !== currentHeight))) {
					this.hasChange = true;
				}

				if (this.observing[key].isToolbar && this.observing[key].powerAction.element.offsetLeft > this.observing[key].element.offsetWidth) {
					this.hasChange = true;
				}

				if (this.observing[key].isSplitBar && this.observing[key].isWindowFixed && (
					this.observing[key].barPosition === 'top' || this.observing[key].barPosition === 'bottom'
					) && this.observing[key].adjustBarSizeIfNeeded && !(this.observing[key]._window && this.observing[key]._window.currentBarBreakQuery === 'pw-bar-break')) {
					this.observing[key].adjustBarSizeIfNeeded();
				}
			}
			if (this.hasChange && this.observing[key].setStatus) {
				this.observing[key].setStatus();
			}

			this.observing[key].lastWidth = currentWidth;
			this.observing[key].lastHeight = currentHeight;
		}

		if (this.hasChange) {
			this.onBarSizeChange();
			this.hasChange = false;
		}
	}

	toggleSmallWindowMode() {
		const _appContainer = document.getElementById('app-container');
		if (window.innerWidth <= 768 || this.$powerUi.touchdevice) {
			if (this.smallWindowMode !== true) {
				this.smallWindowMode = true;
				this.$powerUi.windowModeChange.broadcast();
			}
			this.smallWindowMode = true;
			_appContainer.classList.add('pw-small-window-mode');
		} else {
			if (this.smallWindowMode === true) {
				this.smallWindowMode = false;
				this.$powerUi.windowModeChange.broadcast();
			}
			this.smallWindowMode = false;
			_appContainer.classList.remove('pw-small-window-mode');
		}
	}

	onBarSizeChange() {
		for (const bar of this.bars) {
			if (bar.bar._$pwActive) {
				return;
			}
		}
		this._basicRefresh();
		for (const dialog of this.$powerUi.dialogs) {
			if (dialog.ctrl.isWindow) {
				dialog.ctrl.adjustWindowWithComponents();
				dialog.ctrl.changeWindowBars();
			}
		}
	}

	_browserWindowResize() {
		for (const bar of this.bars) {
			if (bar.bar._$pwActive) {
				bar.bar.powerAction.toggle();
				return;
			}
		}
		// window.alert(window.innerWidth);
		// This change the "app-container" and body element to allow adjust for fixed bars/menus
		this._basicRefresh();
	}

	_orientationChange() {
		// window.alert(window.innerWidth);
		this._browserWindowResize();
	}

	_routeChange() {
		// Give 3 chances, the first already delays 150 ms
		this._basicRefresh();
		const self = this;
		setTimeout(function () {
			self._basicRefresh();
			setTimeout(function () {
				self._basicRefresh();
			}, 300);
		}, 200);
	}

	_basicRefresh() {
		// This change the "app-container" and body element to allow adjust for fixed bars/menus
		this.setFixedBarsSizeAndPosition();
		this._addMarginToBody();
		this._setAppContainerHeight();
		this.toggleSmallWindowMode();
	}

	powerWindowChange() {
		// This change the "app-container" and body element to allow adjust for fixed bars/menus
		this.setFixedBarsSizeAndPosition();
	}
	// This change the "app-container" and body element to allow adjust for fixed bars/menus
	_setAppContainerHeight() {
		const _appContainer = document.getElementById('app-container');
		_appContainer.style.height = window.innerHeight - this.topTotalHeight - this.bottomTotalHeight + 'px';
	}
	// This change the "app-container" and body element to allow adjust for fixed bars/menus
	_addMarginToBody() {
		const body = document.body;
		body.style['margin-top'] = this.topTotalHeight + 'px';
		body.style['margin-left'] = this.leftTotalWidth + 'px';
		body.style['margin-right'] = this.rightTotalWidth + 'px';
	}
	_reorderBars(fixedBars) {
		let priority = fixedBars.length + 20;
		fixedBars.sort(function (a, b) {
			if (!a.bar.priority) {
				a.bar.priority = priority;
				priority = priority + 1;
			}
			if (!b.bar.priority) {
				b.bar.priority = priority;
				priority = priority + 1;
			}
			if (a.bar.priority > b.bar.priority) {
				return 1;
			} else {
				return -1;
			}
			priority = priority + 1;
		});


	}
	getBarsWithPrioritySizes(bars) {
		this._reorderBars(bars);
		let currentTotalTopHeight = 0;
		let currentTotalBottomHeight = 0;
		let currentTotalLeftWidth = 0;
		let currentTotalRightWidth = 0;
		for (const bar of bars) {
			if (bar.bar._$pwActive) {
				bar.bar.powerAction.toggle();
			}
			bar.adjusts = {};
			bar.adjusts.top = currentTotalTopHeight;
			bar.adjusts.bottom = currentTotalBottomHeight;
			bar.adjusts.left = currentTotalLeftWidth;
			bar.adjusts.right = currentTotalRightWidth;

			if (bar.bar.barPosition === 'top') {
				currentTotalTopHeight = currentTotalTopHeight + bar.bar.element.offsetHeight;
			} else if (bar.bar.barPosition === 'bottom') {
				currentTotalBottomHeight = currentTotalBottomHeight + bar.bar.element.offsetHeight;
			} else if (bar.bar.barPosition === 'left') {
				currentTotalLeftWidth = currentTotalLeftWidth + bar.bar.element.offsetWidth;

			} else if (bar.bar.barPosition === 'right') {
				currentTotalRightWidth = currentTotalRightWidth + bar.bar.element.offsetWidth;//this.$powerUi._offsetComputedWidth(bar.bar.element);//bar.bar.element.offsetWidth;
			}
		}

		return bars;
	}
	// This change the position for fixed bars/menus so it shows one after another
	// also register the info so "app-container" and body element can adjust for fixed bars/menus
	setFixedBarsSizeAndPosition() {
		const fixedBars = this.bars.filter(b=> b.bar.isFixed === true && window.getComputedStyle(b.bar.element).visibility !== 'hidden');
		const win = {
			titleBarEl: {offsetHeight: 0},
			defaultBorderSize: 0,
			_currentTop: 0,
			_currentBottom: 0,
			_currentLeft: 0,
			_currentWidth: window.innerWidth,
			_currentHeight: window.innerHeight,
		};
		this.setWindowBarsSizeAndPosition(fixedBars, win, this, false);
	}

	setWindowBarsSizeAndPosition(bars, win, ctx, isPowerWindow) {
		bars = this.getBarsWithPrioritySizes(bars);
		ctx.topTotalHeight = 0;
		ctx.bottomTotalHeight = 0;
		ctx.leftTotalWidth = 0;
		ctx.rightTotalWidth = 0;
		ctx.totalHeight = 0;
		let zIndex = 1000 + bars.length;
		for (const bar of bars) {
			bar.zIndex = zIndex;
			zIndex = zIndex - 1;
			bar.bar.element.style.zIndex = zIndex;
			if (bar.bar.barPosition === 'top') {
				ctx.totalHeight = ctx.totalHeight + bar.bar.element.offsetHeight;
				ctx.topTotalHeight = ctx.topTotalHeight + bar.bar.element.offsetHeight;
				bar.bar.element.style.top = win._currentTop + win.defaultBorderSize + win.titleBarEl.offsetHeight + bar.adjusts.top + 'px';
				bar.bar.element.style.left = win._currentLeft + win.defaultBorderSize + bar.adjusts.left + 'px';
				bar.bar.element.style.width = null;
				bar.bar.element.style.width = (win._currentWidth) - (bar.adjusts.left + bar.adjusts.right + this.$powerUi._offsetComputedAdjustSides(bar.bar.element)) + 'px';
			}
			if (bar.bar.barPosition === 'bottom') {
				ctx.totalHeight = ctx.totalHeight + bar.bar.element.offsetHeight;
				ctx.bottomTotalHeight = ctx.bottomTotalHeight + bar.bar.element.offsetHeight;
				bar.bar.element.style.left = win._currentLeft + win.defaultBorderSize + bar.adjusts.left + 'px';
				bar.bar.element.style.width = null;
				bar.bar.element.style.width = (win._currentWidth) - (bar.adjusts.left + bar.adjusts.right + this.$powerUi._offsetComputedAdjustSides(bar.bar.element)) + 'px';
				const windowBottom = -(win._currentBottom + win._currentHeight) + window.innerHeight;
				bar.bar.element.style.bottom = windowBottom + bar.adjusts.bottom - win.defaultBorderSize + 'px';
			}
			if (bar.bar.barPosition === 'left') {
				ctx.leftTotalWidth = ctx.leftTotalWidth + bar.bar.element.offsetWidth;
				bar.bar.element.style.left = win._currentLeft + win.defaultBorderSize + bar.adjusts.left + 'px';
				bar.bar.element.style.top = win._currentTop + win.defaultBorderSize + win.titleBarEl.offsetHeight + bar.adjusts.top + 'px';
				bar.bar.element.style.height = null;
				const height = (win._currentHeight - win.titleBarEl.offsetHeight) - (bar.adjusts.top + bar.adjusts.bottom + this.$powerUi._offsetComputedAdjustTopBottom(bar.bar.element)) + 'px';
				bar.bar.element.style.height = height;
			}
			if (bar.bar.barPosition === 'right') {
				ctx.rightTotalWidth = ctx.rightTotalWidth + bar.bar.element.offsetWidth;
				const windowRight = -(win._currentLeft + win._currentWidth + win.defaultBorderSize) + window.innerWidth;
				bar.bar.element.style.right = windowRight + bar.adjusts.right + 'px';
				bar.bar.element.style.top = win._currentTop + win.defaultBorderSize + win.titleBarEl.offsetHeight + bar.adjusts.top + 'px';
				bar.bar.element.style.height = null;
				const height = (win._currentHeight - win.titleBarEl.offsetHeight) - (bar.adjusts.top + bar.adjusts.bottom + this.$powerUi._offsetComputedAdjustTopBottom(bar.bar.element)) + 'px';
				bar.bar.element.style.height = height;
			}

			if (bar.bar.isToolbar) {
				bar.bar.setStatus();
			}
			if (isPowerWindow) {
				this.adjustWindowBody(win);
			}
		}
	}

	setWindowFixedBarsSizeAndPosition(bars, win) {
		this.setWindowBarsSizeAndPosition(bars, win, win, true);
	}
	adjustWindowBody(win) {
		win.bodyEl.style['margin-top'] = win.topTotalHeight + 'px';
		win.bodyEl.style['margin-left'] = win.leftTotalWidth + 'px';
		// win.bodyEl.style['margin-right'] = win.rightTotalWidth + 'px';
		win.bodyEl.style.height = (win._currentHeight - win.titleBarEl.offsetHeight) - win.totalHeight + 'px';
		win.bodyEl.style['min-height'] = win._minHeight - win.totalHeight - win.titleBarEl.offsetHeight + 'px';
		win._dialog.style['min-height'] = (win.defaultMinHeight + win.titleBarEl.offsetHeight) + win.topTotalHeight + 'px';
		win._minHeight = win.defaultMinHeight + win.titleBarEl.offsetHeight + win.totalHeight;
		const width = win._currentWidth - (win.rightTotalWidth + win.leftTotalWidth) + 'px';
		win.bodyEl.style.width = width;
		win.bodyEl.style['min-width'] = width;
	}
}

class PowerUi extends _PowerUiBase {
	constructor(config) {
		super();

		if (config.devMode) {
			this.devMode = config.devMode;
			const isTarget = window.location.href.startsWith(config.devMode.target);
			const isSource = window.location.href.startsWith(config.devMode.source);
			if (this.devMode.child && window.location.href.indexOf('isEditable') > -1) {
				this.devMode.isEditable = true;
			}
			window.addEventListener('message', event => {
				// IMPORTANT: check the origin of the data!
				if (event.origin.startsWith(config.devMode.source) || event.origin.startsWith(config.devMode.target)) {
					// The data was sent from your site.
					// Data sent with postMessage is stored in event.data:
					// if (event.data.click === true && event.data.id) {
					// 	const ctrl = this.getCurrentElementCtrl(document.getElementById(event.data.id));
					// 	ctrl.windowsOrder();
					// }
					// Commands only to iframe element
					if (this.devMode.child && this.devMode.isEditable && isSource) {
						if (event.data.command === 'addInnerHTML') {
							const element = document.getElementById(event.data.id);
							element.innerHTML = element.innerHTML + event.data.value;
						} else if (event.data.command === 'replaceInnerHTML') {
							const element = document.getElementById(event.data.id);
							element.innerHTML = event.data.value;
						} else if (event.data.command === 'addClassList') {
							const element = document.getElementById(event.data.id);
							element.classList.add(event.data.value);
						} else if (event.data.command === 'removeClassList') {
							const element = document.getElementById(event.data.id);
							element.classList.remove(event.data.value);
						} else if (event.data.command === 'reloadRoot') {
							const $root = this.getRouteCtrl('$root');
							$root.reload();
						}

					}

					// Register the file
					if (this.devMode.main) {
						const $root = this.getRouteCtrl('$root');
						if (!$root._$filesByRouteId) {
							$root._$filesByRouteId = {};
						}
						if (event.data.command === 'loadFile') {
							if (!$root._$filesByRouteId[event.data.routeId]) {
								$root._$filesByRouteId[event.data.routeId] = {};
							}
							if (!$root._$filesByRouteId[event.data.routeId][event.data.fileName]) {
								$root._$filesByRouteId[event.data.routeId][event.data.fileName] = {source: event.data};
								// Parse html files
								if ($root._$selectRouteFilesToEdit && (event.data.extension === '.html' || event.data.extension === '.htm')) {
									const currentRouteFiles = $root._$filesByRouteId[event.data.routeId][event.data.fileName].source;
									const _template = new DOMParser().parseFromString(currentRouteFiles.content, 'text/html');
									$root._$filesByRouteId[event.data.routeId][event.data.fileName].template = _template.body;
								} else if ($root._$selectRouteFilesToEdit && (event.data.extension === '.json' && event.data.template !== '')) {
									const _template = new DOMParser().parseFromString(event.data.template, 'text/html');
									$root._$filesByRouteId[event.data.routeId][event.data.fileName].template = _template.body;
								}
								$root._$selectRouteFilesToEdit(event.data);
							}

						} else if (event.data.command === 'selectNodeToEdit' && $root._$selectNodeToEdit) {
							$root._$selectNodeToEdit(event.data);
						} else if (event.data.command === 'setCurrentBody' && $root._$setCurrentBody) {
							$root._$setCurrentBody(event.data);
						} else if (event.data.command === 'setChildApp' && $root._$setChildApp) {
							$root._$setChildApp(event.data);
						}
					}
				} else {
					window.console.log('DANGER', event.origin);
					// The data was NOT sent from your site!
					// Be careful! Do not use it. This else branch is
					// here just for clarity, you usually shouldn't need it.
					return;
				}
			});
		}

		window._$dispatchPowerEvent = this._$dispatchPowerEvent;
		// Detect if is touchdevice (Phones, Ipads, etc)
		this.touchdevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement) ? true : false;
		this.controllers = {};
		this.dialogs = [];
		this.JSONById = {};
		this._Unique = _Unique;
		this.UEvent = UEvent;
		this.addScopeEventListener();
		this.numberOfopenModals = 0;
		this.ctrlWaitingToRun = [];
		this.config = config;
		this.waitingViews = 0;
		this.waitingInit = [];
		this.initAlreadyRun = false;
		this._services = config.services || {}; // TODO is done, need document it. Format 'widget', {component: WidgetService, params: {foo: 'bar'}}
		this._addPowerServices();

		this.onFixedPowerSplitBarChange = new UEvent('onFixedPowerSplitBarChange');
		this.onPowerWindowChange = new UEvent('onPowerWindowChange');
		this.componentsManager = new ComponentsManager(this);
		this.interpolation = new PowerInterpolation(config, this);
		this._events = {};
		this._events.ready = new UEvent();
		this._events.Escape = new UEvent();
		this.windowModeChange = new UEvent('windowModeChange');
		this.request = new Request({config, $powerUi: this});
		this.componentsManager.toggleSmallWindowMode();
		this.onBrowserWindowResize = new UEvent('onBrowserWindowResize');
		this.onBrowserWindowResize.subscribe(this.componentsManager._browserWindowResize.bind(this.componentsManager));
		if (this.touchdevice) {
			this.onBrowserOrientationChange = new UEvent('onBrowserOrientationChange');
			this.onBrowserOrientationChange.subscribe(this.componentsManager._orientationChange.bind(this.componentsManager));
			window.addEventListener("orientationchange", ()=> this.onBrowserOrientationChange.broadcast());
		}
		window.addEventListener("resize", ()=> this.onBrowserWindowResize.broadcast());
		this.router = new Router(config, this); // Router calls this.init();
		this.router.onRouteChange.subscribe(this.componentsManager.runObserver.bind(this.componentsManager));
		this.router.onRouteChange.subscribe(this.componentsManager._routeChange.bind(this.componentsManager));
		this.onPowerWindowChange.subscribe(this.componentsManager.powerWindowChange.bind(this.componentsManager));
		// suport ESC key
		document.addEventListener('keyup', this._keyUp.bind(this), false);
		// On the first run broadcast a browser window resize so any window or other
		// component can adapt it's size with the 'app-container'
		this._events.ready.subscribe(()=>this.onBrowserWindowResize.broadcast());
		// Check if app-container exists
		if (!document.getElementById('app-container')) {
			throw 'Missing element with "app-container" id! Check PowerUi documentation for more detais.';
		}
	}

	simpleSweepDOM(node, callback, counter, level) {
		const isNode = !!node && !!node.nodeType;
		const hasChildren = !!node.children && !!node.children.length;

		counter = counter || 0;
		level = level ? level + '.' : '';
		level = level + counter;

		if (isNode) {
			// Call back with any condition to apply
			callback(node, level);

			if (hasChildren) {
				let counterChild = 0;
				for (const currentNode of node.children) {
					// The callback Recursively call simpleSweepDOM for it's children nodes
					this.simpleSweepDOM(currentNode, callback, counterChild, level);
					counterChild = counterChild + 1;
				}
			}
		}
	}

	// Return the "view" controller of any element inside the current view
	getCurrentElementCtrl(node) {
		if (node.classList && node.classList.contains('power-view') && this.controllers[node.id]) {
			return this.controllers[node.id].instance;
		} else {
			if (node.parentNode) {
				return this.getCurrentElementCtrl(node.parentNode);
			} else {
				return null;
			}
		}
	}

	// This is the old tree
	// Remove after implement JSONSchema
	treeTemplate(tree) {
		return new PowerTreeTemplate({$powerUi: this, tree: tree}).template;
	}

	// This is the old tree
	// Remove after implement JSONSchema
	treeTemplatePlus(tree) {
		return new PowerTreeTemplate({$powerUi: this, tree: tree, boilerplate: true}).template;
	}

	removeRouteFromHash(currentHash, routeId, viewId) {
		const route = this.router.getOpenedRoute({routeId: routeId, viewId: viewId});
		const parts = decodeURI(currentHash).split('?');
		let counter = 0;
		let newHash = '';

		for (let part of parts) {
			if (!part.includes(route.route)) {
				if (counter !== 0) {
					part = '?' + part;
				} else {
					part = part.replace(this.router.config.rootPath, '');
				}
				newHash = newHash + part;
				counter = counter + 1;
			}
		}
		return newHash;
	}

	closeAllSecondaryRoutes(supressNavigate=false) {
		const original = this.router.locationHashWithHiddenRoutes();
		let currentHash = original;
		for (const sr of this.router.currentRoutes.secondaryRoutes) {
			const ctrl = this.controllers[sr.viewId] && this.controllers[sr.viewId].instance ? this.controllers[sr.viewId].instance : null;
			if (ctrl) {
				currentHash = this.removeRouteFromHash(currentHash, ctrl._routeId, ctrl._viewId);
			} else {
				window.location.hash = '!/';
				return;
			}
		}
		if (supressNavigate === false && original !== currentHash) {
			this.router.navigate({hash: currentHash, title: null});
		} else {
			return currentHash;
		}
	}

	closeAllHiddenRoutes(hashFromSecondary=false) {
		const original = this.router.locationHashWithHiddenRoutes();
		let currentHash = hashFromSecondary ? hashFromSecondary : original;
		for (const hr of this.router.currentRoutes.hiddenRoutes) {
			const ctrl = this.controllers[hr.viewId] && this.controllers[hr.viewId].instance ? this.controllers[hr.viewId].instance : null;
			if (ctrl) {
				currentHash = this.removeRouteFromHash(currentHash, ctrl._routeId, ctrl._viewId);
			} else {
				window.location.hash = '!/';
				return;
			}
		}
		if (original !== currentHash) {
			this.router.navigate({hash: currentHash, title: null});
		}
	}

	closeAllRoutes() {
		const hash = this.closeAllSecondaryRoutes(true);
		this.closeAllHiddenRoutes(hash);
	}

	getCookie(name) {
		const nameEQ = name + "=";
		const ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	}

	setCookie({name, value, days, domain, path, SameSite}) {
		var expires = "";
		if (days) {
			var date = new Date();
			date.setTime(date.getTime() + (days*24*60*60*1000));
			expires = ";expires=" + date.toUTCString();
		}
		document.cookie = name + "=" + (value || "")  + expires + `;${domain ? ('domain=' + domain + ';') : ''}path=${path || '/'}; SameSite=${SameSite || ''};`;
	}

	removeCookie({name, value, domain, path}) {
		document.cookie = `${name}=${value ? value : ''};${domain ? ('domain=' + domain + ';') : ''}Max-Age=-99999999;path=${path || '/'};`;
	}

	_addService(key, service) {
		this._services[key] = service;
	}
	// Add all native services
	_addPowerServices() {
		this._addService('widget', {
			component: WidgetService,
			// params: {},
		});
		this._addService('JSONSchema', {component: JSONSchemaService});
	}

	_$dispatchPowerEvent(event, self, viewId, name) {
		document.dispatchEvent(new CustomEvent('pwScope', {detail: {viewId: viewId, elementId: self.id, attrName: name, event: event}}));
	}

	_keyUp(event) {
		if (event.key == 'Escape' || event.keyCode == 27) {
			this._events['Escape'].popBroadcast();
		}
	}
	addScopeEventListener() {
		document.removeEventListener('pwScope', this.pwScope.bind(this), false);
		document.addEventListener('pwScope', this.pwScope.bind(this), false);
	}

	// This give support to data-pow-event and evaluate "onevent" inside the controller scope
	// This also add the Event to controller scope so it can be evaluated and passed to the function on data-pow-event as argument
	pwScope(event) {
		const self = this;
		const ctrlScope = (event && event.detail && event.detail.viewId && self.controllers[event.detail.viewId]) ? self.controllers[event.detail.viewId].instance : false;
		if (ctrlScope === false) {
			return;
		}
		ctrlScope.event = event.detail.event;
		ctrlScope.elementId = event.detail.elementId;
		const element = (event && event.detail && event.detail.elementId) ? document.getElementById(event.detail.elementId) : false;
		ctrlScope._node = element;
		const attrName = (event && event.detail && event.detail.attrName) ? `data-pow-${event.detail.attrName}` : false;
		const text = (element && attrName) ? this.interpolation.decodeHtml(element.getAttribute(attrName)) : false;

		if (text) {
			self.safeEval({text: text, $powerUi: self, scope: ctrlScope});
		}
	}

	safeEval({text, scope}) {
		return new ParserEval({text: text, scope: scope, $powerUi: this}).currentValue;
	}

	// Find object on $scope or $powerUi and set its value
	setValueOnScope({text, scope, valueToSet}) {
		new ParserEval({text: text, scope: scope, $powerUi: this, valueToSet: valueToSet});
	}

	// Return object on $scope or $powerUi
	getObjectOnScope({text, scope}) {
		return new ParserEval({text: text, scope: scope, $powerUi: this}).currentValue;
	}

	initAll() {
		// If initAlreadyRun is true that is not the first time this initiate, so wee need clean the events
		if (this.initAlreadyRun) {
			this.powerTree.removeAllEvents();
		}
		this._createPowerTree();
		this.tmp = {dropmenu: {}, bar: {}};
		// If not touchdevice add keyboardManager
		// if (!this.touchdevice) {
		// 	this.keyboardManager = new KeyboardManager(this);
		// }
		this.initAlreadyRun = true;
		for (const item of this.waitingInit) {
			document.getElementById(item.node.id).style.visibility = null;
		}
		this.waitingInit = [];
	}

	initNodes() {
		// Add ids to remove from this.waitingInit
		const needRemove = [];
		for (const currentNode of this.waitingInit) {
			for (const toCheck of this.waitingInit) {
				if (currentNode.viewId !== toCheck.viewId) {
					const isInner = currentNode.node.contains(toCheck.node);
					if (isInner) {
						needRemove.push(toCheck.viewId);
					}
				}
			}
		}
		this.waitingInit = this.waitingInit.filter(n=> !needRemove.includes(n.viewId));

		for (const item of this.waitingInit) {
			// Interpolate using root controller scope
			this.powerTree.createAndInitObjectsFromCurrentNode({id: item.node.id});
			document.getElementById(item.node.id).style.visibility = null;
		}
		this.waitingInit = [];
	}

	prepareViewToLoad({viewId, routeId}) {
		const view = document.getElementById(viewId);
		this.waitingInit.push({node: view, viewId: viewId});
		return view;
	}

	// Templates for views with controllers
	loadTemplateUrl({template, viewId, currentRoutes, routeId, routes, title, loadViewInOrder, orderedRoutesToOpen, routeIndex, ctx, _resolve}) {
		const self = this;
		const view = this.prepareViewToLoad({viewId: viewId, routeId: routeId});
		this.request({
				url: template,
				method: 'GET',
				status: 'Loading page',
		}).then(function (response, xhr) {
			template = xhr.responseText;
			self.buildViewTemplateAndMayCallInit({
				self: self,
				view: view,
				template: template,
				routeId: routeId,
				viewId: viewId,
				title: title,
				loadViewInOrder: loadViewInOrder,
				orderedRoutesToOpen: orderedRoutesToOpen,
				routeIndex: routeIndex,
				ctx: ctx,
				_resolve: _resolve,
			});
			// Cache this template for new requests if avoidCacheTemplate not setted as true
			const routeConfig = routes[routeId];
			if (routeConfig.avoidCacheTemplate !== true) {
				routeConfig.template = xhr.responseText;
				routeConfig.templateIsCached = true;
			} else {
				routeConfig.templateIsCached = false;
			}
		}).catch(function (response, xhr) {
			window.console.log('ERROR loading templateURL:', response);
		});
	}
	// PowerTemplate
	loadTemplateComponent({template, viewId, currentRoutes, routeId, routes, title, $ctrl, loadViewInOrder, orderedRoutesToOpen, routeIndex, ctx, _resolve}) {
		const self = this;
		const view = this.prepareViewToLoad({viewId: viewId, routeId: routeId});
		const component = new template({$powerUi: this, viewId: viewId, routeId: routeId, $ctrl: $ctrl});
		// Add $tscope to controller and save it with the route
		$ctrl.$tscope = component.component;
		routes[routeId].$tscope = component.component;

		component.template.then(function (response) {
			template = response;
			self.buildViewTemplateAndMayCallInit({
				self: self,
				view: view,
				template: template,
				routeId: routeId,
				viewId: viewId,
				title: title,
				loadViewInOrder: loadViewInOrder,
				orderedRoutesToOpen: orderedRoutesToOpen,
				routeIndex: routeIndex,
				ctx: ctx,
				_resolve: _resolve,
			});
		}).catch(function (response, xhr) {
			window.console.log('ERROR loading templateComponent:', response);
		});
	}

	loadTemplate({template, viewId, currentRoutes, routeId, routes, title, loadViewInOrder, orderedRoutesToOpen, routeIndex, ctx, _resolve}) {
		const view = this.prepareViewToLoad({viewId: viewId, routeId: routeId});
		// Add $tscope to controller if have a saved $tscope
		if (routes[routeId].$tscope) {
			this.controllers[viewId].instance.$tscope = routes[routeId].$tscope;
		}
		this.buildViewTemplateAndMayCallInit({
			self: this,
			view: view,
			template: template,
			routeId: routeId,
			viewId: viewId,
			title: title,
			loadViewInOrder: loadViewInOrder,
			orderedRoutesToOpen: orderedRoutesToOpen,
			routeIndex: routeIndex,
			ctx: ctx,
			_resolve: _resolve,
		});
	}

	callInitViews() {
		if (this.initAlreadyRun) {
			this.initNodes();
		} else {
			this.initAll();
		}
		this._events.ready.broadcast('ready');
	}

	// When a view is loaded built it's template, may call init() and may Init all views when all loaded
	buildViewTemplateAndMayCallInit({self, view, template, routeId, viewId, title, loadViewInOrder, orderedRoutesToOpen, routeIndex, ctx, _resolve}) {
		// TODO: Why widget has init?
		if (self.controllers[viewId] && self.controllers[viewId].instance && self.controllers[viewId].instance.isWidget) {
			if (self.controllers[viewId].instance.init) {
				self.controllers[viewId].instance.init();
			}
			template = self.controllers[viewId].instance.$buildTemplate({template: template, title: title});
		}

		view.innerHTML = template;

		const tscope = (self.controllers[viewId].instance && self.controllers[viewId].instance.$tscope) ? self.controllers[viewId].instance && self.controllers[viewId].instance.$tscope : null;
		const viewNode = document.getElementById(viewId);
		if (tscope && viewNode) {
			// Add a list of css selectors to current view
			if (tscope.$classList && tscope.$classList.length) {
				for (const css of tscope.$classList) {
					viewNode.classList.add(css);
				}
			}
			// Add a list of css selectors to routes view
			if (tscope.$routeClassList) {
				for (const routeId of Object.keys(tscope.$routeClassList)) {
					const routeScope = tscope.$ctrl.getRouteCtrl(routeId);
					const routeViewId = routeScope ? routeScope._viewId : null;
					const routeViewNode = routeViewId ? document.getElementById(routeViewId) : null;
					if (routeViewNode) {
						for (const css of tscope.$routeClassList[routeId]) {
							routeViewNode.classList.add(css);
						}
					}
				}
			}
		}

		if (orderedRoutesToOpen) {
			loadViewInOrder(orderedRoutesToOpen, routeIndex, ctx, _resolve);
		}
	}

	removeCss(id, css) {
		const element = document.getElementById(id);
		element.classList.remove(css);
	}
	addCss(id, css) {
		const element = document.getElementById(id);
		element.classList.add(css);
	}

	onFormError({id, msg}) {
		// Get the form input to watch it
		const formInput = document.getElementById(id);
		// Get pw-field-container element to add pw-has-error class
		const formContainer = formInput.parentNode;
		formContainer.classList.add('pw-has-error');

		// Get pw-control-helper element to add the message text
		const helpers = formContainer.getElementsByClassName('pw-control-helper') || null;
		const formHelper = helpers ? helpers[0] : null;

		if (formHelper) {
			formHelper.innerText = msg;
		}

		// Save the current value to compare
		const savedValue = formInput.value;
		new watchInputUntilThen(
			formInput,
			function (element) {
				// This is the condition to remove the has-error
				let valueChange = false;
				if (element.value !== savedValue) {
					valueChange = true;
				}

				return valueChange;
			},
			function (element) {
				// This is the 'thanFn', it runs when the above condition is true
				if (formContainer) {
					formContainer.classList.remove('pw-has-error');
				}
				if (formHelper) {
					formHelper.innerText = '';
				}
			}
		);
	}

	sanitizeHTML(str) {
		const temp = document.createElement('div');
		temp.textContent = str;
		return temp.innerHTML;
	}

	getRouteCtrl(routeId) {
		for (const key of Object.keys(this.controllers)) {
			const ctrl = this.controllers[key];
			if (ctrl.instance && ctrl.instance._routeId === routeId) {
				return ctrl.instance;
			}
		}
		return null;
	}

	getViewCtrl(viewId) {
		for (const key of Object.keys(this.controllers)) {
			const ctrl = this.controllers[key];
			if (ctrl.instance && ctrl.instance._viewId === viewId) {
				return ctrl.instance;
			}
		}
		return null;
	}

	_powerView(element) {
		return new PowerView(element, this);
	}

	_powerMenu(element) {
		return new PowerMenu(element, this);
	}
	_powerSplitBar(element) {
		return new PowerSplitBar(element, this);
	}

	_powerToolbar(element) {
		return new PowerToolbar(element, this);
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

	_powerTabs(element) {
		return new PowerTabs(element, this);
	}

	_powerTabSection(element) {
		return new PowerTabSection(element, this);
	}

	_powerList(element) {
		return new PowerList(element, this);
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

	_powerTreeView(element) {
		return new PowerTreeView(element, this);
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
	_offsetComputedHeight(element) {
		const _element = window.getComputedStyle(element);
		return parseInt(_element.height.split('px')[0] || 0) + parseInt(_element['margin-top'].split('px')[0] || 0) + parseInt(_element['border-top-width'].split('px')[0] || 0) + parseInt(_element['margin-bottom'].split('px')[0] || 0)  + parseInt(_element['border-bottom-width'].split('px')[0] || 0) + parseInt(_element['padding-top'].split('px')[0] || 0) + parseInt(_element['padding-bottom'].split('px')[0] || 0);
	}

	_computedTopBottomPadding(element) {
		const _element = window.getComputedStyle(element);
		return parseInt(_element['padding-top'].split('px')[0] || 0) + parseInt(_element['padding-bottom'].split('px')[0] || 0);
	}
	_computedTopPadding(element) {
		const _element = window.getComputedStyle(element);
		return parseInt(_element['padding-top'].split('px')[0] || 0);
	}

	_computedLeftRightPadding(element) {
		const _element = window.getComputedStyle(element);
		return parseInt(_element['padding-left'].split('px')[0] || 0) + parseInt(_element['padding-right'].split('px')[0] || 0);
	}

	_offsetComputedWidth(element) {
		const _element = window.getComputedStyle(element);
		return parseInt(_element.width.split('px')[0] || 0) - (parseInt(_element['padding-left'].split('px')[0] || 0) + parseInt(_element['padding-right'].split('px')[0] || 0));
	}
	_offsetComputedAdjustSides(element) {
		const _element = window.getComputedStyle(element);
		return parseInt(_element['padding-left'].split('px')[0] || 0) + parseInt(_element['padding-right'].split('px')[0] || 0) + parseInt(_element['border-left-width'].split('px')[0] || 0) + parseInt(_element['border-right-width'].split('px')[0] || 0);
	}
	_offsetComputedAdjustTopBottom(element) {
		const _element = window.getComputedStyle(element);
		return parseInt(_element['padding-top'].split('px')[0] || 0) + parseInt(_element['padding-bottom'].split('px')[0] || 0) + parseInt(_element['border-top-width'].split('px')[0] || 0) + parseInt(_element['border-bottom-width'].split('px')[0] || 0);
	}
}

export { PowerUi };

class PowerScope {
	constructor({$powerUi}) {
		// Add $powerUi to controller
		this.$powerUi = $powerUi;
		this._servicesInstances = {};
	}

	newPowerTextBind(propertyName, bindsArray) {
		return new PowerTextBind(propertyName, bindsArray);
	}

	newPowerStyleBind(propertyName, bindsArray) {
		return new PowerStyleBind(propertyName, bindsArray);
	}

	$service(name) {
		if (this._servicesInstances[name]) {
			return this._servicesInstances[name];
		} else {
			this._servicesInstances[name] = new this.$powerUi._services[name].component({
				$powerUi: this.$powerUi,
				$ctrl: this,
				params: this.$powerUi._services[name].params,
			});
			return this._servicesInstances[name];
		}
	}
}

export { PowerScope };

class PowerServices {
	constructor({$powerUi, $ctrl}) {
		this.$powerUi = $powerUi;
		this.$ctrl = $ctrl;
	}
}

class JSONSchemaService extends PowerServices {
	constructor({$powerUi, $ctrl}) {
		super({$powerUi, $ctrl});
	}

	// Recursively Clone JSON nodes
	cloneObject(obj) {
		if (typeof obj === 'object' && obj.length !== undefined) {
			const newObj = [];
			for (const item of obj) {
				if (typeof item === 'object') {
					newObj.push(this.cloneObject(item));
				} else {
					newObj.push(item);
				}
			}
			return newObj;
		} else {
			const newObj = {};
			// loop over the keys of the object first node
			for (const key of Object.keys(obj)) {
				// If this key is an array
				if (typeof obj[key] === 'object' && obj[key].length !== undefined) {
					newObj[key] = [];
					for (const item of obj[key]) {
						if (typeof item === 'object') {
							newObj[key].push(this.cloneObject(item));
						} else {
							newObj[key].push(item);
						}
					}
				// If this key is an object
				} else if (typeof obj[key] === 'object') {
					newObj[key] = {};
					const _item = obj[key];
					for (const k of Object.keys(_item)) {
						if (typeof _item[k] === 'object') {
							newObj[key][k] = this.cloneObject(_item[k]);
						} else {
							newObj[key][k] = _item[k];
						}
					}
				// If this key is any other typeof
				} else {
					newObj[key] = obj[key];
				}
			}
			return newObj;
		}
	}

	// Recursively overwrite any property on originalJSON node that is declared on newJSON object
	overwriteJSON(originalJson, newJson) {
		// loop over the keys of the object first node
		for (const key of Object.keys(newJson)) {
			// If do not exists in originalJson just add it
			if (!originalJson[key]) {
				originalJson[key] = newJson[key];
			// If this key is an array
			} else if (typeof newJson[key] === 'object' && newJson[key].length !== undefined) {
				let index = 0;
				for (const item of newJson[key]) {
					// If do not exists in originalJson just add it
					if (originalJson[key][index] === undefined) {
							originalJson[key].push(item);
					} else if (typeof item === 'object') {
						originalJson[key][index] = this.overwriteJSON(originalJson[key][index], item);
					} else {
						originalJson[key][index] = item;
					}
					index = index + 1;
				}
			// If this key is an object
			} else if (typeof newJson[key] === 'object') {
				const _item = newJson[key];
				for (const k of Object.keys(_item)) {
					if (typeof _item[k] === 'object' && originalJson[key][k] !== undefined) {
						originalJson[key][k] = this.overwriteJSON(originalJson[key][k], _item[k]);
					// If do not exists in originalJson just add it
					} else {
						originalJson[key][k] = _item[k];
					}
				}
			// If this key is any other typeof
			} else {
				originalJson[key] = newJson[key];
			}
		}
		return originalJson;
	}

	registerJSONById(json) {
		if (!this.$powerUi.JSONById[json.$id]) {
			this.$powerUi.JSONById[json.$id] = json;
		}
	}

	getNewJSON(json) {
		const clonedJson = this.cloneObject(this.$powerUi.JSONById[json.$ref]);
		delete clonedJson.$id;
		const newJson = this.overwriteJSON(clonedJson, json);
		delete newJson.$ref;
		return newJson;
	}

	validateType(type, json) {
		// console.log('type', type, 'json', json, typeof json, typeof json === type);
		if (typeof json === type) {
			return true;
		} else if (type === 'array' && json.length !== undefined) {
			return true;
		} else if (type === 'any') {
			return true;
		} else if (type.length !== undefined && json.length !== undefined) {
			window.console.log(`JSON type expected to be "${type}" but is "${typeof json}"`, json);
			return false;
		} else {
			window.console.log(`JSON type expected to be "${type}" but is "${typeof json}"`, json);
			return false;
		}
	}

	// If exist some if this properties the required is not really needed
	especialRequired(json, requiredKey) {
		const especial = {
			"html": true,
			"button": true,
			"item": true,
			"status": true,
			"icon": true,
			"menu": true,
			"dropmenu": true,
			"dropmenubutton": true,
			"simpleform": true,
			"tree": true,
			"accordion": true,
			"grid": true
		};
		for (const key of Object.keys(json)) {
			if (especial[key] && typeof json[key] === 'object' && requiredKey === key) {
				return true;
			}
		}
	}

	_validateEvents(events, obj, name) {
		for (const event of events) {
			if (this._validate(this.gridDef().properties.events, event) === false) {
				window.console.log(`Failed JSON ${name} event:`, event, events, obj);
				return `Failed JSON ${name} event!`;
			}
		}
		return true;
	}

	_validate(schema, json) {
		// Validate item properties
		for (const key of Object.keys(schema.properties || {})) {
			// Validade other types property
			if (schema.properties[key].type && json[key] !== undefined) {
				// Check current object type against schema type
				if (this.validateType(schema.properties[key].type, json[key]) === false) {
					return false;
				}
			}
		}
		// Validade other properties required fields
		if (schema.required) {
			for (const key of schema.required) {
					// if (schema.$id === '#/schema/draft-07/dropmenu' && !json.items) {
					// 	console.log('key', key, 'schema', schema, json);
					// }
				if (!this.especialRequired(json, key) && !json[key]) {
					window.console.log(`JSON missing required property: "${key}"`, json);
					return false;
				}
			}
		}

		return true;
	}

	// Build pow-event attributes
	_getEventTmpl(events) {
		// Add events if have
		if (events) {
			let eventsTmpl = '';
			for (const event of events) {
				eventsTmpl = `${eventsTmpl} ${event.event}="${event.fn}" `;
			}
			eventsTmpl = `data-pow-event ${eventsTmpl}`;
			return eventsTmpl;
		} else {
			return '';
		}
	}

	_getIdTmpl(id, required) {
		if (id) {
			return `id="${id}"`;
		} else if (required) {
			return `id="${required}_${this.$powerUi._Unique.next()}"`;
		} else {
			return '';
		}
	}

	_getAttrTmpl(attrs) {
		let attributes = '';
		if (attrs) {
			for (const attr of attrs) {
				if (attr.value !== undefined) {
					attributes = `${attributes} ${attr.name}="${attr.value}"`;
				} else {
					attributes = `${attributes} ${attr.name}`;
				}
			}
		}
		return attributes;
	}

	_getClassTmpl(classList) {
		let customCss = '';
		if (classList) {
			for (const css of classList) {
				customCss = customCss ? `${customCss} ${css}` : css;
			}
			return `class="${customCss}"`;
		}
		return customCss;
	}

	_getHtmlBasicTmpl(item, required) {
		return `${this._getIdTmpl(item.id, required)} ${this._getClassTmpl(item.classList)} ${this._getAttrTmpl(item.attrs)} ${this._getEventTmpl(item.events)}${item.title ? ' title="' + item.title + '"' : ''}${item.for ? ' for="' + item.for + '"' : ''}${item.src ? ' src="' + item.src + '"' : ''}${item.cols ? ' cols="' + item.cols + '"' : ''}${item.rows ? ' rows="' + item.rows + '"' : ''}${item.width ? ' width="' + item.width + '"' : ''}${item.height ? ' height="' + item.height + '"' : ''}${item.disabled === true ? ' disabled' : ''}${item.selected === true ? ' selected' : ''}${item.bind ? ' data-pow-bind="' + item.bind + '"' : ''}${item.value ? ' value="' + item.value + '"' : ''}${item.name ? ' name="' + item.name + '"' : ''}${item.required ? ' required' : ''}`;
	}

	_getHtmlMoreBasicTmpl(item, required) {
		return `${this._getIdTmpl(item.id, required)} ${this._getClassTmpl(item.classList)} ${this._getAttrTmpl(item.attrs)} ${this._getEventTmpl(item.events)}`;
	}

	_getInputBasicTmpl(control, required) {
		return `${this._getHtmlBasicTmpl(control, required)} type="${control.type || 'text'}"${control.pattern ? ' pattern="' + control.pattern + '"' : ''}`;
	}

	_arrayOfSchemas(_array, func, keysPath) {
		let template = '';
		let counter = 0;
		for (const tag of _array) {
			const currentKeysPath = keysPath ? `${keysPath},${counter}` : '';
			template = `${template}
				${this[func](tag, currentKeysPath)}`;
			counter = counter + 1;
		}

		return template;
	}

	otherJsonKind(item, keysPath) {
		if (item.button) {
			return this.button(item.button, null, keysPath);
		} else if (item.simpleForm) {
			return this.simpleForm(item.simpleForm, keysPath);
		} else if (item.tree) {
			return this.tree(item.tree, keysPath);
		} else if (item.dropMenuButton) {
			return this.dropMenuButton(item.dropMenuButton, keysPath);
		} else if (item.dropmenu) {
			return this.dropmenu(item.dropmenu, null, null, keysPath);
		} else if (item.menu) {
			return this.menu(item.menu, keysPath);
		} else if (item.accordion) {
			return this.accordion(item.accordion, keysPath);
		} else if (item.icon) {
			return this.icon(item.icon, keysPath);
		} else if (item.status) {
			return this.status(item.status, keysPath);
		} else if (item.html) {
			return this.html(item.html, keysPath);
		} else if (item.grid) {
			return this.grid(item.grid, keysPath);
		} else {
			return null;
		}
	}

	appendClassList({element, json}) {
		for (const css of json.classList) {
			element.classList.add(css);
		}
	}

	// Icon is a css font or an img
	appendIcon({element, json, mirrored, keysPath}) {
		const iconHolder = document.createElement('div');
		const iconJson = {};
		if (json.icon === 'img' && json['icon-src']) {
			iconJson.kind = 'img';
			iconJson.src = json['icon-src'];
		} else {
			iconJson.icon = json.icon;
		}

		iconHolder.innerHTML = this.icon(iconJson, keysPath);
		const icon = iconHolder.childNodes[0];

		if ((!json['icon-position'] && mirrored !== true) || json['icon-position'] === 'left') {
			element.insertBefore(icon, element.childNodes[0]);
		} else {
			element.appendChild(icon);
		}
	}

	appendStatus({element, json, mirrored, keysPath}) {
		const statusHolder = document.createElement('div');
		statusHolder.innerHTML = this.status(json, keysPath);
		const status = statusHolder.childNodes[0];

		if (mirrored === true) {
			status.dataset.powerInactive = json.inactive.replace('right', 'left');
		} else {
			status.dataset.powerInactive = json.inactive;
		}
		status.dataset.powerActive = json.active;
		if (json.position === 'left' || mirrored === true) {
			element.insertBefore(status, element.childNodes[0]);
		} else {
			element.appendChild(status);
		}
	}

	accordion(_accordion, keysPath) {
		// Do not change the original JSON
		const accordion = this.cloneObject(_accordion);
		// This allow pass an array of accordions
		if (_accordion.length) {
			return this._arrayOfSchemas(_accordion, 'accordion', keysPath);
		} else if (_accordion.$ref) {
			// Use the original JSON
			return this.accordion(this.getNewJSON(_accordion), keysPath);
		} else {
			if (_accordion.$id) {
				// Register original JSON
				this.registerJSONById(_accordion);
			}

			if (this._validate(this.accordionDef(), accordion) === false) {
				window.console.log('Failed JSON accordion:', accordion);
				throw 'Failed JSON accordion!';
			}
			if (this._validate(this.accordionDef().properties.config, accordion.config) === false) {
				window.console.log('Failed JSON accordion config:', accordion.config);
				throw 'Failed JSON accordion config!';
			}

			if (!accordion.classList) {
				accordion.classList = [];
			}
			accordion.classList.push('power-accordion');

			const editableJson = `${keysPath ? ' data-is-json="accordion"' : ''}`;

			let mainTmpl = `<div ${this._getHtmlBasicTmpl(accordion)} data-multiple-sections-open="${(accordion.config && accordion.config.multipleSectionsOpen ? accordion.config.multipleSectionsOpen : false)}"${editableJson}>`;

			let counter = 0;
			for (const panel of accordion.panels) {
				const currentKeysPath = keysPath ? `${keysPath},${counter}` : '';
				if (this._validate(this.accordionDef().properties.panels, panel) === false) {
					window.console.log('Failed JSON accordion panel:', panel);
					throw 'Failed JSON accordion panel!';
				}
				if (this._validate(this.accordionDef().properties.panels.properties.header, panel.header) === false) {
					window.console.log('Failed JSON accordion header:', panel.header);
					throw 'Failed JSON accordion header!';
				}
				if (this._validate(this.accordionDef().properties.panels.properties.section, panel.section) === false) {
					window.console.log('Failed JSON accordion section:', panel.section);
					throw 'Failed JSON accordion section!';
				}

				// Headers
				const icon = {};
				if (panel.header.icon) {
					if (panel.header.icon === 'img' && panel.header['icon-src']) {
						icon.kind = 'img';
						icon.src = panel.header['icon-src'];
					} else {
						icon.icon = panel.header.icon;
					}
				}

				const status = {};
				if (panel.header.status) {
					status.active = panel.header.status.active;
					status.inactive = panel.header.status.inactive;
				}

				const sectionId = panel.section.id || this.$powerUi._Unique.next();

				const panelJson = `${keysPath ? ' data-panel-index="' + counter + '"' : ''}`;
				const headerTmpl = `<div
				class="power-action" data-power-target="${sectionId}" ${this._getIdTmpl(panel.header.id, true)}>
					<div${panelJson}>
						${this.icon(icon, currentKeysPath)}
						<span class="pw-label"${currentKeysPath ? ' data-keys-path="' + currentKeysPath + '"' : ''}>${panel.header.label}</span>
					</div>
					${this.status(status, currentKeysPath)}
				</div>`;

				// Sections
				let sectionTmpl = `<div class="power-accordion-section"${panelJson}${currentKeysPath ? ' data-keys-path="' + currentKeysPath + '"' : ''} ${this._getIdTmpl(sectionId)}>
					<div>${panel.section.text || ''}</div>`;

				// If this is not an html json, but a button, dropmenu or other kind of json
				if (panel.section.children) {
					let _c = 0;
					for (const child of panel.section.children) {
						const _cKeysPath = currentKeysPath ? `${currentKeysPath},${_c}` : '';
						sectionTmpl = sectionTmpl + this.otherJsonKind(child, _cKeysPath);
						_c = _c + 1;
					}
				}
				sectionTmpl = sectionTmpl + '</div>';

				mainTmpl = mainTmpl + headerTmpl + sectionTmpl;
				counter = counter + 1;
			}

			return mainTmpl + '</div>';
		}
	}

	powertabs(_powertabs, keysPath) {
		// Do not change the original JSON
		const powertabs = this.cloneObject(_powertabs);
		// This allow pass an array of powertabs
		if (_powertabs.length) {
			return this._arrayOfSchemas(_powertabs, 'powertabs', keysPath);
		} else if (_powertabs.$ref) {
			// Use the original JSON
			return this.powertabs(this.getNewJSON(_powertabs), keysPath);
		} else {
			if (_powertabs.$id) {
				// Register original JSON
				this.registerJSONById(_powertabs);
			}

			if (this._validate(this.powertabsDef(), powertabs) === false) {
				window.console.log('Failed JSON powertabs:', powertabs);
				throw 'Failed JSON powertabs!';
			}

			if (!powertabs.classList) {
				powertabs.classList = [];
			}
			powertabs.classList.push('power-tabs');
			const editableJson = `${keysPath ? ' data-is-json="powertabs"' : ''}`;

			let mainTmpl = `<div ${this._getHtmlBasicTmpl(powertabs)}${editableJson}>`;

			let counter = 0;
			for (const tab of powertabs.tabs) {
				const currentKeysPath = keysPath ? `${keysPath},${counter}` : '';
				if (this._validate(this.powertabsDef().properties.tabs, tab) === false) {
					window.console.log('Failed JSON tab:', tab);
					throw 'Failed JSON tab!';
				}
				if (this._validate(this.powertabsDef().properties.tabs.properties.header, tab.header) === false) {
					window.console.log('Failed JSON tab header:', tab.header);
					throw 'Failed JSON tab header!';
				}
				if (this._validate(this.powertabsDef().properties.tabs.properties.section, tab.section) === false) {
					window.console.log('Failed JSON tab section:', tab.section);
					throw 'Failed JSON tab section!';
				}

				// Headers
				const icon = {};
				if (tab.header.icon) {
					if (tab.header.icon === 'img' && tab.header['icon-src']) {
						icon.kind = 'img';
						icon.src = tab.header['icon-src'];
					} else {
						icon.icon = tab.header.icon;
					}
				}

				const status = {};
				if (tab.header.status) {
					status.active = tab.header.status.active;
					status.inactive = tab.header.status.inactive;
				}

				const sectionId = tab.section.id || this.$powerUi._Unique.next();

				const tabJson = `${keysPath ? ' data-tab-index="' + counter + '"' : ''}`;
				const headerTmpl = `<div
				class="power-action" data-power-target="${sectionId}" ${this._getIdTmpl(tab.header.id, true)}>
					<div${tabJson}>
						${this.icon(icon, currentKeysPath)}
						<span class="pw-label"${currentKeysPath ? ' data-keys-path="' + currentKeysPath + '"' : ''}>${tab.header.label}</span>
					</div>
					${this.status(status)}
				</div>`;

				// Sections
				let sectionTmpl = `<div class="power-tab-section"${tabJson}${currentKeysPath ? ' data-keys-path="' + currentKeysPath + '"' : ''} ${this._getIdTmpl(sectionId)}>
					${tab.section.text || ''}`;

					// If this is not an html json, but a button, dropmenu or other kind of json
					if (tab.section.children) {
						let _c = 0;
						for (const child of tab.section.children) {
							const _cKeysPath = currentKeysPath ? `${currentKeysPath},${_c}` : '';
							sectionTmpl = sectionTmpl + this.otherJsonKind(child, _cKeysPath);
							_c = _c + 0;
						}
					}
				sectionTmpl = sectionTmpl + '</div>';

				mainTmpl = mainTmpl + headerTmpl + sectionTmpl;
				counter = counter + 0;
			}

			return mainTmpl + '</div>';
		}
	}

	_setBarDropmenuPosition(bar) {
		if (!bar.dropMenuPosition) {
			if (!bar.orientation || bar.orientation === 'horizontal') {
				if (bar.mirrored === true) {
					if (bar.position === undefined || bar.position === 'fixed-top') {
						bar.dropMenuPosition = 'bottom-left';
					} else if (bar.position === 'fixed-bottom') {
						bar.dropMenuPosition = 'top-left';
					}
				} else {
					if (bar.position === undefined || bar.position === 'fixed-top') {
						bar.dropMenuPosition = 'bottom-right';
					} else if (bar.position === 'fixed-bottom') {
						bar.dropMenuPosition = 'top-right';
					}
				}
			} else if (bar.orientation === 'vertical') {
				if (bar.mirrored === true || (bar.mirrored === undefined && (bar.position === 'fixed-right' || bar.position === 'float-right'))) {
					bar.dropMenuPosition = 'left-bottom';
				} else {
					bar.dropMenuPosition = 'right-bottom';
				}
			}
		}
	}

	_setBarCssStyles(bar, element) {
		if (!bar.position) {
			return;
		}
		if (bar.mirrored) {
			element.classList.add('pw-mirrored');
		}
		if (bar.position.includes('fixed')) {
			const fixedWindow = bar.position.includes('window');
			element.classList.add(fixedWindow ? 'pw-bar-window-fixed' : 'pw-bar-fixed');
		}

		if (bar.position === 'fixed-top' || bar.position === 'fixed-window-top') {
			element.classList.add('pw-top');
			if (!bar.orientation || bar.orientation === 'horizontal') {
				element.classList.add('pw-horizontal');
			}
		} else if (bar.position === 'fixed-bottom' || bar.position === 'fixed-window-bottom') {
			element.classList.add('pw-bottom');
			if (!bar.orientation || bar.orientation === 'horizontal') {
				element.classList.add('pw-horizontal');
			}
		} else if (bar.position === 'fixed-left' || bar.position === 'fixed-window-left') {
			element.classList.add('pw-left');
			if (!bar.orientation || bar.orientation === 'vertical') {
				element.classList.add('pw-vertical');
			}
		} else if (bar.position === 'fixed-right' || bar.position === 'fixed-window-right') {
			element.classList.add('pw-right');
			if (!bar.orientation || bar.orientation === 'vertical') {
				element.classList.add('pw-vertical');
			}
		} else if (bar.position === 'float-left') {
			element.classList.add('pw-bar-float');
			element.classList.add('pw-left');
		} else if (bar.position === 'float-right') {
			element.classList.add('pw-bar-float');
			element.classList.add('pw-right');
		}
		// Window can ignore bar
		if (bar.ignore) {
			element.classList.add('pw-ignore');
		}
		// Set priority
		if (bar.priority) {
			element.dataset.pwPriority = bar.priority;
		}
		// Set orientation
		if (!bar.orientation) {
			if (element.classList.contains('pw-vertical')) {
				bar.orientation = 'vertical';
			} else {
				bar.orientation = 'horizontal';
			}
		}
	}

	_setBarOrientation(bar, element) {
		if (bar.orientation === 'horizontal') {
			element.classList.add('pw-horizontal');
		} else if (bar.orientation === 'vertical') {
			element.classList.add('pw-vertical');
		}
	}

	menu(_menu, keysPath) {
		// Do not change the original JSON
		const menu = this.cloneObject(_menu);
		// This allow pass an array of menus
		if (_menu.length) {
			return this._arrayOfSchemas(_menu, 'menu', keysPath);
		} else if (_menu.$ref) {
			// Use the original JSON
			return this.menu(this.getNewJSON(_menu), keysPath);
		} else {
			if (_menu.$id) {
				// Register original JSON
				this.registerJSONById(_menu);
			}

			if (this._validate(this.menuDef(), menu) === false) {
				window.console.log('Failed JSON menu:', menu);
				throw 'Failed JSON dropmenu!';
			}
			if (menu.events) {
				const result = this._validateEvents(menu.events, menu, 'menu');
				if ( result !== true) {
					throw result;
				}
			}

			if (!menu.orientation) {
				if (!menu.position || menu.position.includes('top') || menu.position.includes('bottom')) {
					menu.orientation = 'horizontal';
				} else {
					menu.orientation = 'vertical';
				}
			}

			if (!menu.classList) {
				menu.classList = [];
			}

			menu.classList.push('power-menu pw-bar');

			// Bar get its template from dropmenu
			const tmpEl = document.createElement('div');

			// Set dropmenu position
			this._setBarDropmenuPosition(menu);

			tmpEl.innerHTML =  this._buildbarEl(menu, menu.mirrored, menu.flip, (keysPath ? keysPath : ''));

			const menuEl = tmpEl.children[0];
			// Set menu css styles
			this._setBarCssStyles(menu, menuEl);
			this._setBarOrientation(menu, menuEl);

			// Brand
			if (menu.brand) {
				if (menu.brand.events) {
					const result = this._validateEvents(menu.brand.events, menu.brand, 'brand');
					if ( result !== true) {
						throw result;
					}
				}
				// Add menu brand
				const brandHolderEl = document.createElement('div');
				if (!menu.brand.classList) {
					menu.brand.classList = [];
				}
				if (!menu.brand.classList.includes('power-brand')) {
					menu.brand.classList.push('power-brand');
				}
				let kind = '';
				if (menu.brand.text) {
					kind = 'text';
					menu.brand.content = menu.brand.text;
				} else {
					kind = 'html';
					menu.brand.content = menu.brand.html;
				}
				brandHolderEl.innerHTML = `<div ${this._getHtmlBasicTmpl(menu.brand)}${keysPath ? ' data-kind="' + kind + '"' : ''}>${menu.brand.content}</div>`;
				const brandEl = brandHolderEl.children[0];
				menuEl.insertBefore(brandEl, menuEl.childNodes[0]);
			}

			// Add hamburger menu toggle
			if (menu.colapse !== false) {
				menuEl.classList.add('pw-colapse');
				const hamburgerHolderEl = document.createElement('div');
				hamburgerHolderEl.innerHTML = `<a id="${menu.id}-action" class="power-toggle" data-power-target="${menu.id}">
					<i class="pw-icon ${menu.toggleIcon ? menu.toggleIcon : 'icon-hamburguer'}"></i>
				</a>`;
				const hamburgerEl = hamburgerHolderEl.children[0];
				menuEl.appendChild(hamburgerEl);
			}

			return tmpEl.innerHTML;
		}
	}

	toolbar(_toolbar, keysPath) {
		// Do not change the original JSON
		const toolbar = this.cloneObject(_toolbar);
		// This allow pass an array of menus
		if (_toolbar.length) {
			return this._arrayOfSchemas(_toolbar, 'toolbar', keysPath);
		} else if (_toolbar.$ref) {
			// Use the original JSON
			return this.toolbar(this.getNewJSON(_toolbar), keysPath);
		} else {
			if (_toolbar.$id) {
				// Register original JSON
				this.registerJSONById(_toolbar);
			}

			if (this._validate(this.toolbarDef(), toolbar) === false) {
				window.console.log('Failed JSON toolbar:', toolbar);
				throw 'Failed JSON toolbar!';
			}
			if (toolbar.events) {
				const result = this._validateEvents(toolbar.events, toolbar, 'toolbar');
				if ( result !== true) {
					throw result;
				}
			}

			if (!toolbar.orientation) {
				if (!toolbar.position || toolbar.position.includes('top') || toolbar.position.includes('bottom')) {
					toolbar.orientation = 'horizontal';
				} else {
					toolbar.orientation = 'vertical';
				}
			}


			if (!toolbar.classList) {
				toolbar.classList = [];
			}

			toolbar.classList.push('power-toolbar pw-bar pw-icons-bar');

			// Bar get its template from dropmenu
			const tmpEl = document.createElement('div');

			// Set dropmenu position
			this._setBarDropmenuPosition(toolbar);

			tmpEl.innerHTML =  this._buildbarEl(toolbar, toolbar.mirrored, toolbar.flip, (keysPath ? keysPath : ''));

			const toolbarEl = tmpEl.children[0];
			// Set toolbar css styles
			this._setBarCssStyles(toolbar, toolbarEl);

			this._setBarOrientation(toolbar, toolbarEl);

			// Add toolbar toggle
			if (toolbar.colapse !== false) {
				const dotsHolderEl = document.createElement('div');
				dotsHolderEl.innerHTML = `<a id="${toolbar.id}-action" class="power-toggle" data-power-target="${toolbar.id}">
					<i class="pw-icon icon-option-${toolbar.orientation}"></i>
				</a>`;
				const dotsEl = dotsHolderEl.children[0];
				toolbarEl.appendChild(dotsEl);
			}

			return tmpEl.innerHTML;
		}
	}

	splitbar(_splitbar, keysPath) {
		// Do not change the original JSON
		const splitbar = this.cloneObject(_splitbar);
		// This allow pass an array of menus
		if (_splitbar.length) {
			return this._arrayOfSchemas(_splitbar, 'splitbar', keysPath);
		} else if (_splitbar.$ref) {
			// Use the original JSON
			return this.splitbar(this.getNewJSON(_splitbar), keysPath);
		} else {
			if (_splitbar.$id) {
				// Register original JSON
				this.registerJSONById(_splitbar);
			}

			if (this._validate(this.splitbarDef(), splitbar) === false) {
				window.console.log('Failed JSON splitbar:', splitbar);
				throw 'Failed JSON splitbar!';
			}
			if (splitbar.events) {
				const result = this._validateEvents(splitbar.events, splitbar, 'splitbar');
				if ( result !== true) {
					throw result;
				}
			}

			if (!splitbar.orientation) {
				if (!splitbar.position || splitbar.position.includes('top') || splitbar.position.includes('bottom')) {
					splitbar.orientation = 'horizontal';
				} else {
					splitbar.orientation = 'vertical';
				}
			}

			if (!splitbar.classList) {
				splitbar.classList = [];
			}

			splitbar.classList.push('power-split-bar pw-bar');
			if (splitbar.resize !== false) {
				splitbar.classList.push('pw-split');
			}

			// The nav bar
			const tmpEl = document.createElement('div');
			tmpEl.innerHTML = `<nav ${this._getHtmlBasicTmpl(splitbar)}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''} ${splitbar.border ? 'data-pw-border="' + splitbar.border + '" ' : ''}><div class="pw-bar-content">${splitbar.content}</div></nav>`;

			const splitbarEl = tmpEl.children[0];
			// Set splitbar css styles
			this._setBarCssStyles(splitbar, splitbarEl);

			this._setBarOrientation(splitbar, splitbarEl);

			// Add hamburger menu toggle
			if (splitbar.colapse !== false) {
				splitbarEl.classList.add('pw-colapse');
				const hamburgerHolderEl = document.createElement('div');
				hamburgerHolderEl.innerHTML = `<a id="${splitbar.id}-action" class="power-toggle" data-power-target="${splitbar.id}">
					<i class="pw-icon icon-hamburguer"></i>
				</a>`;
				const hamburgerEl = hamburgerHolderEl.children[0];
				splitbarEl.appendChild(hamburgerEl);
			}

			return tmpEl.innerHTML;
		}
	}

	_buildbarEl(bar, mirrored, flip, keysPath='') {
		const tmpEl = document.createElement('div');
		tmpEl.innerHTML = `<nav ${this._getHtmlBasicTmpl(bar)}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''} ${mirrored === true ? ' pw-mirrored' : ''} data-pw-position="${bar.dropMenuPosition}"></nav>`;
		let counter = 0;
		for (const item of bar.items) {
			const itemHolderEl = document.createElement('div');
			const currentKeysPath = keysPath ? `${keysPath},${counter}` : '';
			if (flip && item.status && item.status.active) {
				if (item.status.active.includes('down')) {
					item.status.active = item.status.active.replace('down', 'up');
				} else if (item.status.active.includes('up')) {
					item.status.active = item.status.active.replace('up', 'down');
				}
			}
			if (item.item) {

				itemHolderEl.innerHTML = this.item({
					item: item.item,
					mirrored: item.mirrored === undefined ? mirrored : item.mirrored,
					dropmenuId: item.dropmenu ? item.dropmenu.id : false,
					keysPath: currentKeysPath,
				});
			} else if (item.button && item.dropmenu) {
				if (mirrored !== undefined && item.button.mirrored === undefined) {
					item.button.mirrored = mirrored;
				}
				itemHolderEl.innerHTML = this.dropMenuButton(item, currentKeysPath);
			} else if (item.button && !item.dropmenu) {
				if (mirrored !== undefined && item.button.mirrored === undefined) {
					itemHolderEl.innerHTML = this.button(item.button, mirrored, currentKeysPath);
				} else {
					itemHolderEl.innerHTML = this.button(item.button, null, currentKeysPath);
				}
				// Buttons inside menu needs the 'power-item' class
				itemHolderEl.children[0].classList.add('power-item');
			}

			const anchorEl = itemHolderEl.children[0];

			if (item.item && !item.button) {
				if (item.status) {
					this.appendStatus({element: anchorEl, json: item.status, mirrored: mirrored, keysPath: currentKeysPath});
				}
			}

			tmpEl.children[0].appendChild(anchorEl);

			// Buttons already have the menu created by dropMenuButton inside itemHolderEl
			if (item.button && item.dropmenu) {
				tmpEl.children[0].appendChild(itemHolderEl.children[0]);
			} else if (item.dropmenu && !item.button) {
				// Add submenu if have one and is not a button
				const submenuHolderEl = document.createElement('div');
				submenuHolderEl.innerHTML = this.dropmenu(item.dropmenu, mirrored, flip, currentKeysPath);
				tmpEl.children[0].appendChild(submenuHolderEl.children[0]);
			}
			counter = counter + 1;
		}

		return tmpEl.innerHTML;
	}

	dropmenu(_dropmenu, mirrored, flip, keysPath) {
		// Do not change the original JSON
		const dropmenu = this.cloneObject(_dropmenu);
		const dropmenuPosition = dropmenu.position;
		// This allow pass an array of dropmenus
		if (_dropmenu.length) {
			return this._arrayOfSchemas(_dropmenu, 'dropmenu', keysPath);
		} else if (_dropmenu.$ref) {
			// Use the original JSON
			return this.dropmenu(this.getNewJSON(_dropmenu), mirrored, flip, keysPath);
		} else {
			if (_dropmenu.$id) {
				// Register original JSON
				this.registerJSONById(_dropmenu);
			}

			if (this._validate(this.dropmenuDef(), dropmenu) === false) {
				window.console.log('Failed JSON dropmenu:', dropmenu);
				throw 'Failed JSON dropmenu!';
			}
			if (dropmenu.events) {
				const result = this._validateEvents(dropmenu.events, dropmenu, 'dropmenu');
				if ( result !== true) {
					throw result;
				}
			}

			const tmpEl = document.createElement('div');

			if (!dropmenu.classList) {
				dropmenu.classList = [];
			}

			dropmenu.classList.push('power-dropmenu');

			tmpEl.innerHTML = `<nav ${this._getHtmlBasicTmpl(dropmenu)}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''} ${mirrored === true ? ' pw-mirrored' : ''}></nav>`;

			// Set dropmenu position
			if (dropmenuPosition) {
					const dropmenuEl = tmpEl.children[0];
					dropmenuEl.dataset.pwPosition = dropmenuPosition;
			}

			let counter = 0;

			for (const item of dropmenu.items) {
				const itemHolderEl = document.createElement('div');
				const currentKeysPath = keysPath ? `${keysPath},${counter}` : '';
				if (flip && item.status && item.status.active) {
					if (item.status.active.includes('down')) {
						item.status.active = item.status.active.replace('down', 'up');
					} else if (item.status.active.includes('up')) {
						item.status.active = item.status.active.replace('up', 'down');
					}
				}
				if (item.item) {
					itemHolderEl.innerHTML = this.item({
						item: item.item,
						mirrored: item.mirrored === undefined ? mirrored : item.mirrored,
						dropmenuId: item.dropmenu ? item.dropmenu.id : false,
						keysPath: currentKeysPath
					});
				} else if (item.button && item.dropmenu) {
					if (mirrored !== undefined && item.button.mirrored === undefined) {
						item.button.mirrored = mirrored;
					}
					itemHolderEl.innerHTML = this.dropMenuButton(item, currentKeysPath);
				} else if (item.button && !item.dropmenu) {
					if (mirrored !== undefined && item.button.mirrored === undefined) {
						itemHolderEl.innerHTML = this.button(item.button, mirrored, currentKeysPath);
					} else {
						itemHolderEl.innerHTML = this.button(item.button, null, currentKeysPath);
					}
					// Buttons inside menu needs the 'power-item' class
					itemHolderEl.children[0].classList.add('power-item');
				}

				const anchorEl = itemHolderEl.children[0];

				if (item.item && !item.button) {
					if (item.status) {
						this.appendStatus({element: anchorEl, json: item.status, mirrored: mirrored, keysPath: currentKeysPath});
					}
				}

				tmpEl.children[0].appendChild(anchorEl);

				// Buttons already have the menu created by dropMenuButton inside itemHolderEl
				if (item.button && item.dropmenu) {
					tmpEl.children[0].appendChild(itemHolderEl.children[0]);
				} else if (item.dropmenu && !item.button) {
					// Add submenu if have one and is not a button
					const submenuHolderEl = document.createElement('div');
					submenuHolderEl.innerHTML = this.dropmenu(item.dropmenu, mirrored, flip, currentKeysPath);
					tmpEl.children[0].appendChild(submenuHolderEl.children[0]);
				}
				counter = counter + 1;
			}

			return tmpEl.innerHTML;
		}
	}

	item({item, mirrored, dropmenuId, keysPath}) {
		// Do not change the original JSON
		const newItem = this.cloneObject(item);
		// This allow pass an array of items
		if (item.length) {
			return this._arrayOfSchemas(item, 'item', keysPath);
		} else if (item.$ref) {
			// Use the original JSON
			return this.item(this.getNewJSON(item), mirrored, dropmenuId, keysPath);
		} else {
			if (item.$id) {
				// Register original JSON
				this.registerJSONById(item);
			}

			if (this._validate(this.itemDef(), newItem) === false) {
				window.console.log('Failed JSON item:', newItem);
				return 'Failed JSON item!';
			}
			if (newItem.events) {
				const result = this._validateEvents(newItem.events, newItem, 'item');
				if ( result !== true) {
					throw result;
				}
			}

			const tmpEl = document.createElement('div');

			if (!newItem.classList) {
				newItem.classList = [];
			}

			newItem.classList.push(dropmenuId ? 'power-action' : 'power-item');

			const label = `<span class="pw-label"${keysPath ? ' data-keys-path="' + keysPath + '"' : ''}>${newItem.label}</span>`;

			tmpEl.innerHTML = `<a ${this._getHtmlBasicTmpl(newItem)} ${dropmenuId ? 'data-power-target="' + dropmenuId + '"' : ''}>${newItem.label ? label : ''}</a>`;

			const itemEl = tmpEl.children[0];

			if (newItem.icon) {
				this.appendIcon({element: itemEl, json: newItem, mirrored: mirrored, keysPath: keysPath});
			}

			return tmpEl.innerHTML;
		}
	}

	dropMenuButton(_dropMenuButton, keysPath) {
		// Do not change the original JSON
		const dropMenuButton = this.cloneObject(_dropMenuButton);
		// This allow pass an array of dropMenuButtons
		if (_dropMenuButton.length) {
			return this._arrayOfSchemas(_dropMenuButton, 'dropMenuButton', keysPath);
		} else if (_dropMenuButton.$ref) {
			// Use the original JSON
			return this.dropMenuButton(this.getNewJSON(_dropMenuButton), keysPath);
		} else {
			if (this._validate(this.dropmenubuttonDef(), dropMenuButton) === false) {
				window.console.log('Failed JSON dropMenuButton:', dropMenuButton);
				throw 'Failed JSON dropMenuButton!';
			}

			if (_dropMenuButton.$id) {
				// Register original JSON
				this.registerJSONById(_dropMenuButton);
			}

			const tmpEl = document.createElement('div');
			// Create button
			tmpEl.innerHTML = this.button(dropMenuButton.button, dropMenuButton.button.mirrored, keysPath);

			const buttonEl = tmpEl.children[0];
			buttonEl.dataset.powerTarget = dropMenuButton.dropmenu.id;
			buttonEl.classList.add('power-action');

			if (dropMenuButton.status) {
				this.appendStatus({element: buttonEl, json: dropMenuButton.status, mirrored: dropMenuButton.button.mirrored, flip: dropMenuButton.button.flip, keysPath: keysPath});
			}

			// Create dropmenu
			tmpEl.innerHTML = tmpEl.innerHTML + this.dropmenu(dropMenuButton.dropmenu, dropMenuButton.button.mirrored, dropMenuButton.button.flip, keysPath);

			return tmpEl.innerHTML;
		}
	}

	button(_button, mirrored, keysPath) {
		// Do not change the original JSON
		const button = this.cloneObject(_button);
		// This allow pass an array of buttons
		if (_button.length) {
			return this._arrayOfSchemas(_button, 'button', keysPath);
		} else if (_button.$ref) {
			// Use the original JSON
			return this.button(this.getNewJSON(_button), mirrored, keysPath);
		} else {
			if (_button.$id) {
				// Register original JSON
				this.registerJSONById(_button);
			}

			if (this._validate(this.itemDef(), button) === false) {
				window.console.log('Failed JSON button:', button);
				throw 'Failed JSON button!';
			}
			if (button.events) {
				const result = this._validateEvents(button.events, button, 'button');
				if ( result !== true) {
					throw result;
				}
			}

			const tmpEl = document.createElement('div');

			if (!button.classList) {
				button.classList = [];
			}

			if (!button.type) {
				button.type = 'button';
			}

			button.classList.push(button.kind ? `pw-btn-${button.kind}` : 'pw-btn-default');

			tmpEl.innerHTML = `<button ${this._getInputBasicTmpl(button)}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''}><span class="pw-label">${button.label}</span></button>`;

			const buttonEl = tmpEl.children[0];

			if (button.icon) {
				this.appendIcon({element: buttonEl, json: button, mirrored: mirrored, keysPath: keysPath});
			}

			if (button.classList) {
				this.appendClassList({element: buttonEl, json: button});
			}

			return tmpEl.innerHTML;
		}
	}

	tree(_tree, keysPath) {
		// Do not change the original JSON
		const tree = this.cloneObject(_tree);
		// This allow pass an array of trees
		if (_tree.length) {
			return this._arrayOfSchemas(_tree, 'tree', keysPath);
		} else if (_tree.$ref) {
			// Use the original JSON
			return this.tree(this.getNewJSON(_tree), keysPath);
		} else {
			if (_tree.$id) {
				// Register original JSON
				this.registerJSONById(_tree);
			}

			if (this._validate(this.treeDef(), tree) === false) {
				window.console.log('Failed JSON tree:', tree);
				throw 'Failed JSON tree!';
			}
			if (tree.events) {
				const result = this._validateEvents(tree.events, tree, 'tree');
				if ( result !== true) {
					throw result;
				}
			}

			if (!tree.classList) {
				tree.classList = [];
			}

			tree.classList.push('power-tree-view');

			let template = `<nav ${this._getHtmlMoreBasicTmpl(tree)} ${tree.onClickFile ? 'data-on-click-file="' + tree.onClickFile + '"' : ''}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''}>`;

			let counter = 0;
			for (const item of tree.nodes) {
				const currentKeysPath = keysPath ? `${keysPath},${counter}` : '';
				if (this._validate(this.treeNodeDef(), item) === false) {
					window.console.log('Failed JSON tree node:', item);
					throw 'Failed JSON tree node!';
				}
				if (item.events) {
					const result = this._validateEvents(item.events, item, 'tree node');
					if ( result !== true) {
						throw result;
					}
				}
				if (!item.classList) {
					item.classList = [];
				}

				if (item.kind === 'file') {
					item.classList.push('power-item');

					template = `${template}
					<a ${this._getHtmlMoreBasicTmpl(item)} ${item.path ? ' data-file-path="' + encodeURI(item.path) + '"' : ''}${currentKeysPath ? ' data-keys-path="' + currentKeysPath + '"' : ''} `;
					template = `${template}>
						<span class="pw-icon ${item.icon || 'icon-document-blank'}"></span> <span>${item.fullName}</span></a>`;
				} else if (item.kind === 'folder') {
					const id = `list-${this.$powerUi._Unique.next()}`;
					item.classList.push('power-list');
					template = `${template}
					<a ${this._getHtmlMoreBasicTmpl(item)} data-power-target="${id}"${currentKeysPath ? ' data-keys-path="' + currentKeysPath + '"' : ''}>
						<span class="power-status pw-icon" data-power-active="${item.active || 'icon-folder-open'}" data-power-inactive="${item.inactive || 'icon-folder-close'}"></span> <span>${item.fullName}</span>
					</a>
					${this.tree({nodes: item.nodes, id: id}, currentKeysPath)}`;
				}
				counter = counter + 1;
			}
			template = `${template}
			</nav>`;

			return template;
		}
	}

	grid(_grid, keysPath) {
		// Do not change the original JSON
		const grid = this.cloneObject(_grid);
		// This allow pass an array of grids
		if (_grid.length) {
			return this._arrayOfSchemas(_grid, 'grid', keysPath);
		} else if (_grid.$ref) {
			// Use the original JSON
			return this.grid(this.getNewJSON(_grid));
		} else {
			if (_grid.$id) {
				// Register original JSON
				this.registerJSONById(_grid);
			}

			if (this._validate(this.gridDef(), grid) === false) {
				window.console.log('Failed JSON grid:', grid);
				throw 'Failed JSON grid!';
			}
			if (grid.events) {
				const result = this._validateEvents(grid.events, grid, 'grid');
				if ( result !== true) {
					throw result;
				}
			}

			if (!grid.classList) {
				grid.classList = [];
			}

			grid.classList.push('pw-grid');
			grid.classList.push(grid.kind || 'scroll-12');

			if (grid.border === true) {
				grid.classList.push('border');
			}
			if (grid.inline === true) {
				grid.classList.push('inline-grid');
			}
			if (grid.gap) {
				grid.classList.push(`gap-${grid.gap}`);
			} else {
				grid.classList.push('no-gap');
			}

			let template = `<div ${this._getHtmlBasicTmpl(grid)}>`;

			// If user do not difine a sizes list uses a default size
			if (!grid.sizes) {
				grid.sizes = ['s-1 m-1 l-1 xl-1'];
			}

			let currentSizeCount = 0;
			let counter = 0;
			for (const field of grid.fields) {
				const currentKeysPath = keysPath ? `${keysPath},${counter}` : '';
				if (this._validate(this.gridDef().properties.fields, field) === false) {
					window.console.log('Failed JSON grid field:', field, grid);
					throw 'Failed JSON grid field!';
				}
				if (field.events) {
					const result = this._validateEvents(field.events, field, 'field');
					if ( result !== true) {
						throw result;
					}
				}

				if (!field.classList) {
					field.classList = [];
				}

				field.classList.push('pw-col');
				field.classList.push(field.size || grid.sizes[currentSizeCount]);

				template = `${template}\n\t<div ${currentKeysPath ? 'data-keys-path="' + currentKeysPath + '" ' : ''}${this._getIdTmpl(field.id)} ${this._getClassTmpl(field.classList)}>${field.text || ''}`;

				if (field.children) {
					let _c = 0;
					for (const child of field.children) {
						const _cKeysPath = currentKeysPath ? `${currentKeysPath},${_c}` : '';
						template = `${template}\n\t\t${this.otherJsonKind(child, _cKeysPath)}`;
						_c = _c + 1;
					}
				}

				template = template + '</div>';

				// Only change to the next size pattern if there is no custom size for this field
				if (!field.size) {
					currentSizeCount = currentSizeCount + 1;
				}
				// Reset the counter if bigger than list os sizes length
				if (currentSizeCount >= grid.sizes.length) {
					currentSizeCount = 0;
				}
				counter = counter + 1;
			}

			template = `${template}\n</div>`;

			return template;
		}
	}

	simpleFormControls({controls, template, inline, keysPath=false}) {
		let _counter = 0;
		for (const control of controls) {
			const _currentKeysPath = keysPath ? `${keysPath},${_counter}` : '';
			_counter = _counter + 1;
			if (this._validate(this.simpleformcontrolsDef(), control) === false) {
				window.console.log('Failed JSON control:', control);
				throw 'Failed JSON control!';
			}
			if (control.events) {
				const result = this._validateEvents(control.events, control, 'control');
				if ( result !== true) {
					throw result;
				}
			}
			if (!control.id) {
				control.id = 'input_' + this.$powerUi._Unique.next();
			}
			const label = control.label ? `<label for="${control.id}">${control.label}</label>` : null;

			let customCss = '';
			if (control.classList) {
				for (const css of control.classList) {
					customCss = `${customCss} ${css}`;
				}
			}

			if (!control.classList) {
				control.classList = [];
			}
			control.classList.push('pw-field');

			const size = control.size ? control.size : 's-12 m-12 l-12 xl-12';

			template = `${template}
				<div ${_currentKeysPath ? 'data-keys-path="' + _currentKeysPath + '" ' : ''} class="${control.controls ? 'pw-inner-grid' : ''} pw-col ${size}">`;

			// Allow a inner grid with controls
			if (control.controls) {

				template = `${template}
				<div class="pw-grid scroll-12 gap-1 ${((control.inline === true) || (inline === true)) ? 'inline-grid' : ''}">
					${this.simpleFormControls({controls: control.controls, template: '', keysPath: _currentKeysPath})}
				</div>`;

			// Allow adding any other html or json object
			} else if (control.children) {
				let counter = 0;
				for (const child of control.children) {
					const currentKeysPath = _currentKeysPath ? `${_currentKeysPath},${counter}` : '';
					template = template + this.otherJsonKind(child, currentKeysPath);
					counter = counter + 1;
				}

			} else if (control.button) {

				template = `${template}
					${this.button(control.button, _currentKeysPath)}`;

			} else if (control.type === 'submit' || control.type === 'reset') {

				control.classList.pop();
				template = `${template}
				<div ${_currentKeysPath ? 'data-keys-path="' + _currentKeysPath + '" ' : ''}class="pw-field-container">
					<input ${this._getInputBasicTmpl(control)} />
					<div class="pw-control-helper"></div>
				</div>`;

			} else if (control.type === 'select') {

				template = `${template}
				<div ${_currentKeysPath ? 'data-keys-path="' + _currentKeysPath + '" ' : ''}class="pw-field-container">
					${label ? label : ''}
					<select ${this._getInputBasicTmpl(control)} ${control.multiple === true ? 'multiple' : ''}>`;
						let counter = 0;
						for (const item of control.list) {
							const currentKeysPath = _currentKeysPath ? `${_currentKeysPath},${counter}` : '';
							template = `${template}<option ${currentKeysPath ? 'data-keys-path="' + currentKeysPath + '" ' : ''}value="${item.value}"${item.disabled === true ? ' disabled' : ''}${item.selected === true ? ' selected' : ''}>${item.label}</option>`;
							counter = counter + 1;
						}
					template = `${template}
					</select>
					<div class="pw-control-helper"></div>
				</div>`;

			} else if (control.type === 'radio' || control.type === 'checkbox') {

				template = `${template}
				<div ${_currentKeysPath ? 'data-keys-path="' + _currentKeysPath + '" ' : ''}class="pw-field-container">
					<input ${this._getInputBasicTmpl(control)} /> ${label ? label : ''}
				</div>`;

			} else if (control.type === 'textarea') {

				template = `${template}
				<div ${_currentKeysPath ? 'data-keys-path="' + _currentKeysPath + '" ' : ''}class="pw-field-container">
					${label ? label : ''}
					<textarea ${this._getInputBasicTmpl(control)} ${control.rows ? 'rows="' + control.rows + '"' : ''} ${control.cols ? 'cols="' + control.cols + '"' : ''}>
						${control.value || ''}
					</textarea>
					<div class="pw-control-helper"></div>
				</div>`;

			} else {

				template = `${template}
				<div ${_currentKeysPath ? 'data-keys-path="' + _currentKeysPath + '" ' : ''}class="pw-field-container">
					${label ? label : ''}
					<input ${this._getInputBasicTmpl(control)} />
					<div class="pw-control-helper"></div>
				</div>`;
			}

			template = `${template}
				</div>`;
		}

		return template;
	}

	simpleForm(_form, keysPath) {
		// Do not change the original JSON
		const form = this.cloneObject(_form);
		// This allow pass an array of forms
		if (_form.length) {
			return this._arrayOfSchemas(_form, 'form', keysPath);
		} else if (_form.$ref) {
			// Use the original JSON
			return this.simpleForm(this.getNewJSON(_form), keysPath);
		} else {
			if (_form.$id) {
				// Register original JSON
				this.registerJSONById(_form);
			}

			if (this._validate(this.simpleformDef(), form) === false) {
				window.console.log('Failed JSON form:', form);
				throw 'Failed JSON form!';
			}
			if (form.events) {
				const result = this._validateEvents(form.events, form, 'form');
				if ( result !== true) {
					throw result;
				}
			}

			const classList = [
				'pw-vertical-form',
				`${form.theme || 'pw-simple-form'}`,
				'pw-grid scroll-12',
				'gap-4',
			];

			if (form.inline !== false) {
				classList.push('inline-grid');
			}
			if (form.classList && form.classList.length) {
				for (const css of form.classList) {
					classList.push(css);
				}
			}
			const classTmpl = this._getClassTmpl(classList);

			const formType = form.type ? form.type : 'form';

			let template = `<${formType} ${this._getIdTmpl(form.id, 'form')}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''} ${classTmpl}>`;

			template = this.simpleFormControls({controls: form.controls, template: template, keysPath: keysPath});

			template = `${template}
			</${formType}>`;

			return template;
		}
	}

	html(_html, keysPath) {
		// Do not change the original JSON
		const html = this.cloneObject(_html);
		// This allow pass an array of tags
		if (_html.length) {
			return this._arrayOfSchemas(_html, 'html', keysPath);
		} else if (_html.$ref) {
			// Use the original JSON
			return this.html(this.getNewJSON(_html), keysPath);
		} else {
			if (_html.$id) {
				// Register original JSON
				this.registerJSONById(_html);
			}

			if (this._validate(this.htmlDef(), html) === false) {
				window.console.log('Failed JSON html:', html);
				return 'Failed JSON html!';
			}
			if (html.events) {
				const result = this._validateEvents(html.events, html, 'html');
				if ( result !== true) {
					throw result;
				}
			}

			// If this is not an html json, but a button, dropmenu or other kind of json
			if (html.tagName === undefined) {
				return this.otherJsonKind(html, keysPath);
			}

			const tag = html.tagName.toLowerCase();
			// Avoid tags without input tag
			const avoidTags = ["area", "base", "br", "col", "embed", "hr", "img", "link", "meta", "param", "source", "track", "wbr"];

			if (avoidTags.includes(tag)) {
				return `<${tag} ${this._getHtmlBasicTmpl(html)}${keysPath ? ' data-keys-path="' + keysPath + '" ' : ''} />`;
			} else if (tag === 'input') {
				return `<${tag} ${this._getInputBasicTmpl(html)}${keysPath ? ' data-keys-path="' + keysPath + '" ' : ''} />`;
			} else {
				let template = `<${tag} ${this._getHtmlBasicTmpl(html)} ${html.multiple === true ? 'multiple' : ''}${keysPath ? ' data-keys-path="' + keysPath + '" ' : ''}>
					${html.text || ''}`;

				if (html.children) {
					let counter = 0;
					for (const child of html.children) {
						const currentKeysPath = keysPath ? `${keysPath},${counter}` : '';
						template = `${template}
							${this.html(child, currentKeysPath)}`;
						counter = counter + 1;
					}
				}

				template = `${template}
				</${tag}>`;

				return template;
			}
		}
	}

	icon(_json, keysPath) {
		// Return empty string if not have an icon
		if (_json.icon === undefined && _json.kind === undefined) {
			return '';
		}
		// Do not change the original JSON
		const json = this.cloneObject(_json);
		// This allow pass an array of json
		if (_json.length) {
			return this._arrayOfSchemas(_json, 'icon');
		} else if (_json.$ref) {
			// Use the original JSON
			return this.icon(this.getNewJSON(_json), keysPath);
		} else {
			if (_json.$id) {
				// Register original JSON
				this.registerJSONById(_json);
			}

			if (this._validate(this.iconDef(), _json) === false) {
				window.console.log('Failed JSON icon:', _json);
				return 'Failed JSON icon!';
			}

			let template = '';
			if (!json.classList) {
				json.classList = [];
			}
			json.classList.push('pw-icon');

			if (json.kind === 'img' && json.src) {
				const src = json.src;
				delete json.src;
				template = `<span ${this._getHtmlBasicTmpl(json)}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''}><img src=${src} /></span>`;
			} else {
				json.classList.push(json.icon);
				template = `<span ${this._getHtmlBasicTmpl(json)}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''}></span>`;
			}

			return template;
		}
	}

	status(_json, keysPath) {
		// Return if do not have status
		if (!_json.inactive && !_json.active) {
			return '';
		}

		// Do not change the original JSON
		const json = this.cloneObject(_json);
		// This allow pass an array of json
		if (_json.length) {
			return this._arrayOfSchemas(_json, 'status');
		} else if (_json.$ref) {
			// Use the original JSON
			return this.status(this.getNewJSON(_json), keysPath);
		} else {
			if (_json.$id) {
				// Register original JSON
				this.registerJSONById(_json);
			}

			if (this._validate(this.statusDef(), _json) === false) {
				window.console.log('Failed JSON status:', _json);
				return 'Failed JSON status!';
			}

			if (!json.classList) {
				json.classList = [];
			}
			json.classList.push('pw-icon');
			json.classList.push('power-status');
			return `<span ${this._getHtmlBasicTmpl(json)}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''} data-power-inactive="${json.inactive}" data-power-active="${json.active}"></span>`;
		}
	}

	accordionDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/accordion",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"config": {
					"type": "object",
					"properties": {
						"multipleSectionsOpen": {"type": "boolean"}
					}
				},
				"panels": {
					"type": "array",
					"properties": {
						"header": {
							"type": "object",
							"properties": {
								"id": {"type": "string"},
								"label": {"type": "string"},
								"icon": {"type": "string"},
								"icon-position": {"type": "string"},
								"status": {"$ref": "#/schema/draft-07/status"}
							},
							"required": ["label", "id"]
						},
						"section": {
							"type": "object",
							"properties": {
								"id": {"type": "string"},
								"text": {"type": "string"},
								"children": {
									"type": "array",
									"properties": {
										"html": {"$ref": "#/schema/draft-07/html"},
										"button": {"$ref": "#/schema/draft-07/item"},
										"item": {"$ref": "#/schema/draft-07/item"},
										"status": {"$ref": "#/schema/draft-07/status"},
										"icon": {"$ref": "#/schema/draft-07/icon"},
										"menu": {"$ref": "#/schema/draft-07/menu"},
										"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"},
										"dropmenubutton": {"$ref": "#/schema/draft-07/dropmenubutton"},
										"simpleform": {"$ref": "#/schema/draft-07/simpleform"},
										"tree": {"$ref": "#/schema/draft-07/tree"},
										"accordion": {"$ref": "#/schema/draft-07/accordion"},
										"grid": {"$ref": "#/schema/draft-07/grid"}
									}
								}
							},
							"required": ["id"]
						}
					},
					"required": ["header", "section"]
				}
			},
			"required": ["panels"]
		};
	}

	powertabsDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/powertabs",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"tabs": {
					"type": "array",
					"properties": {
						"header": {
							"type": "object",
							"properties": {
								"id": {"type": "string"},
								"label": {"type": "string"},
								"icon": {"type": "string"},
								"icon-position": {"type": "string"},
								"status": {"$ref": "#/schema/draft-07/status"}
							},
							"required": ["label", "id"]
						},
						"section": {
							"type": "object",
							"properties": {
								"id": {"type": "string"},
								"text": {"type": "string"},
								"children": {
									"type": "array",
									"properties": {
										"html": {"$ref": "#/schema/draft-07/html"},
										"button": {"$ref": "#/schema/draft-07/item"},
										"item": {"$ref": "#/schema/draft-07/item"},
										"status": {"$ref": "#/schema/draft-07/status"},
										"icon": {"$ref": "#/schema/draft-07/icon"},
										"menu": {"$ref": "#/schema/draft-07/menu"},
										"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"},
										"dropmenubutton": {"$ref": "#/schema/draft-07/dropmenubutton"},
										"simpleform": {"$ref": "#/schema/draft-07/simpleform"},
										"tree": {"$ref": "#/schema/draft-07/tree"},
										"accordion": {"$ref": "#/schema/draft-07/accordion"},
										"grid": {"$ref": "#/schema/draft-07/grid"}
									}
								}
							},
							"required": ["id"]
						}
					},
					"required": ["header", "section"]
				}
			},
			"required": ["tabs"]
		};
	}

	simpleformcontrolsDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/simpleformcontrols",
			"type": "array",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"classList": {"type": "array"},
				"label": {"type": "string"},
				"type": {"type": "string"},
				"value": {"type": "any"},
				"name": {"type": "string"},
				"bind": {"type": "string"},
				"id": {"type": "string"},
				"controls": {"$ref": "#/schema/draft-07/simpleformcontrols"},
				"button": {"$ref": "#/schema/draft-07/item"},
				"item": {"$ref": "#/schema/draft-07/item"},
				"status": {"$ref": "#/schema/draft-07/status"},
				"icon": {"$ref": "#/schema/draft-07/icon"},
				"menu": {"$ref": "#/schema/draft-07/menu"},
				"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"},
				"dropmenubutton": {"$ref": "#/schema/draft-07/dropmenubutton"},
				"simpleform": {"$ref": "#/schema/draft-07/simpleform"},
				"tree": {"$ref": "#/schema/draft-07/tree"},
				"html": {"$ref": "#/schema/draft-07/html"},
				"accordion": {"$ref": "#/schema/draft-07/accordion"},
				"grid": {"$ref": "#/schema/draft-07/grid"}
			}
		};
	}

	simpleformDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/simpleform",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"classList": {"type": "array"},
				"type": {"type": "string"},
				"inline" : {"type": "boolean"},
				"padding": {"type": "boolean"},
				"controls": {"$ref": "#/schema/draft-07/simpleformcontrols"}
			},
			"required": ["controls"]
		};
	}

	dropmenuDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/dropmenu",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"items": {
					"type": "array",
					"properties": {
						"button": {"$ref": "#/schema/draft-07/item"},
						"item": {"$ref": "#/schema/draft-07/item"},
						"status": {"$ref": "#/schema/draft-07/status"},
						"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"}
					}
				}
			},
			"required": ["id", "items"]
		};
	}

	menuDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/menu",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"mirrored": {"type": "boolean"},
				"dropMenuPosition": {"type": "string"},
				"orientation": {"type": "string"},
				"position": {"type": "string"},
				"priority": {"type": "number"},
				"ignore": {"type": "boolean"},
				"toggleIcon": {"type": "string"},
				"items": {
					"type": "array",
					"properties": {
						"button": {"$ref": "#/schema/draft-07/item"},
						"item": {"$ref": "#/schema/draft-07/item"},
						"status": {"$ref": "#/schema/draft-07/status"},
						"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"}
					}
				}
			},
			"required": ["id"]
		};
	}

	toolbarDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/toolbar",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"mirrored": {"type": "boolean"},
				"dropMenuPosition": {"type": "string"},
				"orientation": {"type": "string"},
				"position": {"type": "string"},
				"priority": {"type": "number"},
				"ignore": {"type": "boolean"},
				"items": {
					"type": "array",
					"properties": {
						"button": {"$ref": "#/schema/draft-07/item"},
						"item": {"$ref": "#/schema/draft-07/item"},
						"status": {"$ref": "#/schema/draft-07/status"},
						"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"}
					}
				}
			},
			"required": ["id"]
		};
	}

	splitbarDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/splitbar",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"orientation": {"type": "string"},
				"position": {"type": "string"},
				"priority": {"type": "number"},
				"border": {"type": "number"},
				"ignore": {"type": "boolean"},
				"resize": {"type": "boolean"},
				"content": {"type": "string"},
			},
			"required": ["id", "content"]
		};
	}

	// Item can be a power-button, power-action or power-item
	itemDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/item",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"classList": {"type": "array"},
				"label": {"type": "string"},
				"id": {"type": "string"},
				"icon": {"type": "string"},
				"icon-src": {"type": "string"},
				"icon-position": {"type": "string"},
				"kind": {"type": "string"},
				"mirrored": {"type": "boolean"},
				"events": {
					"type": "array",
					"properties": {
						"event": {"type": "string"},
						"fn": {"type": "string"},
					},
					"required": ["event", "fn"]
				}
			},
			// "required": []
		};
	}

	treeNodeDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/treenode",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"classList": {"type": "array"},
				"id": {"type": "string"},
				"name": {"type": "string"},
				"fullName": {"type": "string"},
				"extension": {"type": "string"},
				"path": {"type": "string"},
				"kind": {"type": "string"},
				"events": {
					"type": "array",
					"properties": {
						"event": {"type": "string"},
						"fn": {"type": "string"},
					},
					"required": ["event", "fn"]
				},
				"nodes": {"$ref": "tree"}
			},
			"required": ["name", "fullName", "path", "kind"]
		};
	}

	treeDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/tree",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"events": {
					"type": "array",
					"properties": {
						"event": {"type": "string"},
						"fn": {"type": "string"},
					},
					"required": ["event", "fn"]
				},
				"nodes": {"$ref": "treenode"}
			},
			"required": ["nodes"]
		};
	}

	dropmenubuttonDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/dropmenubutton",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"button": {"$ref": "#/schema/draft-07/item"},
				"status": {"$ref": "#/schema/draft-07/status"},
				"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"}
			},
			"required": ["button"]
		};
	}

	statusDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/status",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"active": {"type": "string"},
				"inactive": {"type": "string"},
				"position": {"type": "string"},
				"classList": {"type": "array"}
			},
			"required": ["active", "inactive"]
		};
	}

	iconDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/icon",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"icon": {"type": "string"},
				"kind": {"type": "string"},
				"src": {"type": "string"},
				"classList": {"type": "array"}
			},
		};
	}

	htmlDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/html",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"classList": {"type": "array"},
				"id": {"type": "string"},
				"tagName": {"type": "string"},
				"multiple": {"type": "boolean"},
				"src": {"type": "string"},
				"width": {"type": "string"},
				"height": {"type": "string"},
				"type": {"type": "string"},
				"bind": {"type": "string"},
				"title": {"type": "string"},
				"for": {"type": "string"},
				"attrs": {"type": "array"},
				"cols": {"type": "string"},
				"rows": {"type": "string"},
				"value": {"type": "any"},
				"name": {"type": "string"},
				"required": {"type": "boolean"},
				"disabled": {"type": "boolean"},
				"pattern": {"type": "string"},
				"events": {
					"type": "array",
					"properties": {
						"event": {"type": "string"},
						"fn": {"type": "string"},
					},
					"required": ["event", "fn"]
				},
				"children": {
					"type": "array",
					"properties": {
						"$id": {"type": "string"},
						"$ref": {"type": "string"},
						"classList": {"type": "array"},
						"id": {"type": "string"},
						"tagName": {"type": "string"},
						"multiple": {"type": "boolean"},
						"src": {"type": "string"},
						"width": {"type": "string"},
						"height": {"type": "string"},
						"type": {"type": "string"},
						"bind": {"type": "string"},
						"title": {"type": "string"},
						"for": {"type": "string"},
						"attrs": {"type": "array"},
						"cols": {"type": "string"},
						"rows": {"type": "string"},
						"value": {"type": "any"},
						"name": {"type": "string"},
						"required": {"type": "boolean"},
						"disabled": {"type": "boolean"},
						"pattern": {"type": "string"},
						"events": {
							"type": "array",
							"properties": {
								"event": {"type": "string"},
								"fn": {"type": "string"},
							},
							"required": ["event", "fn"]
						},
						"html": {"$ref": "#/schema/draft-07/html"},
						"button": {"$ref": "#/schema/draft-07/item"},
						"item": {"$ref": "#/schema/draft-07/item"},
						"status": {"$ref": "#/schema/draft-07/status"},
						"icon": {"$ref": "#/schema/draft-07/icon"},
						"menu": {"$ref": "#/schema/draft-07/menu"},
						"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"},
						"dropmenubutton": {"$ref": "#/schema/draft-07/dropmenubutton"},
						"simpleform": {"$ref": "#/schema/draft-07/simpleform"},
						"tree": {"$ref": "#/schema/draft-07/tree"},
						"accordion": {"$ref": "#/schema/draft-07/accordion"},
						"grid": {"$ref": "#/schema/draft-07/grid"}
					}
				}
			},
			// "required": ["tagName"]
		};
	}

	gridDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/grid",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"classList": {"type": "array"},
				"id": {"type": "string"},
				"kind": {"type": "string"},
				"border": {"type": "boolean"},
				"gap": {"type": "number"},
				"sizes": {"type": "array"},
				"fields": {
					"type": "array",
					"properties": {
						"classList": {"type": "array"},
						"text": {"type": "string"},
						"size": {"type": "string"},
						"events": {
							"type": "array",
							"properties": {
								"event": {"type": "string"},
								"fn": {"type": "string"},
							},
							"required": ["event", "fn"]
						},
						"children": {
							"type": "array",
							"properties": {
								"html": {"$ref": "#/schema/draft-07/html"},
								"button": {"$ref": "#/schema/draft-07/item"},
								"item": {"$ref": "#/schema/draft-07/item"},
								"status": {"$ref": "#/schema/draft-07/status"},
								"icon": {"$ref": "#/schema/draft-07/icon"},
								"menu": {"$ref": "#/schema/draft-07/menu"},
								"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"},
								"dropmenubutton": {"$ref": "#/schema/draft-07/dropmenubutton"},
								"simpleform": {"$ref": "#/schema/draft-07/simpleform"},
								"tree": {"$ref": "#/schema/draft-07/tree"},
								"accordion": {"$ref": "#/schema/draft-07/accordion"},
								"grid": {"$ref": "#/schema/draft-07/grid"}
							}
						}
					}
				},
				"events": {
					"type": "array",
					"properties": {
						"event": {"type": "string"},
						"fn": {"type": "string"},
					},
					"required": ["event", "fn"]
				}
			},
			"required": ["fields"]
		};
	}

	$ref($ref) {
		const path = '#/schema/draft-07/';

		const references = {};
		references[`${path}item`] = this.itemDef;
		references[`${path}status`] = this.statusDef;
		references[`${path}icon`] = this.iconDef;
		references[`${path}menu`] = this.menuDef;
		references[`${path}dropmenu`] = this.dropmenuDef;
		references[`${path}dropmenubutton`] = this.dropmenubuttonDef;
		references[`${path}simpleform`] = this.simpleformDef;
		references[`${path}simpleformcontrols`] = this.simpleformcontrolsDef;
		references[`${path}tree`] = this.treeDef;
		references[`${path}html`] = this.htmlDef;
		references[`${path}accordion`] = this.accordionDef;
		references[`${path}grid`] = this.gridDef;

		return references[$ref]();
	}
}

class WidgetService extends PowerServices {

	mayAddCtrlParams({params, onCommit, onCancel}) {
		if (params === undefined) {
			params = {};
		}
		if (onCommit) {
			params.onCommit = onCommit;
		}
		if (onCancel) {
			params.onCancel = onCancel;
		}

		return params;
	}

	alert(options) {
		options.kind = 'alert';
		return this.open(options);
	}

	confirm(options) {
		options.kind = 'confirm';
		return this.open(options);
	}

	yesno(options) {
		options.kind = 'yesno';
		return this.open(options);
	}

	modal(options) {
		options.kind = 'modal';
		return this.open(options);
	}
	window(options) {
		options.kind = 'window';
		return this.open(options);
	}
	windowIframe(options) {
		options.kind = 'windowIframe';
		return this.open(options);
	}

	open({title, template, ctrl, target, params, controller, kind, onCommit, onCancel, templateUrl, templateComponent, url}) {
		let _resolve;
		let _reject;
		const _promise = new Promise(function (resolve, reject) {
			_resolve = resolve;
			_reject = reject;
		});

		// Allow to create some empty controller so it can open without define one
		if (!ctrl && !controller) {
			controller = function () {};
		}
		if (!ctrl && controller && (typeof controller === 'function')) {
			// Wrap the functions inside an PowerAlert controller
			params = this.mayAddCtrlParams({
				params: params,
				onCommit: onCommit,
				onCancel: onCancel,
			});
			ctrl = wrapFunctionInsideDialog({controller: controller, kind: kind, params: params, resolve: _resolve, reject: _reject, _promise: _promise});
		}

		// Create a new volatile then open it
		const routeId = `pow_route_${this.$powerUi._Unique.next()}`;
		// Register the route for remotion with the controller
		this.$ctrl.volatileRouteIds.push(routeId);
		this._open({
			routeId: routeId,
			target: target || '_blank',
			title: title,
			template: template,
			templateUrl: templateUrl,
			templateComponent: templateComponent,
			url: url,
			ctrl: ctrl,
			params: params,
		});
		return _promise;
	}

	_open({routeId, params, target, title, template, ctrl, templateUrl, templateComponent, url}) {
		// Add it as a hidden route
		const newRoute = {
			id: routeId,
			title: title,
			route: this.$powerUi.router.config.rootPath + routeId, // Use the routeId as unique route
			template: templateUrl || templateComponent || template || url,
			templateUrl: templateUrl,
			templateComponent: templateComponent,
			hidden: true,
			ctrl: ctrl,
			isHidden: true,
		};

		this.$powerUi.router.routes[routeId] = newRoute;

		// Now open the new route
		this.$powerUi.router.openRoute({
			routeId: routeId || this.$ctrl._routeId, // destRouteId
			currentRouteId: this.$ctrl._routeId,
			currentViewId: this.$ctrl._viewId,
			params: params,
			target: target,
			title: title || null,
		});
	}
}

class PowerTextBind {
    constructor(_name, items) {
        this._name = _name;
        this._$allKeys = [];
        for (const item of items) {
            this.addProperty(item.key, item.value);
        }
    }

    addProperty(key, value='') {
        const self = this;
        this._$allKeys.push(key);
        this[`_${key}`] = value;
        Object.defineProperties(this, {
            [key]: {
                 "get": function() {
                    self.get(key);
                 },
                 "set": function(value) {
                    self.set(key, value);
                 }
            }
        });
    }

    clearProperties() {
        for (const key of this._$allKeys) {
            this[key] = '';
        }
    }

    set(key, value) {
        this[`_${key}`] = value;
        this.setNodes(key, value);
    }

    get(key) {
        return this[`_${key}`];
    }

    setNodes(key, value) {
        const list = document.querySelectorAll(`[data-pow-text-bind='${this._name}.${key}']`);
        if (list.length) {
            for (const node of list) {
                node.innerText = value;
            }
        }
    }
}

class PowerStyleBind {
    constructor(_name, items) {
        this._name = _name;
        this._$allKeys = [];
        for (const item of items) {
            this.addProperty(item.key, item.value);
        }
    }

    addProperty(key, values=[{property: 'display', value: 'none'}]) {
        const self = this;
        this._$allKeys.push(key);
        this[`_${key}`] = values;
        Object.defineProperties(this, {
            [key]: {
                 "get": function() {
                    self.get(key);
                 },
                 "set": function(_values) {
                    self.set(key, _values);
                 }
            }
        });
    }

    clearProperties() {
        for (const key of this._$allKeys) {
            this[key] = [{property: 'display', value: 'none'}];
        }
    }

    set(key, values) {
        let _values = [];
        if (!Array.isArray(values) && values.property !== undefined && (values.value !== undefined || values.remove)) {
            _values.push(values);
        } else if (Array.isArray(values) && values[0] && values[0].property !== undefined && (values[0].value !== undefined || values[0].remove)) {
            _values = values;
        } else {
            throw `PowerStyleBind error: Values should contain a dict or array with pairs of "property" and "value" ${values}`;
        }
        this[`_${key}`] = _values;
        this.setNodes(key, _values);
    }

    get(key) {
        return this[`_${key}`];
    }

    setNodes(key, values) {
        const list = document.querySelectorAll(`[data-pow-style-bind='${this._name}.${key}']`);
        if (list.length) {
            for (const node of list) {
                const applyProperties = node.dataset.styleProperties;
                for (const item of values) {
                    if (!applyProperties || applyProperties.includes(item.property)) {
                        if (item.remove) {
                            node.style[item.property] = null;
                        } else {
                            node.style[item.property] = item.value;
                        }
                    }
                }
            }
        }
    }
}

class PowerController extends PowerScope {
	constructor({$powerUi}) {
		// Add $powerUi to controller
		super({$powerUi: $powerUi});
		this.volatileRouteIds = [];
		// Allow user subscribe a method to onCycleEnds router event
		if (this.onCycleEnds) {
			this.$powerUi.router.onCycleEnds.subscribe(this.onCycleEnds.bind(this));
		}
	}

	_load(data) {
		const self = this;
		return new Promise(
			function (resolve, reject) {
				self.load(resolve, reject, data);
			});
	}

	get router() {
		return this.$powerUi.router;
	}

	keepScrollPosition() {
		const view = document.getElementById(this._viewId);
		const container = view.getElementsByClassName('pw-container')[0];
		const body = view.getElementsByClassName('pw-body')[0];
		// Register the scroll of some containers
		if (container) {
			this._containerScrollTop = container.scrollTop || 0;
			this._containerScrollLeft = container.scrollLeft || 0;
		}
		if (body) {
			this._bodyScrollTop = body.scrollTop || 0;
			this._bodyScrollLeft = body.scrollLeft || 0;
		}
	}

	refresh(routeId) {
		this.keepScrollPosition();
		this.router.engineCommands.addPendingComand(routeId || this._routeId, {name: 'refresh', value: true});
		this.router.cloneRoutesAndRunEngine();
	}

	reload(routeId) {
		this.keepScrollPosition();
		this.router.engineCommands.addPendingComand(routeId || this._routeId, {name: 'reload', value: true});
		this.router.cloneRoutesAndRunEngine();
	}

	getRouteCtrl(routeId) {
		return this.$powerUi.getRouteCtrl(routeId);
	}

	getViewCtrl(viewId) {
		return this.$powerUi.getViewCtrl(viewId);
	}

	getRouteParam(key) {
		let param = this._routeParams.find((p)=> p.key === key);
		let value = (param && param.value !== undefined) ? param.value : null;
		if (isNaN(value)) {
			return value;
		} else {
			return value * 1;
		}
	}

	request(options) {
		const self = this;
		const promise = new Promise(function (resolve, reject) {
			self.$powerUi.request(options).then(function(response) {
				resolve(response);
			}).catch(function (error) {
				reject(error);
			});
		});
		return promise;
	}

	openRoute({routeId, params, target, data={}, commands=[]}) {
		// If is open from $root pretend it is from current main-view
		const currentViewId = this._viewId === 'root-view' ? 'main-view' : this._viewId;
		const currentRouteId = this._routeId === '$root' ? this.$powerUi.controllers['main-view'].instance._routeId : this._routeId;
		const route = this.$powerUi.router.getOpenedRoute({routeId: currentRouteId, viewId: currentViewId});

		this.router.openRoute({
			routeId: routeId || currentRouteId, // destRouteId
			currentRouteId: currentRouteId,
			currentViewId: currentViewId,
			params: params,
			target: target, // '_blank' cannot be default like in target: target || '_blank' to allow pages navigation
			title: route.title || null,
			data: data,
			commands: commands,
		});
	}

	_onViewLoad() {
		if (this._viewId === 'main-view') {
			const _appContainer = document.getElementById('app-container');
			_appContainer.scrollTop = this._currentScrollTop || 0;
			_appContainer.scrollLeft = this._currentScrollLeft || 0;
		}
	}

	_onRemoveView() {
		if (this._viewId === 'main-view') {
			const _appContainer = document.getElementById('app-container');
			this._currentScrollTop = _appContainer.scrollTop;
			this._currentScrollLeft = _appContainer.scrollLeft;
		}
	}

	addCommands(commands) {
		this.router.engineCommands.addCommands(commands);
	}

	closeCurrentRoute({callback=null, commands=[]}={}) {
		if (this.router.engineIsRunning || this.router.phantomRouter) {
			this.router.closePhantomRoute(this._routeId, this);
			return;
		}
		// Save the callback to run after view is removed
		if (callback) {
			this.router.pendingCallbacks.push(callback.bind(this));
		}
		// Save the callback to run after view is removed
		if (commands.length) {
			this.addCommands(commands);
		}

		const route = this.router.getOpenedRoute({routeId: this._routeId, viewId: this._viewId});
		const newHash = this.$powerUi.removeRouteFromHash(
			this.router.locationHashWithHiddenRoutes(), this._routeId, this._viewId);
		this.router.navigate({hash: newHash, title: route.title || null});
	}

	safeEval(string) {
		return this.$powerUi.safeEval({text: string, scope: this});
	}

	getObjectById(id) {
		return this.$powerUi.powerTree.allPowerObjsById[id] || null;
	}

	getBindById(id) {
		const bind = this.getObjectById(id);
		return bind ? bind.powBind : null;
	}

	_$postMessage(window, content, url) {
	    window.postMessage(content, url);
	}

	_$postToIframe(id, content) {
		const iframeEl = document.getElementById(id);
		this._$postMessage(iframeEl.contentWindow, content, this.$powerUi.devMode.target);
	}

	_$postToMain(content) {
		this._$postMessage(window.parent.window, content, this.$powerUi.devMode.target);
	}

	_$selectElementToEdit(event, element) {
		if (!this.$powerUi.devMode.isEditable || !this.$powerUi.devMode.child) {
			return;
		}
		if (this.$powerUi._$nodeSelectdToEdit) {
			this.$powerUi._$nodeSelectdToEdit.classList.remove('pw-selected-to-edit');
		}
		const sizes = this._$addSizesInPx(event.target);
		const nodeContainer = document.createElement('div');
		nodeContainer.appendChild(event.target.cloneNode());
		this.$powerUi._$nodeSelectdToEdit = event.target;
		this.$powerUi._$nodeSelectdToEdit.classList.add('pw-selected-to-edit');
		const rect = event.target.getBoundingClientRect();
		this._$postToMain({
			nodeContent: nodeContainer.innerHTML,
			nodeRect: {top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left},
			command: 'selectNodeToEdit',
			clientX: event.clientX,
			clientY: event.clientY,
			level: this.$powerUi._$nodeSelectdToEdit.dataset.level,
			file: element.dataset.file,
			route: element.dataset.route,
			sizes: sizes,
		});
	}

	_$addSizesInPx(node) {
		const sizes = {};
		let nodeStyles = window.getComputedStyle(node, null);
		const savedSize = nodeStyles.fontSize;
		// px
		sizes.currentPx = nodeStyles.getPropertyValue('font-size');

		// em
		node.style.fontSize = '1em';
		nodeStyles = window.getComputedStyle(node, null);
		sizes.emPx = nodeStyles.getPropertyValue('font-size');

		// rem
		node.style.fontSize = '1rem';
		nodeStyles = window.getComputedStyle(node, null);
		sizes.remPx = nodeStyles.getPropertyValue('font-size');

		// pt
		node.style.fontSize = '1pt';
		nodeStyles = window.getComputedStyle(node, null);
		sizes.ptPx = nodeStyles.getPropertyValue('font-size');

		// Percentage
		node.style.fontSize = '100%';
		nodeStyles = window.getComputedStyle(node, null);
		sizes.percentagePx = nodeStyles.getPropertyValue('font-size');

		node.style.fontSize = savedSize;
		node.style.fontSize = null;

		return sizes;
	}

	_$createEditableHtml(template, fileName, routeId) {
		if (!this.$powerUi.devMode.isEditable || !this.$powerUi.devMode.child) {
			return template;
		}
		template = template.replace(/onclick/g, 'ondblclick');
		const _template = new DOMParser().parseFromString(template, 'text/html');
		let counter = 0;
		for (const child of _template.body.children) {
			child.classList.add('pw-allow-edit-element');
			child.dataset.file = fileName;
			child.dataset.route = routeId;
			child.dataset.powEvent = "";
			child.setAttribute("onclick", "_$selectElementToEdit(event, _node)");
			//
			this.$powerUi.simpleSweepDOM(
				child,
				function(node, level) {
					node.dataset.level = level;
					if (node.htmlFor) {
						node.dataset.sFor = node.htmlFor;
						node.removeAttribute('for');
					}
				},
				counter
			);
			counter = counter + 1;
		}
		return _template;
	}
}

export { PowerController };

class Request {
	constructor({config, $powerUi}) {
		this.$powerUi = $powerUi;
		if (config.authCookie) {
			this.$powerUi.authCookie = config.authCookie;
		}
		if (config.authToken) {
			this.$powerUi.authToken = config.authToken;
		}
		if (config.headers) {
			this.$powerUi.headers = config.headers;
		}
		const self = this;
		return function (d) {
			d.withCredentials = d.withCredentials === undefined ? true : d.withCredentials;
			d.headers = d.headers || self.$powerUi.headers || {};
			if (self.$powerUi.authCookie) {
				d.headers.Authorization = `Bearer ${self.$powerUi.getCookie(self.$powerUi.authCookie)}` || null;
			}
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
							const response = JSON.parse(xhr.response);
							try {
								if (response.action && self.$powerUi.config.serverCommands && self.$powerUi.config.serverCommands[response.action]) {
									self.$powerUi.config.serverCommands[response.action].run({response: response, $powerUi: self.$powerUi, $root: self.$powerUi.getRouteCtrl('$root')});
								}
							} catch (error) {
								return promise.onerror(error, response, xhr);
							}
							return promise.onsucess(response, xhr);
						} catch (error) {
							return promise.onsucess(xhr.response, xhr);
						}
					}
					return promise;
				},
				onerror: function (xhr) {
					if (promise.onerror) {
						try {
							const _response = JSON.parse(xhr.response);
							try {
								if (_response.action && self.$powerUi.config.serverCommands && self.$powerUi.config.serverCommands[_response.action]) {
									self.$powerUi.config.serverCommands[_response.action].run({response: _response, $powerUi: self.$powerUi, $root: self.$powerUi.getRouteCtrl('$root')});
								}
								if (_response && _response.fields && _response.fields.length > 0) {
									for (const field of _response.fields) {
										self.$powerUi.onFormError({id: field.id, msg: field.msg});
									}
								}
							} catch (error) {
								return promise.onerror(error, _response, xhr);
							}
							return promise.onerror(_response, xhr);
						} catch (error) {
							return promise.onerror(xhr.response, xhr);
						}
					}
				},
			});
			return promise;
		};
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
		};
		xhr.withCredentials = data.withCredentials;
		xhr.setRequestHeader('Content-Type', 'application/json');
		// if (method && method.toUpperCase() === 'POST')
		// 	xhr.setRequestHeader('Content-Type', 'application/json');
		// else {
		// 	xhr.setRequestHeader('Content-Type', 'text/html');
		// }
		if (data.headers && data.headers['Content-Type']) {
			xhr.setRequestHeader('Content-Type', data.headers['Content-Type']);
		}
		if (data.headers && data.headers.Authorization) {
			xhr.setRequestHeader('Authorization', data.headers.Authorization);
		}
		if (data && data.body) {
			xhr.send(JSON.stringify(data.body));
		} else {
			xhr.send();
		}
		return xhr;
	}
}

function getEmptyRouteObjetc() {
	return {
		params: [],
		id: '',
		viewId: '',
		route: '',
		parentRouteId: null,
		parentViewId: null,
		kind: '',
		secondaryRoutes: [],
		hiddenRoutes: [],
		mainChildRoutes: [],
		secondaryChildRoutes: [],
		hiddenChildRoutes: [],
	};
}

class EngineCommands {
	constructor(router) {
		this.bootstraping = true;
		this.pending = {};
		this.router = router;
		this.routes = {};
		this.default = {
			close: {
				runBeforeClose: true,
				runOnRemoveCtrl: true,
				removeCtrl: true,
				runOnRemoveView: true,
				removeView: true,
			},
			open: {
				addCtrl: true,
				runLoad: true,
				runCtrl: true,
				addView: true,
				runOnViewLoad: true,
			},
		};
		this.command = {
			refresh: {
				close: {
					runBeforeClose: false,
					runOnRemoveCtrl: false,
					removeCtrl: false,
					runOnRemoveView: true,
					removeView: true,
				},
				open: {
					addCtrl: false,
					runLoad: false,
					runCtrl: false,
					addView: true,
					runOnViewLoad: true,
				},
			},
			reload: {
				close: {
					runBeforeClose: true,
					runOnRemoveCtrl: true,
					removeCtrl: true,
					runOnRemoveView: true,
					removeView: true,
				},
				open: {
					addCtrl: true,
					runLoad: true,
					runCtrl: true,
					addView: true,
					runOnViewLoad: true,
				},
			}
		};

		if (this.router.config.routerMode === 'root') {
			this.default.close.rootView = {refresh: true};
		} else if (this.router.config.routerMode === 'parent') {
			this.default.close.parentView = {refresh: true};
		}
	}

	buildOtherCicleCommands() {
		if (this.bootstraping) {
			this.bootstraping = false;
			return;
		}
		this.buildPendingCloseCommands();
		this.buildPendingOpenCommands();
		this.buildPendingListCommands();
		// this.ensureRootIsLastToClose();
		this.pending = {};
	}

	// ensureRootIsLastToClose() {
	// 	let root = false;
	// 	this.router.orderedRoutesToClose = this.router.orderedRoutesToClose.filter(
	// 		function (route) {
	// 			if (route.routeId === '$root') {
	// 				root = route;
	// 			} else {
	// 				return true;
	// 			}
	// 	});

	// 	if (root) {
	// 		this.router.orderedRoutesToClose.push(root);
	// 	}
	// }

	addPendingComand(routeId, command) {
		if (!this.pending[routeId]) {
			this.pending[routeId] = {};
		}
		this.pending[routeId][command.name] = command.value;
	}

	propagateCommand({currentRouteId, sourceRouteId}) {
		for (const name of Object.keys(this.pending[sourceRouteId] || {})) {
			const value = this.pending[sourceRouteId][name];
			this.addPendingComand(currentRouteId, {name: name, value: value});
		}
	}

	addCommands(commands) {
		for (const item of Object.keys(commands || {})) {
			for (const routeId of Object.keys(commands[item] || {})) {
				for (const name of Object.keys(commands[item][routeId] || {})) {
					const command = {};
					command.name = name;
					command.value = commands[item][routeId][name];
					this.addPendingComand(routeId, command);
				}
			}
		}
	}

	override(commandsList, routeId, source) {
		for (const command of Object.keys(this.pending[routeId] || {})) {
			for (const index of Object.keys(this.command[command][source] || {})) {
				commandsList[index] = this.command[command][source][index];
			}
		}
	}

	buildRouteOpenCommands(routeId, viewId, shouldUpdate) {
		// Only apply default commands if the route is new
		if (shouldUpdate) {
			const commandsList = {};
			this.override(commandsList, routeId, 'open');
			return commandsList;
		} else {
			return this.default.open;
		}
	}

	buildRouteCloseCommands(routeId, viewId, shouldUpdate) {
		// Only apply default commands if the route is new
		if (shouldUpdate) {
			const commandsList = {};
			this.override(commandsList, routeId, 'close');
			return commandsList;
		} else {
			return this.default.close;
		}
	}

	buildPendingCloseCommands() {
		let index = 0;
		this.routesToAdd = [];
		for (const route of this.router.orderedRoutesToClose) {
			// May need apply parentView commands
			if (route.parentRouteId && route.commands.parentView && route.commands.parentView.refresh === true) {
				this.parentCommands(route, index);
			}
		}

		for (const route of this.routesToAdd) {
			this.router.orderedRoutesToClose.splice(route.index + 1, 0, route.route_close);
		}
	}

	buildPendingOpenCommands() {
		for (const route of this.routesToAdd) {
			const index = this.router.orderedRoutesToOpen.findIndex(r=> r.parentRouteId === route.route_open.routeId);
			this.router.orderedRoutesToOpen.splice(index, 0, route.route_open);
		}
	}

	buildPendingListCommands() {
		// May need apply some pending $root commands (root commands goes as last in close list)
		const _rootCommands = this.pending.$root;
		if (_rootCommands) {
			this.rootCommands(_rootCommands);
		}
	}

	overrideCommands(open, close, command) {
		for (const index of Object.keys(command.close || {})) {
			if (close.commands[index] === undefined || command.close[index] === true) {
				close.commands[index] = command.close[index];
			}
		}
		for (const index of Object.keys(command.open || {})) {
			if (open.commands[index] === undefined || command.open[index] === true) {
				open.commands[index] = command.open[index];
			}
		}
	}

	parentCommands(route, index) {
		// Only refresh if not removing the parent and if it is still on currentRoutes list
		let parent = this.router.getOpenedRoute({routeId: route.parentRouteId, viewId: route.parentViewId});
		if (!parent && route.parentRouteId === '$root') {
			parent = {id: '$root', viewId: 'root-view', params: null, kind: 'root', parentRouteId: null, parentViewId: null, powerViewNodeId: 'root-view'};
		}
		if (!this.router.orderedRoutesToClose.find(r => r.routeId === route.parentRouteId) && parent) {
			const newRoute = {
				routeId: parent.id,
				viewId: parent.viewId,
				params: parent.params,
				kind: parent.kind,
				parentRouteId: parent.parentRouteId,
				parentViewId: parent.parentViewId,
				powerViewNodeId: this.router.routes[parent.parentRouteId] ? this.router.routes[parent.parentRouteId].powerViewNodeId : null,
			};
			const open = Object.assign({}, newRoute);
			open.commands = {};
			const close = Object.assign({}, newRoute);
			close.commands = {};

			for (const index of Object.keys(route.commands.parentView || {})) {
				if (this.command[index]) {
					this.overrideCommands(open, close, this.command[index]);
				}
			}
			this.routesToAdd.push({index: index, route_close: close, route_open: open});
		}
		index = index + 1;
	}

	rootCommands(commands) {
		const newRoute = {routeId: "$root", viewId: "root-view", paramKeys: null, kind: "root"};
		const open = Object.assign({}, newRoute);
		open.commands = {};
		const close = Object.assign({}, newRoute);
		close.commands = {};

		for (const index of Object.keys(commands || {})) {
			if (this.command[index]) {
				this.overrideCommands(open, close, this.command[index]);
			}
		}

		this.router.orderedRoutesToOpen.unshift(open);
		this.router.orderedRoutesToClose.push(close);
	}
}

class Router {
	constructor(config, powerUi) {
		this.config = config || {};
		this.$powerUi = powerUi;
		this.routes = {};
		this.routeData = {};
		this.pendingCallbacks = [];
		this.oldRoutesBkp = getEmptyRouteObjetc();
		this.oldRoutes = getEmptyRouteObjetc();
		this.currentRoutes = getEmptyRouteObjetc();
		this.phantomRouter = null;
		this.engineCommands = new EngineCommands(this);
		this.onCycleEnds = new UEvent('onCycleEnds');
		this.onRouteChange = new UEvent('onRouteChange');
		if (!this.config.rootPath) {
			this.config.rootPath = '#!/';
		}
		if (config.routes) {
			for (const route of config.routes) {
				this.add(route);
			}
		}
		if (!this.config.phantomMode) {
			this.initRootScopeAndRunEngine();
			// call engine if hash change
			window.onhashchange = this.hashChange.bind(this);
		}
	}

	getCurrentRouteIds() {
		const routeIds = [];
		// Root
		if (this.currentRoutes.parentRouteId) {
			routeIds.push(this.currentRoutes.parentRouteId);
		}
		// Main
		routeIds.push(this.currentRoutes.id);
		// Main child
		for (const child of this.currentRoutes.mainChildRoutes) {
			routeIds.push(child.id);
		}
		// Hidden
		for (const child of this.currentRoutes.hiddenRoutes) {
			routeIds.push(child.id);
		}
		// Hidden child
		for (const child of this.currentRoutes.hiddenChildRoutes) {
			routeIds.push(child.id);
		}
		// Secondary
		for (const child of this.currentRoutes.secondaryRoutes) {
			routeIds.push(child.id);
		}
		// Secondary child
		for (const child of this.currentRoutes.secondaryChildRoutes) {
			routeIds.push(child.id);
		}
		return routeIds;
	}

	add(route) {
		route.template = route.templateUrl || route.template || route.templateComponent || route.url || (route.dynamicUrl ? 'dynamicUrl' : false);
		// main route and secondary routes view id
		this.config.routerMainViewId = 'main-view';
		this.config.routerSecondaryViewId = 'secondary-view';
		// Ensure that the parameters are not empty
		if (!route.id) {
			throw new Error('A route ID must be given');
		}
		if (!route.ctrl && route.id !== 'otherwise') {
			window.console.log('route missing ctrl:', route);
			throw new Error('A route "ctrl" must be given');
		}
		// Ensure that the parameters have the correct types
		if (typeof route.route !== "string" && route.id !== '$root') {
			throw new TypeError('typeof route must be a string');
		}

		// Rewrite root route difined as '/' to an empty string so the final route can be '#!/'
		if (route.route === '/') {
			route.route = '';
		}

		if (route.id === '$root') {
			route.route = '';
		} else {
			route.route = this.config.rootPath + (route.route || '');
		}

		// throw an error if the route already exists to avoid confilicting routes
		// the "otherwise" route can be duplicated only if it do not have a template
		if (route.id !== 'otherwise' || route.template) {
			for (const routeId of Object.keys(this.routes || {})) {
				// the "otherwise" route can be duplicated only if it do not have a template
				if (this.routes[routeId].route === route.route && (routeId !== 'otherwise' || this.routes[routeId].template)) {
					if (routeId === 'otherwise' || route.id === 'otherwise') {
						throw new Error(`the route "${route.route || '/'}" already exists, so "${route.id}" can't use it if you use a template. You can remove the template or use another route.`);
					} else {
						throw new Error(`the route "${route.route || '/'}" already exists, so "${route.id}" can't use it.`);
					}
				}
			}
		}
		// throw an error if the route id already exists to avoid confilicting routes
		if (this.routes[route.id]) {
			throw new Error(`the id ${route.id} already exists`);
		} else {
			this.routes[route.id] = route;
		}
	}

	// Copy the current open secondary route, and init the router with the new route
	hashChange(event) {
		// This support the abort a cicle
		if (this.engineIsRunning === true) {
			this.engineIsRunning = false;
			return;
		}
		this.currentUrl = event ? event.newURL : window.location.href;
		this.previousUrl = event ? event.oldURL : window.location.href;
		// Save the old routes if user abort and need restore it
		this.oldRoutesBkp = this.cloneRoutes({source: this.oldRoutes});
		// Save a copy of currentRoutes as oldRoutes
		this.oldRoutes = this.cloneRoutes({source: this.currentRoutes});
		// Clean current routes
		this.currentRoutes = getEmptyRouteObjetc();
		this.engine();
	}

	cloneRoutesAndRunEngine() {
		this.currentUrl = window.location.href;
		this.previousUrl = window.location.href;
		// Save the old routes if user abort and need restore it
		this.oldRoutesBkp = this.cloneRoutes({source: this.oldRoutes});
		// Save a copy of currentRoutes as oldRoutes
		this.oldRoutes = this.cloneRoutes({source: this.currentRoutes});
		// Clean current routes
		this.currentRoutes = getEmptyRouteObjetc();
		this.engine();
	}

	abortCicle() {
		// Restore routes, location and stop engine;
		this.currentRoutes = this.cloneRoutes({source: this.oldRoutes});
		this.oldRoutes = this.cloneRoutes({source: this.oldRoutesBkp});
		this.clearPhantomRouter();
		window.location.href = this.previousUrl;
		this.engineIsRunning = false;
	}

	clearPhantomRouter() {
		delete this.phantomRouter;
		this.phantomRouter = null;
	}

	cloneRouteList(dest, source, listName) {
		for (const route of source[listName]) {
			const list = {
				id: route.id,
				viewId: route.viewId,
				route: route.route,
				parentRouteId: route.parentRouteId,
				parentViewId: route.parentViewId,
				kind: route.kind,
				params: [],
			};
			for (const param of route.params) {
				list.params.push({key: param.key, value: param.value});
			}
			dest[listName].push(list);
		}
	}

	cloneRoutes({source}) {
		const dest = {
			params: [],
			id: source.id,
			viewId: source.viewId,
			route: source.route,
			parentRouteId: source.parentRouteId,
			parentViewId: source.parentViewId,
			kind: source.kind,
			secondaryRoutes: [],
			hiddenRoutes: [],
			mainChildRoutes: [],
			secondaryChildRoutes: [],
			hiddenChildRoutes: [],
		};
		for (const param of source.params) {
			dest.params.push({key: param.key, value: param.value});
		}
		this.cloneRouteList(dest, source, 'secondaryRoutes');
		this.cloneRouteList(dest, source, 'hiddenRoutes');
		this.cloneRouteList(dest, source, 'mainChildRoutes');
		this.cloneRouteList(dest, source, 'secondaryChildRoutes');
		this.cloneRouteList(dest, source, 'hiddenChildRoutes');
		return dest;
	}

	locationHashWithHiddenRoutes() {
		const hash = decodeURI(window.location.hash + (this.hiddenLocationHash || ''));
		return hash;
	}

	addSpinnerAndHideContent(viewId) {
		// Only add one spinner when the first view is added to waitingViews
		if (!document.getElementById('_power-spinner')) {
			// Backdrop
			const spinnerBackdrop = document.createElement('div');
			spinnerBackdrop.classList.add('pw-spinner-backdrop');
			spinnerBackdrop.id = '_power-spinner';

			// Spinner label
			const spinnerLabel = document.createElement('p');
			spinnerLabel.classList.add('pw-spinner-label');
			spinnerLabel.innerText = this.config.spinnerLabel || 'LOADING';
			spinnerBackdrop.appendChild(spinnerLabel);

			// Spinner
			const spinner = document.createElement('div');
			spinner.classList.add('pw-spinner');
			spinnerBackdrop.appendChild(spinner);

			// Add to body
			document.body.appendChild(spinnerBackdrop);
		}
		// Avoid blink uninterpolated data before call compile and interpolate
		const app = document.getElementById('app-container');
		app.classList.add('pw-show-spinner');
		app.style.opacity = 0;
	}

	removeSpinnerAndShowContent(viewId) {
		const spinner = document.getElementById('_power-spinner');
		if (spinner) {
			spinner.parentNode.removeChild(spinner);
		}
		if (viewId) {
			const view = document.getElementById(viewId);
			view.style.visibility = 'visible';
		}
		// Avoid blink uninterpolated data before call compile and interpolate
		const app = document.getElementById('app-container');
		app.classList.remove('pw-show-spinner');
		app.style.opacity = 1;
	}

	buildRoutesTree(path) {
		const routeParts = {
			full_path: path,
			mainRoute: {path: path},
			secondaryRoutes: [],
			hiddenRoutes: [],
		};
		if (path.includes('?')) {
			const splited = path.split('?');
			routeParts.mainRoute = this.buildPathAndChildRoute(splited[0]);
			for (const part of splited) {
				if (part.includes('sr=')) {
					for (const fragment of part.split('sr=')) {
						if (fragment) {
							const sroute = this.buildPathAndChildRoute(
								this.config.rootPath + fragment);
							routeParts.secondaryRoutes.push(sroute);
						}
					}
				} else	if (part.includes('hr=')) {
					for (const fragment of part.split('hr=')) {
						if (fragment) {
							const hroute = this.buildPathAndChildRoute(
								this.config.rootPath + fragment);
							routeParts.hiddenRoutes.push(hroute);
						}
					}
				}
			}
		} else {
			routeParts.mainRoute = this.buildPathAndChildRoute(path);
		}
		return routeParts;
	}

	buildPathAndChildRoute(fragment) {
		fragment = fragment.replace(this.config.rootPath, '');
		const route = {};
		let current = route;
		const parts = fragment.split('&ch=');
		if (fragment.includes('&ch=')) {
			for (const child of parts) {
				// Jump the first entry becouse it's not a child route
				if (child !== parts[0]) {
					current.childRoute = {path: child};
					current = current.childRoute;
				}
			}
		}
		route.path = parts[0];
		return route;
	}

	recursivelyAddChildRoute(route, mainKind, powerViewNodeId, parentRouteId, parentViewId, propagateCommandsFromRouteId) {
		const routesListName = `${mainKind}ChildRoutes`;
		if (route && route.childRoute) {
			const childRoute = this.matchRouteAndGetIdAndParamKeys(route.childRoute);
			let childViewId = false;
			if (childRoute) {
				if (propagateCommandsFromRouteId) {
					this.engineCommands.propagateCommand({
						currentRouteId: childRoute.routeId,
						sourceRouteId: propagateCommandsFromRouteId,
					});
					propagateCommandsFromRouteId = childRoute.routeId;
				}
				childViewId = this.getVewIdIfRouteExists(route.childRoute.path, routesListName);
				const routeIsNew = (childViewId === false);
				const shouldUpdate = (routeIsNew === false && this.engineCommands.pending[childRoute.routeId] !== undefined);
				// Load child route only if it's a new route
				if (routeIsNew === true || shouldUpdate || propagateCommandsFromRouteId) {
					childViewId = childViewId || _Unique.domID('view');
					// Add child route to ordered list
					this.orderedRoutesToOpen.push({
						routeId: childRoute.routeId,
						viewId: childViewId,
						paramKeys: childRoute.paramKeys,
						kind: 'child',
						powerViewNodeId: powerViewNodeId,
						parentRouteId: parentRouteId,
						parentViewId: parentViewId,
						commands: this.engineCommands.buildRouteOpenCommands(childRoute.routeId, childViewId, shouldUpdate),
					});
				}
				// Register child route on currentRoutes list
				this.setChildRouteState({
					routeId: childRoute.routeId,
					paramKeys: childRoute.paramKeys,
					route: route.childRoute.path,
					viewId: childViewId,
					title: this.routes[childRoute.routeId].title,
					data: this.routes[childRoute.routeId].data,
					mainKind: mainKind,
					parentRouteId: parentRouteId,
					parentViewId: parentViewId,
					kind: 'child',
				});
			}

			if (route.childRoute.childRoute) {
				this.recursivelyAddChildRoute(
					route.childRoute, mainKind, childRoute.powerViewNodeId, (childRoute ? childRoute.routeId : null), (childViewId ? childViewId : null), propagateCommandsFromRouteId);
			}
		}
	}

	setMainRouteAndAddToOrderedRoutesToLoad(currentRoutesTree) {
		// First check main route
		const mainRoute = this.matchRouteAndGetIdAndParamKeys(currentRoutesTree.mainRoute);
		// Second recursively add main route child and any level of child of childs
		if (mainRoute) {
			let propagateCommandsFromRouteId = false;
			// If root has pending commands forces all routes to refresh
			if (this.engineCommands.pending['$root']) {
				this.engineCommands.propagateCommand({
					currentRouteId: mainRoute.routeId,
					sourceRouteId: '$root',
				});
				propagateCommandsFromRouteId = mainRoute.routeId;
			}
			// Add main route to ordered list
			// Load main route only if it is a new route or if has some pending command to run
			const routeIsNew = (!this.oldRoutes.id || (this.oldRoutes.route !== currentRoutesTree.mainRoute.path));
			const shouldUpdate = (routeIsNew === false && this.engineCommands.pending[mainRoute.routeId] !== undefined);
			if (propagateCommandsFromRouteId || shouldUpdate || (!this.oldRoutes.id || (this.oldRoutes.route !== currentRoutesTree.mainRoute.path))) {
				this.orderedRoutesToOpen.push({
					route: currentRoutesTree.mainRoute.path,
					routeId: mainRoute.routeId,
					viewId: this.config.routerMainViewId,
					paramKeys: mainRoute.paramKeys,
					kind: 'main',
					parentRouteId: this.hasRoot ? '$root' : null,
					parentViewId: this.hasRoot ? 'root-view' : null,
					powerViewNodeId: 'root-view',
					commands: this.engineCommands.buildRouteOpenCommands(
						mainRoute.routeId, this.config.routerMainViewId, shouldUpdate),
				});
			}
			// Register main route on currentRoutes list
			this.setMainRouteState({
				routeId: mainRoute.routeId,
				paramKeys: mainRoute.paramKeys,
				route: currentRoutesTree.mainRoute.path,
				viewId: this.config.routerMainViewId,
				title: this.routes[mainRoute.routeId].title,
				data: this.routes[mainRoute.routeId].data,
				parentRouteId: this.hasRoot ? '$root' : null,
				parentViewId: this.hasRoot ? 'root-view' : null,
				powerViewNodeId: 'root-view',
				kind: 'main',
			});
			// Add any main child route to ordered list
			this.recursivelyAddChildRoute(
				currentRoutesTree.mainRoute, 'main', mainRoute.powerViewNodeId, mainRoute.routeId, 'main-view', propagateCommandsFromRouteId);
		} else {
			// otherwise if do not mach a route
			const newRoute = this.routes.otherwise ? this.routes.otherwise.route : this.config.rootPath;
			window.location.replace(encodeURI(newRoute));
			return;
		}
	}
	// Secondary and hidden routes
	setOtherRoutesAndAddToOrderedRoutesToLoad(routesList, routesListName, kind, setRouteState) {
		for (const route of routesList) {
			const currentRoute = this.matchRouteAndGetIdAndParamKeys(route);
			if (currentRoute) {
				let propagateCommandsFromRouteId = false;
				// If root has pending commands forces all routes to refresh
				if (this.engineCommands.pending['$root']) {
					this.engineCommands.propagateCommand({
						currentRouteId: currentRoute.routeId,
						sourceRouteId: '$root',
					});
					propagateCommandsFromRouteId = currentRoute.routeId;
				}

				let viewId = this.getVewIdIfRouteExists(route.path, routesListName);
				const routeIsNew = (viewId === false);
				const shouldUpdate = (routeIsNew === false && this.engineCommands.pending[currentRoute.routeId] !== undefined);
				// Load route only if it's a new route
				if (viewId === false || shouldUpdate || propagateCommandsFromRouteId) {
					// Create route viewId
					viewId = viewId || _Unique.domID('view');
					// Add route to ordered list
					this.orderedRoutesToOpen.push({
						route: route.path,
						routeId: currentRoute.routeId,
						viewId: viewId,
						paramKeys: currentRoute.paramKeys,
						kind: kind,
						parentRouteId: null,
						parentViewId: null,
						commands: this.engineCommands.buildRouteOpenCommands(
							currentRoute.routeId, viewId, shouldUpdate),
					});
				}
				// Register route on currentRoutes list
				setRouteState({
					routeId: currentRoute.routeId,
					paramKeys: currentRoute.paramKeys,
					route: route.path,
					viewId: viewId,
					title: this.routes[currentRoute.routeId].title,
					data: this.routes[currentRoute.routeId].data,
					parentRouteId: null,
					parentViewId: null,
					kind: kind,
				});
				// Add any child route to ordered list
				this.recursivelyAddChildRoute(
					route, kind, currentRoute.powerViewNodeId, currentRoute.routeId, (viewId ? viewId : null), propagateCommandsFromRouteId);
			}
		}
	}

	setNewRoutesAndbuildOrderedRoutesToLoad() {
		const currentRoutesTree = this.buildRoutesTree(this.locationHashWithHiddenRoutes() || this.config.rootPath);
		// First mach any main route and its children
		this.setMainRouteAndAddToOrderedRoutesToLoad(currentRoutesTree);
		// Second mach any secondary route and its children
		this.setOtherRoutesAndAddToOrderedRoutesToLoad(
			currentRoutesTree.secondaryRoutes, 'secondaryRoutes', 'secondary', this.setSecondaryRouteState.bind(this));
		// Third mach any hidden route and its children
		this.setOtherRoutesAndAddToOrderedRoutesToLoad(
			currentRoutesTree.hiddenRoutes, 'hiddenRoutes', 'hidden', this.setHiddenRouteState.bind(this));
	}

	// Render the rootScope if exists and only boostrap after promise returns
	initRootScopeAndRunEngine() {
		const $root = this.$powerUi.config.routes.find(r=> r.id === '$root');
		const openCommands = this.engineCommands.buildRouteOpenCommands('$root', 'root-view', false);
		const closeCommands = this.engineCommands.buildRouteCloseCommands('$root', 'root-view', false);
		const commands = Object.assign(openCommands, closeCommands);
		delete commands.parentView;
		delete commands.rootView;
		const loadRoot = {routeId: "$root", viewId: "root-view", paramKeys: null, kind: "root", commands: commands};
		if ($root) {
			this.hasRoot = true;
			this.engine(loadRoot);
		} else {
			this.engine();
		}
	}

	setDefaultCommands() {
		if (this.engineCommands.default.close.rootView && this.engineCommands.default.close.rootView.refresh) {
			// Only refresh when some route changes or closes, but not when opens a secondary route.
			if (this.previousUrl && this.currentUrl) {
				const c_secondaryParts = this.currentUrl.split('?');
				const p_secondaryParts = this.previousUrl.split('?');
				if (c_secondaryParts.length < p_secondaryParts.length || (c_secondaryParts.length === p_secondaryParts.length && (this.previousUrl !== this.currentUrl))) {
					this.engineCommands.addPendingComand('$root', {name: 'refresh', value: true});
				}
			}
		}
	}

	// testSpinner() {
	// 	const _promise = new Promise(function(resolve) {
	// 		setTimeout(function() {
	// 			resolve();
	// 		}, 2000);
	// 	});
	// 	return _promise;
	// }

	async engine($root) {
		if (!this.config.phantomMode) {
			this.addSpinnerAndHideContent();
			this.setDefaultCommands();
			// await this.testSpinner();
		} else {
			this.removeSpinnerAndShowContent();
		}
		this.engineIsRunning = true;

		const routesToRunOnBeforeClose = this.getRoutesToRunOnBeforeClose();
		const abort = await this.resolveWhenListIsPopulated(
			this.runBeforeCloseInOrder, routesToRunOnBeforeClose, 0, this);
		if (abort === 'abort') {
			this.abortCicle();
			return;
		}

		this.orderedRoutesToOpen = $root ? [$root] : [];
		this.orderedRoutesToClose = [];
		this.setNewRoutesAndbuildOrderedRoutesToLoad();
		this.buildOrderedRoutesToClose();
		this.engineCommands.buildOtherCicleCommands();
		this.clearPhantomRouter();
		await this.resolveWhenListIsPopulated(
			this.removeViewInOrder, this.orderedRoutesToClose, 0, this);
		await this.resolveWhenListIsPopulated(
			this.runOnRemoveCtrlAndRemoveController, this.orderedRoutesToClose, 0, this);
		await this.resolveWhenListIsPopulated(
			this.initRouteControllerAndRunLoadInOrder, this.orderedRoutesToOpen, 0, this);
		await this.resolveWhenListIsPopulated(
			this.runControllerInOrder, this.orderedRoutesToOpen, 0, this);
		await this.resolveWhenListIsPopulated(
			this.loadViewInOrder, this.orderedRoutesToOpen, 0, this);
		await this.resolveWhenListIsPopulated(
			this.runOnViewLoadInOrder, this.orderedRoutesToOpen, 0, this);
		this.engineIsRunning = false;

		if (this.pendingCallbacks.length) {
			for (const callback of this.pendingCallbacks) {
				callback();
			}
			this.pendingCallbacks = [];
		}
		if (!this.config.phantomMode) {
			this.onCycleEnds.broadcast();
			// Clear observers to call only a single time
			this.onCycleEnds.observers = [];
		}
		// Delay becouse some browsers still working
		const self = this;
		setTimeout(function () {
			self.onRouteChange.broadcast();
			if (self.$powerUi.devMode && self.$powerUi.devMode.child && self.$powerUi.devMode.isEditable) {
				const $root = self.$powerUi.getRouteCtrl('$root');
				$root._$postToMain({
					routeIds: self.getCurrentRouteIds(),
					command: 'setCurrentBody',
					body: document.getElementsByTagName("BODY")[0].innerHTML,
				});
			}
		}, 150);
	}

	// This is the first link in a chain of recursive loop with promises
	// We are calling recursive functions that may contain promises
	// When the function detects it's done it calls the this function resolve
	resolveWhenListIsPopulated(fn, orderedList, index, ctx) {
		const _promise = new Promise(function(resolve) {
			const _resolve = resolve;
			fn(orderedList, index, ctx, _resolve);
		});
		return _promise;
	}

	removeViewInOrder(orderedRoutesToClose, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToClose[routeIndex];
		if (!route) {
			return _resolve();
		}

		// Run the onRemoveView
		if (route.commands.runOnRemoveView === true &&
			ctx.$powerUi.controllers[route.viewId] &&
			ctx.$powerUi.controllers[route.viewId].instance &&
			ctx.$powerUi.controllers[route.viewId].instance.onRemoveView) {
			const result = ctx.$powerUi.controllers[route.viewId].instance.onRemoveView();
			if (result && result.then) {
				result.then(function (response) {
					if (ctx.$powerUi.controllers[route.viewId].instance._onRemoveView) {
						ctx.$powerUi.controllers[route.viewId].instance._onRemoveView();
					}
					ctx.removeView(route.viewId, ctx);
					ctx.callNextLinkWhenReady(
						ctx.removeViewInOrder, orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
				}).catch(function (error) {
					_resolve('abort');
					if (error) {
						window.console.log('Error running onRemoveView: ', route.routeId, error);
					}
				});
			} else {
				if (ctx.$powerUi.controllers[route.viewId].instance._onRemoveView) {
					ctx.$powerUi.controllers[route.viewId].instance._onRemoveView();
				}
				ctx.removeView(route.viewId, ctx);
					ctx.callNextLinkWhenReady(
						ctx.removeViewInOrder, orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
			}
		} else {
			if (ctx.$powerUi.controllers[route.viewId].instance._onRemoveView) {
				ctx.$powerUi.controllers[route.viewId].instance._onRemoveView();
			}
			ctx.removeView(route.viewId, ctx);
			ctx.callNextLinkWhenReady(
				ctx.removeViewInOrder, orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
		}
	}

	callNextLinkWhenReady(runInOrder, orderedList, index, ctx, _resolve) {
		if (ctx.phantomRouter) {
			ctx.phantomRouter.ready.subscribe(function () {
				runInOrder(orderedList, index, ctx, _resolve);
			});
		} else {
			runInOrder(orderedList, index, ctx, _resolve);
		}
	}

	// THIS OLD VERSION FOLLOW THE PATTER OF ALL OTHER CICLE METHODS
	// runBeforeCloseInOrder(orderedRoutesToClose, routeIndex, ctx, _resolve) {
	// 	const route = orderedRoutesToClose[routeIndex];
	// 	if (!route) {
	// 		return	_resolve();
	// 	}
	// 	// Run the controller onBeforeClose
	// 	if (route.commands.runBeforeClose === true &&
	// 		ctx.$powerUi.controllers[route.viewId] &&
	// 		ctx.$powerUi.controllers[route.viewId].instance &&
	// 		ctx.$powerUi.controllers[route.viewId].instance.onBeforeClose) {
	// 		const result = ctx.$powerUi.controllers[route.viewId].instance.onBeforeClose();
	// 		if (result && result.then) {
	// 			result.then(function (response) {
	// 				ctx.callNextLinkWhenReady(
	// 					ctx.runBeforeCloseInOrder, orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
	// 			}).catch(function (error) {
	// 				_resolve('abort');
	// 				if (error) {
	// 					window.console.log('Error running onBeforeClose: ', route.routeId, error);
	// 				}
	// 			});
	// 		} else {
	// 			ctx.runBeforeCloseInOrder(
	// 				orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
	// 		}
	// 	} else {
	// 		ctx.runBeforeCloseInOrder(orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
	// 	}
	// }
	runBeforeCloseInOrder(routesToRunOnBeforeClose, routeIndex, ctx, _resolve) {
		const ctrl = routesToRunOnBeforeClose[routeIndex];
		if (!ctrl) {
			return	_resolve();
		}
		// Run the controller onBeforeClose
		if (ctrl.onBeforeClose) {
			const result = ctrl.onBeforeClose();
			if (result && result.then) {
				result.then(function (response) {
					ctx.callNextLinkWhenReady(
						ctx.runBeforeCloseInOrder, routesToRunOnBeforeClose, routeIndex + 1, ctx, _resolve);
				}).catch(function (error) {
					_resolve('abort');
					if (error) {
						window.console.log('Error running onBeforeClose: ', ctrl.routeId, error);
					}
				});
			} else {
				ctx.runBeforeCloseInOrder(
					routesToRunOnBeforeClose, routeIndex + 1, ctx, _resolve);
			}
		} else {
			ctx.runBeforeCloseInOrder(routesToRunOnBeforeClose, routeIndex + 1, ctx, _resolve);
		}
	}

	// Run the controller instance for the route
	initRouteControllerAndRunLoadInOrder(orderedRoutesToOpen, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToOpen[routeIndex];
		if (!route) {
			return	_resolve();
		}
		if (route.commands.addCtrl) {
			let $data = {};
			if (ctx.routeData[route.routeId]) {
				$data = Object.assign(ctx.routeData[route.routeId], ctx.routes[route.routeId].data || {});
				delete ctx.routeData[route.routeId];
			} else {
				$data = Object.assign({}, ctx.routes[route.routeId].data || {});
			}
			const ctrl = ctx.routes[route.routeId].ctrl;
			// Register the controller with $powerUi
			ctx.$powerUi.controllers[route.viewId] = {
				component: ctrl,
				data: $data,
			};

			const currentRoute = ctx.getOpenedRoute({routeId: route.routeId, viewId: route.viewId});
			// Instanciate the controller
			$data.$powerUi = ctx.$powerUi;
			$data.viewId = route.viewId;
			$data.routeId = route.routeId;
			$data.title = ctx.routes[route.routeId].title;
			ctx.$powerUi.controllers[route.viewId].instance = new ctrl($data);
			ctx.$powerUi.controllers[route.viewId].instance._viewId = route.viewId;
			ctx.$powerUi.controllers[route.viewId].instance._routeId = route.routeId;
			ctx.$powerUi.controllers[route.viewId].instance._routeParams = currentRoute ? currentRoute.params : [];
			ctx.$powerUi.controllers[route.viewId].instance.$root = (ctx.$powerUi.controllers['root-view'] && ctx.$powerUi.controllers['root-view'].instance) ? ctx.$powerUi.controllers['root-view'].instance : null;
		}
		// Run the controller load
		if (route.commands.runLoad &&
			ctx.$powerUi.controllers[route.viewId] &&
			ctx.$powerUi.controllers[route.viewId].instance &&
			ctx.$powerUi.controllers[route.viewId].instance.load) {
			const loadPromise = ctx.$powerUi.controllers[route.viewId].instance._load(
				ctx.$powerUi.controllers[route.viewId].data);
			loadPromise.then(function () {
				ctx.initRouteControllerAndRunLoadInOrder(
					orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
			}).catch(function (error) {
				window.console.log('Error load CTRL: ', error);
			});
		} else {
			ctx.initRouteControllerAndRunLoadInOrder(
				orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
		}
	}

	runControllerInOrder(orderedRoutesToOpen, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToOpen[routeIndex];
		if (!route) {
			return	_resolve();
		}

		if (route.commands.runCtrl &&
			ctx.$powerUi.controllers[route.viewId] &&
			ctx.$powerUi.controllers[route.viewId].instance &&
			ctx.$powerUi.controllers[route.viewId].instance.ctrl) {
			const result = ctx.$powerUi.controllers[route.viewId].instance.ctrl(
				ctx.$powerUi.controllers[route.viewId].data);
			if (result && result.then) {
				result.then(function () {
					ctx.callNextLinkWhenReady(
						ctx.runControllerInOrder, orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
				}).catch(function (error) {
					window.console.log('Error running CTRL: ', error);
				});
			} else {
				ctx.runControllerInOrder(
					orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
			}
		} else {
			ctx.runControllerInOrder(
				orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
		}
	}

	runOnRemoveCtrlAndRemoveController(orderedRoutesToClose, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToClose[routeIndex];
		if (!route) {
			return _resolve();
		}

		if (ctx.$powerUi.controllers[route.viewId] &&
			ctx.$powerUi.controllers[route.viewId].instance) {
			const result = (route.commands.runOnRemoveCtrl && ctx.$powerUi.controllers[route.viewId].instance.onRemoveCtrl) ? ctx.$powerUi.controllers[route.viewId].instance.onRemoveCtrl() : false;

			if (result && result.then) {
				result.then(function () {
					if (route.commands.runOnRemoveCtrl) {
						if (ctx.$powerUi.controllers[route.viewId].instance._onRemoveCtrl) {
							ctx.$powerUi.controllers[route.viewId].instance._onRemoveCtrl();
						}
						ctx.removeVolatileViews(route.viewId);
						delete ctx.$powerUi.controllers[route.viewId];
					}
					ctx.callNextLinkWhenReady(
						ctx.runOnRemoveCtrlAndRemoveController, orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
				}).catch(function (error) {
					window.console.log('Error running onRemoveCtrl: ', route.routeId, error);
				});
			} else {
				if (route.commands.runOnRemoveCtrl) {
					if (ctx.$powerUi.controllers[route.viewId].instance._onRemoveCtrl) {
						ctx.$powerUi.controllers[route.viewId].instance._onRemoveCtrl();
					}
					ctx.removeVolatileViews(route.viewId);
					delete ctx.$powerUi.controllers[route.viewId];
				}
				ctx.runOnRemoveCtrlAndRemoveController(
					orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
			}
		} else {
			if (route.commands.runOnRemoveCtrl) {
				if (ctx.$powerUi.controllers[route.viewId].instance._onRemoveCtrl) {
					ctx.$powerUi.controllers[route.viewId].instance._onRemoveCtrl();
				}
			}
			ctx.runOnRemoveCtrlAndRemoveController(orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
		}
	}

	// Dialogs and modals with a hidden route opened throw a widget service are volatile routes
	// One route are create for each instante, so we need remove it when the controller are distroyed
	removeVolatileViews(viewId) {
		if (this.$powerUi.controllers[viewId] && this.$powerUi.controllers[viewId].instance && this.$powerUi.controllers[viewId].instance.volatileRouteIds && this.$powerUi.controllers[viewId].instance.volatileRouteIds.length) {
			for (const volatileId of this.$powerUi.controllers[viewId].instance.volatileRouteIds) {
				delete this.routes[volatileId];
			}
		}
	}

	runOnViewLoadInOrder(orderedRoutesToOpen, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToOpen[routeIndex];
		if (!route) {
			return _resolve();
		}

		if (route.commands.runOnViewLoad &&
			ctx.$powerUi.controllers[route.viewId] &&
			ctx.$powerUi.controllers[route.viewId].instance) {
			if (ctx.$powerUi.controllers[route.viewId].instance.onViewLoad) {
				const result = ctx.$powerUi.controllers[route.viewId].instance.onViewLoad(
					ctx.$powerUi.powerTree.allPowerObjsById[route.viewId].$shared.element); // passing the view element
				if (result && result.then) {
					result.then(function () {
						ctx.afterOnViewLoad(ctx, route);
						ctx.runOnViewLoadInOrder(orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
					}).catch(function (error) {
						window.console.log('Error running onViewLoad: ', route.routeId, error);
					});
				} else {
					ctx.afterOnViewLoad(ctx, route);
					ctx.runOnViewLoadInOrder(orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
				}
			} else {
				ctx.afterOnViewLoad(ctx, route);
				ctx.runOnViewLoadInOrder(orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
			}
		} else {
			ctx.afterOnViewLoad(ctx, route);
			ctx.runOnViewLoadInOrder(orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
		}
	}

	afterOnViewLoad(ctx, route) {
		if (ctx.$powerUi.controllers[route.viewId].instance._onViewLoad) {
			ctx.$powerUi.controllers[route.viewId].instance._onViewLoad(
				ctx.$powerUi.powerTree.allPowerObjsById[route.viewId].$shared.element); // passing the view element
		}
	}

	removeViewAndRouteViewCss(viewId, ctx) {
		const tscope = (ctx.$powerUi.controllers[viewId].instance && ctx.$powerUi.controllers[viewId].instance.$tscope) ? ctx.$powerUi.controllers[viewId].instance && ctx.$powerUi.controllers[viewId].instance.$tscope : null;
		const viewNode = document.getElementById(viewId);

		if (tscope && viewNode) {
			// Add a list of css selectors to current view
			if (tscope.$classList && tscope.$classList.length) {
				for (const css of tscope.$classList) {
					viewNode.classList.remove(css);
				}
			}
			// Add a list of css selectors to routes view
			if (tscope.$routeClassList) {
				for (const routeId of Object.keys(tscope.$routeClassList || {})) {
					const routeScope = tscope.$ctrl.getRouteCtrl(routeId);
					const routeViewId = routeScope ? routeScope._viewId : null;
					const routeViewNode = routeViewId ? document.getElementById(routeViewId) : null;
					if (routeViewNode) {
						for (const css of tscope.$routeClassList[routeId]) {
							routeViewNode.classList.remove(css);
						}
					}
				}
			}
		}
	}

	removeView(viewId, ctx) {
		if (!this.$powerUi.powerTree) {
			return;
		}
		// Remove custom css of this view if exists
		this.removeCustomCssNode(viewId);
		this.removeViewAndRouteViewCss(viewId, ctx);

		const powerViewNode = document.getElementById(viewId);
		// delete all inner elements and events from this.allPowerObjsById[id]
		if (this.$powerUi.powerTree.allPowerObjsById[viewId] &&
			this.$powerUi.powerTree.allPowerObjsById[viewId].$shared) {
			if (viewId === 'main-view') {
				this.$powerUi.powerTree.allPowerObjsById[viewId].$shared.removeInnerElementsFromPower();
			} else if (viewId === 'root-view') {
				this.$powerUi.powerTree.allPowerObjsById[viewId].$shared.removeInnerElementsFromPower();
			} else {
				this.$powerUi.powerTree.allPowerObjsById[viewId].$shared.removeElementAndInnersFromPower(powerViewNode)
			}
		}
		// Remove the node it self if not main-view
		if (viewId !== 'main-view' && viewId !== 'root-view' && powerViewNode) {
			powerViewNode.parentNode.removeChild(powerViewNode);
		}

		// Remove 'modal-open' css class from body if all modals are closed
		const modals = document.body.getElementsByClassName('pw-backdrop');
		if (modals && modals.length === 0) {
			document.body.classList.remove('modal-open');
		}
	}

	recursivelyGetChildrenRoutesToRunOnBeforeClose(currentRoute, routesList) {
		const route = this.matchRouteAndGetIdAndParamKeys(currentRoute);
		routesList.push(route);
		if (currentRoute.childRoute) {
			this.recursivelyGetChildrenRoutesToRunOnBeforeClose(currentRoute.childRoute, routesList);
		}
	}

	addRouteToRoutesToClose(routesToClose, oldRoutesList, currentRoutesList) {
		for (const route of oldRoutesList) {
			const thisRoute = currentRoutesList.find(r=> r.routeId === route.id);
			if (thisRoute === undefined) {
				const ctrl = this.$powerUi.getRouteCtrl(route.id);
				if (ctrl && ctrl.onBeforeClose) {
					routesToClose.push(ctrl);
				}
			}
		}
	}

	// Return a list of routes that are closing and have onBeforeRoute method
	getRoutesToRunOnBeforeClose() {
		const routesToClose = [];
		const currentRoutesTree = this.buildRoutesTree(this.locationHashWithHiddenRoutes() || this.config.rootPath);
		// First check main route
		const mainRoute = this.matchRouteAndGetIdAndParamKeys(currentRoutesTree.mainRoute);
		// Will keep the route and only apply commands
		if (this.oldRoutes.id !== mainRoute.routeId) {
			const mainCtrl = this.$powerUi.getRouteCtrl(this.oldRoutes.id);
			if (mainCtrl && mainCtrl.onBeforeClose) {
				routesToClose.push(mainCtrl);
			}
			for (const child of this.oldRoutes.mainChildRoutes) {
				const childCtrl = this.$powerUi.getRouteCtrl(child.id);
				if (childCtrl && childCtrl.onBeforeClose) {
					routesToClose.push(childCtrl);
				}
			}
		} else if (this.oldRoutes.mainChildRoutes.length) {
			// Only check chidren if not removing the role main route with it childrens
			// Build a list with the current childrens to compare with old childrens
			const currentChildrens = [];
			this.recursivelyGetChildrenRoutesToRunOnBeforeClose(currentRoutesTree.mainRoute.childRoute, currentChildrens);
			this.addRouteToRoutesToClose(routesToClose, this.oldRoutes.mainChildRoutes, currentChildrens);
		}

		// Secondary and secondary children routes
		const currentSecondaryRoutes = [];
		const currentSecondaryChildRoutes = [];
		for (const route of currentRoutesTree.secondaryRoutes) {
			const secRoute = this.matchRouteAndGetIdAndParamKeys(route);
			currentSecondaryRoutes.push(secRoute);
			if (secRoute.childRoute) {
				this.recursivelyGetChildrenRoutesToRunOnBeforeClose(secRoute.childRoute, currentSecondaryChildRoutes);
			}
		}
		this.addRouteToRoutesToClose(routesToClose, this.oldRoutes.secondaryRoutes, currentSecondaryRoutes);
		// Children
		if (this.oldRoutes.secondaryChildRoutes.length) {
			this.addRouteToRoutesToClose(routesToClose, this.oldRoutes.secondaryChildRoutes, currentSecondaryChildRoutes);
		}

		// Hidden and hidden children routes
		const currentHiddenRoutes = [];
		const currentHiddenChildRoutes = [];
		for (const route of currentRoutesTree.hiddenRoutes) {
			const hiddenRoute = this.matchRouteAndGetIdAndParamKeys(route);
			currentHiddenRoutes.push(hiddenRoute);
			if (hiddenRoute.childRoute) {
				this.recursivelyGetChildrenRoutesToRunOnBeforeClose(hiddenRoute.childRoute, currentHiddenChildRoutes);
			}
		}
		this.addRouteToRoutesToClose(routesToClose, this.oldRoutes.hiddenRoutes, currentHiddenRoutes);
		// Children
		if (this.oldRoutes.hiddenChildRoutes.length) {
			this.addRouteToRoutesToClose(routesToClose, this.oldRoutes.hiddenChildRoutes, currentHiddenChildRoutes);
		}

		return routesToClose;
	}

	buildOrderedRoutesToClose() {
		let propagateCommandsFromRouteId = false;
		// If root has pending commands forces all routes to refresh
		if (this.engineCommands.pending['$root']) {
			this.engineCommands.propagateCommand({
				currentRouteId: this.oldRoutes.id,
				sourceRouteId: '$root',
			});
			propagateCommandsFromRouteId = this.oldRoutes.id;
		}
		// Will keep the route and only apply commands
		const routeIsNew = (this.oldRoutes.id !== this.currentRoutes.id);
		const shouldUpdate = (routeIsNew === false && this.engineCommands.pending[this.oldRoutes.id] !== undefined);
		// Add the old main route if have one
		if (propagateCommandsFromRouteId || shouldUpdate || (this.oldRoutes.id && (this.oldRoutes.route !== this.currentRoutes.route))) {
			this.orderedRoutesToClose.unshift({
				routeId: this.oldRoutes.id,
				viewId: this.oldRoutes.viewId,
				params: this.oldRoutes.params,
				kind: 'main',
				parentRouteId: this.oldRoutes.parentRouteId,
				parentViewId: this.oldRoutes.parentViewId,
				powerViewNodeId: 'root-view',
				commands: this.engineCommands.buildRouteCloseCommands(
					this.oldRoutes.id, this.oldRoutes.viewId, shouldUpdate),
			});
		}
		// Add old child route from main route if have some
		this.markToRemoveRouteViews('mainChildRoutes', 'child', propagateCommandsFromRouteId);
		// Add old child route and secondary routes if have some
		this.markToRemoveRouteViews('secondaryChildRoutes', 'child', propagateCommandsFromRouteId);
		this.markToRemoveRouteViews('secondaryRoutes', 'secondary', propagateCommandsFromRouteId);
		// Add old child route from hidden routes if have some
		this.markToRemoveRouteViews('hiddenChildRoutes', 'child', propagateCommandsFromRouteId);
		this.markToRemoveRouteViews('hiddenRoutes', 'hidden', propagateCommandsFromRouteId);
	}

	markToRemoveRouteViews(routesListName, kind, propagateCommandsFromRouteId) {
		for (const old of this.oldRoutes[routesListName]) {
			const current = this.currentRoutes[routesListName].find(r=>r.id === old.id && r.viewId === old.viewId) || null;
			// Will keep the route and only apply commands
			const shouldUpdate = (current !== null && this.engineCommands.pending[old.id] !== undefined);
			if (propagateCommandsFromRouteId || shouldUpdate || !this.currentRoutes[routesListName].find(o=> o.route === old.route)) {
				this.orderedRoutesToClose.unshift({
					routeId: old.id,
					viewId: old.viewId,
					params: old.params,
					kind: kind,
					parentRouteId: old.parentRouteId,
					parentViewId: old.parentViewId,
					powerViewNodeId: this.routes[old.parentRouteId] ? this.routes[old.parentRouteId].powerViewNodeId : null,
					commands: this.engineCommands.buildRouteCloseCommands(old.id, old.viewId, shouldUpdate),
				});
			}
		}
	}

	getVewIdIfRouteExists(route, listName) {
		const oldRoute = this.oldRoutes[listName].find(r=>r && r.route === route);
		const newRoute = this.currentRoutes[listName].find(r=>r && r.route === route);
		if (!oldRoute && !newRoute) {
			return false;
		} else {
			return oldRoute ? oldRoute.viewId : newRoute.viewId;
		}
	}

	addNewViewNode(viewId, routeViewNodeId) {
		// Create a new element to this view and add it to secondary-view element (where all secondary views are)
		const newViewNode = document.createElement('div');
		newViewNode.id = viewId;
		newViewNode.classList.add('power-view');
		const viewNode = document.getElementById(routeViewNodeId);
		viewNode.appendChild(newViewNode);
	}

	loadViewInOrder(orderedRoutesToOpen, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToOpen[routeIndex];
		if (!route) {
			ctx.$powerUi.callInitViews();
			if (!ctx.config.phantomMode) {
				ctx.removeSpinnerAndShowContent('root-view');
			}
			return _resolve();
		}
		if (route.commands.addView) {
			if (route.kind === 'secondary' || route.kind === 'hidden') {
				ctx.addNewViewNode(route.viewId, ctx.config.routerSecondaryViewId);
			} else if (route.kind === 'child') {
				// Add the new node inside it's main route power-view node
				ctx.addNewViewNode(route.viewId, route.powerViewNodeId);
			}

			ctx.loadRoute({
				routeId: route.routeId,
				paramKeys: route.paramKeys,
				viewId: route.viewId,
				ctrl: ctx.routes[route.routeId].ctrl,
				title: ctx.routes[route.routeId].title,
				data: ctx.routes[route.routeId].data,
				loadViewInOrder: ctx.loadViewInOrder,
				orderedRoutesToOpen: orderedRoutesToOpen,
				routeIndex: routeIndex + 1,
				ctx: ctx,
				_resolve: _resolve,
			});
		} else {
			ctx.loadViewInOrder(orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
		}
	}

	matchRouteAndGetIdAndParamKeys(route) {
		let found = false;
		for (const routeId of Object.keys(this.routes || {})) {
			// Only run if not otherwise or if the otherwise have a template
			if (routeId !== 'otherwise') {
				// If the route have some parameters get it /some_page/:page_id/syfy/:title
				const paramKeys = this.getRouteParamKeys(this.routes[routeId].route);
				let regEx = this.buildRegExPatternToRoute(routeId, paramKeys);
				// our route logic is true,
				const checkRoute = this.config.rootPath + route.path;
				if (checkRoute.match(regEx)) {
					if (this.routes[routeId] && this.routes[routeId].title) {
						document.title = this.routes[routeId].title;
					}

					if (routeId !== 'otherwise') {
						found = {routeId: routeId, paramKeys: paramKeys, powerViewNodeId: this.routes[routeId].powerViewNodeId || null};
					}
					break;
				}
			}
		}

		return found;
	}

	removeCustomCssNode(viewId) {
		// Remove custom css of this view if exists
		const nodeCss = document.getElementById('_css' + viewId);

		if (nodeCss) {
			const head = nodeCss.parentNode;
			if (head) {
				head.removeChild(nodeCss);
			}
		}
	}

	loadRoute({routeId, paramKeys, viewId, ctrl, title, data, loadViewInOrder, orderedRoutesToOpen, routeIndex, ctx, _resolve}) {
		const _viewId = this.routes[routeId].viewId || viewId;
		// If have a template to load let's do it
		if (this.routes[routeId].template && !this.config.noRouterViews) {
			// If user defines a custom viewId to this route, but the router don't find it alert the user
			if (this.routes[routeId].viewId && !document.getElementById(this.routes[routeId].viewId)) {
				throw new Error(`You defined a custom viewId "${this.routes[routeId].viewId}" to the route "${this.routes[routeId].route}" but there is no element on DOM with that id.`);
			}
			if (this.routes[routeId].templateUrl && this.routes[routeId].templateIsCached !== true) {
				this.$powerUi.loadTemplateUrl({
					template: this.routes[routeId].template,
					viewId: _viewId,
					currentRoutes: this.currentRoutes,
					routeId: routeId,
					routes: this.routes,
					title: title,
					loadViewInOrder: loadViewInOrder,
					orderedRoutesToOpen: orderedRoutesToOpen,
					routeIndex: routeIndex,
					ctx: ctx,
					_resolve: _resolve,
				});
			} else if (this.routes[routeId].templateComponent) {
				this.$powerUi.loadTemplateComponent({
					template: this.routes[routeId].templateComponent,//this.routes[routeId].template,
					viewId: _viewId,
					currentRoutes: this.currentRoutes,
					routeId: routeId,
					routes: this.routes,
					title: title,
					$ctrl: this.$powerUi.controllers[_viewId].instance,
					loadViewInOrder: loadViewInOrder,
					orderedRoutesToOpen: orderedRoutesToOpen,
					routeIndex: routeIndex,
					ctx: ctx,
					_resolve: _resolve,
				});
			} else {
				// If users dynamicUrl set the current url as template
				if (this.routes[routeId].dynamicUrl === true) {
					const tmpCtrl = this.$powerUi.getViewCtrl(_viewId);
					if (!tmpCtrl.getDynamicUrl) {
						throw `The "${routeId}" route controller is missing the "getDynamicUrl" method to return the current URL.`;
						return;
					}
					this.routes[routeId].template = tmpCtrl.getDynamicUrl();
				}
				this.$powerUi.loadTemplate({
					template: this.routes[routeId].template,
					viewId: _viewId,
					currentRoutes: this.currentRoutes,
					routeId: routeId,
					routes: this.routes,
					title: title,
					loadViewInOrder: loadViewInOrder,
					orderedRoutesToOpen: orderedRoutesToOpen,
					routeIndex: routeIndex,
					ctx: ctx,
					_resolve: _resolve,
				});
			}
		}
	}

	routeKind(routeId) {
		return this.routes[routeId].hidden ? 'hr' : 'sr';
	}

	buildNewHash(oldHash, fragment) {
		const splitedChild = fragment.split('&ch=');
		const splitedOld = oldHash.split('?');
		const splitedFragment = fragment.split('?');
		// If the fragment is already in old hash do not change it
		if (splitedOld.includes(splitedFragment[1])) {
			return oldHash;
		} else if (splitedChild.length > 1 && oldHash.includes(splitedChild[0])) {
			// Secondary or hidden route with a new child must be replaced
			const newEntry = splitedChild[0].split('?')[1];
			let index = 0;
			for (const item of splitedOld) {
				const oldMain = item.split('&ch=')[0];
				if (oldMain === newEntry) {
					splitedOld[index] = splitedFragment[1];
					return splitedOld.join('?');
				}
				index = index + 1;
			}
		} else {
			return oldHash + fragment;
		}
	}

	closePhantomRoute(routeId, ctx) {
		this.phantomRouter.closePhantomRoute(routeId, ctx);
	}

	openRoute({routeId, params, target, currentRouteId, currentViewId, title, data, commands}) {
		const routeKind = this.routeKind(routeId);
		// Only hidden route can open a second router (This is for dialog messages only)
		if (this.engineIsRunning && routeKind === 'hr') {
			const routes = [this.routes[routeId]];
			const newRouter = new PhantomRouter({rootPath: window.location.hash, routes: routes, phantomMode: true}, this.$powerUi);
			this.phantomRouter = newRouter;
			newRouter.openRoute({routeId, params, target, currentRouteId, currentViewId, title, data, commands});
			return;
		} else if (this.engineIsRunning && routeKind !== 'hr') {
			const self = this;
			this.onCycleEnds.subscribe(function () {
				self.openRoute({routeId, params, target, currentRouteId, currentViewId, title, data, commands});
			});
		}


		const paramKeys = this.getRouteParamKeysWithoutDots(this.routes[routeId].route);
		if (paramKeys) {
			for (const key of paramKeys) {
				if (!params || params[key] === undefined) {
					throw `The parameter "${key}" of route "${routeId}" is missing!`;
				}
			}
		}

		if (this.routeNotExists({routeId, params})) {
			return;
		} else {
			// Close the current view and open the route in a new secondary view
			if (target === '_self') {
				const selfRoute = this.getOpenedRoute({routeId: currentRouteId, viewId: currentViewId});
				const oldHash = this.getOpenedSecondaryOrHiddenRoutesHash({filter: [selfRoute.route]});
				const fragment = `?${routeKind}=${this.buildHash({routeId, params, paramKeys})}`;
				const newRoute = this.buildNewHash(oldHash, fragment);
				this.navigate({hash: newRoute, title: title, data: data, commands: commands, routeId: routeId});
			// Open the route in a new secondary view without closing any view
			} else if (target === '_blank') {
				const oldHash = this.getOpenedSecondaryOrHiddenRoutesHash({});
				const fragment = `?${routeKind}=${this.buildHash({routeId, params, paramKeys})}`;
				const newRoute = this.buildNewHash(oldHash, fragment);
				this.navigate({hash: newRoute, title: title, data: data, commands: commands, routeId: routeId});
			// Close all secondary views and open the route in the main view
			} else {
				if (target === '_single') {
					this.navigate({hash: this.buildHash({routeId, params, paramKeys}), title: title, isMainView: true, data: data, commands: commands, routeId: routeId});
				} else {
					const oldHash = this.getOpenedSecondaryRoutesHash();
					const newRoute = this.buildHash({routeId, params, paramKeys}) + oldHash;
					this.navigate({hash: newRoute, title: title, isMainView: true, data: data, commands: commands, routeId: routeId});
				}
			}
		}
	}

	// Get the hash definition of current secondary and hidden routes
	getOpenedSecondaryOrHiddenRoutesHash({filter=[]}) {
		const routeParts = this.extractRouteParts(this.locationHashWithHiddenRoutes());
		let oldHash = routeParts.path.replace(this.config.rootPath, '');
		for (let route of routeParts.secondaryRoutes.concat(routeParts.hiddenRoutes)) {
			const routeKind = routeParts.hiddenRoutes.includes(route) ? 'hr' : 'sr';
			route = route.replace(this.config.rootPath, '');
			if (filter.lenght === 0 || !filter.includes(route)) {
				oldHash = oldHash + `?${routeKind}=${route}`;
			}
		}
		return oldHash;
	}

	// Get the hash definition of current secondary and hidden routes
	getOpenedSecondaryRoutesHash() {
		const routeParts = this.extractRouteParts(window.location.hash);
		let oldHash = '';
		for (let route of routeParts.secondaryRoutes) {
			route = route.replace(this.config.rootPath, '');
			oldHash = oldHash + `?sr=${route}`;
		}
		return oldHash;
	}

	navigate({hash, title, isMainView, data={}, commands=[], routeId=null}) {
		const newHashParts = this.extractRouteParts(hash);
		let newHash = newHashParts.path || '';
		let newHiddenHash = '';
		for (const part of newHashParts.secondaryRoutes) {
			newHash = `${newHash}?sr=${part.replace(this.config.rootPath, '')}`;
		}
		for (const part of newHashParts.hiddenRoutes) {
			newHiddenHash = `${newHiddenHash}?hr=${part.replace(this.config.rootPath, '')}`;
		}

		const newLoacationHash = encodeURI(this.config.rootPath + newHash);
		// If route has change
		if ((newLoacationHash + encodeURI(newHiddenHash) || '') !== this.locationHashWithHiddenRoutes()) {
			this.hiddenLocationHash = encodeURI(newHiddenHash);
			// Pass data to new route and add pending commands before navigate
			if (routeId) {
				this.routeData[routeId] = data;
			}
			if (commands.length) {
				this.engineCommands.addCommands(commands);
			}

			// If there is some new secondary or main route
			if (window.location.hash !== newLoacationHash) {
				window.history.pushState(null, title, window.location.href);
				window.location.replace(encodeURI(this.config.rootPath) + encodeURI(newHash));
				if (isMainView){
					window.scrollTo(0, 0);
				}
			} else {
				// If there is only a new hidden rote
				// Only the hiddenLocationHash change, manually call hasChange
				this.hashChange();
			}
		}
	}

	buildHash({routeId, params, paramKeys}) {
		let route = this.routes[routeId].route.slice(3, this.routes[routeId].length);
		if (params && paramKeys.length) {
			for (const key of paramKeys) {
				if (params[key] !== undefined) {
					route = route.replace(`:${key}`, params[key]);
				}
			}
		}
		// If it's a child view recursively get the main view route
		if (this.routes[routeId].mainRouteId) {
			route = `${this.buildHash({routeId: this.routes[routeId].mainRouteId, params: params, paramKeys: paramKeys})}&ch=${route}`;
		}
		return route;
	}

	routeNotExists({routeId, params}) {
		let exists = false;
		// Test the main route
		if (routeId === this.currentRoutes.id) {
			if (!params) {
				return true;
			}
			let keyValueExists = false;
			for (const targetParamKey of Object.keys(params || {})) {
				for (const currentParam of this.currentRoutes.params) {
					if (targetParamKey === currentParam.key && params[targetParamKey] === currentParam.value) {
						keyValueExists = true;
					}
				}

				exists = keyValueExists;
				keyValueExists = false; // reset the flag to false
			}

			if (exists) {
				return true;
			}
		}

		// Test the secondary and hidden routes
		for (const sroute of this.currentRoutes.secondaryRoutes.concat(this.currentRoutes.hiddenRoutes)) {
			if (routeId === sroute.id) {
				let keyValueExists = false;
				for (const targetParamKey of Object.keys(params || {})) {
					for (const currentParam of sroute.params) {
						if (targetParamKey === currentParam.key && params[targetParamKey] === currentParam.value) {
							keyValueExists = true;
						}
					}

					exists = keyValueExists;
					keyValueExists = false; // reset the flag to false
				}
			}
		}
		return exists;
	}

	setMainRouteState({routeId, paramKeys, route, viewId, title, data, parentRouteId, parentViewId}) {
		// Register current route id
		this.currentRoutes.id = routeId;
		this.currentRoutes.route = route.replace(this.config.rootPath, ''); // remove #!/
		this.currentRoutes.viewId = this.routes[routeId].viewId || viewId;
		this.currentRoutes.isMainView = true;
		this.currentRoutes.kind = 'main';
		this.currentRoutes.title = title;
		this.currentRoutes.data = data;
		this.currentRoutes.parentRouteId = parentRouteId;
		this.currentRoutes.parentViewId = parentViewId;
		// Register current route parameters keys and values
		if (paramKeys) {
			this.currentRoutes.params = this.getRouteParamValues({routeId: routeId, paramKeys: paramKeys, route: route});
		} else {
			this.currentRoutes.params = [];
		}
	}
	setOtherRouteState({routeId, paramKeys, route, viewId, title, data, parentRouteId, parentViewId, kind}) {
		const newRoute = {
			title: title,
			isMainView: false,
			params: [],
			id: '',
			route: route.replace(this.config.rootPath, ''), // remove #!/
			viewId: this.routes[routeId].viewId || viewId,
			data: data || null,
			parentRouteId: parentRouteId,
			parentViewId: parentViewId,
			kind: kind,
		};
		// Register current route id
		newRoute.id = routeId;
		// Register current route parameters keys and values
		if (paramKeys) {
			newRoute.params = this.getRouteParamValues({routeId: routeId, paramKeys: paramKeys, route: route});
		}
		return newRoute;
	}
	setSecondaryRouteState(params) {
		this.currentRoutes.secondaryRoutes.push(
			this.setOtherRouteState(params));
	}
	setHiddenRouteState(params) {
		this.currentRoutes.hiddenRoutes.push(
			this.setOtherRouteState(params));
	}
	setChildRouteState(params) {
		if (params.mainKind === 'main') {
			this.currentRoutes.mainChildRoutes.push(
				this.setOtherRouteState(params));
		} else if (params.mainKind === 'secondary') {
			this.currentRoutes.secondaryChildRoutes.push(
				this.setOtherRouteState(params));
		} else {
			this.currentRoutes.hiddenChildRoutes.push(
				this.setOtherRouteState(params));
		}
	}

	extractRouteParts(path) {
		const routeParts = {
			path: path,
			secondaryRoutes: [],
			hiddenRoutes: [],
		};
		if (path.includes('?')) {
			const splited = path.split('?');
			routeParts.path = splited[0];
			for (const part of splited) {
				if (part.includes('sr=')) {
					for (const fragment of part.split('sr=')) {
						if (fragment) {
							routeParts.secondaryRoutes.push(this.config.rootPath + fragment);
						}
					}
				} else	if (part.includes('hr=')) {
					for (const fragment of part.split('hr=')) {
						if (fragment) {
							routeParts.hiddenRoutes.push(this.config.rootPath + fragment);
						}
					}
				}
			}
		}
		return routeParts;
	}

	buildRegExPatternToRoute(routeId, paramKeys) {
		// This regular expression below avoid detect /some_page_2 and /some_page as the same route
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
				// allow all [^]*
				newRegEx = newRegEx.replace(key, '[^]*');
			}
			regEx = new RegExp(newRegEx);
		}
		return regEx;
	}

	getRoute({routeId}) {
		return this.routes[routeId];
	}

	getOpenedRoute({routeId, viewId}) {
		return this.getRouteOnList({
			routeId: routeId,
			viewId: viewId,
			listName: 'currentRoutes',
		});
	}

	getOldRoute({routeId, viewId}) {
		return this.getRouteOnList({
			routeId: routeId,
			viewId: viewId,
			listName: 'oldRoutes',
		});
	}

	getRouteOnList({routeId, viewId, listName}) {
		if (this[listName].id === routeId && this[listName].viewId) {
			return this[listName];
		} else {
			for (const route of this[listName].mainChildRoutes) {
				if (route.id === routeId && route.viewId === viewId) {
					return route;
				}
			}
			for (const route of this[listName].secondaryRoutes) {
				if (route.id === routeId && route.viewId === viewId) {
					return route;
				}
			}
			for (const route of this[listName].secondaryChildRoutes) {
				if (route.id === routeId && route.viewId === viewId) {
					return route;
				}
			}
			for (const route of this[listName].hiddenRoutes) {
				if (route.id === routeId && route.viewId === viewId) {
					return route;
				}
			}
			for (const route of this[listName].hiddenChildRoutes) {
				if (route.id === routeId && route.viewId === viewId) {
					return route;
				}
			}
			return null;
		}
	}

	getRouteParamKeys(route) {
		const regex = new RegExp(/:[^\s/]+/g);
		return route.match(regex);
	}

	getRouteParamKeysWithoutDots(route) {
		const keys = [];
		for (const key of this.getRouteParamKeys(route) || []) {
			keys.push(key.substring(1));
		}
		return keys;
	}

	getRouteParamValues({routeId, paramKeys, route}) {
		const routeParts = this.routes[routeId].route.split('/').filter(item=> item !== '#!');
		const hashParts = (route || this.locationHashWithHiddenRoutes() || this.config.rootPath).split('?')[0].split('/');
		const params = [];
		for (const key of paramKeys) {
			// Get key and value
			if (this.routes[routeId].route.includes(routeParts[0])) {
				params.push({key: key.substring(1), value: hashParts[routeParts.indexOf(key)]});
			}
		}
		return params;
	}

	getParamValue(key) {
		const param = this.currentRoutes.params.find(p => p.key === key);
		return (param && param.value !== undefined) ? param.value : null;
	}
}


class PhantomRouter extends Router {
	openRoute({routeId, params, target, currentRouteId, currentViewId, title}) {
		this.ready = new UEvent('phantomRouter');
		const newRoute = {
			routeId: routeId,
			title: title,
			isMainView: false,
			kind: 'hidden',
			params: params,
			id: routeId,
			route: routeId, // the route and routeId is the same
			viewId: _Unique.domID('view'),
			data: null,
		};
		const route = this.setOtherRouteState(newRoute);
		this.currentRoutes.hiddenRoutes = [];
		this.currentRoutes.hiddenRoutes.push(route);
		this.routes[routeId].viewId = newRoute.viewId;

		const openCommands = this.engineCommands.buildRouteOpenCommands(routeId, newRoute.viewId, false);
		const closeCommands = this.engineCommands.buildRouteCloseCommands(routeId, newRoute.viewId, false);
		const commands = Object.assign(openCommands, closeCommands);
		delete commands.parentView;
		delete commands.rootView;
		// Add route to ordered list
		const $fakeRoot = {
			routeId: routeId,
			viewId: newRoute.viewId,
			paramKeys: '',
			kind: 'hidden',
			parentRouteId: null,
			parentViewId: null,
			commands: commands,
		};
		this.engine($fakeRoot);
	}

	closePhantomRoute(routeId, ctx) {
		const currentRoute = this.routes[routeId];
		this.oldRoutes.hiddenRoutes.push(currentRoute);
		this.engine();
		this.ready.broadcast();
	}
}

class PowerTemplate extends PowerScope {
	constructor({$powerUi, viewId, routeId, $ctrl}) {
		super({$powerUi: $powerUi});
		this._viewId = viewId;
		this._routeId = routeId;
		this.$ctrl = $ctrl;
		this.$routeClassList = {};

		if (this.css) {
			const self = this;
			const css = new Promise(this.css.bind(this));
			css.then(function (response) {
				self.appendCss(response);
			}).catch(function (response) {
				window.console.log('Error loading css', response);
			});
		}

		return {template: this._template(), component: this};
	}

	_template() {
		return new Promise(this.template.bind(this));
	}

	_replaceHtmlForEdit(response, fileName, self, isJson=false) {
		if (!this.$powerUi.devMode.isEditable || !this.$powerUi.devMode.child || !self.$ctrl._$createEditableHtml) {
			return response;
		}
		const result = self.$ctrl._$createEditableHtml(response, fileName, self._routeId, isJson);
		return (result && result.body) ? result.body.innerHTML : response;
	}

	_import(filePath) {
		const self = this;
		return new Promise(function (resolve, reject) {
			self.$powerUi.request({
					url: filePath,
					body: {},
					method: 'GET',
					status: 'Loading file',
			}).then(function (response) {
				let content = '';
				if (self.$powerUi.devMode && self.$powerUi.devMode.child && self.$powerUi.devMode.isEditable) {
					let fileExt = false;
					let template = '';
					const parts = filePath.split('/');
					const fileName = parts[parts.length - 1];

					if (filePath.slice(-4) === '.css') {
						fileExt = '.css';
						content = response;
					} else if (filePath.slice(-5) === '.json') {
						fileExt = '.json';
						content = response;
						const selector = response.$selector || null;
						if (selector) {
							const html = self.$service('JSONSchema')[selector](response, selector);
							template = self._replaceHtmlForEdit(html, fileName, self, response);
						}
					} else if (filePath.slice(-4) === '.htm') {
						fileExt = '.htm';
						content = self._replaceHtmlForEdit(response, fileName, self);
					} else if (filePath.slice(-5) === '.html') {
						fileExt = '.html';
						content = self._replaceHtmlForEdit(response, fileName, self);
					}

					self.$ctrl._$postToMain({
						command: 'loadFile',
						extension: fileExt || null,
						path: filePath,
						content: content,
						template: template,
						viewId: self._viewId,
						routeId: self._routeId,
						fileName: fileName,
					});

					resolve(template || content);
				} else {
					if (filePath.slice(-5) === '.json' && response.$selector) {
						content = self.$service('JSONSchema')[response.$selector](response);
						resolve(content);
					} else {
						resolve(response);
					}
				}
			}).catch(function (error) {
				window.console.log('Error importing file:', error);
				reject(error);
			});
		});
	}

	import(filePaths, concat) {
		if (typeof filePaths === 'string' || filePaths instanceof String) {
			return this._import(filePaths);
		} else if (filePaths.length) {
			const promises = [];
			for (const path of filePaths) {
				promises.push(this._import(path));
			}

			if (!concat) {
				return Promise.all(promises);
			} else {
				return new Promise(function (resolve, reject) {
					Promise.all(promises).then(function (response) {
						try {
							let result = '';
							for (const file of response) {
								if (concat === true) {
									result = result + file;
								} else {
									result = result + concat + file;
								}
							}
							resolve(result);
						} catch(error) {
							window.console.log('Error importing files:', error);
							reject(error);
						}
					});
				});
			}
		} else {
			throw "Error: import expects a string or array";
		}
	}

	request(options) {
		const self = this;
		const promise = new Promise(function (resolve, reject) {
			self.$powerUi.request(options).then(function(response) {
				resolve(response);
			}).catch(function (error) {
				reject(error);
			});
		});
		return promise;
	}

	appendCss(css) {
		// Concatenate if is an array
		if (css.length) {
			let _new = '';
			for (const _css of css) {
				_new = _new + _css;
			}
			css = _new;
		}
		const head = document.getElementsByTagName('head')[0];
		let style = document.createElement('style');
		style.innerHTML = css;
		style.id = '_css' + this._viewId;
		head.appendChild(style);
	}
}

export { PowerTemplate };

class PowerInterpolation {
	constructor(config={}, powerUi) {
		this.config = config;
		this.$powerUi = powerUi;
		this.startSymbol = config.interpolateStartSymbol || '{{';
		this.endSymbol = config.interpolateEndSymbol || '}}';
	}

	compile({template, scope, view}) {
		if (!scope && view) {
			// The scope controller of the view of this element
			scope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;
		}
		// console.log('COMPILE', scope);
		if (template.includes('power-view')) {
			const tmp = document.createElement("div");
			tmp.innerHTML = template;
			this.interpolateInOrder(tmp);
			template = tmp.innerHTML;
		}
		return this.replaceInterpolation(template, scope);
	}
	// Interpolate views and root scope in the right order
	interpolateInOrder(node) {
		const powerViews = node ? node.getElementsByClassName('power-view') : document.getElementsByClassName('power-view');
		// Interpolate using view controller scope
		let index = powerViews.length - 1;
		while (index >= 0) {
			const view = powerViews[index];
			if (this.$powerUi.controllers[view.id] && this.$powerUi.controllers[view.id].instance) {
				const scope = this.$powerUi.controllers[view.id].instance;
				view.innerHTML = this.replaceInterpolation(view.innerHTML, scope);
			}
			index = index - 1;
		}
	}
	// Add the {{ }} to pow interpolation values
	getDatasetResult(template, scope) {
		return this.compile({template: `${this.startSymbol} ${this.decodeHtml(template)} ${this.endSymbol}`, scope: scope});
	}
	// REGEX {{[^]*?}} INTERPOLETE THIS {{ }}
	standardRegex() {
		const REGEX = `${this.startSymbol}[^]*?${this.endSymbol}`;
		return new RegExp(REGEX, 'gm');
	}

	replaceInterpolation(template, scope) {
		template = this.stripWhiteChars(template);
		const templateWithoutComments = template.replace(/<!--[\s\S]*?-->/gm, '');
		const match = templateWithoutComments.match(this.standardRegex());
		if (match) {
			for (const entry of match) {
				const value = this.getInterpolationValue(entry, scope);
				template = template.replace(entry, value);
			}
		}
		return template.trim();
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

	// Arbitrary replace a value with another (so dont look for it on scope)
	replaceWith({entry, oldValue, newValue}) {
		const regexOldValue = new RegExp(oldValue, 'gm');

		const match = entry.match(this.standardRegex());
		if (match) {
			for (const item of match) {
				let newItem = '';
				// Only replace the first element of a dict
				if (item.includes('.')) {
					const parts = item.split('.');
					parts[0] = parts[0].replace(regexOldValue, newValue);
					newItem = parts.join('.');
				} else {
					newItem = item.replace(regexOldValue, newValue);
				}
				entry = entry.replace(item, newItem);
			}
		}
		entry = this.replaceIdsAndRemoveInterpolationSymbol({
			entry: entry,
			regexOldValue: regexOldValue,
			newValue: newValue
		});
		return entry;
	}

	replaceIdsAndRemoveInterpolationSymbol({entry, regexOldValue, newValue}) {
		const tmp = document.createElement('div');
		tmp.innerHTML = entry;
		for (const child of tmp.children) {
			for (const attr of child.attributes) {
				if (attr.name.includes('data-pow') || attr.name.includes('data-pwc')) {
					// Only replace the first element of a dict
					if (attr.value.includes('.')) {
						const parts = attr.value.split('.');
						parts[0] = parts[0].replace(regexOldValue, newValue);
						attr.value = parts.join('.');
					} else {
						attr.value = attr.value.replace(regexOldValue, newValue);
					}
				} else if (child.hasAttribute("data-pow-event") && attr.name.includes('on') && !attr.name.includes('data')) {
					// Only replace the first element of a dict
					if (attr.value.includes('.')) {
						const parts = attr.value.split('.');
						parts[0] = parts[0].replace(regexOldValue, newValue);
						attr.value = parts.join('.');
					} else {
						attr.value = attr.value.replace(regexOldValue, newValue);
					}
				}
			}
			if (child.id) {
				// Evaluate and remove interpolation symbol from id
				child.id = this.replaceInterpolation(child.id, this.$powerUi);
			}
			if (child.children.length) {
				child.innerHTML = this.replaceIdsAndRemoveInterpolationSymbol({
					entry: child.innerHTML,
					regexOldValue: regexOldValue,
					newValue: newValue,
				});
			}
		}
		return tmp.innerHTML;
	}

	getInterpolationValue(entry, scope) {
		let newEntry = this.stripWhiteChars(entry);
		newEntry = this.stripInterpolation(newEntry);
		return this.encodeHtml(this.safeEvaluate(newEntry, scope));
	}

	safeEvaluate(entry, scope) {
		let result;
		try {
			result = this.$powerUi.safeEval({text: entry, scope: scope, $powerUi: this.$powerUi});
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

	encodeHtml(html) {
	  const element = document.createElement('div');
	  element.innerText = element.textContent = html;
	  html = element.innerHTML;
	  return html;
	}

	decodeHtml(html) {
	    const element = document.createElement('textarea');
	    element.innerHTML = html;
	    return element.value;
	}
}

class PowerView extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);
		this.isView = true;
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-view', isMain: true});

class SyntaxTree {
	constructor({counter}) {
		this.currentPriority = 0;
		this.nodes = [];
		this.tokensListener = new TokensListener({counter: counter, syntaxTree: this});
		this.validAfter = {
			variable: this.variableValidation,
			string: this.stringValidation,
			parentheses: this.parenthesesValidation,
			dot: this.dotValidation,
			integer: this.numberValidation,
			float: this.numberValidation,
			operator: this.operationValidation,
			equal: this.equalityValidation,
			'NOT-equal': this.equalityValidation,
			'greater-than': this.equalityValidation,
			'minor-than': this.equalityValidation,
			'minor-or-equal': this.equalityValidation,
			'greater-or-equal': this.equalityValidation,
			object: this.objectValidation,
			function: this.objectValidation,
			anonymousFunc: this.objectValidation,
			dictNode: this.objectValidation,
			comma: this.commaValidation,
			AND: this.orAndNotValidation,
			OR: this.orAndNotValidation,
			NOT: this.orAndNotValidation,
			'NOT-NOT': this.orAndNotValidation,
			'short-hand': this.shortHandValidation,
			'dictDefinition': ()=> true, // TODO create dictDefinition validation
			'arrayDefinition': ()=> true, // TODO create arrayDefinition validation
		}
		// console.log('this.node', this.nodes);
	}

	buildTreeLeaf(isParameter) {
		this.tree = this.checkAndPrioritizeSyntax({nodes: this.nodes, isParameter: isParameter});

		// if (!isParameter) {
			// console.log('nodes', this.nodes);
			// console.log('TREE:', this.tree);
		// }
	}

	shortHandValidation({currentNode, isParameter}) {
		if (currentNode.condition[0] && currentNode.condition[0].expression_nodes && !currentNode.condition[0].expression_nodes.length) {
			return false;
		} else if (currentNode.if[0] && currentNode.if[0].expression_nodes && !currentNode.if[0].expression_nodes.length) {
			return false;
		} else if (currentNode.else[0] && currentNode.else[0].expression_nodes && !currentNode.else[0].expression_nodes.length) {
			return false;
		} else {
			return true;
		}
	}

	firstNodeValidation({node, isParameter}) {
		if (['dot', 'anonymousFunc',
			'AND', 'OR', 'NOT-equal',
			'minor-or-equal', 'greater-or-equal',
			'equal', 'minor-than', 'greater-than'].includes(node.syntax)) {
			return false;
		} else if (node.syntax === 'operator' && (node.label !== '+' && node.label !== '-')) {
			return false;
		} else {
			return true;
		}
	}

	orAndNotValidation({nextNode, isParameter}) {
		if (['string', 'variable', 'integer', 'object',
			'float', 'dictNode', 'parentheses',
			'NOT', 'NOT-NOT', 'function'].includes(nextNode.syntax)) {
			return true;
		} else if (nextNode.syntax === 'operator' && (nextNode.label === '+' || nextNode.label === '-')) {
			return true;
		} else {
			return false;
		}
	}

	commaValidation({nextNode, isParameter}) {
		if (['string', 'variable', 'integer', 'object',
			'float', 'dictNode', 'parentheses', 'arrayDefinition', 'dictDefinition',
			'NOT', 'NOT-NOT', 'comma', 'function', 'end'].includes(nextNode.syntax)) {
			return true;
		} else if (nextNode.syntax === 'operator' && (nextNode.label === '+' || nextNode.label === '-')) {
			return true;
		} else {
			return false;
		}
	}

	// Functions and dictionaries
	objectValidation({nextNode, isParameter}) {
		if (['operator', 'anonymousFunc', 'short-hand',
			'NOT-equal', 'equal', 'minor-than', 'greater-than',
			'minor-or-equal', 'greater-or-equal',
			'dot', 'AND', 'OR', 'dictNode', 'end'].includes(nextNode.syntax) || (nextNode.syntax === 'comma' && isParameter)) {
			return true;
		} else {
			return false;
		}
	}

	equalityValidation({nextNode, currentNode, isParameter}) {
		if (['variable', 'parentheses', 'function', 'arrayDefinition', 'dictDefinition',
			'float', 'integer', 'dictNode', 'object',
			'NOT', 'NOT-NOT', 'string'].includes(nextNode.syntax)) {
			return true;
		} else if (nextNode.syntax === 'string' && currentNode.label === '+') {
			return true;
		} else if (nextNode.syntax === 'operator' && (nextNode.label === '+' || nextNode.label === '-')) {
			return true;
		} else {
			return false;
		}
	}

	operationValidation({nextNode, currentNode, isParameter}) {
		if (['NOT', 'NOT-NOT', 'float', 'object',
			'integer', 'variable', 'dictNode', 'arrayDefinition', 'dictDefinition',
			'parentheses', 'function'].includes(nextNode.syntax)) {
			return true;
		} else if (nextNode.syntax === 'string' && currentNode.label === '+') {
			return true;
		} else if (nextNode.syntax === 'operator' && (nextNode.label === '+' || nextNode.label === '-')) {
			return true;
		} else {
			return false;
		}
	}

	variableValidation({nextNode, isParameter}) {
		if (['dot', 'operator', 'NOT-equal',
			'equal', 'minor-than', 'greater-than',
			'minor-or-equal', 'greater-or-equal',
			'AND', 'OR' , 'short-hand', 'end'].includes(nextNode.syntax) || (nextNode.syntax === 'comma' && isParameter)) {
			return true;
		} else {
			return false;
		}
	}

	numberValidation({nextNode, isParameter}) {
		if (['operator', 'NOT-equal', 'equal',
			'minor-than', 'greater-than', 'AND',
			'minor-or-equal', 'greater-or-equal',
			'OR' , 'short-hand', 'end'].includes(nextNode.syntax) || (nextNode.syntax === 'comma' && isParameter)) {
			return true;
		} else {
			return false;
		}
	}

	stringValidation({nextNode, isParameter}) {
		if (['NOT', 'NOT-NOT', 'string', 'variable',
			'dictNode', 'function', 'parentheses', 'arrayDefinition', 'dictDefinition',
			'integer', 'float', 'especial', 'anonymousFunc',
			'dot', 'dictNode'].includes(nextNode.syntax)) {
			return false;
		} else if (nextNode.syntax === 'comma' && isParameter) {
			return true;
		} else {
			return true;
		}
	}

	parenthesesValidation({nextNode, isParameter}) {
		if (['anonymousFunc', 'dot', 'operator',
			'short-hand', 'NOT-equal', 'equal',
			'minor-or-equal', 'greater-or-equal',
			'minor-than', 'greater-than', 'AND',
			'OR' , 'short-hand', 'end'].includes(nextNode.syntax) || (nextNode.syntax === 'comma' && isParameter)) {
			return true;
		} else {
			return false;
		}
	}

	dotValidation({nextNode, isParameter}) {
		if (['function', 'variable', 'dictNode'].includes(nextNode.syntax)) {
			return true;
		} else {
			return false;
		}
	}

	// Return true if the next node is valid after a given syntax
	isNextValidAfterCurrent({currentNode, nextNode, isParameter}) {
		// console.log('currentNode, nextNode, isParameter', currentNode, nextNode, isParameter);
		// return true;
		return this.validAfter[currentNode.syntax] ? this.validAfter[currentNode.syntax]({
			currentNode: currentNode,
			nextNode: nextNode,
			isParameter: isParameter
		}) : false;
	}

	checkAndPrioritizeSyntax({nodes, isParameter}) {
		let current_expression_nodes = [];
		let priority_nodes = [];
		let expression_groups = [];
		let doubleOperator = false;

		nodes = this.filterNodesAndUnifyObjects(nodes);
		nodes.push({syntax: 'end'});

		if (!nodes.length) {
			return [];
		}

		let index = 0;
		const nodesLastIndex = nodes.length - 1;
		let isValid = true;

		// Validade the first node
		isValid = this.firstNodeValidation({node: this.getCurrentNode({index: 0, nodes})});

		if (isValid === false) {
			throw `PowerUI template invalid syntax: "${nodes[0].label}" starting the expression.`;
		}

		while (index <= nodesLastIndex && isValid) {
			const currentNode = this.getCurrentNode({index: index, nodes});
			isValid = this.isNextValidAfterCurrent({
				currentNode: currentNode,
				nextNode: this.getNextNode({index: index, nodes}),
				isParameter: isParameter,
			});

			if (isValid === false && currentNode.syntax !== 'end') {
				throw `PowerUI template invalid syntax: "${currentNode.label}".`;
			}

			const result = this.createExpressionGroups({
				index: index,
				currentNode: currentNode,
				previousNode: this.getPreviousNode({index: index, nodes}),
				nextNode: this.getNextNode({index: index, nodes}),
				current_expression_nodes: current_expression_nodes,
				priority_nodes: priority_nodes,
				expression_groups: expression_groups,
				doubleOperator: doubleOperator,
			});

			priority_nodes = result.priority_nodes;
			current_expression_nodes = result.current_expression_nodes;
			expression_groups = result.expression_groups;
			doubleOperator = result.doubleOperator;

			index = index + 1;
		}

		expression_groups = this.prioritizeExpressionGroups({priority: 'equality', expression_groups: expression_groups});
		expression_groups = this.prioritizeExpressionGroups({priority: 'AND', expression_groups: expression_groups});

		// Remove the last node (end syntax)
		expression_groups.pop();

		return expression_groups;
	}

	createExpressionGroups({index, currentNode, previousNode, nextNode, current_expression_nodes, priority_nodes, expression_groups, doubleOperator}) {
		// Simple expressions
		if (currentNode.syntax === 'operator' && index === 0) {
			priority_nodes.push(currentNode);
			doubleOperator = true;
		} else if (currentNode.syntax === 'operator' && previousNode.syntax === 'operator') {
			priority_nodes.push(currentNode);
			doubleOperator = true;
		} else if (['integer', 'float', 'string', 'variable', 'parentheses', 'object', 'short-hand', 'dictDefinition', 'arrayDefinition'].includes(currentNode.syntax)) {
			if (nextNode.syntax === 'operator' && (nextNode.label !== '+' && nextNode.label !== '-') ||
				previousNode.syntax === 'operator' && (previousNode.label !== '+' && previousNode.label !== '-')) {
				priority_nodes.push(currentNode);
			} else if (doubleOperator) {
				priority_nodes.push(currentNode);
				doubleOperator = false;
			} else {
				current_expression_nodes.push(currentNode);
			}
		} else if (currentNode.syntax === 'operator') {
			if (currentNode.label !== '+' && currentNode.label !== '-') {
				priority_nodes.push(currentNode);
			} else {
				if (priority_nodes.length) {
					current_expression_nodes.push({priority: priority_nodes});
					priority_nodes = [];
				}
				current_expression_nodes.push(currentNode);
			}
		}
		// equality expression / logic OR/AND expressions
		if (['NOT-equal', 'equal', 'greater-than', 'minor-than', 'minor-or-equal', 'greater-or-equal', 'OR', 'AND', 'end'].includes(currentNode.syntax)) {
			const KIND = ['OR', 'AND'].includes(currentNode.syntax) ? currentNode.syntax : 'equality';
			if (priority_nodes.length) {
				current_expression_nodes.push({priority: priority_nodes});
				priority_nodes = [];
			}

			const expression = {kind: 'expression', expression_nodes: current_expression_nodes};
			expression_groups.push(expression);
			current_expression_nodes = [];
			currentNode.kind = currentNode.syntax === 'end' ? 'end' : KIND;
			expression_groups.push(currentNode);
		}

		return {
			priority_nodes: priority_nodes,
			current_expression_nodes: current_expression_nodes,
			expression_groups: expression_groups,
			doubleOperator: doubleOperator,
		};
	}

	prioritizeExpressionGroups({priority, expression_groups}) {
		let newGroups = [];
		let currentGroups = [];
		let foundPriority = false;

		for (const group of expression_groups) {
			if (group.syntax === 'end' && currentGroups.length) {
				if (newGroups.length) {
					newGroups.push({priority: currentGroups});
				} else {
					newGroups = currentGroups;
				}
				newGroups.push(group);
				currentGroups = [];
			} else if (group.kind === priority) {
				foundPriority = true;
				currentGroups.push(group);
			} else if (!group.priority && group.kind !== 'expression' && foundPriority && currentGroups.length) {
				newGroups.push({priority: currentGroups});
				newGroups.push(group);
				currentGroups = [];
				foundPriority = false;
			} else if (group.syntax === 'OR' || group.syntax === 'AND') {
				newGroups.push({priority: currentGroups});
				newGroups.push(group);
				currentGroups = [];
			} else {
				currentGroups.push(group);
			}
		}

		return newGroups;
	}

	getCurrentNode({index, nodes}) {
		return nodes[index];
	}

	// Return the previous node from node list
	getPreviousNode({index, nodes}) {
		return nodes[index - 1] || {syntax: 'end'};
	}

	// Return the next node from node list
	getNextNode({index, nodes}) {
		return nodes[index + 1] || {syntax: 'end'};
	}

	filterNodesAndUnifyObjects(nodes) {
		const filteredNodes = [];
		let object = this.newObject();
		let counter = nodes.length -1;
		let concatObject = false;
		while (nodes[counter]) {
			// Remove empty nodes
			if (nodes[counter].syntax !== 'empty') {
				if (['function', 'dictNode', 'anonymousFunc'].includes(nodes[counter].syntax)) {
					object.parameters.unshift(nodes[counter]);
					let label = nodes[counter].label;
					if (nodes[counter].syntax === 'function') {
						label = label + '()';
					}
					object.label = label + object.label;
					concatObject = true;
				} else {
					if (concatObject) {
						filteredNodes.unshift(object);
						concatObject = false;
						object = this.newObject();
					}
					filteredNodes.unshift(nodes[counter]);
				}
			} else {
				if (concatObject) {
					filteredNodes.unshift(object);
					concatObject = false;
					object = this.newObject();
				}
			}
			counter = counter - 1;
		}
		// If object is the last node it may be wating...
		if (concatObject) {
			filteredNodes.unshift(object);
			concatObject = false;
			object = this.newObject();
		}
		return filteredNodes;
	}

	newObject() {
		return {syntax: 'object', label: '', parameters: []};
	}
}

class PowerLexer {
	constructor({text, tokensTable, counter, isParameter}) {
		this.isParameter = isParameter;
		this.originalText = String(text);
		this.syntaxTree = new SyntaxTree({counter: counter});
		this.tokens = [];
	}

	scan() {
		for (const char of this.originalText) {
			const token = this.convertToToken(char);
			this.tokens.push(token);
		}
		this.tokens.push({name: 'end', value: null});
	}

	convertToToken(char) {
		for (const kind of this.tokensTable) {
			if (kind.values.includes(char)) {
				return {name: kind.name, value: char};
			}
		}

		return {name: 'undefined', value: char};
	}
}

class PowerTemplateParser extends PowerLexer{
	constructor({text, tokensTable, counter, isParameter}) {
		super({text: text, tokensTable: tokensTable, counter: counter || 0, isParameter: isParameter});
		this.counter = counter || 0;
		this.tokensTable = tokensTable || [
			{name: 'blank', values: [' ', '\t', '\n']},
			{name: 'escape', values: ['\\']},
			{name: 'especial', values: ['_', '$']},
			{name: 'quote', values: ['"', '`', "'"]},
			{name: 'braces', values: ['{', '}']},
			{name: 'separator', values: ['(', ')', '[', ']']},
			{name: 'operator', values: ['+', '-', '*', '/', '%']},
			{name: 'equal', values: ['=']},
			{name: 'minor-than', values: ['<']},
			{name: 'greater-than', values: ['>']},
			{name: 'NOT', values: ['!']},
			{name: 'AND', values: ['&']},
			{name: 'OR', values: ['|']},
			{name: 'comma', values: ','},
			{name: 'dot', values: ['.']},
			{name: 'short-hand', values: ['?', ':']},
			{name: 'number', values: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']},
			{name: 'letter', values: [
				'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i',
				'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
				's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
				'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
				'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
				'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
			},
			{name: 'end', values: [null]},
		];
		this.buildSyntaxTree();
	}

	buildSyntaxTree() {
		this.scan();
		this.syntaxTree.buildTreeLeaf(this.isParameter || false);
	}

	scan() {
		let counter = this.counter;
		for (const char of this.originalText) {
			const token = this.convertToToken(char);
			this.tokens.push(token);
			this.syntaxTree.tokensListener.read({token: token, counter: counter});
			counter = counter + 1;
		}
		// Add an end token to the stream end
		const token = this.convertToToken(null);
		this.tokens.push(token);
		this.syntaxTree.tokensListener.read({token: token, counter: counter});
	}

}

// Listen to tokens for syntax patterns
class TokensListener {
	constructor({counter, syntaxTree}) {
		this.syntaxTree = syntaxTree;
		this.currentTokens = [];
		this.currentLabel = '';
		this.start = counter;
		this.patterns = [
			{name: 'empty', obj: EmptyPattern},
			{name: 'string', obj: StringPattern},
			{name: 'arrayDefinition', obj: ArrayDefinitionPattern},
			{name: 'variable', obj: VariablePattern},
			{name: 'number', obj: NumberPattern},
			{name: 'operator', obj: OperationPattern},
			{name: 'equal', obj: EqualPattern},
			{name: 'minor-than', obj: MinorThanPattern},
			{name: 'greater-than', obj: GreaterThanPattern},
			{name: 'NOT', obj: NotPattern},
			{name: 'AND', obj: AndPattern},
			{name: 'OR', obj: OrPattern},
			{name: 'comma', obj: CommaPattern},
			{name: 'dot', obj: DictPattern},
			{name: 'braces', obj: BracesPattern},
			{name: 'separator', obj: DictPattern},
			{name: 'short-hand', obj: ShortHandPattern},
			{name: 'parentheses', obj: parenthesesPattern}
			// {name: 'object', obj: ObjectPattern}, // this is a secondary detector
		];
		this.candidates = [];
		this.checking = 'firstToken';

		this.resetCandidates();
	}

	read({token, counter}) {
		for (const candidate of this.candidates) {
			if (candidate.instance[this.checking]({token: token, counter: counter})) {
				this.currentTokens.push(token);
				this.currentLabel = this.currentLabel + (token.value || (token.value === null ? '' : token.value));
				break;
			}
		}
	}

	nextPattern({token, counter, syntax, parameters}) {
		this.syntaxTree.nodes.push({
			syntax: syntax,
			label: this.currentLabel,
			tokens: this.currentTokens,
			start: this.start,
			end: counter,
			parameters: parameters || [],
		});
		this.start = counter;
		this.currentTokens = [];
		this.currentLabel = '';
		this.checking = 'firstToken';
		this.resetCandidates();

		this.read({token, counter});
	}

	resetCandidates() {
		this.candidates = [];
		for (const candidate of this.patterns) {
			this.candidates.push({name: candidate.name, instance: new candidate.obj(this)});
		}
	}
}

class ParserEval {
	constructor({text, nodes, scope, $powerUi, valueToSet}) {
		this.$powerUi = $powerUi;
		this.$scope = scope || {};
		this.nodes = nodes || new PowerTemplateParser({text: text}).syntaxTree.tree;
		this.currentValue = '';
		this.operator = '';
		this.doubleOperator = '';
		this.lastNode = '';
		this.currentNode = '';
		this.nextNode = '';
		this.equality = '$_not_Setted_$';
		this.leftExpressionValueToCompare = '$_not_Setted_$';
		this.rightExpressionValueToCompare = '$_not_Setted_$'; // TODO implement this one

		this.evalNodes(valueToSet);
	}

	evalNodes(valueToSet) {
		let count = 0;
		for (let node of this.nodes) {
			if (node.expression_nodes) {
				for (const item of node.expression_nodes) {
					this.currentNode = item;

					this.nextNode = node.expression_nodes[count + 1];
					if (item.syntax === 'short-hand') {
						this.evalShortHandExpression(item);
					} else if (item.syntax === 'dictDefinition') {
						this.evalDictDefinition(item);
						// console.log('item is dictDefinition:', item);
					} else {
						if (item.syntax === 'variable' && ['true', 'false', 'null', 'undefined'].includes(item.label)) {
							this.evalSpecialValues(item.label);
						} else {
							this.eval(item, valueToSet);
						}
					}

					this.lastNode = item;
				}
			} else {
				if (node.kind === 'equality' || ['===', '!==', '==', '!=', '>=', '<=', '>', '<'].includes(node.label)) {
					this.leftExpressionValueToCompare = this.currentValue;
					this.currentValue = '';
					this.equality = node;
				} else if (['OR', 'AND'].includes(node.syntax)) {
					this.leftExpressionValueToCompare = this.currentValue;
					this.currentValue = '';
					this.orAndExpression = node;
				} else {
					// Or left and rigth values
					if (this.nodes[count + 1] && this.nodes[count + 1].syntax === 'OR' && node.priority && node.priority[0] && node.priority[0].priority) {
						if (node.priority.length > 1) {
							this.currentValue = this.recursiveEval(node.priority);
						} else {
							this.currentValue = this.recursiveEval(node.priority[0].priority);
						}
					} else if (this.nodes[count - 1] && this.nodes[count - 1].syntax === 'OR' && node.priority && node.priority[0] && node.priority[0].priority) {
						if (node.priority.length > 1) {
							this.currentValue = this.recursiveEval(node.priority);
						} else {
							this.currentValue = this.recursiveEval(node.priority[0].priority);
						}
					// And left and rigth values
					} else if (this.nodes[count + 1] && this.nodes[count + 1].syntax === 'AND' && node.priority) {
						this.currentValue = this.recursiveEval(node.priority);
					} else if (this.nodes[count - 1] && this.nodes[count - 1].syntax === 'AND' && node.priority) {
						this.currentValue = this.recursiveEval(node.priority);
					} else {
						console.log('NO EXPRESSION_NODES!!', this.currentValue, node, this.nodes);
					}
				}
			}
			if (this.equality && this.currentValue !== '' && this.leftExpressionValueToCompare !== '$_not_Setted_$') {
				this.evalEquality();
			} else if (this.orAndExpression && this.orAndExpression.syntax === 'OR' && this.currentValue !== '' && this.leftExpressionValueToCompare !== '$_not_Setted_$') {
				this.evalOrExpression();
			} else if (this.orAndExpression && this.orAndExpression.syntax === 'AND' && this.currentValue !== '' && this.leftExpressionValueToCompare !== '$_not_Setted_$') {
				this.evalAndExpression();
			}
			count = count + 1;
		}

	}

	evalDictDefinition(item) {
		this.currentValue = {};
		for (const param of item.parameters) {
			this.currentValue[this.recursiveEval(param.key)] = this.recursiveEval(param.value);
		}
	}

	evalArrayDefinition(item) {
		this.currentValue = [];
		for (const param of item.parameters) {
			this.currentValue.push(this.recursiveEval(param));
		}
	}

	evalSpecialValues(value) {
		if (value === 'true') {
			this.currentValue = true;
		} else if (value === 'false') {
			this.currentValue = false;
		} else if (value === 'null') {
			this.currentValue = null;
		} else if (value === 'undefined') {
			this.currentValue = undefined;
		}
	}

	evalShortHandExpression(item) {
		const condition = this.recursiveEval(item.condition);
		const ifResult = this.recursiveEval(item.if);
		const elseResult = this.recursiveEval(item.else);
		if (condition) {
			this.currentValue = ifResult;
		} else {
			this.currentValue = elseResult;
		}
		// console.log('SHORT-HAND EXPRESSION condition', condition, 'if', ifResult, 'else', elseResult, 'item', item);
	}

	evalOrExpression() {
		// console.log('OR EXPRESSION', this.leftExpressionValueToCompare, this.orAndExpression, this.currentValue);
		this.currentValue = this.leftExpressionValueToCompare || this.currentValue;
		this.leftExpressionValueToCompare = '$_not_Setted_$';
	}

	evalAndExpression() {
		// console.log('AND EXPRESSION', this.leftExpressionValueToCompare, this.orAndExpression, this.currentValue);
		this.currentValue = this.leftExpressionValueToCompare && this.currentValue;
		this.leftExpressionValueToCompare = '$_not_Setted_$';
	}

	evalEquality() {
		// console.log('!! EQUALITY !!', this.leftExpressionValueToCompare, this.equality.label, this.currentValue);
		if (this.equality.label === '===') {
			this.currentValue = this.leftExpressionValueToCompare === this.currentValue;
		} else if (this.equality.label === '==') {
			this.currentValue = this.leftExpressionValueToCompare == this.currentValue;
		} else if (this.equality.label === '!==') {
			this.currentValue = this.leftExpressionValueToCompare !== this.currentValue;
		} else if (this.equality.label === '!=') {
			this.currentValue = this.leftExpressionValueToCompare != this.currentValue;
		} else if (this.equality.label === '<=') {
			this.currentValue = this.leftExpressionValueToCompare <= this.currentValue;
		} else if (this.equality.label === '>=') {
			this.currentValue = this.leftExpressionValueToCompare >= this.currentValue;
		} else if (this.equality.label === '>') {
			this.currentValue = this.leftExpressionValueToCompare > this.currentValue;
		} else if (this.equality.label === '<') {
			this.currentValue = this.leftExpressionValueToCompare < this.currentValue;
		}
		this.leftExpressionValueToCompare = '$_not_Setted_$';
	}

	eval(item, valueToSet) {
		// console.log('last', this.lastNode, 'current', this.currentNode, 'next', this.nextNode);
		let value = '';
		if (item.syntax === 'float') {
			value = parseFloat(item.label);
			if (this.currentValue === '') {
				this.currentValue = this.adjustForNegative(value);
			} else {
				this.currentValue = this.mathOrConcatValues(value);
			}
		} else if (item.syntax === 'integer') {
			value = parseInt(item.label);
			if (this.currentValue === '') {
				this.currentValue = this.adjustForNegative(value);
			} else {
				this.currentValue = this.mathOrConcatValues(value);
			}
		} else if (item.syntax === 'operator') {
			// Jesus... javascript allows multiple operators like in: 2 +-+-+-+- 4
			if (this.operator) {
				if (this.operator === '-' && item.label === '-') {
					this.operator = '+';
				} else if (this.operator === '-' && item.label === '+') {
					this.operator = '-';
				} else if (this.operator === '+' && item.label === '-') {
					this.operator = '-';
				} else if (this.operator === '+' && item.label === '+') {
					this.operator = '+';
				} else {
					if (this.doubleOperator === '-' && item.label === '-') {
						this.doubleOperator = '+';
					} else if (this.doubleOperator === '-' && item.label === '+') {
						this.doubleOperator = '-';
					} else if (this.doubleOperator === '+' && item.label === '-') {
						this.doubleOperator = '-';
					} else if (this.doubleOperator === '+' && item.label === '+') {
						this.doubleOperator = '+';
					} else {
						this.doubleOperator = item.label;
					}
				}
			} else {
				this.operator = item.label;
			}
		} else if (item.priority || item.syntax === 'parentheses') {
			const newNodes = item.priority ? [{expression_nodes: item.priority}] : item.parameters;
			value = this.recursiveEval(newNodes);
			this.currentValue = this.mathOrConcatValues(value);
		} else if (item.syntax === 'variable') {
			value = this.getOrSetObjectOnScope(item.label, valueToSet);
			if (this.currentValue === '') {
				this.currentValue = this.adjustForNegative(value);
			} else {
				this.currentValue = this.mathOrConcatValues(value);
			}
		} else if (item.syntax === 'string') {
			value = this.removeQuotes(item.label);
			if (this.currentValue === '') {
				this.currentValue = this.adjustForNegative(value);
			} else {
				this.currentValue = this.mathOrConcatValues(value);
			}
		} else if (item.syntax === 'arrayDefinition') {
			this.evalArrayDefinition(item);
		} else if (item.syntax === 'object') {
			value = this.evalOrSetObjectOnScope(item, valueToSet);
			this.currentValue = this.mathOrConcatValues(value);
		} else {
			console.log('NOT NUMBER OR OPERATOR OR PRIORITY OR SHORT-HAND', item);
		}

		return value;
	}

	removeQuotes(string) {
		let newString = '';
		for (const char of string) {
			if (!['"', '`', "'"].includes(char)) {
				newString = newString + char;
			}
		}
		return newString;
	}

	// This can evaluate the model on scope (return its value) or give to it a new value
	evalOrSetObjectOnScope(item, newValue) {
		let $currentScope = '';
		let objOnScope = '';
		let value = '';
		// The following is to allow set the model itself
		let lastLabel = '';
		let lastObject = '';

		let count = 0;
		for (const obj of item.parameters) {
			let label = '';
			if (obj.syntax === 'function') {
				label = obj.label;
			} else if (obj.syntax === 'dictNode'){
				label = this.recursiveEval(obj.parameters);
			} else {
				if (obj.syntax !== 'anonymousFunc') {
					console.log('NOT FUNCTION or DICTNODE!', obj);
				}
			}

			if (count === 0) {
				$currentScope = this.getObjScope(label);
				lastObject = $currentScope;
				count = 1;
			} else if ($currentScope === '') {
				return undefined;
				break;
			}

			// Build the dict object
			if (obj.syntax !== 'anonymousFunc') {
				if (objOnScope === '' && $currentScope) {
					// first node of dict
					objOnScope = $currentScope[label];
				} else {
					if (!objOnScope) {
						return objOnScope;
					}
					// other nodes of dict
					objOnScope = objOnScope[label];
				}
			}

			if (obj.syntax === 'function' || obj.syntax === 'anonymousFunc') {
				const args = [];
				for (const param of obj.parameters[0].expression_nodes) {
					args.push(this.recursiveEval([{expression_nodes: [param]}]));
				}
				// This allow call multiple anonymous functions
				value = objOnScope.apply($currentScope || null, args);
				objOnScope = value;
			}
			lastLabel = label;
			if (typeof objOnScope === 'object') {
				lastObject = objOnScope;
			}
		}
		if (objOnScope !== '') {
			value = objOnScope;
			objOnScope = '';
		}
		// Change/set the model on scope
		if (newValue !== undefined) {
			lastObject[lastLabel] = newValue;
		}
		return value;
	}

	recursiveEval(nodes) {
		return new ParserEval({nodes: nodes, scope: this.$scope, $powerUi: this.$powerUi}).currentValue;
	}

	adjustForNegative(value) {
		if (this.operator === '-') {
			value = -value;
		}
		this.operator = '';
		return value;
	}

	mathOrConcatValues(value) {
		if (this.operator && isNaN(value) === false) {
			if (Number.isInteger(value)) {
				value = parseInt(value);
			} else if (isNaN(parseFloat(value)) === false) {
				value = parseFloat(value);
			}
		}

		if (this.doubleOperator === '-') {
			value = -value;
			this.doubleOperator = '';
		}

		if (this.operator === '+') {
			value = this.currentValue + value;
		} else if (this.operator === '-') {
			value = this.currentValue - value;
		} else if (this.operator === '/') {
			value = this.currentValue / value;
		} else if (this.operator === '*') {
			value = this.currentValue * value;
		}

		this.operator = '';
		return value;
	}

	// Return item on $scope, or $root or $powerUi
	getOrSetObjectOnScope(item, valueToSet) {
		if (this.$scope[item] !== undefined) {
			if (valueToSet !== undefined) {
				this.$scope[item] = valueToSet;
			}
			return this.$scope[item];
		} else if (this.$scope.$root && this.$scope.$root[item] !== undefined) {
			if (valueToSet !== undefined) {
				this.$scope.$root[item] = valueToSet;
			}
			return this.$scope.$root[item];
		} else if (this.$powerUi[item] !== undefined) {
			if (valueToSet !== undefined) {
				this.$powerUi[item] = valueToSet;
			}
			return this.$powerUi[item];
		} else {
			return undefined;
		}
	}

	// Get the scope where objec exists
	getObjScope(item) {
		if (this.$scope[item] !== undefined) {
			return this.$scope;
		} else if (this.$scope.$root && this.$scope.$root[item] !== undefined) {
			return this.$scope.$root;
		} else if (this.$powerUi[item] !== undefined) {
			return this.$powerUi;
		} else {
			return undefined;
		}
	}
}

class StringPattern {
	constructor(listener) {
		this.listener = listener;
		this.openQuote = null;
		this.escape = false;
		this.invalid = false;
	}

	// Condition to start check if is a string
	firstToken({token, counter}) {
		if (['quote'].includes(token.name)) {
			this.openQuote = token.value;
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'string');
			this.listener.checking = 'middleTokens';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (token.value !== this.openQuote && token.name !== 'end') {
			if (token.name === 'escape') {
				this.escape = true;
			}
			return true;
		} else if (token.value === this.openQuote) {
			if (token.name === 'escape') {
				this.escape = false;
			} else {
				this.openQuote = null;
				this.listener.checking = 'endToken';
			}
			return true;
		} else {
			return false;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && ['blank', 'end', 'operator', 'equal', 'NOT-equal', 'greater-than', 'minor-than', 'greater-or-equal', 'minor-or-equal', 'NOT', 'NOT-NOT', 'AND', 'OR', 'short-hand', 'comma'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'string', token: token, counter: counter});
			return false;
		} else if (this.invalid === true && ['blank', 'end', 'operator', 'equal', 'NOT-equal', 'greater-than', 'minor-than', 'greater-or-equal', 'minor-or-equal', 'NOT', 'NOT-NOT', 'AND', 'OR', 'short-hand', 'comma'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			this.invalid = true;
			return true;
		}
	}
}

// It also detect objects (dictionary and function) and change for ObjectPattern when detects it
class VariablePattern {
	constructor(listener) {
		this.listener = listener;
	}

	// Condition to start check if is empty chars
	firstToken({token, counter}) {
		if (['letter', 'especial'].includes(token.name)) {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'variable');
			this.listener.checking = 'middleTokens';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (['letter', 'especial', 'number'].includes(token.name)) {
			return true;
		} else if (['blank', 'end', 'operator', 'equal', 'NOT-equal', 'greater-than', 'minor-than', 'greater-or-equal', 'minor-or-equal', 'NOT', 'NOT-NOT', 'AND', 'OR', 'short-hand', 'comma'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'variable', token: token, counter: counter});
			return false;
		// If is some function or dictionary
		} else if (token.value === '(' || token.value === '[' || token.name === 'dot') {
			this.listener.checking = 'firstToken';
			this.listener.firstNodeLabel = this.listener.currentLabel;
			this.listener.candidates = [{name: 'object', instance: new ObjectPattern(this.listener)}];
			return true;
		} else {
			// Invalid!
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition are only to INVALID syntaxe
	// wait for some blank or end token and register the current stream as invalid
	endToken({token, counter}) {
		if (['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			return true;
		}
	}
}

class BracesPattern {
	constructor(listener) {
		this.listener = listener;
		this.innerObjects = 0;
		this.currentParams = '';
		this.dictDefinition = [];
		this.currentKey = '';
		this.currentValue = '';
	}

	// Condition to start check if is empty chars
	firstToken({token, counter}) {
		if (token.value === '{') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'braces');
			this.listener.checking = 'middleTokens';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (this.innerObjects === 0 && token.value === '}') {
			this.setDictDefinition(counter);
			this.listener.checking = 'endToken';
		// Collecting inner parameters, so allow any valid syntax
		} else if (['blank', 'escape', 'especial', 'quote', 'equal', 'minor-than', 'greater-than', 'NOT', 'NOT-NOT', 'AND', 'OR', 'comma', 'number', 'letter', 'operator', 'dot', 'separator', 'undefined', 'short-hand', 'braces'].includes(token.name)) {
			if (['{', '(', '['].includes(token.value)) {
				this.innerObjects = this.innerObjects + 1;
			} else if (['}', ')', ']'].includes(token.value)) {
				this.innerObjects = this.innerObjects - 1;
			}
			// Identify keys and values
			if (this.innerObjects === 0) {
				if (token.value === ':') {
					this.currentKey = this.currentParams.trim();
					this.currentParams = '';
					if (!this.containsQuotes(this.currentKey)) {
						this.currentKey = `"${this.currentKey}"`;
					}
					this.currentKey = new PowerTemplateParser({
						text: this.currentKey,
						counter: counter - this.currentKey.length,
						isParameter: true,
					}).syntaxTree.tree;
				} else if (token.value === ',') {
					this.setDictDefinition(counter);
				}
			}

			if (token.value !== ':' && token.value !== ',' || this.innerObjects !== 0) {
				this.currentParams = this.currentParams + token.value;
			}
			return true;
		} else {
			// Invalid!
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	endToken({token, counter}) {
		if (['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'dictDefinition', token: token, counter: counter, parameters: this.dictDefinition});
			return false;
		} else {
			// this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return true;
		}
	}

	containsQuotes(str) {
		if (str.indexOf("'") >= 0 || str.indexOf('"') >= 0 || str.indexOf('`') >= 0) {
			return true;
		} else {
			return false;
		}
	}

	setDictDefinition(counter) {
		if (this.currentParams === '') {
			return;
		}
		this.currentValue = this.currentParams;
		this.currentParams = '';
		this.currentValue = new PowerTemplateParser({
			text: this.currentValue,
			counter: counter - this.currentValue.length,
			isParameter: true,
		}).syntaxTree.tree;
		this.dictDefinition.push({kind: 'keyValue', key: this.currentKey, value: this.currentValue});
	}
}

class NumberPattern {
	constructor(listener) {
		this.listener = listener;
		this.float = false;
	}

	// Condition to start check if is empty chars
	firstToken({token, counter}) {
		if (token.name === 'number') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'number');
			this.listener.checking = 'middleTokens';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (this.float === false && token.name === 'number') {
			return true;
		} else if (this.float === false && ['blank', 'end', 'operator', 'equal', 'NOT-equal', 'greater-than', 'minor-than', 'greater-or-equal', 'minor-or-equal', 'NOT-NOT', 'NOT', 'AND', 'OR', 'short-hand', 'comma'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'integer', token: token, counter: counter});
			return false;
		} else if (this.float === false && token.value === '.') {
			this.float = true;
			return true;
		} else if (this.float === true && token.name === 'number') {
			return true;
		} else if (this.float === true && ['blank', 'end', 'operator', 'equal', 'NOT-equal', 'greater-than', 'minor-than', 'greater-or-equal', 'minor-or-equal', 'NOT-NOT', 'NOT', 'AND', 'OR', 'short-hand', 'comma'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'float', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition are only to INVALID syntaxe
	// wait for some blank or end token and register the current stream as invalid
	endToken({token, counter}) {
		if (['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			return true;
		}
	}
}

class OperationPattern {
	constructor(listener) {
		this.listener = listener;
	}

	// Condition to start check if is empty chars
	firstToken({token, counter}) {
		if (token.name === 'operator') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'operator');
			this.openOperator = token.value;
			this.listener.checking = 'middleTokens';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (['blank', 'end', 'letter', 'especial', 'number', 'quote', 'operator'].includes(token.name) || token.value === '(') {
			this.listener.nextPattern({syntax: 'operator', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition are only to INVALID syntaxe
	// wait for some blank or end token and register the current stream as invalid
	endToken({token, counter}) {
		if (['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			return true;
		}
	}
}

class EqualPattern {
	constructor(listener) {
		this.listener = listener;
		this.one = null;
		this.two = null;
		this.three = null;
		this.invalid = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'equal') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'equal');
			this.listener.checking = 'middleTokens';
			this.one = token.value;
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		// Second operator
		if (this.two === null) {
			if (token.name === 'equal') {
				this.two = token.value;
				// The only valid value after a leading = is another = (2 == 2)
				return true;
			} else {
				// Invalid!
				this.invalid = true;
				// wait for some blank or end token and register the current stream as invalid
				this.listener.checking = 'endToken';
				return true;
			}
		} else {
			if (token.name === 'equal') {
				this.three = token.value;
				this.listener.checking = 'endToken';
				return true;
			// JS syntax allows ! (not operator) after an equality test without spaces: false==!true (evaluate as true)
			} else if (['blank', 'end', 'letter', 'especial', 'number', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
				this.listener.nextPattern({syntax: 'equal', token: token, counter: counter});
				return false;
			} else {
				// Invalid!
				this.invalid = true;
				// wait for some blank or end token and register the current stream as invalid
				this.listener.checking = 'endToken';
				return true;
			}
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'equal', token: token, counter: counter});
			return false;
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			return true;
		}
	}
}

class MinorThanPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'minor-than') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'minor-than');
			this.listener.checking = 'middleTokens';
			this.one = token.value;
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (token.name === 'equal') {
			this.listener.checking = 'endToken';
			return true;
		// JS syntax allows ! (not operator) after an equality test without spaces: false==!true (evaluate as true)
		} else if (['blank', 'end', 'letter', 'especial', 'number', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'minor-than', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'minor-or-equal', token: token, counter: counter});
			return false;
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			return true;
		}
	}
}

class GreaterThanPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'greater-than') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'greater-than');
			this.listener.checking = 'middleTokens';
			this.one = token.value;
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (token.name === 'equal') {
			this.listener.checking = 'endToken';
			return true;
		// JS syntax allows ! (not operator) after an equality test without spaces: false==!true (evaluate as true)
		} else if (['blank', 'end', 'letter', 'especial', 'number', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'greater-than', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'greater-or-equal', token: token, counter: counter});
			return false;
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			return true;
		}
	}
}

class NotPattern {
	constructor(listener) {
		this.listener = listener;
		this.one = null;
		this.two = null;
		this.three = null;
		this.invalid = false;
	}
	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'NOT') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'NOT');
			this.listener.checking = 'middleTokens';
			this.one = token.value;
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		// Second operator
		if (this.two === null) {
			if (token.name === 'equal' || token.name === 'NOT') {
				this.two = token.value;
				// The only valid value after a leading = is another = (2 == 2)
				return true;
			} else if (['blank', 'end', 'letter', 'especial', 'number', 'quote'].includes(token.name)) {
				this.listener.nextPattern({syntax: 'NOT', token: token, counter: counter});
				return false;
			} else {
				// Invalid!
				this.invalid = true;
				// wait for some blank or end token and register the current stream as invalid
				this.listener.checking = 'endToken';
				return true;
			}
		} else {
			this.three = token.value;
			if (this.two === '=' && token.name === 'equal') {
				this.listener.checking = 'endToken';
				return true;
			// JS syntax allows ! (not operator) after an equality test without spaces: false==!true (evaluate as true)
			} else if (this.two === '=' && ['blank', 'end', 'letter', 'especial', 'number', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
				this.listener.nextPattern({syntax: 'NOT-equal', token: token, counter: counter});
				return false;
			} else if (this.two === '!' && ['blank', 'end', 'letter', 'especial', 'number', 'quote'].includes(token.name)) {
				this.listener.checking = 'endToken';
				this.listener.nextPattern({syntax: 'NOT-NOT', token: token, counter: counter});
				return false;
			} else if (this.two === '!' && token.name === 'NOT') {
				this.listener.checking = 'endToken';
				return true;
			} else {
				// Invalid!
				this.invalid = true;
				// wait for some blank or end token and register the current stream as invalid
				this.listener.checking = 'endToken';
				return true;
			}
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && this.three === '=' && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'NOT-equal', token: token, counter: counter});
			return false;
		} else if (this.invalid === false && this.three === '!' && ['blank', 'end', 'letter', 'number', 'especial', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'NOT-NOT', token: token, counter: counter});
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			if (token.value !== '!') {
				this.invalid = true;
			}
			return true;
		}
	}
}

class AndPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'AND') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'AND');
			this.listener.checking = 'middleTokens';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (token.name === 'AND') {
			this.listener.checking = 'endToken';
			return true;
		} else {
			// Invalid!
			this.invalid = true;
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'AND', token: token, counter: counter});
			return false;
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			return true;
		}
	}
}

class OrPattern {
	constructor(listener) {
			this.listener = listener;
			this.invalid = false;
		}

		// Condition to start check first operator
		firstToken({token, counter}) {
			if (token.name === 'OR') {
				this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'OR');
				this.listener.checking = 'middleTokens';
				return true;
			} else {
				return false;
			}
		}

		// middle tokens condition
		middleTokens({token, counter}) {
			if (token.name === 'OR') {
				this.listener.checking = 'endToken';
				return true;
			} else {
				// Invalid!
				this.invalid = true;
				// wait for some blank or end token and register the current stream as invalid
				this.listener.checking = 'endToken';
				return true;
			}
		}

		// end condition
		endToken({token, counter}) {
			if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
				this.listener.nextPattern({syntax: 'OR', token: token, counter: counter});
				return false;
			} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
				this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
				return false;
			} else {
				// Invalid!
				this.invalid = true;
				return true;
			}
		}
}

class ShortHandPattern {
	constructor(listener) {
		this.listener = listener;
		this.currentParams = '';

		this.shortHand = {syntax: 'short-hand', condition: [], if: [], else: [], label: ''};
		this.counter = 0;
		this.openShortHand = 0;
		this.needCloseShortHand = 0;

		// Track any open parentheses or brackets
		this.parentheses = 0;
		this.brackets = 0;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'short-hand' && token.value === '?') {
			this.openShortHand = this.openShortHand  + 1;
			this.createConditionNode({token, counter});
			return true;
		} else {
			return false;
		}
	}

	// middle condition
	middleTokens({token, counter}) {
		// Collecting inner parameters, so allow any valid syntax
		if (['blank', 'escape', 'especial', 'quote', 'equal', 'minor-than', 'greater-than', 'NOT', 'NOT-NOT', 'AND', 'OR', 'comma', 'number', 'letter', 'operator', 'dot', 'separator', 'undefined'].includes(token.name)) {
			this.currentParams = this.currentParams + token.value;
			if (token.value === '(') {
				this.parentheses = this.parentheses + 1;
			} else if (token.value === '[') {
				this.brackets = this.brackets + 1;
			} else if (token.value === ')') {
				this.parentheses = this.parentheses - 1;
			} else if (token.value === ']') {
				this.brackets = this.brackets - 1;
			}
			return true;
		} else if (token.name === 'short-hand' && token.value === ':') {
			if (this.brackets === 0 && this.parentheses === 0) {
				this.needCloseShortHand = this.needCloseShortHand + 1;
				// Set the short-hand to close on 'end' syntax, but if found a '?' before it,
				// this is a inner short-hand on the 'condition' ou 'else' part of the main short-hand
				// This also can be a inner short-hand inside the 'if' part of the main short-hand
				if (this.openShortHand === this.needCloseShortHand) {
					this.needCloseShortHand = this.needCloseShortHand - 1;
					this.createIfNode({token: token, text: this.currentParams});
				}
			}
			this.currentParams = this.currentParams + token.value;
			return true;
		// It may some inner shot-hand inside 'condition' or 'else' part of main short hand
		} else if (token.name === 'short-hand' && token.value === '?') {
			if (this.brackets === 0 && this.parentheses === 0) {
				if (this.openShortHand === 1 && this.needCloseShortHand === 1) {
					let tempLabel = this.shortHand.label + this.currentParams;
					// replace the real nodes with a tempNode just with the correct label so the createConditionNode use it
					// to create a condition node with a full short-hand label
					this.listener.syntaxTree.nodes = [{syntax: 'temp', label: tempLabel}];
					// Reset all variables
					this.shortHand = {syntax: 'short-hand', condition: [], if: [], else: [], label: ''};
					this.openShortHand = this.openShortHand  - 1;
					this.needCloseShortHand = this.needCloseShortHand - 1;
					this.counter = 0;
					// This add a short-hand as 'condition' or 'else' of another short-hand
					this.currentParams = this.currentParams + token.value;
					this.createConditionNode({token, counter});
					return true;
				} else {
					this.openShortHand = this.openShortHand  + 1;
				}
			}
			this.currentParams = this.currentParams + token.value;
			return true;
		} else if (token.name === 'end') {
			this.createElseNode({token});
			return false;
		} else {
			// Invalid!
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		}
	}

	createConditionNode({token}) {
		// Remove the current nodes from suntaxTree and add it as the short-hand condition
		for (const node of this.listener.syntaxTree.nodes) {
			this.shortHand.label = `${this.shortHand.label}${node.label}`;
		}
		this.shortHand.condition = new PowerTemplateParser({
			text: this.shortHand.label,
			counter: this.counter,
			isParameter: true,
		}).syntaxTree.tree;

		this.listener.syntaxTree.nodes = [];
		this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'short-hand');
		this.listener.checking = 'middleTokens';
		this.counter = this.shortHand.label.length + 1; // +1 represents the ?
		this.currentParams = '';
		this.fullLabel = this.shortHand.label + token.value;
	}

	createIfNode({token, text}) {
		this.shortHand.if = new PowerTemplateParser({
			text: text,
			counter: this.counter,
			isParameter: true,
		}).syntaxTree.tree;

		this.shortHand.label = this.fullLabel + this.currentParams;
		this.counter = this.shortHand.label.length + 1;
		this.currentParams = '';
	}

	createElseNode({token}) {
		this.shortHand.else = new PowerTemplateParser({
			text: this.currentParams,
			counter: this.counter,
			isParameter: true,
		}).syntaxTree.tree;

		this.shortHand.label = this.shortHand.label + this.currentParams;
		this.shortHand.start = 0;
		this.shortHand.end = this.shortHand.label.length;
		this.listener.syntaxTree.nodes.push(this.shortHand);
		this.openShortHand = this.openShortHand  - 1;
		this.needCloseShortHand = this.needCloseShortHand - 1;
	}
}

class CommaPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'comma') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'comma');
			this.listener.checking = 'endToken';
			return true;
		} else {
			return false;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && ['blank', 'end', 'especial', 'separator', 'operator', 'quote', 'equal', 'NOT', 'NOT-NOT', 'comma', 'number', 'letter'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'comma', token: token, counter: counter});
			return false;
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			return true;
		}
	}
}

// If is some dictNode
class DictPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		// can't start with dot
		if (token.name === 'dot' && this.listener.syntaxTree.nodes.length === 0) {
			// INVALID!
			this.listener.checking = 'endToken';
			this.listener.firstNodeLabel = this.listener.currentLabel;
			const instance = new ObjectPattern(this.listener);
			instance.invalid = true;
			this.listener.candidates = [{name: 'object', instance: instance}];
			return true;
		} else if (token.name === 'dot' || token.value === '[') {
			this.listener.checking = 'firstToken';
			this.listener.firstNodeLabel = this.listener.currentLabel;
			const instance = new ObjectPattern(this.listener);
			instance.anonymous = true;
			this.listener.candidates = [{name: 'object', instance: instance}];

			return true;
		} else {
			return false;
		}
	}
}

// Create a parentheses or anonymous function
class parenthesesPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
		this.nodes = [];
		this.currentOpenChar = null;
		this.currentParams = '';
		this.currentParamsCounter = null; //Allow pass the couter to the params
		this.innerOpenedParenteses = 0;
		this.anonymous = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		// The open char of the current node
		this.currentOpenChar = token.value;
		if (this.currentOpenChar === '(' && !this.listener.isAnonymousFunc) {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'parentheses');
			this.listener.checking = 'middleTokens';
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}
			return true;
		} else if (this.listener.isAnonymousFunc === true) {
			this.listener.checking = 'firstToken';
			this.listener.firstNodeLabel = this.listener.currentLabel;
			const instance = new ObjectPattern(this.listener);
			instance.anonymous = true;
			this.listener.candidates = [{name: 'object', instance: instance}];
			this.listener.isAnonymousFunc = false;
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (token.value === ')' && this.innerOpenedParenteses === 0) {
			this.listener.checking = 'endToken';
			return true;
		// This is a functions with parameters, so allow any valid char
		} else if (['blank', 'escape', 'especial', 'quote', 'equal', 'minor-than', 'greater-than', 'NOT', 'NOT-NOT', 'AND', 'OR', 'comma', 'short-hand', 'number', 'letter', 'operator', 'dot', 'separator', 'braces', 'undefined'].includes(token.name)) {
			this.currentParams = this.currentParams + token.value;
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}

			if (token.value === '(') {
				this.innerOpenedParenteses = this.innerOpenedParenteses + 1;
			} else if (token.value === ')') {
				this.innerOpenedParenteses = this.innerOpenedParenteses - 1;
			}
			return true;
		} else if (this.innerOpenedParenteses >= 0 && token.name === 'end') {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false ) {
			if (['blank', 'end', 'dot', 'operator'].includes(token.name)) {
				const parameters = new PowerTemplateParser({
					text: this.currentParams,
					counter: this.currentParamsCounter,
					isParameter: true,
				}).syntaxTree.tree;

				this.listener.nextPattern({syntax: this.anonymous ? 'anonymousFunc' : 'parentheses', token: token, counter: counter, parameters: parameters});
				return false;
			// Allow invoke a second function
			} else if (token.value === '(') {
				// MANUALLY CREATE THE CURRENT NODE
				const parameters = new PowerTemplateParser({
					text: this.currentParams,
					counter: this.currentParamsCounter,
					isParameter: true,
				}).syntaxTree.tree;

				this.listener.syntaxTree.nodes.push({
					syntax: this.anonymous ? 'anonymousFunc' : 'parentheses',
					label: this.listener.currentLabel,
					tokens: this.listener.currentTokens,
					start: this.listener.start,
					end: counter,
					parameters: parameters || [],
				});
				this.listener.start = counter;
				this.listener.currentTokens = [];
				this.currentParams = [];
				this.listener.currentLabel = '';

				this.anonymous = true;
				this.listener.checking = 'middleTokens';
				return true;
			} else {
				// Invalid!
				this.invalid = true;
				return true;
			}
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			return true;
		}
	}
}

class ArrayDefinitionPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
		this.nodes = [];
		this.innerOpenedObjects = 0;
		this.currentParams = '';
		this.arrayContent = [];
		this.currentParamsCounter = null; //Allow pass the couter to the params
	}
	// Condition to start check first operator
	firstToken({token, counter}) {
		const lastToken = this.listener.syntaxTree.nodes[this.listener.syntaxTree.nodes.length-1];
		// The open char of the current node
		if (token.value === '[' && !(lastToken && lastToken.syntax === 'dictNode')) {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'arrayDefinition');
			this.listener.checking = 'middleTokens';
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		// Empty array?
		if (token.value === ']' && this.innerOpenedObjects === 0) {
			this.listener.checking = 'endToken';
			if (this.currentParams !== '') {
				// Parse the array item and push it into this.arrayContent
				this.setArrayItem();
			}
			return true;
		// This is a functions with parameters, so allow any valid char
		} else if (['blank', 'escape', 'especial', 'quote', 'equal', 'minor-than', 'greater-than', 'NOT', 'NOT-NOT', 'AND', 'OR', 'comma', 'short-hand', 'number', 'letter', 'operator', 'dot', 'separator', 'braces', 'undefined'].includes(token.name)) {
			if (this.innerOpenedObjects === 0 && token.value === ',') {
				// Parse the array item and push it into this.arrayContent
				this.setArrayItem();
			} else {
				this.currentParams = this.currentParams + token.value;
			}
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}

			if (['{', '(', '['].includes(token.value)) {
				this.innerOpenedObjects = this.innerOpenedObjects + 1;
			} else if (['}', ')', ']'].includes(token.value)) {
				this.innerOpenedObjects = this.innerOpenedObjects - 1;
			}
			return true;
		}
	}
	// end condition
	endToken({token, counter}) {
		if (this.invalid === false ) {
			if (['end', 'blank', 'equal', 'minor-than', 'greater-than', 'NOT', 'NOT-NOT', 'AND', 'OR', 'comma', 'short-hand', 'operator'].includes(token.name)) {
				this.listener.nextPattern({syntax: 'arrayDefinition', token: token, counter: counter, parameters: this.arrayContent});
				return false;
			} else {
				// Invalid!
				this.invalid = true;
				return true;
			}
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			return true;
		}
	}

	setArrayItem() {
		// Parse the array item
		const parameters = new PowerTemplateParser({
			text: this.currentParams,
			counter: this.currentParamsCounter,
			isParameter: false,
		}).syntaxTree.tree;

		this.arrayContent.push(parameters);
		this.currentParams = '';
	}
}

// bracket notation dictionary (user['age'])
class ObjectPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
		this.nodes = [];
		this.currentOpenChar = null;
		this.currentParams = '';
		this.currentParamsCounter = null; //Allow pass the couter to the params
		this.innerOpenedObjects = 0;
		this.anonymous = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		// Invalidade any dict ending in: [ ( .
		if (token.value === null) {
			const lastToken = this.listener.currentTokens[this.listener.currentTokens.length -1];
			const second = token;
			if (lastToken.value === '(' || lastToken.value === '[' || lastToken.value === '.') {
				this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
				return false;
			}
		}
		// The open char of the current node
		this.currentOpenChar = this.listener.currentTokens[this.listener.currentTokens.length - 1].value;
		if (this.currentOpenChar === '(') {
			// Is a simple function without parameters
			if (token.value === ')') {
				this.listener.checking = 'endToken';
				return true;
			// Collect the function parameters and go to middleTokens
			} else if (['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'NOT-NOT', 'quote', 'undefined'].includes(token.name) || (token.value === '-' || token.value === '+')) {
				this.listener.checking = 'middleTokens';
				this.currentParams = this.currentParams + token.value;
				if (this.currentParamsCounter === null) {
					this.currentParamsCounter = counter || null;
				}
				return true;
			} else if (['(', '[', '{'].includes(token.value)) {
				this.innerOpenedObjects = this.innerOpenedObjects + 1;
				this.currentParams = this.currentParams + token.value;
				this.listener.checking = 'middleTokens';
				if (this.currentParamsCounter === null) {
					this.currentParamsCounter = counter || null;
				}
				return true;
			} else {
				// Invalid!
				this.invalid = true;
				// wait for some blank or end token and register the current stream as invalid
				this.listener.checking = 'endToken';
				return true;
			}
		// If is a bracket or dot dictionary
		} else if ((this.currentOpenChar === '[' || this.currentOpenChar === '.') && (token.name !== 'separator' || token.value === '(')) {
			// When a bracket dict is detect we already have the first node and the open bracket
			// Get the node label without the bracket and convert it to STRING to create the first node
			// If bracket or dot are detected from DictPattern it may come with a single bracket or dot as
			// currentLabel, in that case with don't want manually create a dict node now
			if (this.listener.currentLabel !== '.' && this.listener.currentLabel !== '[') {
				this.listener.firstNodeLabel = this.listener.currentLabel;
				this.currentParams = `"${this.listener.currentLabel.slice(0, this.listener.currentLabel.length - 1)}"`;
				// MANUALLY CREATE THE DICTIONAY NODE
				this.createDictionaryNode({token: token, counter: counter});
				// Variable name can't start with a number
				if (this.currentOpenChar === '.' && token.name === 'number') {
					// this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
					// return false;
					this.invalid = true;
				}
			} else {
				this.listener.checking = 'middleTokens';
			}

			// After create the first node set to collect the params inside the brackets to create the second node with it
			this.currentParams = this.currentParams + token.value;
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}
			return true;
		} else if (token.name === 'dot' || token.name === 'separator') {
			// Invalid!
			this.invalid = true;
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		// Function
		if (this.currentOpenChar === '(' && token.value === ')' && this.innerOpenedObjects === 0) {
			this.listener.checking = 'endToken';
			return true;
		// This is a functions with parameters, so allow any valid char
		} else if (this.currentOpenChar === '(' && ['blank', 'escape', 'especial', 'quote', 'equal', 'minor-than', 'greater-than', 'NOT', 'NOT-NOT', 'AND', 'OR', 'comma', 'short-hand', 'number', 'letter', 'operator', 'dot', 'separator', 'braces', 'undefined'].includes(token.name)) {
			this.currentParams = this.currentParams + token.value;
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}
			if (['(', '{', '['].includes(token.value)) {
				this.innerOpenedObjects = this.innerOpenedObjects + 1;
			} else if ([')', '}', ']'].includes(token.value)) {
				this.innerOpenedObjects = this.innerOpenedObjects - 1;
			}
			return true;
		} else if (this.currentOpenChar === '(' && this.innerOpenedObjects >= 0 && token.name === 'end') {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		// bracket dictNode
		} else if  (this.currentOpenChar === '[' && token.value === ']' && this.innerOpenedObjects === 0) {
			this.invalid = this.currentParams.length ? false : true; // dictNodes can't be empty []
			this.listener.checking = 'endToken';
			return true;
		// dot dictNode
		} else if (this.currentOpenChar === '.' && (['blank', 'end', 'operator', 'dot'].includes(token.name) || (token.value === '(' || token.value === '['))) {
			// Variable name can't start with a number
			if ((this.listener.currentTokens.length >= 2 &&
				this.listener.currentTokens[0].name === 'dot' &&
				this.listener.currentTokens[1].name === 'number') || (
				this.listener.syntaxTree.nodes.length &&
				this.listener.syntaxTree.nodes[this.listener.syntaxTree.nodes.length-1] &&
				this.listener.syntaxTree.nodes[this.listener.syntaxTree.nodes.length-1].syntax === 'dictNode' &&
				this.listener.syntaxTree.nodes[this.listener.syntaxTree.nodes.length-1].tokens[
				this.listener.syntaxTree.nodes[this.listener.syntaxTree.nodes.length-1].tokens.length-1].value === '.' &&
				this.listener.currentTokens[0].name === 'number')) {
				// Invalid!
				this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
				return false;
			}
			const parameters = new PowerTemplateParser({
				text: `"${this.currentParams}"`,
				counter: this.currentParamsCounter,
				isParameter: true,
			}).syntaxTree.tree;

			this.listener.currentLabel = this.anonymous ? this.listener.currentLabel : this.listener.firstNodeLabel;
			// Set parenthesesPattern to create an anonymous function after this dictionary
			if (token.value === '(') {
				this.listener.isAnonymousFunc = true;
			}
			this.listener.nextPattern({syntax: 'dictNode', token: token, counter: counter, parameters: parameters});
			return false;
		// This is a dictNode with parameters, so allow any valid char
		} else if (this.currentOpenChar === '[' && ['blank', 'escape', 'especial', 'quote', 'equal', 'NOT-equal', 'greater-than', 'minor-than', 'greater-or-equal', 'minor-or-equal', 'NOT', 'NOT-NOT', 'AND', 'OR', 'comma', 'short-hand', 'number', 'letter', 'operator', 'dot', 'separator'].includes(token.name)) {
			this.currentParams = this.currentParams + token.value;
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}

			if (token.value === '[') {
				this.innerOpenedObjects = this.innerOpenedObjects + 1;
			} else if (token.value === ']') {
				this.innerOpenedObjects = this.innerOpenedObjects - 1;
			}
			return true;
		// This is a DOT dictNode so collect it label/parameter
		} else if (this.currentOpenChar === '.' && ['especial', 'number', 'letter'].includes(token.name)) {
			this.currentParams = this.currentParams + token.value;
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}
			return true;
		} else if ((this.currentOpenChar === '[') && this.innerOpenedObjects >= 0 && token.name === 'end') {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false ) {
			// If is a function or the last function nodes or last dictNode
			if (['blank', 'end', 'operator', 'comma', 'dot'].includes(token.name)) {
				const parameters = new PowerTemplateParser({
					text: this.currentParams,
					counter: this.currentParamsCounter,
					isParameter: true,
				}).syntaxTree.tree;

				if (this.currentOpenChar === '(') {
					this.listener.currentLabel = this.anonymous ? this.listener.currentLabel : this.listener.firstNodeLabel;
					this.listener.nextPattern({syntax: this.anonymous ? 'anonymousFunc' : 'function', token: token, counter: counter, parameters: parameters});
					return false;
				} else if (this.currentOpenChar === '[' || this.currentOpenChar === '.') {
					this.listener.currentLabel = this.anonymous ? this.listener.currentLabel : this.listener.firstNodeLabel;
					this.listener.nextPattern({syntax: 'dictNode', token: token, counter: counter, parameters: parameters});
					return false;
				} else {
					// Invalid!
					this.invalid = true;
					return true;
				}
			// If there is an anonymous function after another function
			} else if (this.currentOpenChar === '(' && (token.value === '(' || token.value === '[')) {
				this.listener.checking = 'middleTokens';
				// MANUALLY CREATE THE FUNCTION NODE
				this.createAnonymousFuncNode({token: token, counter: counter});
				this.currentOpenChar = token.value;
				return true;
			// If there is another dictNode or function after last dictNode
			} else if (this.currentOpenChar === '[' && (token.value === '[' || token.value === '(')) {
				// MANUALLY CREATE THE DICTIONAY NODE
				this.createDictionaryNode({token: token, counter: counter});
				this.currentOpenChar = token.value;
				return true;
			} else {
				// Invalid!
				this.invalid = true;
				return true;
			}
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			return true;
		}
	}

	dictHaveInvalidParams(parameters) {
		// Dictionary can't have empty key
		if (parameters.length === 0) {
			invalid = true;
			return true;
		} else {
			return false;
		}
	}

	createDictionaryNode({token, counter}) {
		const parameters = new PowerTemplateParser({
			text: this.currentParams,
			counter: this.currentParamsCounter,
			isParameter: true,
		}).syntaxTree.tree;

		if (this.dictHaveInvalidParams(parameters)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		}
		// this.listener.currentLabel = this.anonymous ? this.listener.currentLabel : this.listener.firstNodeLabel;
		this.listener.syntaxTree.nodes.push({
			syntax: 'dictNode',
			label: this.listener.firstNodeLabel ? this.listener.firstNodeLabel : this.listener.currentLabel,
			tokens: this.listener.currentTokens,
			start: this.listener.start,
			end: counter,
			parameters: parameters || [],
		});
		this.listener.start = counter;
		this.listener.currentTokens = [];
		this.currentParams = [];
		this.listener.currentLabel = '';
		this.listener.firstNodeLabel = '';

		this.anonymous = true;
		this.listener.checking = 'middleTokens';
	}

	createAnonymousFuncNode({token, counter}) {
		const parameters = new PowerTemplateParser({
			text: this.currentParams,
			counter: this.currentParamsCounter,
			isParameter: true,
		}).syntaxTree.tree;

		this.listener.currentLabel = (this.anonymous === true) ? this.listener.currentLabel : this.listener.firstNodeLabel;
		this.listener.syntaxTree.nodes.push({
			syntax: (this.anonymous === true) ? 'anonymousFunc' : 'function',
			label: this.listener.currentLabel,
			tokens: this.listener.currentTokens,
			start: this.listener.start,
			end: counter,
			parameters: parameters || [],
		});
		this.listener.start = counter;
		this.listener.currentTokens = [];
		this.currentParams = [];
		this.listener.currentLabel = '';
		this.listener.firstNodeLabel = '';

		this.anonymous = true;
		this.listener.checking = 'middleTokens';
	}
}

class EmptyPattern {
	constructor(listener) {
		this.listener = listener;
	}

	// Condition to start check if is empty chars
	firstToken({token, counter}) {
		if (token.name === 'blank') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'empty');
			this.listener.checking = 'middleTokens';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (token.name === 'blank') {
			return true;
		} else {
			this.listener.nextPattern({syntax: 'empty', token: token, counter: counter});
			return false;
		}
	}
}

class PowerWidget extends PowerController {
    constructor({$powerUi}) {
        super({$powerUi: $powerUi});
        this.isWidget = true;
    }

    $buildTemplate({template, title}) {
        const tempElement = document.createElement('div');
        if (this.addBeforeTemplate) {
            template = this.addBeforeTemplate + template;
        }
        tempElement.innerHTML = this.template({$title: title || null});
        if (this.addAfterTemplate) {
            template = template + this.addAfterTemplate;
        }
        const content = tempElement.querySelectorAll('[data-pw-content]');
        content[0].innerHTML = template;
        template = tempElement.innerHTML;

        return template;
    }
}

export { PowerWidget };

class PowerDialogBase extends PowerWidget {
	constructor({$powerUi, noEsc, promise}) {
		super({$powerUi: $powerUi});
		const self = this;
		if (promise) {
			this._promise = new Promise(function (resolve, reject) {
				self._resolve = resolve;
				self._reject = reject;
			});
		}

		if (noEsc) {
			return;
		}

		this._closeWindow = function() {
			self._cancel();
		};
	}
	// Allow async calls to implement onCancel
	_cancel(...args) {
		if (this.onCancel && this._promise) {
			const commands = this.onCancel(this._resolve, this._reject, ...args) || [];
			const self = this;
			this._promise.then(function () {
				self.closeCurrentRoute({commands: commands});
			}).catch(function (error) {
				self.closeCurrentRoute();
			});
		} else if (this.onCancel) {
			const commands = this.onCancel(...args) || [];
			this.closeCurrentRoute({commands: commands});
		} else {
			this.closeCurrentRoute();
		}
	}
	// Allow async calls to implement onCommit
	_commit(...args) {
		if (this.onCommit && this._promise) {
			const commands = this.onCommit(this._resolve, this._reject,...args) || [];
			const self = this;
			this._promise.then(function () {
				self.closeCurrentRoute({commands: commands});
			}).catch(function (error) {
				self.closeCurrentRoute();
			});
		} else if (this.onCommit) {
			const commands = this.onCommit(...args) || [];
			this.closeCurrentRoute({commands: commands});
		} else {
			this.closeCurrentRoute();
		}
	}

	closeCurrentRoute({commands=[], callback=null}={}) {
		// Only close if is opened,
		const view = document.getElementById(this._viewId);
		if (view) {
			super.closeCurrentRoute({commands: commands, callback: callback});
		} else {
			// If not opened, call the next in the queue
			this.$powerUi._events.Escape.broadcast();
		}
	}

	_onRemoveView() {
		this.$powerUi.dialogs = this.$powerUi.dialogs.filter(d=> d.id !== this.dialogId);
		this.$powerUi.onBrowserWindowResize.unsubscribe(this.browserWindowResize, this);
		if (this.$powerUi.touchdevice) {
			this.$powerUi.onBrowserOrientationChange.unsubscribe(this.orientationChange, this);
		}
		if (!this.isWindow) {
			this.$powerUi._events.Escape.unsubscribe(this._closeWindow);
		}
		this._currentScrollTop = this.bodyEl.scrollTop || 0;
		this._currentScrollLeft = this.bodyEl.scrollLeft || 0;
	}

	_onViewLoad(view, hasCustomScroll, hasCustomLimits) {
		if (!this.isWindow) {
			this.$powerUi._events.Escape.subscribe(this._closeWindow);
		}

		this.$powerUi.onBrowserWindowResize.subscribe(this.browserWindowResize, this);
		if (this.$powerUi.touchdevice) {
			this.$powerUi.onBrowserOrientationChange.subscribe(this.orientationChange, this);
		}
		this.isHiddenRoute = this.$powerUi.router.routes[this._routeId].isHidden || false;
		const route = this.$powerUi.router.getOpenedRoute({routeId: this._routeId, viewId: this._viewId});

		this._dialog = view.getElementsByClassName('pw-dialog-container')[0];
		this.bodyEl = view.getElementsByClassName('pw-body')[0];
		this.titleBarEl = view.getElementsByClassName('pw-title-bar')[0];

		if (route) {
			this.dialogId = `dialog_${route.route.replace('/', '-')}`;
			this.zIndex = 1999 + this.$powerUi.dialogs.length + 1;
			this._dialog.style.zIndex = this.zIndex;
			this.$powerUi.dialogs.push({id: this.dialogId, ctrl: this});
		}

		if (!hasCustomLimits) {
			this.setHeightLimits();
		}
		if (!hasCustomScroll) {
			this.restoreScrollPosition(view);
		}
	}


	setHeightLimits() {
		if (this.bodyEl.offsetHeight + this.titleBarEl.offsetHeight > window.innerHeight - 30) {
			this._setHieghtLimits();
		} else {
			this.bodyEl.style.height = null;
			// There is a chance when resizing that the value after removing the height is greater than allowed
			if (this.bodyEl.offsetHeight + this.titleBarEl.offsetHeight > window.innerHeight - 30) {
				this._setHieghtLimits();
			}
		}
	}

	_setHieghtLimits() {
		const newHeight = window.innerHeight - this.titleBarEl.offsetHeight - 30 + 'px';
		this.bodyEl.style.height = newHeight;
	}

	browserWindowResize() {
		this.setHeightLimits();
	}

	orientationChange() {
		this.browserWindowResize();
	}

	restoreScrollPosition(view) {
		this.bodyEl.scrollTop = this._currentScrollTop || 0;
		this.bodyEl.scrollLeft = this._currentScrollLeft || 0;
	}

	$buttons() {
		if (this.commitBt || this.cancelBt) {
			const cancelBt = '<button class="pw-btn-default" data-pow-event onclick="_cancel()">Cancel</button>';
			let buttons = '';
			if (this.commitBt) {
				const defaultLabel = this.noBt ? 'Yes' : 'Ok';
				const commitIco = `<span class="pw-icon ${(this.commitBt.icon ? this.commitBt.icon : 'icon-ok-black')}"></span>`;
				const commitBt = `<button
								class="${(this.commitBt.css ? this.commitBt.css : 'pw-btn-default')}"
								data-pow-event onclick="_commit(true)">
								${(this.commitBt.icon !== false ? commitIco : '')}
								<span class="pw-label">
									${(this.commitBt.label ? this.commitBt.label : defaultLabel)}
								</span>
								</button>`;
				buttons = buttons + commitBt;
			}
			if (this.noBt) {
				const noIco = `<span class="pw-icon ${(this.noBt.icon ? this.noBt.icon : 'icon-cancel-black')}"></span>`;
				const noBt = `<button
								class="${(this.noBt.css ? this.noBt.css : 'pw-btn-default')}"
								data-pow-event onclick="_commit(false)">
								${(this.noBt.icon !== false ? noIco : '')}
								<span class="pw-label">
									${(this.noBt.label ? this.noBt.label : 'No')}
								</span>
								</button>`;
				buttons = buttons + noBt;
			}
			if (this.cancelBt) {
				const defaultIco = this.noBt ? 'icon-cancel-simple' : 'icon-cancel-black';
				const cancelIco = `<span class="pw-icon ${(this.cancelBt.icon ? this.cancelBt.icon : defaultIco)}"></span>`;
				const cancelBt = `<button
								class="${(this.cancelBt.css ? this.cancelBt.css : 'pw-btn-default')}"
								data-pow-event onclick="_cancel()">
								${(this.cancelBt.icon !== false ? cancelIco : '')}
								<span class="pw-label">
									${(this.cancelBt.label ? this.cancelBt.label : 'Cancel')}
								</span>
								</button>`;
				buttons = buttons + cancelBt;
			}
			return buttons;
		} else {
			return '';
		}
	}

	template({$title}) {
		// This allow the user define a this.$title on controller constructor, otherwise use the route title
		this.$title = this.$title || $title;
		const buttons = this.$buttons();
		return `<div class="pw-title-bar">
					<span class="pw-title-bar-label">${this.$title}</span>
					<div data-pow-event onclick="_cancel()" class="pw-bt-dialog-title pw-icon icon-cancel-black"></div>
					${this.restoreBt ? '<div style="display:none;" data-pow-event onclick="restore(event)" class="pw-bt-dialog-title pw-icon icon-windows"></div>' : ''}
					${this.maximizeBt ? '<div data-pow-event onclick="maximize(event)" class="pw-bt-dialog-title pw-icon icon-maximize"></div>' : ''}
				</div>
				<div class="pw-body">
					<div class="pw-container" data-pw-content>
					</div>
					${buttons ? '<div class="pw-container">' + buttons + '</div>' : ''}
				</div>`;
	}
}

export { PowerDialogBase };

class PowerDialog extends PowerDialogBase {
	constructor({$powerUi, promise=true}) {
		super({$powerUi: $powerUi, promise: promise});
	}

	template({$title}) {
		// This allow the user define a this.$title on controller constructor or compile, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-dialog pw-dialog-container pw-backdrop">
					${super.template({$title})}
				</div>`;
	}
}

class PowerAlert extends PowerDialog {
	constructor({$powerUi, promise=true}) {
		super({$powerUi: $powerUi, promise: promise});
		this.commitBt = true;
	}
}

class PowerConfirm extends PowerDialog {
	constructor({$powerUi, promise=true}) {
		super({$powerUi: $powerUi, promise: promise});
		this.commitBt = true;
		this.cancelBt = true;
	}
}

class PowerYesNo extends PowerDialog {
	constructor({$powerUi, promise=true}) {
		super({$powerUi: $powerUi, promise: promise});
		this.commitBt = true;
		this.noBt = true;
		this.cancelBt = true;
	}
}

function wrapFunctionInsideDialog({controller, kind, params, resolve, reject, _promise}) {
	class _Alert extends PowerAlert {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi, promise: false});
			this.ctrl = controller;
			this._resolve = resolve;
			this._reject = reject;
			this._promise = _promise;
			if (params) {
				for (const key of Object.keys(params || {})) {
					this[key] = params[key];
				}
			}
		}
	}

	class _Confirm extends PowerConfirm {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi, promise: false});
			this.ctrl = controller;
			this._resolve = resolve;
			this._reject = reject;
			this._promise = _promise;
			if (params) {
				for (const key of Object.keys(params || {})) {
					this[key] = params[key];
				}
			}
		}
	}

	class _YesNo extends PowerYesNo {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi, promise: false});
			this.ctrl = controller;
			this._resolve = resolve;
			this._reject = reject;
			this._promise = _promise;
			if (params) {
				for (const key of Object.keys(params || {})) {
					this[key] = params[key];
				}
			}
		}
	}

	class _Modal extends PowerModal {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi, promise: false});
			this.ctrl = controller;
			this._resolve = resolve;
			this._reject = reject;
			this._promise = _promise;
			if (params) {
				for (const key of Object.keys(params || {})) {
					this[key] = params[key];
				}
			}
		}
	}
	class _Window extends PowerWindow {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi, promise: false});
			this.ctrl = controller;
			this._resolve = resolve;
			this._reject = reject;
			this._promise = _promise;
			if (params) {
				for (const key of Object.keys(params || {})) {
					this[key] = params[key];
				}
			}
		}
	}

	class _WindowIframe extends PowerWindowIframe {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi, promise: false});
			this.ctrl = controller;
			this._resolve = resolve;
			this._reject = reject;
			this._promise = _promise;
			if (params) {
				for (const key of Object.keys(params || {})) {
					this[key] = params[key];
				}
			}
		}
	}

	if (kind === 'confirm') {
		return _Confirm;
	} else if (kind === 'yesno') {
		return _YesNo;
	} else if (kind === 'modal') {
		return _Modal;
	} else if (kind === 'window') {
		return _Window;
	} else if (kind === 'windowIframe') {
		return _WindowIframe;
	} else {
		return _Alert;
	}
}

export { PowerDialog, PowerAlert, PowerConfirm };

class PowerModal extends PowerDialogBase {
	constructor({$powerUi, classList, promise=false}) {
		super({$powerUi: $powerUi, promise: promise});
		this.isModal = true;

		if (classList) {
			this.classList = classList;
		}
	}

	clickOutside(event) {
		if (event.target.classList.contains('pw-backdrop')) {
			this._cancel();
		}
	}

	template({$title}) {
		if (document.body && document.body.classList) {
			document.body.classList.add('modal-open');
		}
		let classList = ' ';
		if (this.classList) {
			for (const css of this.classList) {
				classList = `${classList} ${css}`;
			}
		}
		// This allow the user define a this.$title on controller constructor, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-modal pw-dialog-container pw-backdrop${this.$powerUi.touchdevice ? ' pw-touchdevice': ''}${classList}" data-pow-event onclick="clickOutside(event)">
					${super.template({$title})}
				</div>`;
	}
}

export { PowerModal };

// This is the old tree
// Remove after implement JSONSchema
class PowerTreeTemplate {
	constructor({$powerUi, tree, boilerplate}) {
		this.boilerplate = boilerplate || false;
		this.$powerUi = $powerUi;
		this.tree = tree;
		this.template = this.buildTemplate(this.tree);
	}

	buildTemplate(tree, id) {
		let template = `<nav ${id ? 'id="' + id + '"' : ''} class="power-tree-view">`;
		for (const item of tree) {
			if (item.kind === 'file') {
				if (this.boilerplate) {
					template = `${template}
					<a class="power-item" data-pow-event onclick="_commit({path:'${item.path}'})"><span class="pw-icon icon-document"></span> ${item.fullName}</a>`;
				} else {
					template = `${template}
					<a class="power-item"><span class="pw-icon icon-document"></span> ${item.fullName}</a>`;
				}
			} else if (item.kind === 'folder') {
				const id = `list-${this.$powerUi._Unique.next()}`;
				template = `${template}
				<a class="power-list" data-power-target="${id}">
					<span class="power-status pw-icon" data-power-active="icon-folder-open" data-power-inactive="icon-folder-close"></span> ${item.fullName}
				</a>
				${this.buildTemplate(item.content, id)}`;
			}
		}
		template = `${template}
		</nav>`;

		return template;
	}
}

// export { PowerTreeTemplate };

class PowerWindow extends PowerDialogBase {
	constructor({$powerUi, promise=false}) {
		super({$powerUi: $powerUi, noEsc: true, promise: promise});
		this.isWindow = true;
		this.defaultMinHeight = 100;
		this.defaultMinWidth = 250;
		this.defaultBorderSize = 5;
		this._minWidth = this.defaultMinWidth;
		this._minHeight = this.defaultMinHeight;
		this.maximizeBt = true;
		this.restoreBt = true;
		this.isMaximized = false;
		this.topTotalHeight = 0;
		this.bottomTotalHeight = 0;
		this.leftTotalWidth = 0;
		this.rightTotalWidth = 0;
		this.totalHeight = 0;
		this.powerWindowModeChange = new UEvent('powerWindowModeChange');
		this.powerWindowStateChange = new UEvent('powerWindowStateChange');
		this.onPowerWindowResize = new UEvent('onPowerWindowResize');
		this.$powerUi.onFixedPowerSplitBarChange.subscribe(this.onFixedPowerSplitBarChange, this);
	}

	// Allow async calls to implement onCancel
	// _cancel(...args) {
	// 	super._cancel(args);
	// }

	_onViewLoad(view) {
		super._onViewLoad(view, true, true);
		this.currentView = view;
		this.fixedBars = {left: [], right: [], top: [], bottom: []};
		const fixedBars = this.currentView.getElementsByClassName('pw-bar-fixed');
		for (const bar of fixedBars) {
			if (bar.classList.contains('pw-left')) {
				this.fixedBars.left.push(bar);
			} else if (bar.classList.contains('pw-right')) {
				this.fixedBars.right.push(bar);
			} else if (bar.classList.contains('pw-top')) {
				this.fixedBars.top.push(bar);
			} else if (bar.classList.contains('pw-bottom')) {
				this.fixedBars.bottom.push(bar);
			}
		}
		this.windowBars = [];
		this.windowToolbars = [];
		const winBars = this.currentView.getElementsByClassName('pw-bar-window-fixed');
		for (const bar of winBars) {
			const _bar = this.$powerUi.componentsManager.bars.find(b=> b.id === bar.id);
			if (_bar) {
				_bar.bar._window = this;
				if (_bar.bar.subscribeToPowerWindowModeChange) {
					_bar.bar.subscribeToPowerWindowModeChange();
				}
				if (_bar.bar.subscribeToOnPowerWindowResize) {
					_bar.bar.subscribeToOnPowerWindowResize();
				}
				this.windowBars.push(_bar);
				if (_bar.bar.isToolbar) {
					this.windowToolbars.push(_bar);
				}
			}
		}

		if (!this.isHiddenRoute) {
			this.loadWindowState();
			// Run a single reorder function at the end of the cycle
			if (!this.$powerUi.reorder) {
				this.$powerUi.reorder = true;
				this.$powerUi.router.onCycleEnds.subscribe(this.reorderDialogsList.bind(this));
			}
		}

		if (this._top !== undefined && this._left !== undefined) {
			this._dialog.style.top = this._top + 'px';
			this._dialog.style.left = this._left + 'px';
		}

		if (this._width !== undefined && this._height !== undefined) {
			this._dialog.style.width = this._width + 'px';
			this._dialog.style.height = this._height + 'px';
		}

		this._width = this._dialog.offsetWidth;
		this._height = this._dialog.offsetHeight;
		this._top = this._dialog.offsetTop;
		this._left = this._dialog.offsetLeft;
		this._lastHeight = 0;
		this._lastwidth = 0;
		// Register events
		this._changeWindowSize = this.changeWindowSize.bind(this);
		this._onMouseUp = this.onMouseUp.bind(this);
		// Make it draggable
		this.addDragWindow();

		// Make it resizable
		this.maximizeBt = this._dialog.getElementsByClassName('icon-maximize')[0];
		this.restoreBt = this._dialog.getElementsByClassName('icon-windows')[0];

		this.bodyEl.style.height = this._height - this.titleBarEl.offsetHeight + 'px';
		let minHeight = parseInt(window.getComputedStyle(this._dialog).getPropertyValue('min-height').replace('px', ''));
		minHeight = minHeight + this.titleBarEl.offsetHeight;
		this._dialog.style['min-height'] = minHeight + 'px';
		this._minHeight = minHeight;

		this.addOnMouseBorderEvents();
		this.setAllWindowElements();

		const minTop = this.minTop();
		const minLeft = this.minLeft();

		this.topLeftLimits(minTop + this.defaultBorderSize, minLeft + this.defaultBorderSize);

		if (this.isMaximized) {
			this.maximize(null, true);
		} else {
			this.restore(null, true);
		}

		this.replaceSizeQueries();
		this.restoreScrollPosition(view);
		this.refreshWindowToolbars();
		this._dialog.classList.add('pw-active');
	}

	onFixedPowerSplitBarChange() {
		this.browserWindowResize();
	}

	changeWindowBars() {
		const manager = this.$powerUi.componentsManager;
		if ((this.isMaximized === true && !manager.smallWindowMode) || (this.isMaximized === false && manager.smallWindowMode)) {
			this._currentTop = -this.defaultBorderSize + this._dialog.offsetTop;
			this._currentBottom = -this.defaultBorderSize + this._dialog.offsetTop;
			this._currentLeft = -this.defaultBorderSize + this.respectLeft;
			this._currentWidth = this._dialog.offsetWidth;
			this._currentHeight = this._dialog.offsetHeight + this.ignoreTop + this.ignoreBottom;
		} else if (this.isMaximized === true && manager.smallWindowMode) {
			this._currentTop = -this.defaultBorderSize;
			this._currentBottom = this._currentTop;
			this._currentLeft = -this.defaultBorderSize;
			this._currentWidth = this._dialog.offsetWidth - (this.defaultBorderSize + this.defaultBorderSize);
			this._currentHeight = this._dialog.offsetHeight - (this.defaultBorderSize + this.defaultBorderSize);
		} else {
			this._currentTop = this._top;
			this._currentBottom = this._currentTop;
			this._currentLeft = this._left;
			this._currentWidth = this._width;
			this._currentHeight = this._height;
		}
		this.$powerUi.componentsManager.setWindowFixedBarsSizeAndPosition(this.windowBars, this);
	}

	refreshWindowToolbars() {
		for (const bar of this.windowToolbars) {
			bar.bar.setStatus();
		}
	}

	// Adapt window to fixed bars and maybe also other power components
	adjustWindowWithComponents() {
		this.respectTop = 0;
		this.ignoreTop = 0;
		this.respectBottom = 0; //this.totalHeight;
		this.ignoreBottom = 0;
		this.respectRight = 0;
		this.respectLeft = 0;
		this.ignoreLeft = 0;
		const manager = this.$powerUi.componentsManager;
		const bars = manager.bars.filter(b=> b.bar.isFixed === true);
		for (const bar of bars) {
			if (!bar.bar.ignore && bar.bar.barPosition === 'top') {
				this.respectTop = this.respectTop + bar.bar.element.offsetHeight;
			} else if (bar.bar.ignore && bar.bar.barPosition === 'top') {
				this.ignoreTop = this.ignoreTop + bar.bar.element.offsetHeight;
			} else if (!bar.bar.ignore && bar.bar.barPosition === 'bottom') {
				this.respectBottom = this.respectBottom + bar.bar.element.offsetHeight;
			} else if (bar.bar.ignore && bar.bar.barPosition === 'bottom') {
				this.ignoreBottom = this.ignoreBottom + bar.bar.element.offsetHeight;
			} else if (bar.bar.ignore && bar.bar.barPosition === 'right') {
				this.respectRight = this.respectRight + bar.bar.element.offsetWidth;//this.$powerUi._offsetComputedAdjustSides(bar.bar.element);
			} else if (!bar.bar.ignore && bar.bar.barPosition === 'left') {
				this.respectLeft = this.respectLeft + bar.bar.element.offsetWidth;//this.$powerUi._offsetComputedAdjustSides(bar.bar.element);
			} else if (bar.bar.ignore && bar.bar.barPosition === 'left') {
				this.ignoreLeft = this.ignoreLeft + bar.bar.element.offsetWidth;//this.$powerUi._offsetComputedAdjustSides(bar.bar.element);
			}
		}

		if (this.isMaximized && !(manager.smallWindowMode) || (!this.isMaximized && manager.smallWindowMode)) {
			const _appContainer = document.getElementById('app-container');
			this._dialog.style.left = _appContainer.offsetLeft - this.ignoreLeft + 'px';
			this._dialog.style.width = _appContainer.offsetWidth + this.respectRight + this.ignoreLeft + 'px';
			// this._dialog.style.width = this.$powerUi._offsetComputedWidth(_appContainer) + this.respectRight + this.respectLeft + 'px';
			this._dialog.style['padding-left'] = 0;
			this._dialog.style['padding-right'] = 0;

			if (this._dialog.offsetTop < this.respectTop) {
				this._dialog.style['padding-top'] = 0;
				this._dialog.style.top = this.respectTop + 'px';
				this._dialog.style.height = window.innerHeight - this.respectTop + 'px';
				this.bodyEl.style.height = window.innerHeight - this.respectTop - this.titleBarEl.offsetHeight + 'px';
			}

			if (this.respectBottom) {
				this._dialog.style.height = window.innerHeight - manager.totalHeight + 'px';
				this.bodyEl.style.height = window.innerHeight - this.respectTop - this.respectBottom - this.titleBarEl.offsetHeight + 'px';
				this._dialog.style['padding-bottom'] = 0;
			}
		} else {
			this._dialog.style['padding-top'] = this.defaultBorderSize + 'px';
			this._dialog.style['padding-bottom'] = this.defaultBorderSize + 'px';
			this._dialog.style['padding-left'] = this.defaultBorderSize + 'px';
			this._dialog.style['padding-right'] = this.defaultBorderSize + 'px';
		}
	}

	_onRemoveCtrl() {
		delete this.zIndex;
		this.saveWindowState();
		this.removeWindowIsMaximizedFromBody();
		this.$powerUi.onFixedPowerSplitBarChange.unsubscribe(this.onFixedPowerSplitBarChange, this);
	}

	_onRemoveView() {
		delete this.currentWindowQuery;
		delete this.currentBarBreakQuery;
		super._onRemoveView();
	}

	removeWindowIsMaximizedFromBody() {
		if (document.body && document.body.classList) {
			document.body.classList.remove('window-is-maximized');
		}
	}

	saveWindowState() {
		if (!this.dialogId) {
			return;
		}
		const winState = {
			width: this._width,
			height: this._height,
			top: this._top,
			left: this._left,
			zIndex: this.zIndex,
			isMaximized: this.isMaximized,
		};
		sessionStorage.setItem(this.dialogId, JSON.stringify(winState));
	}

	loadWindowState() {
		let winState = sessionStorage.getItem(this.dialogId);
		if (winState) {
			winState = JSON.parse(winState);
			this._width = winState.width;
			this._height = winState.height;
			this._top = winState.top;
			this._left = winState.left;
			this.zIndex = winState.zIndex || this.zIndex;
			this._dialog.style.zIndex = this.zIndex;
			this.isMaximized = winState.isMaximized || this.isMaximized;
		}
	}

	addOnMouseBorderEvents() {
		this._dialog.onmousemove = this.onMouseMoveBorder.bind(this);
		this._dialog.onmouseout = this.onMouseOutBorder.bind(this);
		this._dialog.onmousedown = this.onMouseDownBorder.bind(this);
	}

	onMouseMoveBorder(e) {
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget || this.$powerUi._mouseIsDown || this.$powerUi._dragging) {
			return;
		}

		e.preventDefault();
		const viewId = this.$root ? 'root-view' : this._viewId;

		this.removeAllCursorClasses();
		this.cursorPositionOnWindowBound(e);
		if (this._dialog.cursor === 'top-left' || this._dialog.cursor === 'bottom-right') {
			this.$powerUi.addCss(viewId, 'window-left-top');
		} else if (this._dialog.cursor === 'top-right' || this._dialog.cursor === 'bottom-left') {
			this.$powerUi.addCss(viewId, 'window-left-bottom');
		} else if (this._dialog.cursor === 'top' || this._dialog.cursor === 'bottom') {
			this.$powerUi.addCss(viewId, 'window-height');
		} else {
			this.$powerUi.addCss(viewId, 'window-width');
		}
	}

	cursorPositionOnWindowBound(e) {
		const rect = this._dialog.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const width = this._dialog.offsetWidth;
		const height = this._dialog.offsetHeight;
		if ((x <= 15 && y <= 15)) {
			// top left corner
			this._dialog.cursor = 'top-left';
		} else if (x <= 15 && (y > 15 && y >= height - 15)) {
			// bottom left corner
			this._dialog.cursor = 'bottom-left';
		} else if (x >= width - 15 && y <= 15) {
			// top right corner
			this._dialog.cursor = 'top-right';
		} else if (x >= width - 15 && y >= height - 15) {
			// bottom left corner
			this._dialog.cursor = 'bottom-right';
		} else if ((y > 15 && y <= height - 15) && x < 15) {
			// left
			this._dialog.cursor = 'left';
		} else if ((y > 15 && y <= height - 15) && x >= width - 15) {
			// right
			this._dialog.cursor = 'right';
		} else if (y < 15 && (x > 15 && x <= width - 15)) {
			// top
			this._dialog.cursor = 'top';
		} else if (y >= height - 15 && (x > 15 && x <= width - 15)) {
			// bottom
			this._dialog.cursor = 'bottom';
		}
	}

	onMouseOutBorder() {
		if (this.$powerUi._mouseIsDown) {
			return;
		}
		this.removeAllCursorClasses();
	}

	onMouseDownBorder(e) {
		// Re-order the windows z-index
		this.setWindowsOrder(true);
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget) {
			return;
		}
		window.addEventListener("mousemove", this._changeWindowSize);
		window.addEventListener("mouseup", this._onMouseUp);
		e.preventDefault();
		if (this.isMaximized) {
			this._height = window.innerHeight - (this.defaultBorderSize + this.defaultBorderSize);
			this._width = window.innerWidth - (this.defaultBorderSize + this.defaultBorderSize);
			this._top = this.defaultBorderSize;
			this._left = this.defaultBorderSize;
			this.setAllWindowElements();
			this.restore();
		}
		this.$powerUi._mouseIsDown = true;
		this.allowResize = true;
		this._initialX = e.clientX;
		this._initialY = e.clientY;
		this._initialLeft = this._left;
		this._initialTop = this._top;
		this._initialOffsetWidth = this._dialog.offsetWidth;
		this._initialOffsetHeight = this._dialog.offsetHeight;
	}

	changeWindowSize(e) {
		e.preventDefault();
		if (this.allowResize) {
			const rect = this._dialog.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			if (this._dialog.cursor === 'right') {
				this.resizeRightBorder(x);
			} else if (this._dialog.cursor === 'left') {
				this.resizeLeftBorder(x);
			} else if (this._dialog.cursor === 'top') {
				this.resizeTopBorder(y);
			} else if (this._dialog.cursor === 'bottom') {
				this.resizeBottomBorder(y);
			} else if (this._dialog.cursor === 'top-right') {
				this.resizeTopBorder(y);
				this.resizeRightBorder(x);
			} else if (this._dialog.cursor === 'top-left') {
				this.resizeTopBorder(y);
				this.resizeLeftBorder(x);
			} else if (this._dialog.cursor === 'bottom-right') {
				this.resizeBottomBorder(y);
				this.resizeRightBorder(x);
			} else if (this._dialog.cursor === 'bottom-left') {
				this.resizeBottomBorder(y);
				this.resizeLeftBorder(x);
			}

			this.avoidExceedingLimits();
			this.setAllWindowElements();
			this.onPowerWindowResize.broadcast();
		}
	}

	topLeftLimits(minTop, minLeft) {
		if (this._left < minLeft) {
			this._left = minLeft;
		}
		if (this._top < minTop) {
			this._top = minTop;
		}
	}

	avoidExceedingLimits() {
		const minTop = this.minTop();
		const maxBottom = this.maxBottom();
		const minLeft = this.minLeft();
		const maxRight = this.maxRight();
		let widthFix = 0;
		let heightFix = 0;
		if (this._width < this._minWidth) {
			widthFix = this._width - this._minWidth;
			this._width = this._minWidth;
		}
		if (this._height < this._minHeight) {
			heightFix = this._height - this._minHeight;
			this._height = this._minHeight;
		}
		this.topLeftLimits(minTop, minLeft);
		// Left limits
		if (this._width === this._minWidth && this._dialog.cursor.includes('left')) {
			this._left = this._left + widthFix;
		} else if (this._left <= minLeft && this._lastWidth < this._width && this._dialog.cursor.includes('left')) {
			this._width = this._lastWidth;
		}
		// Top limits
		if (this._height === this._minHeight && this._dialog.cursor.includes('top')) {
			this._top = this._top + heightFix;
		} else if (this._top <= minTop && this._lastHeight < this._height && this._dialog.cursor.includes('top')) {
			this._height = this._lastHeight;
		}
		// Right limits
		if ((this._left + this._width) + maxRight + (this.defaultBorderSize + this.defaultBorderSize) > window.innerWidth) {
			this._width = (window.innerWidth - this._left) - maxRight - (this.defaultBorderSize + this.defaultBorderSize);
		}
		// Bottom limits
		if ((this._top + this._height) + maxBottom + (this.defaultBorderSize + this.defaultBorderSize) > window.innerHeight) {
			this._height = (window.innerHeight - this._top) - maxBottom - (this.defaultBorderSize + this.defaultBorderSize);
		}
		this.topLeftLimits(minTop, minLeft);

		this._lastHeight = this._height;
		this._lastWidth = this._width;
		this._lastTop = this._top;
		this._lastLeft = this._left;
	}

	browserWindowResize() {
		if (this.isMaximized) {
			this.maximize();
		} else {
			this.restore();
		}
	}

	orientationChange() {
		this.browserWindowResize();
		this.powerWindowStateChange.broadcast();
	}

	_maximizeDialog() {
		this._dialog.style.top = -this.defaultBorderSize + 'px';
		this._dialog.style.left = -this.defaultBorderSize + 'px';
		this._dialog.style.height = window.innerHeight + 'px';
		this._dialog.style.width = window.innerWidth + 'px';
		this.bodyEl.style.height = window.innerHeight - this.titleBarEl.offsetHeight + 'px';
	}

	maximize(event, preventBroadcast) {
		if (event) {
			event.preventDefault();
		}
		this._maximizeDialog();
		this.maximizeBt.style.display = 'none';
		this.restoreBt.style.display = 'block';
		this.isMaximized = true;
		this.saveWindowState();
		if (document.body && document.body.classList) {
			document.body.classList.add('window-is-maximized');
		}
		this.adjustWindowWithComponents();
		// Run once to adjust bars and other elements
		this.replaceSizeQueries();
		this.changeWindowBars();
		this.refreshWindowToolbars();

		if (!preventBroadcast) {
			this.powerWindowStateChange.broadcast();
			this.$powerUi.onPowerWindowChange.broadcast();
		}
		this.$powerUi.componentsManager.restartObserver();
		// Run final to adjust final positions after body change size
		this.replaceSizeQueries();
		this.onPowerWindowResize.broadcast();
	}

	restore(event, preventBroadcast) {
		if (event) {
			event.preventDefault();
		}
		this.maximizeBt.style.display = 'block';
		this.restoreBt.style.display = 'none';
		if (!this.$powerUi.componentsManager.smallWindowMode) {
			this._dialog.style.top = this._top + 'px';
			this._dialog.style.left = this._left + 'px';
			this._dialog.style.height = this._height + 'px';
			this._dialog.style.width = this._width + 'px';
			this.bodyEl.style.height = this._height - this.titleBarEl.offsetHeight + 'px';
		} else {
			this._maximizeDialog();
		}
		this.isMaximized = false;
		this.saveWindowState();
		this.removeWindowIsMaximizedFromBody();
		this.adjustWindowWithComponents();
		// Run once to adjust bars and other elements
		this.replaceSizeQueries();
		this.changeWindowBars();
		this.refreshWindowToolbars();

		if (!preventBroadcast) {
			this.powerWindowStateChange.broadcast();
			this.$powerUi.onPowerWindowChange.broadcast();
		}
		this.$powerUi.componentsManager.restartObserver();
		// Run final to adjust final positions after body change size
		this.replaceSizeQueries();
		this.onPowerWindowResize.broadcast();
	}

	setBorderSizes() {
		this._top = this._top - this.defaultBorderSize;
		this._left = this._left - this.defaultBorderSize;
		this._width = this._width - this.defaultBorderSize;
		this._height = this._height - this.defaultBorderSize;
	}

	setAllWindowElements() {
		this._dialog.style.width =  this._width +'px';
		this._dialog.style.height =  this._height + 'px';
		this.bodyEl.style.height = this._height - this.titleBarEl.offsetHeight + 'px';
		this._dialog.style.left = this._left + 'px';
		this._dialog.style.top = this._top + 'px';

		// Add the classes to create a css "midia query" for the window
		this.replaceSizeQueries();
		this.saveWindowState();
		this.changeWindowBars();
		this.refreshWindowToolbars();
	}

	replaceSizeQueries() {
		this.replaceWindowSizeQuery();
		this.replaceBarBreakQuery();
	}

	resizeRightBorder(x) {
		this._width = this._initialOffsetWidth + this._initialLeft + (x - this._initialX) - 10;
	}

	resizeLeftBorder(x) {
		const diff = (x - this._initialX);
		this._left = this._initialLeft + this._left + diff;
		this._width = this._width - (this._initialLeft + diff);
	}

	resizeTopBorder(y) {
		const diff = (y - this._initialY);
		this._top = this._initialTop + this._top + diff;
		this._height = this._height - (this._initialTop + diff);
	}

	resizeBottomBorder(y) {
		this._height = this._initialOffsetHeight + this._initialTop + (y - this._initialY) - 10;
	}

	onMouseUp() {
		this._dialog.classList.add('pw-active');
		this.allowResize = false;
		this.$powerUi._mouseIsDown = false;
		this.removeAllCursorClasses();
		window.removeEventListener("mousemove", this._changeWindowSize);
		window.removeEventListener("mouseup", this._onMouseUp);
		if (this.onResize) {
			this.onResize();
		}
	}

	removeAllCursorClasses() {
		const viewId = this.$root ? 'root-view' : this._viewId;
		this.$powerUi.removeCss(viewId, 'window-left-top');
		this.$powerUi.removeCss(viewId, 'window-left-bottom');
		this.$powerUi.removeCss(viewId, 'window-width');
		this.$powerUi.removeCss(viewId, 'window-height');
	}

	template({$title}) {
		// This allow the user define a this.$title on controller constructor or compile, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-window${this.$powerUi.touchdevice ? ' pw-touchdevice': ''} pw-dialog-container">
					${super.template({$title})}
				</div>`;
	}

	// Allow simulate midia queries with power-window
	replaceWindowSizeQuery() {
		let changeWindowQueryTo = this.currentWindowQuery;
		let width = this.bodyEl.offsetWidth;
		if (width <= 600) {
			changeWindowQueryTo = 'pw-wsize-tinny';
		} else if (width >= 601 && width <= 900) {
			changeWindowQueryTo = 'pw-wsize-small';
		} else if (width >= 901 && width <= 1200) {
			changeWindowQueryTo = 'pw-wsize-medium';
		} else if (width >= 1201 && width <= 1500) {
			changeWindowQueryTo = 'pw-wsize-large';
		} else {
			changeWindowQueryTo = 'pw-wsize-extra-large';
		}
		this.removeWindowQueries();
		this._dialog.classList.add(changeWindowQueryTo);
		this.currentWindowQuery = changeWindowQueryTo;
	}

	// Remove any window midia query from window classes
	removeWindowQueries() {
		this._dialog.classList.remove('pw-wsize-tinny');
		this._dialog.classList.remove('pw-wsize-small');
		this._dialog.classList.remove('pw-wsize-medium');
		this._dialog.classList.remove('pw-wsize-large');
		this._dialog.classList.remove('pw-wsize-extra-large');
	}

	replaceBarBreakQuery() {
		let changeBarBreakQueryTo = this.currentBarBreakQuery;
		let width = this._width;
		if (this.isMaximized) {
			width = this._dialog.offsetWidth;
		}

		if (width <= 768 || this.$powerUi.componentsManager.smallWindowMode) {
			changeBarBreakQueryTo = 'pw-bar-break';
		} else {
			changeBarBreakQueryTo = false;
		}

		this.removeBarBreakQuery();
		if (changeBarBreakQueryTo) {
			this._dialog.classList.add(changeBarBreakQueryTo);
		}
		this.currentBarBreakQuery = changeBarBreakQueryTo;
		this.powerWindowModeChange.broadcast();
	}

	removeBarBreakQuery() {
		this._dialog.classList.remove('pw-bar-break');
	}

	addDragWindow() {
		this.pos1 = 0;
		this.pos2 = 0;
		this.pos3 = 0;
		this.pos4 = 0;

		const titleBar = this.currentView.getElementsByClassName('pw-title-bar')[0];
		if (titleBar) {
			// if the title bar exists move from it
			titleBar.onmousedown = this.dragMouseDown.bind(this);
			titleBar.ondblclick = this.onDoubleClickTitle.bind(this);
		} else {
			// or move from anywhere inside the container
			this._dialog.onmousedown = this.dragMouseDown.bind(this);
		}
	}

	onDoubleClickTitle(event) {
		event.preventDefault();
		if (this.isMaximized) {
			this.restore(event);
		} else {
			this.maximize(event);
		}
	}

	dragMouseDown(event) {
		event = event || window.event;
		event.preventDefault();
		if (this.isMaximized || this.$powerUi.componentsManager.smallWindowMode) {
			this._dialog.classList.add('pw-active');
			return;
		}
		this.$powerUi._dragging = true;
		// get initial mouse cursor position
		this.pos3 = event.clientX;
		this.pos4 = event.clientY;
		// call a function when the cursor moves
		this._elementDrag = this.elementDrag.bind(this);
		// Cancel if user giveup
		this._endDragWindow = this.endDragWindow.bind(this);
		window.addEventListener("mousemove", this._elementDrag);
		window.addEventListener("mouseup", this._endDragWindow);
	}

	elementDrag(event) {
		event = event || window.event;
		event.preventDefault();
		// calculate the new cursor position
		this.pos1 = this.pos3 - event.clientX;
		this.pos2 = this.pos4 - event.clientY;
		this.pos3 = event.clientX;
		this.pos4 = event.clientY;
		// set the _dialog's new position
		this._top = this._dialog.offsetTop - this.pos2;
		this._left = this._dialog.offsetLeft - this.pos1;

		this.avoidDragOutOfScreen();

		this._dialog.style.top = this._top + 'px';
		this._dialog.style.left = this._left + 'px';
		this._top = this._dialog.offsetTop;
		this._left = this._dialog.offsetLeft;
		this.changeWindowBars();
	}

	minTop() {
		let minTop = 0;
		for (const bar of this.fixedBars.top) {
			minTop = minTop + bar.offsetHeight;
		}
		return minTop;
	}

	maxBottom() {
		let maxBottom = 0;
		for (const bar of this.fixedBars.bottom) {
			maxBottom = maxBottom + bar.offsetHeight;
		}
		return maxBottom;
	}

	minLeft() {
		let minLeft = 0;
		for (const bar of this.fixedBars.left) {
			minLeft = minLeft + bar.offsetWidth;
		}
		return minLeft;
	}

	maxRight() {
		let maxRight = 0;
		for (const bar of this.fixedBars.right) {
			maxRight = maxRight + bar.offsetWidth;
		}
		return maxRight;
	}

	avoidDragOutOfScreen() {
		const minTop = this.minTop();
		const maxBottom = this.maxBottom();
		const minLeft = this.minLeft();
		const maxRight = this.maxRight();
		if (this._top + this._height + 10 > window.innerHeight - maxBottom) {
			this._top = window.innerHeight - (this._height + maxBottom) - 10;
		}
		if (this._top < minTop) {
			this._top = minTop;
		}
		if (this._left + this._width + 10 >= window.innerWidth - maxRight) {
			this._left = window.innerWidth - (this._width + maxRight) - 10;
		}
		if (this._left < minLeft) {
			this._left = minLeft;
		}
	}

	endDragWindow() {
		this._dialog.classList.add('pw-active');
		this._bodyHeight = window.getComputedStyle(this.bodyEl).height;
		// stop moving when mouse button is released:
		window.removeEventListener("mouseup", this._endDragWindow);
		window.removeEventListener("mousemove", this._elementDrag);
		this.$powerUi._dragging = false;
		this.$powerUi._mouseIsDown = false;
		this.saveWindowState();
	}

	setWindowsOrder(preventActivateWindow) {
		this.$powerUi.dialogs = this.$powerUi.dialogs.filter(d => d.id !== this.dialogId);
		let biggerIndex = 1999;
		for (const dialog of this.$powerUi.dialogs) {
			biggerIndex = biggerIndex + 1;
			dialog.ctrl.zIndex = biggerIndex;
			dialog.ctrl._dialog.style.zIndex = biggerIndex;
			dialog.ctrl._dialog.classList.remove('pw-active');
			if (dialog.ctrl.isWindow && dialog.ctrl.saveWindowState) {
				dialog.ctrl.saveWindowState();
			}
		}

		this.zIndex = biggerIndex + 1;
		this._dialog.style.zIndex = this.zIndex;
		this.$powerUi.dialogs.push({id: this.dialogId, ctrl: this});
		// Prevent set the active if dragging or resizing
		if (!preventActivateWindow || this.isMaximized || this.$powerUi.componentsManager.smallWindowMode) {
			this._dialog.classList.add('pw-active');
		} else {
			this._dialog.classList.remove('pw-active');
		}
		this.saveWindowState();
	}

	reorderDialogsList() {
		// Run once and reset reorder to false so refresh can re-run it
		this.$powerUi.reorder = false;
		if (this.$powerUi.dialogs.length <= 1) {
			return;
		}
		this.$powerUi.dialogs.sort(function (a, b) {
			if (a.ctrl.zIndex > b.ctrl.zIndex) {
				return 1;
			} else {
				return -1;
			}
		});
	}
}

class PowerWindowIframe extends PowerWindow {
	constructor({$powerUi, promise=true}) {
		super({$powerUi: $powerUi, noEsc: true, promise: promise});
		this.isWindow = true;
	}

	_onViewLoad(view) {
		// Make it resizable
		this.iframe = view.getElementsByTagName('iframe')[0];
		this.coverIframe = view.getElementsByClassName('pw-cover-iframe')[0];
		super._onViewLoad(view);
	}

	maximize(event) {
		if (event) {
			event.preventDefault();
		}
		this._dialog.classList.add('pw-active');
		super.maximize(event);
		this.resizeIframeAndCover();
	}

	restore(event) {
		if (event) {
			event.preventDefault();
		}
		if (this.$powerUi.componentsManager.smallWindowMode) {
			this._dialog.classList.add('pw-active');
		}
		super.restore(event);
		this.resizeIframeAndCover();
	}

	resizeIframeAndCover() {
		this.iframe.style.height = this._currentHeight - this.titleBarEl.offsetHeight + 'px';
		this.coverIframe.style.height = this.iframe.style.height;
		this.coverIframe.style.width = this._currentWidth + 'px';
		this.coverIframe.style.top = this.titleBarEl.offsetHeight + this.defaultBorderSize + 'px';
	}

	setAllWindowElements() {
		super.setAllWindowElements();
		this.resizeIframeAndCover();
	}

	template({$title, $url}) {
		// This allow the user define a this.$title on controller constructor or compile, otherwise use the route title
		this.$title = this.$title || $title;
		const id = `iframe_${this.$powerUi._Unique.next()}`;
		return `<div class="pw-window${this.$powerUi.touchdevice ? ' pw-touchdevice': ''} pw-dialog-container">
					<div class="pw-title-bar">
						<span class="pw-title-bar-label">${this.$title}</span>
						<div data-pow-event onmousedown="_cancel()" class="pw-bt-dialog-title pw-icon icon-cancel-black"></div>
						${this.restoreBt ? '<div style="display:none;" data-pow-event onclick="restore(event)" class="pw-bt-dialog-title pw-icon icon-windows"></div>' : ''}
						${this.maximizeBt ? '<div data-pow-event onclick="maximize(event)" class="pw-bt-dialog-title pw-icon icon-maximize"></div>' : ''}
					</div>
					<div class="pw-body pw-body-iframe">
						<iframe frameBorder="0" name="${id}" id="${id}" data-pw-content src="${$url}"></iframe>
						<div class="pw-cover-iframe" data-pow-event onmousedown="dragMouseDown()"></div>
					</div>
				</div>`;
	}

	// Override PowerWidget $buildTemplate
	$buildTemplate({template, title}) {
		return this.template({$title: title || null, $url: template});
	}
}

export { PowerWindow, PowerWindowIframe };

class _PowerBarsBase extends PowerTarget {
	constructor(bar, $powerUi) {
		super(bar);
		this.$powerUi = $powerUi;
		this._$pwActive = false;
		this.isBar = true;
		this.order = 0; // This helps keep zIndex
		this.id = this.element.getAttribute('id');
		// Bar priority
		this.priority = this.element.getAttribute('data-pw-priority');
		this.priority = this.priority ? parseInt(this.priority) : null;
		if (this.element.classList.contains('pw-bar-window-fixed')) {
			this.isWindowFixed = true;
			this.isFixed = false;
		} else if (this.element.classList.contains('pw-bar-fixed')) {
			this.isFixed = true;
		} else {
			this.isFixed = false;
		}
		if (this.element.classList.contains('pw-top')) {
			this.barPosition = 'top';
		} else if (this.element.classList.contains('pw-bottom')) {
			this.barPosition = 'bottom';
		} else if (this.element.classList.contains('pw-left')) {
			this.barPosition = 'left';
		} else if (this.element.classList.contains('pw-right')) {
			this.barPosition = 'right';
		}
		if (this.element.classList.contains('pw-ignore')) {
			this.ignore = true;
		}
		// Add this bar to componentsManager.bars
		this.$powerUi.componentsManager.bars.push({id: this.id, bar: this});
		if (this.isFixed || this.isWindowFixed) {
			this.$powerUi.componentsManager.observe(this);
		}
	}

	onRemove() {
		// Remove this bar from componentsManager.bars
		this.$powerUi.componentsManager.bars = this.$powerUi.componentsManager.bars.filter(bar=> bar.id !== this.id);
		if (this.isFixed || this.isWindowFixed) {
			this.$powerUi.componentsManager.stopObserve(this.element);
		}
	}

	init() {
	}
}

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
			for (const action of Object.keys(this.ctx.powerAccordion.childrenActions || {})) {
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

class PowerList extends PowerTarget {
	constructor(element) {
		super(element);

		this._target = this.element.dataset.powerTarget;
		if (!this._target) {
			console.error('power-action/power-list/power-toggle selectors needs a power element target', this.element);
			throw 'Missing power-action/power-list/power-toggle target. Please define it: data-power-target="power_element_id"';
		}
	}

	init() {
		this.clickEvent = (this.$powerUi.devMode && this.$powerUi.devMode.child && this.$powerUi.devMode.isEditable) ? 'dblclick' : 'click';
		// Add the target element to the list/action
		// It selects the first element with this id that have a powerTarget
		const allPowerObjsById = this.$powerUi.powerTree.allPowerObjsById[this._target];
		for (const index in allPowerObjsById) {
			if (allPowerObjsById[index].powerTarget) {
				this.targetObj = allPowerObjsById[index];
			}
		}
		// Add the action to the target Class
		this.subscribe({event: this.clickEvent, fn: this.toggle});
	}

	toggle() {
		if (this._$pwActive) {
			this._$pwActive = false;
			this.targetObj._$pwActive = false;
			this.targetObj.element.classList.remove('power-active');
			this.element.classList.remove('power-active');
		} else {
			this._$pwActive = true;
			this.targetObj._$pwActive = true;
			this.targetObj.element.classList.add('power-active');
			this.element.classList.add('power-active');
		}
		// Broadcast toggle custom event
		this.broadcast('toggle', true);
	}
}

// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-list'});

class PowerAction extends PowerList {
	constructor(element) {
		super(element);
	}

	init() {
		super.init();
		this.targetObj.powerAction = this;
		// this.subscribe({event: 'click', fn: this.toggle});
	}

	// Params allows a flag to "avoidCallAction"
	// Some times the targetObj.action needs to call the action.toggle, but if the action.toggle also calls the targetObj.action a loop will occurs
	// The avoidCallAction flag avoid the loop
	toggle(params={}) {
		if (this.targetObj.action && !params.avoidCallAction) this.targetObj.action();
		if (this._$pwActive) {
			// Give menu a z-index to put it on top of any windows
			if (this.$pwMain.isBar) {
				if (this.$pwMain.order > 0) {
					this.$pwMain.order = this.$pwMain.order - 1;
					if (this.$pwMain.order === 0) {
						this.$pwMain.element.classList.remove('pw-order');
					}
				}
			}
		} else {
			// Give menu its normal z-index
			if (this.$pwMain.isBar) {
				if (this.$pwMain.order === 0) {
					this.$pwMain.element.classList.add('pw-order');
				}
				this.$pwMain.order = this.$pwMain.order + 1;
			}
		}
		super.toggle();
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
		const devMode = (this.$powerUi.devMode && this.$powerUi.devMode.child && this.$powerUi.devMode.isEditable);

		// Do not close if click some power-action
		if ((!elementToCheck.classList.contains('power-status') && !elementToCheck.classList.contains('power-action') && !elementToCheck.classList.contains('power-list') && !elementToCheck.classList.contains('power-toggle')) && ((elementToCheck.parentNode && elementToCheck.parentNode.classList) && (!elementToCheck.parentNode.classList.contains('power-status') && !elementToCheck.parentNode.classList.contains('power-action') && !elementToCheck.parentNode.classList.contains('power-list') && !elementToCheck.parentNode.classList.contains('power-toggle'))) && (!devMode || (devMode && !elementToCheck.classList.contains('power-item') && !elementToCheck.parentNode.classList.contains('power-item')))) {
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

class PowerActionsBar extends _PowerBarsBase {
	constructor(bar, $powerUi) {
		super(bar, $powerUi);
		// The position the dropmenu will try to appear by default
		this.defaultPosition = this.element.getAttribute('data-pw-position');
		// If user does not define a default position, see if is horizontal or vertical bar
		if (this.element.classList.contains('pw-horizontal')) {
			this.orientation = 'horizontal';
		} else {
			this.orientation = 'vertical';
		}
	}

	onRemove() {
		super.onRemove();

		for (const action of this.childrenPowerActions) {
			// Only atach the windows like behaviour if not a touchdevice
			if (!this.$powerUi.touchdevice) {
				action.unsubscribe({event: this.clickEvent, fn: this.hoverModeOn, bar: this});
				action.unsubscribe({event: 'toggle', fn: this.maySetHoverModeOff, action: action, bar: this});
			}
		}
	}

	init() {
		super.init();
		this.clickEvent = (this.$powerUi.devMode && this.$powerUi.devMode.child && this.$powerUi.devMode.isEditable) ? 'dblclick' : 'click';
		this.mouseenterEvent = (this.$powerUi.devMode && this.$powerUi.devMode.child && this.$powerUi.devMode.isEditable) ? 'dblclick' : 'mouseenter';
		// Child powerActions - Hold all the power actions in this bar, but not the children of childrens (the ones on the internal Power dropmenus)
		this.childrenPowerActions = this.getChildrenByPowerCss('powerAction');
		// Child powerItem - Hold all the power items in this bar, but not the ones on the internal Power dropmenus
		this.childrenPowerItems = this.getChildrenByPowerCss('powerItem');
		// Inner powerActions without the childrens - Hold all the power actions in the internal Power dropmenus, but not the childrens directly in this bar
		this.innerPowerActionsWithoutChildren = this.getInnerWithoutChildrenByPowerCss('powerAction');
		// Child powerDropmenus - Hold all the power Dropmenus in this bar, but not the children of childrens (the ones on the internal Power dropmenus)
		this.childrenPowerDropmenus = this.getChildrenByPowerCss('powerDropmenu');
		// Inner powerDropmenus - Hold all the power Dropmenus in this bar, including the childrens directly in this bar
		this.innerPowerDropmenus = this.getInnerByPowerCss('powerDropmenu');

		// Define the position to show all the dropmenus
		// The dropmenus directly on the bar may start as a dropdown or dropup and the children dropmenus may start on left or right
		for (const dropmenu of this.innerPowerDropmenus) {
			if (dropmenu.isRootElement) {
				defineRootDropmenusPosition(this, dropmenu);
			} else {
				defineInnerDropmenusPosition(this, dropmenu);
			}
		}

		// Bar subscribe to any action to allow "windows like" behaviour on Power dropmenus
		// When click the first bar item on Windows and Linux, the other Power dropmenus opens on hover
		for (const action of this.childrenPowerActions) {
			// Only atach the windows like behaviour if not a touchdevice
			if (!this.$powerUi.touchdevice) {
				action.subscribe({event: this.clickEvent, fn: this.hoverModeOn, bar: this});
				action.subscribe({event: 'toggle', fn: this.maySetHoverModeOff, action: action, bar: this});
			}
		}
	}

	hoverModeOn(ctx, event, params) {
		// Abort if is moving
		if (params.bar.$powerUi.tmp.bar._mouseIsMovingTo) {
			// User may move over the same element, only add new target if not the same target
			if (params.bar.$powerUi.tmp.bar._mouseIsMovingTo.id !== params.bar.id) {
				params.bar.moveOverPossibleNewTarget(params.action);
			}
			return;
		}
		for (const action of params.bar.childrenPowerActions) {
			action.subscribe({event: params.bar.mouseenterEvent, fn: params.bar.onMouseEnterAction, action: action, bar: params.bar});
			action.subscribe({event: this.clickEvent, fn: params.bar.onMouseEnterAction, action: action, bar: params.bar});
		}
	}

	onMouseEnterAction(ctx, event, params) {
		// Abort if is moving
		if (params.bar.$powerUi.tmp.bar._mouseIsMovingTo) {
			// User may moving over the same element, only add new target if not the same target
			if (params.bar.$powerUi.tmp.bar._mouseIsMovingTo.id !== params.action.id) {
				params.bar.moveOverPossibleNewTarget(params.action);
			}
			return;
		}
		if (params.action._$pwActive) {
			return;
		}
		params.action.toggle();
		params.bar.onMouseEnterItem(ctx, event, params, true);
		for (const item of params.bar.childrenPowerItems) {
			item.subscribe({event: params.bar.mouseenterEvent, fn: params.bar.onMouseEnterItem, action: params.action, bar: params.bar, item: item});
		}
		params.bar.startWatchMouseMove(ctx, event, params);
	}

	onMouseEnterItem(ctx, event, params, onMouseEnterAction) {
		// Abort if is moving
		if (this.$powerUi.tmp.bar._mouseIsMovingTo) {
			// User may moving over the same element, only add new target if not the same target
			if (this.$powerUi.tmp.bar._mouseIsMovingTo.id !== params.action.id) {
				params.bar.moveOverPossibleNewTarget(params.action);
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
		for (const action of params.bar.innerPowerActionsWithoutChildren) {
			if (action._$pwActive) {
				action.toggle();
			}
		}
		// Close any first level possible active dropmenu if not the current dropmenu
		for (const action of params.bar.childrenPowerActions) {
			if (action._$pwActive && (action.id !== params.action.id)) {
				action.toggle();
			}
		}

		// Unsubscribe from all the power items mouseenter
		for (const item of params.bar.childrenPowerItems) {
			item.unsubscribe({event: params.bar.mouseenterEvent, fn: params.bar.onMouseEnterItem, action: params.action, bar: params.bar});
		}

	}

	maySetHoverModeOff(ctx, event, params) {
		setTimeout(function() {
			let someDropdownIsOpen = false;
			// See if there is any childrenPowerActions active
			for (const action of params.bar.childrenPowerActions) {
				if (action._$pwActive) {
					someDropdownIsOpen = true;
				}
			}

			// If there is no active action, set hover mode to off
			if (someDropdownIsOpen === false) {
				params.bar.hoverModeOff(ctx, event, params);
			} else {
				params.bar.startWatchMouseMove(ctx, event, params);
			}
		}, 50);
	}
	// Deactivate hover mode
	hoverModeOff(ctx, event, params) {
		params.bar.stopWatchMouseMove();
		for (const action of params.bar.childrenPowerActions) {
			action.unsubscribe({event: params.bar.mouseenterEvent, fn: params.bar.onMouseEnterAction, action: action, bar: params.bar});
			action.unsubscribe({event: this.clickEvent, fn: params.bar.onMouseEnterAction, action: action, bar: params.bar});
		}
	}

	// Bellow functions temporary abort the hover mode to give time to users move to the opened dropmenu
	moveOverPossibleNewTarget(item) {
		this.$powerUi.tmp.bar._possibleNewTarget = item;
	}
	onmousestop() {
		// Only stopWatchMouseMove if the _possibleNewTarget are not already active
		// If it is already active then wait user to mover over it
		if (this.$powerUi.tmp.bar._possibleNewTarget && !this.$powerUi.tmp.bar._possibleNewTarget._$pwActive) {
			const item = this.$powerUi.tmp.bar._possibleNewTarget;
			const self = this;
			setTimeout(function () {
				item.broadcast(self.mouseenterEvent);
			}, 10);
			this.stopWatchMouseMove();
		} else {
			this.$powerUi.tmp.bar._resetMouseTimeout();
		}
	}
	// Called when mouse move
	resetMouseTimeout() {
		clearTimeout(this.$powerUi.tmp.bar.timeout);
		this.$powerUi.tmp.bar.timeout = setTimeout(this.$powerUi.tmp.bar._onmousestop, 120);
	}
	startWatchMouseMove(ctx, event, params) {
		if (this.$powerUi.tmp.bar._mouseIsMovingTo) {
			return;
		}
		params.action.targetObj.subscribe({event: params.bar.mouseenterEvent, fn: this.stopWatchMouseMove, action: params.action, bar: params.bar});
		this.$powerUi.tmp.bar._mouseIsMovingTo = params.action.targetObj;
		this.$powerUi.tmp.bar._onmousestop = this.onmousestop.bind(this);
		this.$powerUi.tmp.bar._resetMouseTimeout = this.resetMouseTimeout.bind(this);
		this.$powerUi.tmp.bar.timeout = setTimeout(this.$powerUi.tmp.bar._onmousestop, 300);
		document.addEventListener('mousemove', this.$powerUi.tmp.bar._resetMouseTimeout, true);
	}
	stopWatchMouseMove() {
		this.$powerUi.tmp.bar._mouseIsMovingTo = false;
		this.$powerUi.tmp.bar._possibleNewTarget = false;
		clearTimeout(this.$powerUi.tmp.bar.timeout);
		document.removeEventListener('mousemove', this.$powerUi.tmp.bar._resetMouseTimeout, true);
		this.unsubscribe({event: this.mouseenterEvent, fn: this.stopWatchMouseMove});
	}

	toggle() {
		// PowerAction implements an optional "click out" system to allow toggles to hide
		this.powerAction.ifClickOut();

		// Removed becouse power-toggle already implement a toggle event
		// Broadcast toggle custom event
		// this.powerAction.broadcast('toggle', true);
	}

	// The powerToggle call this action method
	action() {
		this.toggle();
	}
}

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
		this.defaultPosition = this.element.getAttribute('data-pw-position');

		// Mark the root of the dropmenu tree, first level element
		this._markRootAndMenuDropmenu();
	}

	init() {
		this.clickEvent = (this.$powerUi.devMode && this.$powerUi.devMode.child && this.$powerUi.devMode.isEditable) ? 'dblclick' : 'click';
		this.mouseenterEvent = (this.$powerUi.devMode && this.$powerUi.devMode.child && this.$powerUi.devMode.isEditable) ? 'dblclick' : 'mouseenter';
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
			if (searchResult.powerElement.className.includes('pw-bar')) {
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
			// User may move over the same element, only add new target if not the same target
			if (this.$powerUi.tmp.dropmenu._mouseIsMovingTo.id !== this.id) {
				this.moveOverPossibleNewTarget(this);
			}
			return;
		}
		for (const action of this.childrenPowerActions) {
			action.subscribe({event: this.mouseenterEvent, fn: this.onMouseEnterAction, action: action, dropmenu: this});
			action.subscribe({event: this.clickEvent, fn: this.onMouseEnterAction, action: action, dropmenu: this});
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
			item.subscribe({event: params.dropmenu.mouseenterEvent, fn: params.dropmenu.onMouseEnterItem, action: params.action, dropmenu: params.dropmenu, item: item});
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
			item.unsubscribe({event: params.dropmenu.mouseenterEvent, fn: params.dropmenu.onMouseEnterItem, action: params.action, dropmenu: params.dropmenu});
		}

	}

	// Deactivate hover mode
	hoverModeOff() {
		this.stopWatchMouseMove();
		for (const action of this.childrenPowerActions) {
			action.unsubscribe({event: this.mouseenterEvent, fn: this.onMouseEnterAction, action: action, dropmenu: this});
			action.unsubscribe({event: this.clickEvent, fn: this.onMouseEnterAction, action: action, dropmenu: this});
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
				item.broadcast(this.mouseenterEvent);
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
		params.action.targetObj.subscribe({event: params.dropmenu.mouseenterEvent, fn: this.stopWatchMouseMove, action: params.action, dropmenu: params.dropmenu});
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
		document.removeEventListener(this.mouseenterEvent, this.$powerUi.tmp.dropmenu._resetMouseTimeout, true);
		this.unsubscribe({event: this.mouseenterEvent, fn: this.stopWatchMouseMove});
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
		let hasChanged = false;
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
			hasChanged = true;
		} else if (elementRect.left < 0) {
		// Correct position if left is not allowed anymore
		// Change position if left element is bigger than left document
			pos.leftRight = 'right';
			changes.leftRight++;
			hasChanged = true;
		}
		// Bottom may also not allowed anymore
		// Change position if bottom element is bigger than bottom document
		if (elementRect.bottom > document.defaultView.innerHeight) {
			pos.topDown = 'top';
			changes.topDown++;
			hasChanged = true;
		} else if (elementRect.top < 0) {
			pos.topDown = 'bottom';
			changes.topDown++;
			hasChanged = true;
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

		// Also need to correct the new position if is inside fixed element with scroll
		if (hasChanged) {
			this.fixPositionIfInsideFixedElement();
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
				if (window.getComputedStyle(self.powerAction.element).position === 'fixed') {
					self.element.style.position = 'fixed';
					self.element.style.left = window.getComputedStyle(self.powerAction.element).left;
				}
				// If drop-menus are inside some fixed element wee need to remove any scroll from position
				self.fixPositionIfInsideFixedElement();
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

	fixPositionIfInsideFixedElement() {
		const self = this;
		let scrollTop = 0;
		let scrollLeft = 0;
		let isInnerDropMenu = false;

		const searchFixedEl = PowerTree._searchUpDOM(self.element, function(element) {
			// If is inside another dropmenu cancel the search
			if (element.classList.contains('power-dropmenu')) {
				isInnerDropMenu = true;
				return true;
			}
			// Find and return the fixed element
			// Also add anny scrollTop and scrollLeft
			scrollTop = scrollTop + element.scrollTop;
			scrollLeft = scrollLeft + element.scrollLeft;
			if (window.getComputedStyle(element).getPropertyValue('position') === 'fixed' || element.id === 'app-container') {
				return true;
			}
		});

		// Only if is a fixed element and not some other dropdown
		if (searchFixedEl.conditionResult && !isInnerDropMenu) {
			if (scrollTop > 0) {
				const top = parseInt(window.getComputedStyle(self.element).top.replace('px', '') || 0);
				self.element.style.top = (top - scrollTop) + 'px';
			}
			if (scrollLeft > 0) {
				const left = parseInt(window.getComputedStyle(self.element).left.replace('px', '') || 0);
				self.element.style.left = (left - scrollLeft) + 'px';
			}
		}
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

class PowerMenu extends PowerActionsBar {
	constructor(menu, $powerUi) {
		super(menu, $powerUi);
		this.isMenu = true;
	}

	onRemove() {
		super.onRemove();
	}

	init() {
		super.init();
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-menu', isMain: true});

class PowerSplitBar extends _PowerBarsBase {
	constructor(menu, $powerUi) {
		super(menu, $powerUi);
		this.isSplitBar = true;
		this.borderSize = 5;
		this._currentHeight = null;
		this._currentWidth = null;
	}

	onRemove() {
		this.unsubscribe({event: 'click', fn: this.onClick, bar: this});
		if (this.pwSplit) {
			this.$powerUi.windowModeChange.unsubscribe(this.onWindowModeChange, this, this.id);
			this.unsubscribe({event: 'click', fn: this.onClick, bar: this});
			window.removeEventListener("mousemove", this._changeMenuSize);
			window.removeEventListener("mouseup", this._onMouseUp);
			this.$powerUi._mouseIsDown = false;
			if (this.pwSplit) {
				this.$powerUi.onBrowserWindowResize.unsubscribe(this.onBrowserWindowResize, this);
				if (this.isWindowFixed && this._window) {
					this._window.powerWindowModeChange.unsubscribe(this.onPowerWindowModeChange, this);
					this._window.onPowerWindowResize.unsubscribe(this.onPowerWindowResize, this);
				}
			}
		}
		super.onRemove();
	}

	init() {
		super.init();

		this.pwSplit = this.element.classList.contains('pw-split');
		this.resizeRight = this.element.classList.contains('pw-left');
		this.resizeLeft = this.element.classList.contains('pw-right');
		this.resizeTop = this.element.classList.contains('pw-bottom');
		this.resizeBottom = this.element.classList.contains('pw-top');

		if (this.pwSplit) {
			this._changeMenuSize = this.changeMenuSize.bind(this);
			this._onMouseUp = this.onMouseUp.bind(this);
			this.$powerUi.windowModeChange.subscribe(this.onWindowModeChange, this);
			this.$powerUi.onBrowserWindowResize.subscribe(this.onBrowserWindowResize, this);
			this.subscribe({event: 'click', fn: this.onClick, bar: this});
			this.setBorder();
			this.addOnMouseBorderEvents();
		}
	}

	broadcastFixedBarWhenSizeChange() {
		if (this.isFixed && this.element) {
			this.$powerUi.onFixedPowerSplitBarChange.broadcast();
		}
	}

	subscribeToOnPowerWindowResize() {
		this._window.onPowerWindowResize.subscribe(this.onPowerWindowResize, this);
	}
	subscribeToPowerWindowModeChange() {
		this._window.powerWindowModeChange.subscribe(this.onPowerWindowModeChange, this);
	}

	// Only for powerWindow split bars
	onPowerWindowModeChange() {
		if (!this.element || !this._window) {
			return;
		}
		if (this._window.currentBarBreakQuery === 'pw-bar-break') {
			this.setSmallWindowModeSize();
		} else {
			this.removeStyles();
			this.element.style.width = this._currentWidth;
			this.element.style.height = this._currentHeight;
		}
	}

	onPowerWindowResize() {
		this.adjustBarSizeIfNeeded();
	}

	onBrowserWindowResize() {
		this.onPowerWindowModeChange();
		this.adjustBarSizeIfNeeded();
	}

	// Only for powerWindow split bars
	onWindowModeChange() {
		if (!this.element || !this._window) {
			return;
		}
		if (this.$powerUi.componentsManager.smallWindowMode) {
			this.setSmallWindowModeSize();
		} else {
			this.removeStyles();
			this.element.style.width = this._currentWidth;
			this.element.style.height = this._currentHeight;
		}
	}

	// Size when menu is colapsed
	setSmallWindowModeSize(keepWidth) {
		this.removeStyles(keepWidth);
		if (this.barPosition === 'top') {
			this.setTopColapsedMenuSize();
		} else if (this.barPosition === 'bottom') {
			this.setBottomColapsedMenuSize();
		} else if (this.barPosition === 'left') {
			this.setLeftColapsedMenuSize();
		} else if (this.barPosition === 'right') {
			this.setRightColapsedMenuSize();
		}
	}
	// Size when menu is colapsed
	setTopColapsedMenuSize() {
		// When counting position we need compensate a pixel
		const fixOffsetPosition = 1;
		if (this.isWindowFixed && this._window) {
			const bodyHeight = this._window.bodyEl.offsetHeight;
			const diff = this.element.offsetTop - this._window._dialog.offsetTop - this._window.defaultBorderSize - this._window.bodyEl.offsetTop + fixOffsetPosition;
			let height = bodyHeight + diff + this._window.titleBarEl.offsetHeight + this.element.offsetHeight;
			if (this._window.isMaximized || this.$powerUi.componentsManager.smallWindowMode) {
				height = height - this._window.defaultBorderSize;
			}
			this.element.style['max-height'] = height + 'px';
			this.element.style['min-width'] = this._currentWidth + 'px';
		}
	}
	// Size when menu is colapsed
	setBottomColapsedMenuSize() {
		// When counting position we need compensate a pixel
		const fixOffsetPosition = 1;
		if (this.isWindowFixed && this._window) {
			const diff = this.element.offsetTop - this._window._dialog.offsetTop;
			let height = diff - this._window.defaultBorderSize - this._window.defaultBorderSize + fixOffsetPosition;
			this.element.style['max-height'] = height + 'px';
			this.element.style['min-width'] = this._currentWidth + 'px';
		}
	}
	// Size when menu is colapsed
	setLeftColapsedMenuSize() {
		// When counting position we need compensate a pixel
		const fixOffsetPosition = 1;
		if (this.isWindowFixed && this._window) {
			const height = this._window.bodyEl.offsetHeight - this._window.defaultBorderSize - fixOffsetPosition;
			const diff = (this.element.offsetLeft - this._window._dialog.offsetLeft) - this._window.bodyEl.offsetLeft;
			let width = this._window.bodyEl.offsetWidth - diff - this._window.defaultBorderSize - fixOffsetPosition;
			this.element.style.height = height + 'px';
			this.element.style['min-height'] = height + 'px';
			this.element.style['max-width'] = width + 'px';
		} else {
			this.element.style.height = '100%';
			this.element.style['max-height'] = '100%';
		}
	}
	// Size when menu is colapsed
	setRightColapsedMenuSize() {
		// When counting position we need compensate a pixel
		const fixOffsetPosition = 1;
		if (this.isWindowFixed && this._window) {
			const height = this._window.bodyEl.offsetHeight - this._window.defaultBorderSize - fixOffsetPosition;
			const diff = (this._window._dialog.offsetLeft + this._window.bodyEl.offsetLeft) - this.element.offsetLeft;
			let width = this.element.offsetWidth - diff - this._window.defaultBorderSize - fixOffsetPosition;
			this.element.style.height = height + 'px';
			this.element.style['min-height'] = height + 'px';
			this.element.style['max-width'] = width + 'px';
		}
	}

	onClick(fn, self) {
		self.$powerUi.componentsManager.runObserverFewTimes(10);
		setTimeout(function () {
			self.adjustBarSizeIfNeeded();
		}, 50);
	}

	setBorder() {
		this.defaultBorderSize = this.element.getAttribute('data-pw-border');
		if (this.defaultBorderSize) {
			const borderSide = this.resizeRight ? 'right' : this.resizeLeft ? 'left' : this.resizeTop ? 'top' : this.resizeBottom ? 'bottom' : null;
			this.borderSize = parseInt(this.defaultBorderSize);
			this.element.style[`border-${borderSide}-width`] = this.defaultBorderSize + 'px';
		}
	}

	cursorPositionOnMenuBound(e) {
		const rect = this.element.getBoundingClientRect();
		this.x = e.clientX - rect.left;
		this.y = e.clientY - rect.top;
		this.width = this.element.offsetWidth;
		this.height = this.element.offsetHeight;

		if (this.resizeRight) {
			if (this.isOverRightBorder()) {
				this.$powerUi.addCss(this.element.id, 'cursor-width');
			} else if (this.x < this.width - this.borderSize) {
				this.removeAllCursorClasses();
			}
		} else if (this.resizeLeft) {
			if (this.isOverLeftBorder()) {
				this.$powerUi.addCss(this.element.id, 'cursor-width');
			} else if (this.x > this.borderSize) {
				this.removeAllCursorClasses();
			}
		} else if (this.resizeBottom) {
			if (this.isOverBottomBorder()) {
				this.$powerUi.addCss(this.element.id, 'cursor-height');
			} else if (this.y < this.height - this.borderSize) {
				this.removeAllCursorClasses();
			}
		} else if (this.resizeTop) {
			if (this.isOverTopBorder()) {
				this.$powerUi.addCss(this.element.id, 'cursor-height');
			} else if ((this.y <= this.borderSize) === false) {
				this.removeAllCursorClasses();
			}
		}
	}

	removeAllCursorClasses() {
		this.$powerUi.removeCss(this.element.id, 'cursor-width');
		this.$powerUi.removeCss(this.element.id, 'cursor-height');
	}

	addOnMouseBorderEvents() {
		this.element.onmouseout = this.onMouseOutBorder.bind(this);
		this.element.onmousemove = this.onMouseMoveBorder.bind(this);
		this.element.onmousedown = this.onMouseDownBorder.bind(this);
		this.element.ondblclick = this.onDoubleClickBorder.bind(this);
	}

	onDoubleClickBorder(e) {
		e.preventDefault();
		if (this.$powerUi.componentsManager.smallWindowMode || (this._window && this._window.isMaximized && this.$powerUi.componentsManager.smallWindowMode)) {
			return;
		}
		if (this.isOverRightBorder() || this.isOverLeftBorder() || this.isOverBottomBorder() || this.isOverTopBorder()) {
			this._currentHeight = null;
			this._currentWidth = null;
			this.removeStyles();
			this.onMouseUp(e);
		}
		this.broadcastFixedBarWhenSizeChange();
		this.adjustBarSizeIfNeeded();
		if (this.isWindowFixed && this._window) {
			this._window.changeWindowBars();
		}
	}

	removeStyles(keepWidth) {
		if (!this.element || (window.innerWidth < 768 && this.isFixed && (this.barPosition === 'top' || this.barPosition === 'bottom'))) {
			this.element.style['max-height'] = '50%';
			this.element.style.height = null;
			return;
		}
		if (!keepWidth) {
			this.element.style.width = null;
		}
		this.element.style['min-width'] = null;
		this.element.style['max-width'] = null;
		if (this.isFixed && (this.barPosition === 'left' || this.barPosition === 'right')) {
			return;
		}
		this.element.style.height = null;
		this.element.style['min-height'] = null;
		this.element.style['max-height'] = null;
	}

	onMouseOutBorder(e) {
		this.removeAllCursorClasses();
	}

	onMouseMoveBorder(e) {
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget || this.$powerUi._mouseIsDown || this.$powerUi._dragging || window.innerWidth < 768 || (this._window && this._window.currentBarBreakQuery !== false)) {
			return;
		}

		e.preventDefault();
		this.cursorPositionOnMenuBound(e);
	}

	getBrowserWindowContext() {
		const component = this.$powerUi.componentsManager;
		const win = {
			_currentWidth: window.innerWidth,
			_currentHeight: window.innerHeight,
			rightTotalWidth: component.rightTotalWidth,
			bottomTotalHeight: component.bottomTotalHeight,
			leftTotalWidth: component.leftTotalWidth,
			topTotalHeight: component.topTotalHeight,
			defaultMinWidth: 270,
			defaultMinHeight: 170,
			defaultBorderSize: 0,
		};
		return win;
	}

	getPowerWindowContext() {
		const win = {
			_currentWidth: this._window._currentWidth,
			_currentHeight: this._window._currentHeight,
			rightTotalWidth: this._window.rightTotalWidth - this._window._dialog.offsetLeft,
			bottomTotalHeight: this._window.bottomTotalHeight - (this._window._dialog.offsetTop - this._window.titleBarEl.offsetHeight),
			leftTotalWidth: this._window.leftTotalWidth + this._window._dialog.offsetLeft,
			topTotalHeight: this._window.topTotalHeight + this._window._dialog.offsetTop + this._window.bodyEl.offsetTop,
			defaultMinWidth: this._window.defaultMinWidth + 20,
			defaultMinHeight: this._window.defaultMinHeight + this._window.defaultBorderSize + 20,
			defaultBorderSize: this._window.defaultBorderSize + 1,
		};
		return win;
	}

	setInitialValues() {
		this._initialLeft = this.element.offsetLeft;
		this._initialTop = this.element.offsetTop;
		this._initialOffsetWidth = this.element.offsetWidth;
		this._initialOffsetHeight = this.element.offsetHeight;
		this._initialRightTotalWidthDiff = this.ctx.rightTotalWidth - this._initialOffsetWidth;
		this._initialBottomTotalHeightDiff = this.ctx.bottomTotalHeight - this._initialOffsetHeight;
	}

	onMouseDownBorder(e) {
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget) {
			return;
		}
		e.preventDefault();
		this.$powerUi._mouseIsDown = true;
		window.addEventListener("mousemove", this._changeMenuSize);
		window.addEventListener("mouseup", this._onMouseUp);
		this.ctx = (this.isWindowFixed === true && this._window !== undefined) ? this.getPowerWindowContext() : this.getBrowserWindowContext();
		this.allowResize = true;
		this._initialX = e.clientX;
		this._initialY = e.clientY;
		this.setInitialValues();

		if (this.resizeRight && this.isOverRightBorder()) {
			this.resizingRight = true;
		}

		if (this.resizeLeft && this.isOverLeftBorder()) {
			this.resizingLeft = true;
		}

		if (this.resizeBottom && this.isOverBottomBorder()) {
			this.resizingBottom = true;
		}

		if (this.resizeTop && this.isOverTopBorder()) {
			this.resizingTop = true;
		}
	}

	onMouseUp(e) {
		this.resizingRight = false;
		this.resizingLeft = false;
		this.resizingBottom = false;
		this.allowResize = false;
		window.removeEventListener("mousemove", this._changeMenuSize);
		window.removeEventListener("mouseup", this._onMouseUp);
		this.$powerUi._mouseIsDown = false;
		this.removeAllCursorClasses();
		this.$powerUi.componentsManager.runObserver();
		this.broadcastFixedBarWhenSizeChange();
	}

	changeMenuSize(e) {
		if (this.allowResize === false) {
			return;
		}
		this.ctx = (this.isWindowFixed === true && this._window !== undefined) ? this.getPowerWindowContext() : this.getBrowserWindowContext();
		const rect = this.element.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		if (this.resizingRight) {
			this.resizeRightBorder(x);
		} else if (this.resizingLeft) {
			this.resizeLeftBorder(x);
		} else if (this.resizingBottom) {
			this.resizeBottomBorder(y);
		} else if (this.resizingTop) {
			this.resizeTopBorder(y);
		}

		if (this.isWindowFixed === true) {
			this.$powerUi.componentsManager.setWindowFixedBarsSizeAndPosition(this._window.windowBars, this._window);
		}
	}

	adjustBarSizeIfNeeded() {
		if (this._window && this._window.currentBarBreakQuery === 'pw-bar-break') {
			return;
		}
		if (this.$powerUi.componentsManager.smallWindowMode) {
			this.removeStyles();
			return;
		}

		const minHeight = 50;

		this.ctx = (this.isWindowFixed === true && this._window !== undefined) ? this.getPowerWindowContext() : this.getBrowserWindowContext();
		this.setInitialValues();

		let width = this.element.style.width;
		if (width) {
			width = parseInt(width.replace('px', ''));
		}
		let height = this.element.style.height;
		if (height) {
			height = parseInt(height.replace('px', ''));
		}
		if (this.barPosition === 'top') {
			if (!height && this.topHeightIsTooBig(this.element.offsetHeight)) {
				height = this.element.offsetHeight;
			}
			if (!height || height < minHeight) return;
			if (this.isWindowFixed) {
				this._lastWindowHeight = this._window._currentHeight;
			}
			this.setTopMenuSize(height);

			if (this.isWindowFixed) {
				if (this.element.offsetHeight > this._lastWindowHeight) {
					this._currentHeight = minHeight + 'px';
					this.element.style.height = this._currentHeight;
				}
			}
		} else if (this.barPosition === 'bottom') {
			if (!height && this.bottomHeightIsTooBig(this.element.offsetHeight)) {
				height = this.element.offsetHeight;
			}
			if (!height || height < minHeight) return;
			this.setBottomMenuSize(height);
		} else if (this.barPosition === 'left') {
			if (this.isWindowFixed && this._window) {
				this.element.style.height = this._window.bodyEl.offsetHeight - this._window.defaultBorderSize - 1 + 'px';
			}
			if (!width) return;
			this.setLeftMenuSize(width);
		} else if (this.barPosition === 'right') {
			if (this.isWindowFixed && this._window) {
				this.element.style.height = this._window.bodyEl.offsetHeight - this._window.defaultBorderSize - 1 + 'px';
			}
			if (!width) return;
			this.setRightMenuSize(width);
		}
	}

	topHeightIsTooBig(height) {
		let titleBar = 0;
		if (this.isFixed) {
			titleBar = 40;
		}
		const result = this.ctx._currentHeight - (this.ctx.defaultMinHeight + titleBar) < this._initialTop + height + this.ctx.bottomTotalHeight;
		return result;
	}

	setTopMenuSize(height) {
		// Compesate for window title bar if there is some opened and maximized
		let titleBar = 0;
		if (this.isFixed) {
			titleBar = 40;
		}
		if (this.topHeightIsTooBig(height)) {
			height = this.ctx._currentHeight - this._initialTop - this.ctx.bottomTotalHeight - (this.ctx.defaultMinHeight + titleBar) - this.ctx.defaultBorderSize;
		}
		this._currentHeight = height + 'px';
		this.element.style.height = this._currentHeight;
	}

	bottomHeightIsTooBig(height) {
		const maxHeight = this.ctx._currentHeight - (this._initialBottomTotalHeightDiff + this.ctx.topTotalHeight + this.ctx.defaultMinHeight);
		return height > maxHeight;
	}

	setBottomMenuSize(height) {
		let maxHeight = this.ctx._currentHeight - (this._initialBottomTotalHeightDiff + this.ctx.topTotalHeight + this.ctx.defaultMinHeight);
		if (maxHeight < 0) {
			maxHeight = -maxHeight;
		}
		if (this.bottomHeightIsTooBig(height)) {
			height = maxHeight;
		}
		this._currentHeight = height + 'px';
		this.element.style.height = this._currentHeight;
	}

	setLeftMenuSize(width) {
		if (width + this.element.offsetLeft > this.ctx._currentWidth - this.ctx.rightTotalWidth - this.ctx.defaultMinWidth) {
			width = this.ctx._currentWidth - this.element.offsetLeft - this.ctx.rightTotalWidth - this.ctx.defaultMinWidth;
		}
		this._currentWidth = width + 'px';
		this.element.style.width = this._currentWidth;
	}

	setRightMenuSize(width) {
		if (this.ctx.leftTotalWidth + this.ctx.defaultMinWidth > this.ctx._currentWidth - width - this._initialRightTotalWidthDiff) {
			width = this.ctx._currentWidth - this._initialRightTotalWidthDiff - this.ctx.leftTotalWidth - this.ctx.defaultMinWidth;
		}
		this._currentWidth = width + 'px';
		this.element.style.width = this._currentWidth;
	}

	isOverRightBorder() {
		return (this.y > 0 && this.y <= this.height) && (this.x >= this.width - this.borderSize) && (this.x < this.width - this.borderSize) === false;
	}

	resizeRightBorder(x) {
		let width = this._initialOffsetWidth + this._initialLeft + (x - this._initialX) - 10;
		this.setLeftMenuSize(width);
	}

	isOverLeftBorder() {
		return (this.y > 0 && this.y <= this.height - this.borderSize) && (this.x <= this.borderSize) === true;
	}

	resizeLeftBorder(x) {
		let width = (this.element.offsetWidth - x);
		this.setRightMenuSize(width);
	}

	isOverBottomBorder() {
		return this.y >= this.height - this.borderSize && (this.x > 0 && this.x <= this.width);
	}

	resizeBottomBorder(y) {
		let height = this._initialOffsetHeight + this._initialTop + (y - this._initialY) - 10;
		this.setTopMenuSize(height);
	}

	isOverTopBorder() {
		return this.y > 0 && this.y <= this.borderSize && (this.x > 0 && this.x <= this.width);
	}

	resizeTopBorder(y) {
		let height = this.element.offsetHeight - y;
		this.setBottomMenuSize(height);
	}

	toggle() {
		if (this.isWindowFixed && this._window && this._window.currentBarBreakQuery === 'pw-bar-break') {
			this.setSmallWindowModeSize(true);
		}
		// PowerAction implements an optional "click out" system to allow toggles to hide
		this.powerAction.ifClickOut();
	}

	// The powerToggle call this action method
	action() {
		this.toggle();
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-split-bar', isMain: true});

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
				for (const index of Object.keys(allPowerObjsById[element.id] || {})) {
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

class PowerTabs extends PowerTarget {
	constructor(element) {
		super(element);
	}

	init() {
		this.childrenSections = this.getChildrenByPowerCss('powerTabSection');
		this.childrenActions = this.getChildrenByPowerCss('powerAction');

		this.childrenActions[0].element.classList.add('power-active');
		this.childrenSections[0].element.classList.add('power-active');
		this.childrenActions[0]._$pwActive = true;
		this.childrenSections[0]._$pwActive = true;
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-tabs'});


class PowerTabSection extends PowerTarget {
	constructor(element) {
		super(element);
	}

	init() {
		let parent = this.parent;
		// Add the header to this powerSection
		do {
			if (parent.$powerCss === 'powerTabs') {
				this.powerTabs = parent;
			} else {
				parent = parent.parent;
			}
		} while (parent && parent.$powerCss !== 'powerTabs');
	}

	// Open and close the tab section
	action() {
		// Cancel if already active
		if (this._$pwActive === true) {
			this.powerAction._$pwActive = false;
			// Reset this action and section to active
			this.powerAction.broadcast('toggle', true);
			return;
		}

		// close the other sections
		for (const action of Object.keys(this.powerTabs.childrenActions || {})) {
			// Only toggle if is not this section and or is active
			const targetAction = this.powerTabs.childrenActions[action];
			if ((targetAction.targetObj.id !== this.powerTabs.id) && targetAction._$pwActive && (this !== targetAction.targetObj)) {
				// This prevent the targetAction.toggle call this action again, so this flag avoid a loop to occurs
				targetAction.toggle({avoidCallAction: true});
				targetAction.targetObj.active = !targetAction.targetObj.active;
			}
		}
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-tab-section'});

class PowerToolbar extends PowerActionsBar {
	constructor(bar, $powerUi) {
		super(bar, $powerUi);
		this.isToolbar = true;
		this.isColapsed = false;
		// this.$powerUi.router.onRouteChange.subscribe(this.setStatus, this);
	}

	onRemove() {
		this.powerAction.unsubscribe({event: 'toggle', fn: this._setStatus, bar: this});
		super.onRemove();
	}

	init() {
		super.init();
	}

	getChildrenTotalWidth() {
		let totalChildrenWidth = 0;
		for (const action of this.childrenPowerActions) {
			totalChildrenWidth = totalChildrenWidth + action.element.offsetWidth;
		}

		for (const item of this.childrenPowerItems) {
			totalChildrenWidth = totalChildrenWidth + item.element.offsetWidth;
		}
		totalChildrenWidth = totalChildrenWidth + this.powerToggle.offsetWidth;
		return totalChildrenWidth;
	}

	getChildrenTotalHeight() {
		let totalChildrenHeight = 0;
		for (const action of this.childrenPowerActions) {
			totalChildrenHeight = totalChildrenHeight + action.element.offsetHeight;
		}

		for (const item of this.childrenPowerItems) {
			totalChildrenHeight = totalChildrenHeight + item.element.offsetHeight;
		}
		return totalChildrenHeight;
	}

	_setStatus(ctx, event, params) {
		params.bar.setStatus.bind(params.bar)();
	}

	setStatus() {
		if (!this.powerToggle) {
			if (!this.powerAction || !this.powerAction.element) {
				throw `Toolbar ${this.id} is missing the "power-toggle" element or it's "data-power-target" attribute value is different from the toolbar id. See documentation for more details.`;
			} else {
				this.powerToggle = this.powerAction.element;
				this.powerAction.subscribe({event: 'toggle', fn: this._setStatus, bar: this});
			}
		}
		this.barWidth = parseInt(this.element.style.width.replace('px', '')) || this.element.offsetWidth;
		this.barHeight = parseInt(this.element.style.height.replace('px', '')) || this.element.offsetHeight;
		this.toggleWidth = this.powerToggle.offsetWidth;
		this.toggleHeight = this.powerToggle.offsetHeight;
		if (this.orientation === 'vertical') {
			this.VerticalShowAndHiddeItems();
		} else {
			this.horizontalShowAndHiddeItems();
		}
	}

	VerticalShowAndHiddeItems() {
		if (this.getChildrenTotalHeight() >= this.barHeight) {
			if (this.isColapsed === false) {
				this.element.classList.add('pw-show-toggle');
				this.isColapsed = true;
			}
		} else if (this.isColapsed === true) {
			this.element.classList.remove('pw-show-toggle');
			this.isColapsed = false;
		}
		let currentHeight = 0;
		for (const child of this.element.children) {
			const isAction = child.classList.contains('power-action');
			const isItem = child.classList.contains('power-item');
			if (isItem || isAction) {
				currentHeight = currentHeight + child.offsetHeight;
				if (this._$pwActive || (currentHeight < this.barHeight - this.toggleHeight)) {
					child.classList.add('pw-force-show');
					child.style['margin-top'] = null;
					child.style['margin-bottom'] = null;
				} else {
					child.classList.remove('pw-force-show');
					child.style['margin-top'] = -(child.offsetHeight) + 'px';
				}
			}
		}
		this.setMaxWidthOnActiveVerticalBar();
	}

	setMaxWidthOnActiveVerticalBar() {
		if (!this._$pwActive) {
			this.element.style.width = null;
			return;
		}
		const firstItem = this.childrenPowerActions[0] || this.childrenPowerItems[0];
		const firstItemWidth = firstItem.element.offsetWidth;

		let maxWidth =  firstItemWidth + firstItemWidth;
		let needIncrease = true;
		let loops = 0;
		while (needIncrease && loops < 30) {
			loops = loops + 1;
			this.element.style.width = maxWidth + 'px';
			needIncrease = false;
			for (const action of this.childrenPowerActions) {
				if (action.element.offsetTop >= this.barHeight - firstItemWidth) {
					needIncrease = true;
				}
			}

			for (const item of this.childrenPowerItems) {
				if (item.element.offsetTop >= this.barHeight - firstItemWidth) {
					needIncrease = true;
				}
			}
			maxWidth = maxWidth + firstItemWidth;
		}

		if (loops >= 30) {
			this.element.style.width = null;
		}
	}

	horizontalShowAndHiddeItems() {
		if (this.getChildrenTotalWidth() >= this.barWidth) {
			if (this.isColapsed === false) {
				this.element.classList.add('pw-show-toggle');
				this.isColapsed = true;
			}
		} else if (this.isColapsed === true) {
			this.element.classList.remove('pw-show-toggle');
			this.isColapsed = false;
		}
		let currentWidth = 0;
		this.lastTotalChildrenWidth = 0;
		for (const child of this.element.children) {
			const isAction = child.classList.contains('power-action');
			const isItem = child.classList.contains('power-item');
			if (isItem || isAction) {
				currentWidth = currentWidth + child.offsetWidth;
				if (this._$pwActive || (currentWidth < this.barWidth - this.toggleWidth)) {
					this.lastTotalChildrenWidth = currentWidth;
					child.style['margin-left'] = null;
					child.style['margin-right'] = null;
					child.classList.add('pw-force-show');
				} else {
					child.classList.remove('pw-force-show');
					child.style['margin-left'] = -(child.offsetWidth) + 'px';
					// child.style['margin-right'] = -(child.offsetWidth*0.5) + 'px';
				}
			}
		}
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-toolbar', isMain: true});

class PowerTreeView extends PowerTarget {
    constructor(element) {
        super(element);
        if (element.dataset.onClickFile) {
            this.mainNode = true;
        }
    }

    init() {
        const view = this.$pwView;
        // The scope of the controller of the view of this element
        this.ctrlScope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;
        if (this.mainNode) {
            const items = this.element.getElementsByClassName('power-item');
            for (const item of items) {
                const obj = this.$powerUi.powerTree.allPowerObjsById[item.id];
                if (obj && obj.powerItem) {
                    const onScope = this.$powerUi.getObjectOnScope({text: this.element.dataset.onClickFile, $powerUi: this.$powerUi, scope: this.ctrlScope});

                    obj.powerItem.subscribe({fn: onScope, event: 'click', ctx: this.ctrlScope, path: decodeURI(obj.powerItem.element.dataset.filePath), element: item});
                }
            }
        }
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-tree-view'});
