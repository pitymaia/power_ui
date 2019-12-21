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
			this.element.removeChild(child);
		}
		// this.element.innerHTML = '';
		delete this.element.dataset.pwhascomp;
	}

	removeElementAndInnersFromPower(element) {
		element = element || this.element;
		if (element.id && this.ctx.allPowerObjsById[element.id]) {
			// Remove events of this objects
			this.ctx.removeEventsOfObject(element.id);
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

	subscribe(fn, ctx, params) { // *ctx* is what *this* will be inside *fn*.
		// Remove any old event before add to avoid duplication
		this.unsubscribe(fn);
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

	get rootCompilers() {
		const rootCompilers = {};
		for (const id of Object.keys(this.allPowerObjsById || {})) {
			// TODO: add this to condition? && this.allPowerObjsById[id].$shared.element
			// TODO: We avoid problems with powEvent in a hard coded way by filtering it out... fix it.
			if (this.allPowerObjsById[id] && this.allPowerObjsById[id].$shared.isRootCompiler && !this.allPowerObjsById[id].powEvent) {
				rootCompilers[id] = this.allPowerObjsById[id].$shared.originalInnerHTML;
			}
		}
		return rootCompilers;
	}

	removeAllEvents() {
		for (const id of Object.keys(this.allPowerObjsById || {})) {
			this.removeEventsOfObject(id);
		}
		UEvent.index = {};
	}

	resetRootCompilers() {
		for (const id of Object.keys(this.rootCompilers)) {
			if (this.allPowerObjsById[id]) {
				// Remove events of this objects
				this.removeEventsOfObject(id);
				// delete all inner this.allPowerObjsById[id]
				this.allPowerObjsById[id]['$shared'].removeInnerElementsFromPower();
				const element = document.getElementById(id);
				element.innerHTML = this.rootCompilers[id];
			}
		}
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
	buildAndInterpolate(node, refresh) {
		this.sweepDOM({
			entryNode: node,
			callback: this.buildPowerObjects.bind(this),
			isInnerCompiler: false,
		});

		// Evaluate and replace any {{}} from template
		if (!refresh) {
			const body = document.getElementsByTagName('BODY')[0];
			body.innerHTML = this.$powerUi.interpolation.replaceInterpolation(body.innerHTML, this);
		}

		// if (!refresh) {
		// 	const tempTree = {pending: []};
		// 	const body = document.getElementsByTagName('BODY')[0];
		// 	// body.innerHTML = this.$powerUi.interpolation.interpolationToPowText(body.innerHTML, tempTree, this);
		// 	for (const id of tempTree.pending) {
		// 		this.addPowTextObject(id);
		// 	}
		// }
	}

	// Create individual pow-eval powerObject instances of element already in the DOM and add it to this.allPowerObjectsById
	// addPowTextObject(id) {
	// 	const newNode = document.getElementById(id);
	// 	// Search a powerElement parent of currentObj up DOM if exists
	// 	const currentParentElement = this._getParentElementFromChildElement(newNode);
	// 	// Get the main and view elements of the currentObj
	// 	const currentMainElement = this._getMainElementFromChildElement(newNode);
	// 	const isMain = this.datasetIsMain(newNode.dataset);
	// 	const currentViewElement = this._getViewElementFromChildElement(newNode);
	// 	// Get any possible rootCompiler
	// 	const currentRootCompilerElement = this._getRootCompilerElementFromChildElement(newNode, this);
	// 	const isRootCompiler = (!currentRootCompilerElement && this.datasetIsCompiler(newNode.dataset));
	// 	// Make the instance and add the powerObject into a list ordered by id
	// 	this._instanciateObj({
	// 		currentElement: newNode,
	// 		datasetKey: 'powEval',
	// 		main: currentMainElement,
	// 		view: currentViewElement,
	// 		parent: currentParentElement,
	// 		rootCompiler: currentRootCompilerElement,
	// 		isRootCompiler: isRootCompiler,
	// 		isMain: isMain,
	// 		originalInnerHTML: newNode.innerHTML,
	// 	});
	// }

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
		}
	}
	createAndInitObjectsFromCurrentNode({id, refresh}) {
		const entryAndConfig = this.getEntryNodeWithParentsAndConfig(id);
		this.buildPowerObjects(entryAndConfig);
		// Evaluate and replace any {{}} from template
		if (!refresh) {
			const node = document.getElementById(id);
			node.innerHTML = this.$powerUi.interpolation.replaceInterpolation(node.innerHTML, this);
		}
		// Replace any interpolation with pow-eval
		// if (!refresh) {
		// 	const node = document.getElementById(id);
		// 	const tempTree = {pending: []};
		// 	// node.innerHTML = this.$powerUi.interpolation.interpolationToPowText(node.innerHTML, tempTree, this);
		// 	for (const id of tempTree.pending) {
		// 		this.addPowTextObject(id);
		// 	}
		// }
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
            if (attr.name.includes('on')) {
                const name = attr.name.slice(2, attr.name.length);
                this.element.setAttribute(`data-pow-${name}`, encodeURIComponent(attr.value));
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

		const parts = decodeURIComponent(this.element.dataset.powFor).split(' ');
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
				newValue: encodeURIComponent(`_tempScope['${scope}']`),
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
				newValue: encodeURIComponent(`_tempScope['${scope}']`),
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
		const value = this.$powerUi.safeEval({text: decodeURIComponent(this.element.dataset.powIf), $powerUi: this.$powerUi, scope: ctrlScope});
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
		window._$dispatchPowerEvent = this._$dispatchPowerEvent;
		this.controllers = {
			$routeSharedScope: {
				$waitingToDelete: [],
			},
		};
		this.$services = {};
		this._Unique = _Unique;
		this.addScopeEventListener();
		this.numberOfopenModals = 0;
		this.ctrlWaitingToRun = [];
		this.config = config;
		this.waitingViews = 0;
		this.waitingInit = [];
		this.initAlreadyRun = false;
		this.instantiateServices(config.services);
		this.interpolation = new PowerInterpolation(config, this);
		this._events = {};
		this._events['ready'] = new UEvent();
		this._events['Escape'] = new UEvent();
		this.request = new Request(config);
		this.router = new Router(config, this); // Router calls this.init();

		document.addEventListener('keyup', this._keyUp.bind(this), false);
	}

	instantiateServices(services) {
		for (const key of Object.keys(services || {})) {
			this.$services[key] = new services[key].component({$powerUi: this, params: services[key].params});
		}
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
	// This also add the Event to controller scope so it can be evaluated and passed to the funcion on data-pow-event as argument
	pwScope(event) {
		const self = this;
		const ctrlScope = (event && event.detail && event.detail.viewId && self.controllers[event.detail.viewId]) ? self.controllers[event.detail.viewId].instance : false;
		ctrlScope.event = event.detail.event;
		const element = (event && event.detail && event.detail.elementId) ? document.getElementById(event.detail.elementId) : false;
		const attrName = (event && event.detail && event.detail.attrName) ? `data-pow-${event.detail.attrName}` : false;
		const text = (element && attrName) ? decodeURIComponent(element.getAttribute(attrName)) : false;

		if (text) {
			self.safeEval({text: text, $powerUi: self, scope: ctrlScope});
		}
	}

	safeEval({text, scope}) {
		return new ParserEval({text: text, scope: scope, $powerUi: this}).currentValue;
	}

	initAll({template, routeId, viewId}) {
		const t0 = performance.now();
		// If initAlreadyRun is true that is not the first time this initiate, so wee need clean the events
		if (this.initAlreadyRun) {
			this.powerTree.removeAllEvents();
		}
		this._createPowerTree();
		this.truth = {};
		this.tmp = {dropmenu: {}};
		// Detect if is touchdevice (Phones, Ipads, etc)
		this.touchdevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement) ? true : false;
		// If not touchdevice add keyboardManager
		if (!this.touchdevice) {
			this.keyboardManager = new KeyboardManager(this);
		}
		this.initAlreadyRun = true;
		for (const item of this.waitingInit) {
			document.getElementById(item.node.id).style.visibility = null;
		}
		this.waitingInit = [];

		this.callOnViewLoad(this, viewId);
		const t1 = performance.now();
		console.log('PowerUi init run in ' + (t1 - t0) + ' milliseconds.');
	}

	pwReload() {
		this.initAlreadyRun = false;
		this.router._reload();
	}

	callOnViewLoad(self, viewId) {
		if (self.controllers[viewId] && self.controllers[viewId].instance) {
			if (self.controllers[viewId].instance.onViewLoad) {
				self.controllers[viewId].instance.onViewLoad(self.powerTree.allPowerObjsById[viewId].$shared.element);
			}
			if (self.controllers[viewId].instance._onViewLoad) {
				self.controllers[viewId].instance._onViewLoad(self.powerTree.allPowerObjsById[viewId].$shared.element);
			}
		}
	}

	initNodes({template, routeId, viewId}) {
		const t0 = performance.now();
		for (const item of this.waitingInit) {
			this.powerTree.createAndInitObjectsFromCurrentNode({id: item.node.id});
			document.getElementById(item.node.id).style.visibility = null;
		}

		this.callOnViewLoad(this, viewId);
		const t1 = performance.now();
		console.log('PowerUi init run in ' + (t1 - t0) + ' milliseconds.', this.waitingInit);
		this.waitingInit = [];
	}

	hardRefresh({node, view}) {
		node = node || document;
		const t0 = performance.now();
		this.powerTree.resetRootCompilers();
		// Remove all the events
		this.powerTree.removeAllEvents();

		this.powerTree.allPowerObjsById = {};
		this.powerTree.buildAndInterpolate(node, true);
		this.powerTree._callInit();

		const t1 = performance.now();
		console.log('hardRefresh run in ' + (t1 - t0) + ' milliseconds.');
	}

	softRefresh(node) {
		const t0 = performance.now();
		this.powerTree.resetRootCompilers();
		for (const id of Object.keys(this.powerTree.rootCompilers || {})) {
			// delete this.powerTree.allPowerObjsById[id];
			this.powerTree.createAndInitObjectsFromCurrentNode({id: id, refresh: true});
		}
		const t1 = performance.now();
		console.log('softRefresh run in ' + (t1 - t0) + ' milliseconds.');
	}

	prepareViewToLoad({viewId, routeId}) {
		const view = document.getElementById(viewId);
		// Avoid blink uninterpolated data before call compile and interpolate
		view.style.visibility = 'hidden';
		this.waitingViews = this.waitingViews + 1;
		this.waitingInit.push({node: view, viewId: viewId});
		return view;
	}

	// Run the controller instance for the route
	runRouteController() {
		for (const ctrl of this.ctrlWaitingToRun) {
			if (this.controllers[ctrl.viewId] && this.controllers[ctrl.viewId].instance) {
				this.controllers[ctrl.viewId].instance._viewId = ctrl.viewId;
				this.controllers[ctrl.viewId].instance._routeId = ctrl.routeId;
				this.controllers[ctrl.viewId].instance.ctrl(this.controllers[ctrl.viewId].params);
			}
		}
		this.ctrlWaitingToRun = [];
	}

	loadTemplateUrl({template, viewId, currentRoutes, routeId, routes, title}) {
		const self = this;
		const view = this.prepareViewToLoad({viewId: viewId, routeId: routeId});
		this.request({
				url: template,
				method: 'GET',
				status: "Loading page",
				withCredentials: false,
		}).then(function (response, xhr) {
			template = xhr.responseText;
			self.buildViewTemplateAndMayCallInit({
				self: self,
				view: view,
				template: template,
				routeId: routeId,
				viewId: viewId,
				title: title,
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
			self.ifNotWaitingServerCallInit({template: response, routeId: routeId, viewId: viewId});
		});
	}

	loadTemplate({template, viewId, currentRoutes, routeId, routes, title}) {
		const view = this.prepareViewToLoad({viewId: viewId, routeId: routeId});
		this.buildViewTemplateAndMayCallInit({
			self: this,
			view: view,
			template: template,
			routeId: routeId,
			viewId: viewId,
			title: title,
		});
	}

	// When a view is loaded built it's template, may call init() and may Init all views when all loaded
	buildViewTemplateAndMayCallInit({self, view, template, routeId, viewId, title}) {
		if (self.controllers[viewId] && self.controllers[viewId].instance && self.controllers[viewId].instance.isWidget) {
			if (self.controllers[viewId].instance.init) {
				self.controllers[viewId].instance.init();
			}
			template = self.controllers[viewId].instance.$buildTemplate({template: template, title: title});
		}
		view.innerHTML = template;
		self.ifNotWaitingServerCallInit({template: template, routeId: routeId, viewId: viewId});
	}

	ifNotWaitingServerCallInit({template, routeId, viewId}) {
		const self = this;
		self.ctrlWaitingToRun.push({viewId: viewId, routeId: routeId});
		setTimeout(function () {
			self.waitingViews = self.waitingViews - 1;
			if (self.waitingViews === 0) {
				self.runRouteController();
				if (self.initAlreadyRun) {
					self.initNodes({
						template: template,
						routeId: routeId,
						viewId: viewId,
					});
				} else {
					self.initAll({
						template: template,
						routeId: routeId,
						viewId: viewId,
					});
				}
				self._events['ready'].broadcast('ready');
			}
		}, 10);
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

class WidgetService {
    constructor({$powerUi}) {
        this.$powerUi = $powerUi;
    }
    open(options) {
        console.log('open', options, this.$powerUi);
    }
}

class PowerController {
	constructor({$powerUi}) {
		// Add $powerUi to controller
		this.$powerUi = $powerUi;
	}

	get router() {
		return this.$powerUi.router;
	}

	openRoute({routeId, params, target}) {
		const route = this.$powerUi.router.getOpenedRoute({routeId: this._routeId, viewId: this._viewId});
		this.router.openRoute({
			routeId: routeId || this._routeId, // destRouteId
			currentRouteId: this._routeId,
			currentViewId: this._viewId,
			params: params,
			target: target,
			title: route.title || null,
		});
	}

	closeCurrentRoute() {
		const route = this.router.getOpenedRoute({routeId: this._routeId, viewId: this._viewId});
		const parts = decodeURI(window.location.hash).split('?');
		let counter = 0;
		let newHash = '';

		for (let part of parts) {
			if (!part.includes(route.route)) {
				if (counter !== 0) {
					part = '?' + part;
				} else {
					part = part.replace(this.router.config.rootRoute, '');
				}
				newHash = newHash + part;
				counter = counter + 1;
			}
		}
		this.router.navigate({hash: newHash, title: route.title || null});
	}

	safeEval(string) {
		return this.$powerUi.safeEval({text: string, scope: this});
	}
}

class Request {
	constructor(config) {
		const self = this;
		return function (d) {
			d.withCredentials = d.withCredentials === undefined ? true : d.withCredentials;
			d.headers = d.headers || config.headers || {};
			if (config.authCookie) {
				d.headers['Authorization'] = getCookie(config.authCookie) || null;
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

function getEmptyRouteObjetc() {
	return {
		params: [],
		id: '',
		viewId: '',
		route: '',
		secundaryRoutes: [],
		hiddenRoutes: [],
	};
}

class Router {
	constructor(config={}, powerUi) {
		this.config = config;
		this.$powerUi = powerUi;
		this.routes = {};
		this.oldRoutes = getEmptyRouteObjetc();
		this.currentRoutes = getEmptyRouteObjetc();
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

	add({id, route, template, templateUrl, avoidCacheTemplate, callback, viewId, ctrl, title, hidden}) {
		template = templateUrl || template;
		// Ensure user have a element to render the main view
		// If the user doesn't define an id to use as main view, "main-view" will be used as id
		if (!this.config.routerMainViewId && this.config.routerMainViewId !== false) {
			this.config.routerMainViewId = 'main-view';
			// If there are no element with the id defined to render the main view throw an error
			if (!document.getElementById(this.config.routerMainViewId)) {
				throw new Error('The router needs a element with an ID to render views, you can define some HTML element with the id "main-view" or set your on id in the config using the key "routerMainViewId" with the choosen id. If you not want render any view in a main view, set the config key "routerMainViewId" to false and a "viewId" flag to each route with a view.');
			}
		}
		// If the user doesn't define an id to use as secundary view, "secundary-view" will be used as id
		if (!this.config.routerSecundaryViewId && this.config.routerSecundaryViewId !== false) {
			this.config.routerSecundaryViewId = 'secundary-view';
			// If there are no element with the id defined to render the secundary view throw an error
			if (!document.getElementById(this.config.routerSecundaryViewId)) {
				throw new Error('The router needs a element with an ID to render views, you can define some HTML element with the id "secundary-view" or set your on id in the config using the key "routerSecundaryViewId" with the choosen id. If you not want render any view in a secundary view, set the config key "routerSecundaryViewId" to false and a "viewId" flag to each route with a view.');
			}
		}
		// Ensure that the parameters are not empty
		if (!id) {
			throw new Error('A route ID must be given');
		}
		if (!route && !template && !callback) {
			throw new Error('route, template, templateUrl or callback must be given');
		}
		if (this.config.routerMainViewId === false && template && !viewId) {
			throw new Error(`You set the config flag "routerMainViewId" to false, but do not provide a custom "viewId" to the route "${route}" and id "${id}". Please define some element with some id to render the template, templateUrl, and pass it as "viewId" paramenter to the router.`);
		}
		if (this.config.routerSecundaryViewId === false && template && !viewId) {
			throw new Error(`You set the config flag "routerSecundaryViewId" to false, but do not provide a custom "viewId" to the route "${route}" and id "${id}". Please define some element with some id to render the template, templateUrl, and pass it as "viewId" paramenter to the router.`);
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
			title: title,
			route: this.config.rootRoute + route,
			callback: callback || null,
			template: template || null,
			templateUrl: templateUrl || null,
			avoidCacheTemplate: avoidCacheTemplate === true ? true : false,
			templateIsCached: templateUrl ? false : true,
			viewId: viewId || null,
			ctrl: ctrl || null,
			hidden: hidden || null,
		};
		// throw an error if the route already exists to avoid confilicting routes
		// the "otherwise" route can be duplicated only if it do not have a template
		if (id !== 'otherwise' || template) {
			for (const routeId of Object.keys(this.routes || {})) {
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

	// Copy the current open secundary route, and init the router with the new route
	hashChange(event) {
		// Save a copy of currentRoutes as oldRoutes
		this.oldRoutes = this.cloneRoutes({source: this.currentRoutes});
		// Clean current routes
		this.currentRoutes = getEmptyRouteObjetc();
		this.init({onHashChange: event});
	}

	cloneRoutes({source}) {
		const dest = {
			params: [],
			id: source.id,
			viewId: source.viewId,
			route: source.route,
			secundaryRoutes: [],
			hiddenRoutes: [],
		};
		for (const param of source.params) {
			dest.params.push({key: param.key, value: param.value});
		}
		for (const route of source.secundaryRoutes) {
			const secundaryRoutes = {
				id: route.id,
				viewId: route.viewId,
				route: route.route,
				params: [],
			}
			for (const param of route.params) {
				secundaryRoutes.params.push({key: param.key, value: param.value});
			}
			dest.secundaryRoutes.push(secundaryRoutes);
		}
		for (const route of source.hiddenRoutes) {
			const hiddenRoutes = {
				id: route.id,
				viewId: route.viewId,
				route: route.route,
				params: [],
			}
			for (const param of route.params) {
				hiddenRoutes.params.push({key: param.key, value: param.value});
			}
			dest.hiddenRoutes.push(hiddenRoutes);
		}
		return dest;
	}

	_reload() {
		const viewId = this.currentRoutes.viewId;
		this.savedOldRoutes = this.cloneRoutes({source: this.oldRoutes});
		this.oldRoutes = this.cloneRoutes({source: this.currentRoutes});
		this.currentRoutes = getEmptyRouteObjetc();
		this.removeMainView({viewId})
		this.closeOldSecundaryAndHiddenViews();
		this.hashChange();
		this.oldRoutes = this.cloneRoutes({source: this.savedOldRoutes});
		delete this.savedOldRoutes;

	}
	locationHashWithHiddenRoutes() {
		return decodeURI(window.location.hash);
	}
	// Match the current window.location to a route and call the necessary template and callback
	// If location doesn't have a hash, redirect to rootRoute
	// the secundaryRoute param allows to manually match secundary routes
	init({secundaryRoute, hiddenRoute, onHashChange}={}) {
		const routeParts = this.extractRouteParts(secundaryRoute || hiddenRoute || this.locationHashWithHiddenRoutes() || this.config.rootRoute);
		for (const routeId of Object.keys(this.routes || {})) {
			// Only run if not otherwise or if the otherwise have a template
			if (routeId !== 'otherwise' || this.routes[routeId].template) {
				// If the route have some parameters get it /some_page/:page_id/syfy/:title
				const paramKeys = this.getRouteParamKeys(this.routes[routeId].route);
				let regEx = this.buildRegExPatternToRoute(routeId, paramKeys);
				// our route logic is true,
				if (routeParts.path.match(regEx)) {
					if (this.routes[routeId] && this.routes[routeId].title) {
						document.title = this.routes[routeId].title;
					}
					if (!secundaryRoute && !hiddenRoute) {
						// Load main route only if it is a new route
						if (!this.oldRoutes.id || this.oldRoutes.route !== routeParts.path.replace(this.config.rootRoute, '')) {
							this.removeMainView({viewId: this.routes[routeId].viewId || this.config.routerMainViewId});
							this.loadRoute({
								routeId: routeId,
								paramKeys: paramKeys,
								viewId: this.config.routerMainViewId,
								ctrl: this.routes[routeId].ctrl,
								title: this.routes[routeId].title,
							});
						}
						this.setMainRouteState({
							routeId: routeId,
							paramKeys: paramKeys,
							route: routeParts.path,
							viewId: this.config.routerMainViewId,
							title: this.routes[routeId].title,
						});
						// Recursively run the init for each possible secundaryRoute
						for (const compRoute of routeParts.secundaryRoutes) {
							this.init({secundaryRoute: compRoute});
						}
						// Recursively run the init for each possible hiddenRoute
						for (const compRoute of routeParts.hiddenRoutes) {
							this.init({hiddenRoute: compRoute});
						}
						// Remove all the old views if needed
						this.closeOldSecundaryAndHiddenViews();
						return true;
					} else if (secundaryRoute) {
						// Load secundary route if not already open
						// Check if the route already open as old route or as new route
						const thisRoute = secundaryRoute.replace(this.config.rootRoute, '');
						const oldSecundaryRoute = this.oldRoutes.secundaryRoutes.find(r=>r && r.route === thisRoute);
						const newSecundaryRoute = this.currentRoutes.secundaryRoutes.find(r=>r && r.route === thisRoute);
						if (!oldSecundaryRoute && !newSecundaryRoute) {
							const secundaryViewId = this.loadSecundaryOrHiddenRoute({
								routeId: routeId,
								paramKeys: paramKeys,
								routeViewId: this.config.routerSecundaryViewId,
								ctrl: this.routes[routeId].ctrl,
							});
							this.currentRoutes.secundaryRoutes.push(this.setSecundaryOrHiddenRouteState({
								routeId: routeId,
								paramKeys: paramKeys,
								route: secundaryRoute,
								viewId: secundaryViewId,
								title: this.routes[routeId].title,
							}));
						} else {
							// If the newSecundaryRoute is already on the list do nothing
							// Only add if it is only on oldSecundaryRoute list
							if (!newSecundaryRoute) {
								this.currentRoutes.secundaryRoutes.push(oldSecundaryRoute);
							}
						}
					} else if (hiddenRoute) {
						console.log('hiddenRoute', hiddenRoute);
						// Load hidden route if not already open
						// Check if the route already open as old route or as new route
						const thisRoute = hiddenRoute.replace(this.config.rootRoute, '');
						const oldHiddenRoute = this.oldRoutes.hiddenRoutes.find(r=>r && r.route === thisRoute);
						const newHiddenRoute = this.currentRoutes.hiddenRoutes.find(r=>r && r.route === thisRoute);
						if (!oldHiddenRoute && !newHiddenRoute) {
							const hiddenViewId = this.loadSecundaryOrHiddenRoute({
								routeId: routeId,
								paramKeys: paramKeys,
								routeViewId: this.config.routerSecundaryViewId,
								ctrl: this.routes[routeId].ctrl,
							});
							this.currentRoutes.hiddenRoutes.push(this.setSecundaryOrHiddenRouteState({
								routeId: routeId,
								paramKeys: paramKeys,
								route: hiddenRoute,
								viewId: hiddenViewId,
								title: this.routes[routeId].title,
							}));
						} else {
							// If the newHiddenRoute is already on the list do nothing
							// Only add if it is only on oldHiddenRoute list
							if (!newHiddenRoute) {
								this.currentRoutes.hiddenRoutes.push(oldHiddenRoute);
							}
						}
					}
				}
			}
		}
		// otherwise
		// (doesn't run otherwise for secundary routes)
		if (!secundaryRoute && !hiddenRoute) {
			const newRoute = this.routes['otherwise'] ? this.routes['otherwise'].route : this.config.rootRoute;
			window.location.replace(encodeURI(newRoute));
		}
	}

	// Only close the old secundary and hidden views that are not also in the currentRoutes.secundaryRoutes
	closeOldSecundaryAndHiddenViews() {
		for (const route of this.oldRoutes.secundaryRoutes) {
			if (!this.currentRoutes.secundaryRoutes.find(r=>r.route === route.route)) {
				this.removeSecundaryView({secundaryViewId: route.viewId, routeId: route.id});
			}
		}
		for (const route of this.oldRoutes.hiddenRoutes) {
			if (!this.currentRoutes.hiddenRoutes.find(r=>r.route === route.route)) {
				this.removeSecundaryView({secundaryViewId: route.viewId, routeId: route.id});
			}
		}
		this.clearRouteSharedScopes();
		// Remove 'modal-open' css class from body if all modals are closed
		const modals = document.body.getElementsByClassName('pw-modal-backdrop');
		if (modals.length === 0) {
			document.body.classList.remove('modal-open');
		}
	}

	clearRouteSharedScopes() {
		for (const routeId of this.$powerUi.controllers.$routeSharedScope.$waitingToDelete) {
			if (this.$powerUi.controllers.$routeSharedScope[routeId] && this.$powerUi.controllers.$routeSharedScope[routeId]._instances === 0) {
				delete this.$powerUi.controllers.$routeSharedScope[routeId];
			}
		}
		this.$powerUi.controllers.$routeSharedScope.$waitingToDelete = [];
	}

	removeSecundaryView({secundaryViewId, routeId}) {
		// Remove all view power Objects and events
		if (this.$powerUi.powerTree.allPowerObjsById[secundaryViewId] && this.$powerUi.powerTree.allPowerObjsById[secundaryViewId]['$shared']) {
			this.$powerUi.powerTree.allPowerObjsById[secundaryViewId]['$shared'].removeElementAndInnersFromPower();
		}
		// Remove view node
		const node = document.getElementById(secundaryViewId);
		node.parentNode.removeChild(node);

		// Delete the controller instance of this view if exists
		if (this.$powerUi.controllers[secundaryViewId]) {
			delete this.$powerUi.controllers[secundaryViewId];
			// Decrease $routeSharedScope number of opened instances and delete if is the last instance
			if (this.$powerUi.controllers.$routeSharedScope[routeId] && this.$powerUi.controllers.$routeSharedScope[routeId]._instances !== undefined) {
				this.$powerUi.controllers.$routeSharedScope[routeId]._instances = this.$powerUi.controllers.$routeSharedScope[routeId]._instances - 1;
				if (this.$powerUi.controllers.$routeSharedScope[routeId]._instances === 0) {
					this.$powerUi.controllers.$routeSharedScope.$waitingToDelete.push(routeId);
				}
			}
		}
	}

	removeMainView({viewId}) {
		if (!this.$powerUi.powerTree) {
			return;
		}
		// delete all inner elements and events from this.allPowerObjsById[id]
		this.$powerUi.powerTree.allPowerObjsById[viewId]['$shared'].removeInnerElementsFromPower();
	}

	loadRoute({routeId, paramKeys, viewId, ctrl, title}) {
		if (ctrl) {
			// Register the controller with $powerUi
			this.$powerUi.controllers[viewId] = ctrl;
			// Instanciate the controller
			const $params = ctrl.params || {};
			$params.$powerUi = this.$powerUi;
			$params.viewId = viewId;
			$params.routeId = routeId;
			$params.title = title;
			this.$powerUi.controllers[viewId].instance = new ctrl.component($params);
		}

		// If have a template to load let's do it
		if (this.routes[routeId].template && !this.config.noRouterViews) {
			// If user defines a custom viewId to this route, but the router don't find it alert the user
			if (this.routes[routeId].viewId && !document.getElementById(this.routes[routeId].viewId)) {
				throw new Error(`You defined a custom viewId "${this.routes[routeId].viewId}" to the route "${this.routes[routeId].route}" but there is no element on DOM with that id.`);
			}
			if (this.routes[routeId].templateUrl && this.routes[routeId].templateIsCached !== true) {
				this.$powerUi.loadTemplateUrl({
					template: this.routes[routeId].template,
					viewId: this.routes[routeId].viewId || viewId,
					currentRoutes: this.currentRoutes,
					routeId: routeId,
					routes: this.routes,
					title: title,
				});
			} else {
				this.$powerUi.loadTemplate({
					template: this.routes[routeId].template,
					viewId: this.routes[routeId].viewId || viewId,
					currentRoutes: this.currentRoutes,
					routeId: routeId,
					routes: this.routes,
					title: title,
				});
			}
		}
		// If have a callback run it
		if (this.routes[routeId].callback) {
			return this.routes[routeId].callback.call(this, this.routes[routeId]);
		}
	}
	loadSecundaryOrHiddenRoute({routeId, paramKeys, routeViewId, ctrl, title}) {
		if (ctrl) {
			// Create a shared scope for this route if not existas
			if (!this.$powerUi.controllers.$routeSharedScope[routeId]) {
				this.$powerUi.controllers.$routeSharedScope[routeId] = {};
				this.$powerUi.controllers.$routeSharedScope[routeId]._instances = 0;
			}
			this.$powerUi.controllers.$routeSharedScope[routeId]._instances = this.$powerUi.controllers.$routeSharedScope[routeId]._instances + 1;
			ctrl.params.$shared = this.$powerUi.controllers.$routeSharedScope[routeId];
		}
		// Create a new element to this view and add it to secundary-view element (where all secundary views are)
		const newViewNode = document.createElement('div');
		const viewId = getIdAndCreateIfDontHave(newViewNode);
		newViewNode.id = viewId;
		newViewNode.classList.add('power-view');
		document.getElementById(routeViewId).appendChild(newViewNode);
		// Load the route inside the new element view
		this.loadRoute({
			title: title,
			routeId: routeId,
			paramKeys: paramKeys,
			viewId: viewId,
			ctrl: this.routes[routeId].ctrl,
			title: this.routes[routeId].title,
		});
		return viewId;
	}

	openRoute({routeId, params, target, currentRouteId, currentViewId, title}) {
		const paramKeys = this.getRouteParamKeysWithoutDots(this.routes[routeId].route);
		if (paramKeys) {
			for (const key of paramKeys) {
				if (!params || !params[key]) {
					throw `The parameter "${key}" of route "${routeId}" is missing!`;
				}
			}
		}

		if (this.routeExists({routeId, params})) {
			return;
		} else {
			// Close the current view and open the route in a new secundary view
			if (target === '_self') {
				const selfRoute = this.getOpenedRoute({routeId: currentRouteId, viewId: currentViewId});
				const oldHash = this.getOpenedSecundaryRoutesHash([selfRoute.route]);
				const newRoute = oldHash + `?sr=${this.buildHash({routeId, params, paramKeys})}`;
				this.navigate({hash: newRoute, title: title});
			// Open the route in a new secundary view without closing any view
			} else if (target === '_blank') {
				const oldHash = this.getOpenedSecundaryRoutesHash();
				const newRoute = oldHash + `?sr=${this.buildHash({routeId, params, paramKeys})}`;
				this.navigate({hash: newRoute, title: title});
			// Close all secundary views and open the route in the main view
			} else {
				this.navigate({hash: this.buildHash({routeId, params, paramKeys}), title: title});
			}
		}
	}

	// Get the hash definition of current secundary routes
	getOpenedSecundaryRoutesHash(filter=[]) {
		const routeParts = this.extractRouteParts(this.locationHashWithHiddenRoutes());
		let oldHash = routeParts.path.replace(this.config.rootRoute, '');
		for (let route of routeParts.secundaryRoutes) {
			route = route.replace(this.config.rootRoute, '');
			if (filter.lenght === 0 || !filter.includes(route)) {
				oldHash = oldHash + `?sr=${route}`;
			}
		}
		return oldHash;
	}

	navigate({hash, title}) {
		window.history.pushState(null, title, window.location.href);
		window.location.replace(encodeURI(this.config.rootRoute) + encodeURI(hash));
	}

	buildHash({routeId, params, paramKeys}) {
		let route = this.routes[routeId].route.slice(3, this.routes[routeId].length);

		if (params && paramKeys.length) {
			for (const key of paramKeys) {
				route = route.replace(`:${key}`, params[key]);
			}
		}
		return route;
	}

	routeExists({routeId, params}) {
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

		// Test the secundary routes
		for (const sroute of this.currentRoutes.secundaryRoutes) {
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

	setMainRouteState({routeId, paramKeys, route, viewId, title}) {
		// Register current route id
		this.currentRoutes.id = routeId;
		this.currentRoutes.route = route.replace(this.config.rootRoute, ''); // remove #!/
		this.currentRoutes.viewId = this.routes[routeId].viewId || viewId;
		this.currentRoutes.isMainView = true;
		this.currentRoutes.title = title;
		// Register current route parameters keys and values
		if (paramKeys) {
			this.currentRoutes.params = this.getRouteParamValues({routeId: routeId, paramKeys: paramKeys});
		} else {
			this.currentRoutes.params = [];
		}
	}
	setSecundaryOrHiddenRouteState({routeId, paramKeys, route, viewId, title}) {
		const newRoute = {
			title: title,
			isMainView: false,
			params: [],
			id: '',
			route: route.replace(this.config.rootRoute, ''), // remove #!/
			viewId: this.routes[routeId].viewId || viewId,
		}
		// Register current route id
		newRoute.id = routeId;
		// Register current route parameters keys and values
		if (paramKeys) {
			newRoute.params = this.getRouteParamValues({routeId: routeId, paramKeys: paramKeys, route: route});
		}
		return newRoute;
	}

	extractRouteParts(path) {
		const routeParts = {
			path: path,
			secundaryRoutes: [],
			hiddenRoutes: [],
		};
		if (path.includes('?')) {
			const splited = path.split('?');
			routeParts.path = splited[0];
			for (const part of splited) {
				if (part.includes('sr=')) {
					for (const fragment of part.split('sr=')) {
						if (fragment) {
							routeParts.secundaryRoutes.push(this.config.rootRoute + fragment);
						}
					}
				} else	if (part.includes('hr=')) {
					for (const fragment of part.split('hr=')) {
						if (fragment) {
							routeParts.hiddenRoutes.push(this.config.rootRoute + fragment);
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
		if (this.currentRoutes.id === routeId && this.currentRoutes.viewId) {
			return this.currentRoutes;
		} else {
			for (const route of this.currentRoutes.secundaryRoutes) {
				if (route.id === routeId && route.viewId === viewId) {
					return route;
				}
			}
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
		const routeParts = this.routes[routeId].route.split('/');
		const hashParts = (route || this.locationHashWithHiddenRoutes() || this.config.rootRoute).split('/');
		const params = [];
		for (const key of paramKeys) {
			// Get key and value
			params.push({key: key.substring(1), value: hashParts[routeParts.indexOf(key)]});
			// Also remove any ?sr=route from the value
			// params.push({key: key.substring(1), value: hashParts[routeParts.indexOf(key)].replace(/(\?sr=[^]*)/, '')});
		}
		return params;
	}

	getParamValue(key) {
		const param = this.currentRoutes.params.find(p => p.key === key);
		return param ? param.value : null;
	}
}

class PowerInterpolation {
	constructor(config={}, powerUi) {
		this.config = config;
		this.$powerUi = powerUi;
		this.startSymbol = config.interpolateStartSymbol || '{{';
		this.endSymbol = config.interpolateEndSymbol || '}}';
	}

	compile({template, scope, view}) {
		if (!scope && view) {
			// The scope of the controller of the view of this element
			scope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;
		}
		return this.replaceInterpolation(template, scope);
	}
	// Add the {{ }} to pow interpolation values
	getDatasetResult(template, scope) {
		return this.compile({template: `${this.startSymbol} ${decodeURIComponent(template)} ${this.endSymbol}`, scope: scope});
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

	// interpolationToPowText(template, tempTree, scope) {
	// 	const templateWithoutComments = template.replace(/<!--[\s\S]*?-->/gm, '');
	// 	const match = templateWithoutComments.match(this.standardRegex());
	// 	if (match) {
	// 		for (const entry of match) {
	// 			const id = _Unique.domID('span');
	// 			const innerTEXT = this.getInterpolationValue(entry, scope);
	// 			const value = `<span data-pow-eval="${encodeURIComponent(this.stripInterpolation(entry).trim())}"
	// 				data-pwhascomp="true" id="${id}">${innerTEXT}</span>`;
	// 			template = template.replace(entry, value);

	// 			// Regiter any new element on tempTree pending to add after interpolation
	// 			tempTree.pending.push(id);
	// 		}
	// 	}
	// 	return template;
	// }

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
				let newItem = item.replace(regexOldValue, newValue);
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
					attr.value = attr.value.replace(regexOldValue, newValue);
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
					newValue: newValue
				});
			}
		}
		return tmp.innerHTML;
	}

	getInterpolationValue(entry, scope) {
		let newEntry = this.stripWhiteChars(entry);
		newEntry = this.stripInterpolation(newEntry);
		return this.safeEvaluate(newEntry, scope);
	}

	safeEvaluate(entry, scope) {
		let result;
		try {
			result = this.$powerUi.safeEval({text: decodeURIComponent(entry), scope: scope, $powerUi: this.$powerUi});
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
			// {name: 'object', obj: ObjectPattern}, // this is a secundary detector
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
	constructor({text, nodes, scope, $powerUi}) {
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

		this.evalNodes();
	}

	evalNodes() {
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
							this.eval(item);
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

	eval(item) {
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
			value = this.getOnScope(item.label);
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
			value = this.evalObject(item);
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

	evalObject(item) {
		let $currentScope = '';
		let objOnScope = '';
		let value = '';

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
		}
		if (objOnScope !== '') {
			value = objOnScope;
			objOnScope = '';
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

	// Return item on $scope or $powerUi ($rootScope)
	getOnScope(item) {
		if (this.$scope[item] !== undefined) {
			return this.$scope[item];
		} else if (this.$powerUi[item] !== undefined) {
			return this.$powerUi[item];
		} else {
			return undefined;
		}
	}

	// Get the scope where objec exists
	getObjScope(item) {
		if (this.$scope[item] !== undefined) {
			return this.$scope;
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
        tempElement.innerHTML = this.template({$title: title || null});
        const content = tempElement.querySelectorAll('[data-pw-content]');
        content[0].innerHTML = template;
        template = tempElement.innerHTML;

        return template;
    }
}

class PowerDialogBase extends PowerWidget {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});

		const self = this;
		this._closeWindow = function() {
			self._cancel();
		}
		$powerUi._events['Escape'].subscribe(this._closeWindow);
	}
	// Allow async calls to implement onCancel
	_cancel() {
		if (this.onCancel) {
			new Promise(this.onCancel.bind(this)).then(
				this.closeCurrentRoute.bind(this)
			).catch(()=> (this.onCancelError) ? this.onCancelError() : null);
		} else {
			this.closeCurrentRoute();
		}
	}
	// Allow async calls to implement onCommit
	_commit() {
		if (this.onCommit) {
			new Promise(this.onCommit.bind(this)).then(
				this.closeCurrentRoute.bind(this)
			).catch(()=> (this.onCommitError) ? this.onCommitError() : null);
		} else {
			this.closeCurrentRoute();
		}
	}

	closeCurrentRoute() {
		// Only close if is opened, if not just remove the event
		const view = document.getElementById(this._viewId);
		this.$powerUi._events['Escape'].unsubscribe(this._closeWindow);
		if (view) {
			super.closeCurrentRoute();
		} else {
			// If not opened, call the next in the queue
			this.$powerUi._events['Escape'].broadcast();
		}
	}

	_onViewLoad(view) {
		const buttons = view.querySelectorAll('[data-pow-click]');
		for (const bt of buttons) {
			if (bt.getAttribute('data-pow-click').includes('_commit')) {
				bt.focus();
				return true;
			}
		}
	}

	$buttons() {
		if (this.commitBt || this.cancelBt) {
			const cancelBt = '<button class="pw-btn-default" data-pow-event onclick="_cancel()">Cancel</button>';
			let buttons = '';
			if (this.commitBt) {
				const commitIco = `<span class="pw-ico fa fa-${(this.commitBt.ico ? this.commitBt.ico : 'check-circle')}"></span>`;
				const commitBt = `<button
								class="${(this.commitBt.css ? this.commitBt.css : 'pw-btn-default')}"
								data-pow-event onclick="_commit()">
								${(this.commitBt.ico !== false ? commitIco : '')}
								${(this.commitBt.label ? this.commitBt.label : 'Ok')}
								</button>`;
				buttons = buttons + commitBt;
			}
			if (this.cancelBt) {
				const cancelIco = `<span class="pw-ico fa fa-${(this.cancelBt.ico ? this.cancelBt.ico : 'times-circle')}"></span>`;
				const cancelBt = `<button
								class="${(this.cancelBt.css ? this.cancelBt.css : 'pw-btn-default')}"
								data-pow-event onclick="_cancel()">
								${(this.cancelBt.ico !== false ? cancelIco : '')}
								${(this.cancelBt.label ? this.cancelBt.label : 'Cancel')}
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
		return `<div class="pw-title-bar">
					<span class="pw-title-bar-label">${this.$title}</span>
					<div data-pow-event onclick="_cancel()" class="pw-bt-close fa fa-times"></div>
				</div>
				<div class="pw-window">
					<div class="pw-container" data-pw-content>
					</div>
					<div class="pw-container">
						${this.$buttons()}
					</div>
				</div>`;
	}
}

class PowerDialog extends PowerDialogBase {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
	}

	template({$title}) {
		// This allow the user define a this.$title on controller constructor or compile, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-dialog pw-dialog-container">
					${super.template({$title})}
				</div>`;
	}
}

class PowerAlert extends PowerDialog {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
		this.commitBt = true;
	}
}

class PowerConfirm extends PowerDialog {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
		this.commitBt = true;
		this.cancelBt = true;
	}
}

class PowerModal extends PowerDialogBase {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
		this.isModal = true;
	}

	clickOutside(event) {
		if (event.target.classList.contains('pw-modal-backdrop')) {
			this._cancel();
		}
	}

	template({$title}) {
		if (document.body && document.body.classList) {
			document.body.classList.add('modal-open');
		}
		// This allow the user define a this.$title on controller constructor, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-modal pw-modal-backdrop" data-pow-event onclick="clickOutside(event)">
					${super.template({$title})}
				</div>`;
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
		// this.element = menu;
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

const someViewTemplate = `<h1>Cats list</h1>
			<div data-pow-for="cat of cats">
				<div data-pow-css-hover="pw-blue" data-pow-if="cat.gender === 'female'" id="cat_b{{$pwIndex}}_f">{{$pwIndex + 1}} - Minha linda <span data-pow-eval="cat.name"></span> <span data-pow-if="cat.name === 'Princesa'">(Favorita!)</span>
				</div>
				<div data-pow-css-hover="pw-orange" data-pow-if="cat.gender === 'male'" id="cat_b{{$pwIndex}}_m">{{$pwIndex + 1}} - Meu lindo {{ cat.name }} <span data-pow-if="cat.name === 'Riquinho'">(Favorito!)</span>
				</div>
				<div data-pow-css-hover="pw-yellow" data-pow-if="cat.gender === 'unknow'" id="cat_b{{$pwIndex}}_u">{{$pwIndex + 1}} - São lindos meus {{ cat.name }}
				</div>
			</div>
			<hr>
			<h1>Ice cream list</h1>
			<div data-pow-for="icecream of [
				{
					flavor: 'Flakes',
					color: 'light-yellow'
				},
				{
					flavor: 'Chocolatte',
					color: 'Brown',
					isFavorite: true
				},
				{
					flavor: 'Lemon',
					color: 'Green',
					isFavorite: false
				}
			]">
				<div class="some{{2+3}}" data-pow-css-hover="pw-blue" id="ice{{3*(3 + $pwIndex)}}_f">{{$pwIndex + 1}} - My delicious icecream of {{icecream.flavor }} is {{ icecream.color }} <span data-pow-if="icecream.isFavorite === true">(My favorite!)</span>
				</div>
			</div>`;
var teste = 'MARAVILHA!';

class FrontPage extends PowerController {

	ctrl() {
		// const parser = new PowerTemplateParser({text: 'a() === 1 || 1 * 2 === 0 ? "teste" : (50 + 5 + (100/3))'});
		// const parser = new PowerTemplateParser({text: 'pity.teste().teste(pity.testador(2+2), pity[a])[dd[f]].teste'});
		// const parser = new PowerTemplateParser({text: '2.5+2.5*5-2+3-3*2*8/2+3*(5+2*(1+1)+3)+a()+p.teste+p[3]()().p'});
		// const princesa = '2.5+2.5*5-20+3-3*2*8/2+3*5+2*1+1+3-15*2+30';
		// const princesa = '2.5*2.5 + 5 + 1 * 2 + 13.75 - 27';
		// const princesa = 'fofa[(a ? b : c)]';
		// const princesa = 'teste(princesa( { teste: beleza({key: value1, key2: value2}), number: 2+2, dict: pity[teste]["novo"].pity(2+2), "fim": end } ), 2+5, teste())';
		// const princesa = 'princesa ? fofa : linda';
		// const princesa = 'princesa ? fofa ? gatinha : amorosa : linda';
		// const princesa = 'princesa ? fofa : linda ? amorosa : dengosa';
		// const princesa = 'princesa ? fofa ? gatinha ? lindinha : fofinha : amorosa[a?b:c] : linda ? sdfsd : ss';

		this.pitanga = 'olha';
		this.morango = 'pen';
		this.amora = 'inha';
		this.pita = {teste: {pi10: 25, func: a}};
		this.testess = 'teste';
		this.j = 2;
		this.h = 3;
		this.sdfs = false;
		this.falso = false;
		this.pArray = [1,2,3,4,5];

		// const princesa = '2.5*2.5 + (5 - 2) + (1 * (2 + 5) + 5.75)';
		// const princesa = 'j + j - h * j + (j*j*j)*h + 2 + num(16) + nSum(2, 3) * nMult(5, 2 , 6)';
		// const princesa = 'j + j - h * j + (j*j*j)*h + 2 + num(16) + nSum(2, 3) * nMult(5, 2 , 6) - nov.nSum(20, 10)';
		// const princesa = 'getValue({value: 2+2+4+4-2 + (5+5)}) - j + j - h * j + -+-+-(j*j*j)*-+-+-h *+-2 + num(16) + nSum(2, 3) * nMult(5, 2 , 6) - +-+-+- +-+- +-+-nov.nSum(20, 10) + pita["teste"].pi10 + nov.nSum(20, 10) + pita["teste"].func()().aqui + pita["teste"].func()().nossa.cool["final"]+-+-+-+-+-309';
		// const princesa = '+-j*-h+j-h+-2*+20+-35 - + 2 + -pita["teste"].pi10 +-+-+-+-+-+-+-nov.nSum(20, 10) + " pity o bom"';
		// const princesa = '-pita["teste"].pi10 +-+-+-+-+-nov.nSum(20, 10)';
		// const princesa = 'sdfs || falso || 2 < 1 || 2 === 1 || pitanga';
		// const princesa = '2 > 2 && 2 === 2 || 2 === 2 && (j + h) === 6 - 2 || "pity"';
		// const princesa = 'getValue({value: 2+2+4+4-2 + (5+5)})';
		// const princesa = '[[1,2,3], [j,h,pity], ["pity", "andre", "bred"], [pita, pita.teste, {a: 1, b: 2}, {a: {cor: "verde", preço: 1.25}, b: {cor: "amarelo", preço: 2}, c: [1,2,3,4,5,6],}]]';
		// const princesa = 'getValue2(pita["teste"]["pi10"])';
		// const princesa = 'getValue2([{a: [1,2,3,4,5,6], b: [3,2,1]}, [], {}])';
		// this.final = [{flavor: 'Flakes', color: 'light-yellow'}, {flavor: 'Chocolatte', color: 'Brown', isFavorite: true}];
		// this.princesa = '2+2-1+(2*3)+10';

		// const value = this.safeEval(princesa);
	}

	getValue({value}) {
		return value;
	}

	getValue2(value) {
		return value;
	}

	onViewLoad(view) {

	}

	openModal(params) {
		this.openRoute({
			params: params,
			routeId: 'component1',
			target: '_blank',
		});
	}

	openSimpleModal() {
		this.openRoute({
			routeId: 'simple-template',
			target: '_blank',
		});
	}

	gotoPowerOnly() {
		this.openRoute({
			routeId: 'power-only',
		});
	}
}

class PowerOnlyPage extends PowerController {
	ctrl({lock, $powerUi}) {
		this.cats = [
			{name: 'Sol', gender: 'female'},
			{name: 'Lion', gender: 'male'},
			{name: 'Duque', gender: 'male'},
			{name: 'Tiger', gender: 'male'},
			{name: 'Pingo', gender: 'male'},
			{name: 'Meg', gender: 'female'},
			{name: 'Princesa', gender: 'female'},
			{name: 'Lady', gender: 'female'},
			{name: 'Lindinha', gender: 'female'},
			{name: 'Docinho', gender: 'female'},
			{name: 'Florzinha', gender: 'female'},
			{name: 'Laylita', gender: 'female'},
		];
	}

	changeModel(kind) {
		if (this.oldName === this.myName) {
			this.myName = 'My name is Bond, James Bond!';
		} else {
			this.changeName = this.myName;
			this.myName = this.oldName;
			this.oldName = this.changeName;
		}
		if (this.cats.length === 12) {
			this.cats[10].name = 'Luke';
			this.cats[10].gender = 'male';
			this.cats.push({name: 'Floquinho', gender: 'male'});
			this.cats.push({name: '4 gatinhos', gender: 'unknow'});
		} else {
			this.cats[10].name = 'Florzinha';
			this.cats[10].gender = 'female';
			this.cats.pop();
		}
		if (kind === 'pwReload') {
			this.$powerUi.pwReload();
		} else if (kind === 'hardRefresh') {
			this.$powerUi.hardRefresh(document);
		} else if (kind === 'softRefresh') {
			this.$powerUi.softRefresh(document);
		}
	}

	onViewLoad(view) {

	}

	openSimpleModal() {
		this.openRoute({
			routeId: 'simple-template',
			target: '_blank',
		});
	}

	openSimpleDialog() {
		// this.openRoute({
		// 	routeId: 'simple-dialog',
		// 	target: '_blank',
		// });

		this.$powerUi.$services.widget.open({
			title: 'Confirm dialog',
			template: '<p>This is a dialog</p>',
			ctrl: {
				component: SimpleDialog,
				params: {pity: true},
			},
		});
	}

	test() {
		console.log('mouseover!');
	}

	gotoIndex() {
		this.openRoute({
			routeId: 'front-page'
		});
	}

	openModal(params) {
		this.openRoute({
			params: params,
			routeId: 'component1',
			target: '_blank',
		});
	}
}

class SimpleModal extends PowerModal {
	init() {
		this.commitBt = {
			label: 'Close',
		}
	}

	ctrl({lock, $powerUi}) {
		this.cats = [
			{name: 'Sol', gender: 'female'},
			{name: 'Lion', gender: 'male'},
			{name: 'Duque', gender: 'male'},
			{name: 'Tiger', gender: 'male'},
			{name: 'Pingo', gender: 'male'},
			{name: 'Meg', gender: 'female'},
			{name: 'Lindinha', gender: 'female'},
			{name: 'Laylita', gender: 'female'},
		];
	}

	onViewLoad(view) {
	}
}

class SimpleDialog extends PowerConfirm {

	init() {
		this.commitBt = {
			label: 'Yes',
			// ico: 'check',
		};
		this.cancelBt = {
			label: 'No',
			// ico: 'close',
		};
	}

	ctrl({lock, $powerUi}) {

	}

	// onViewLoad(view) {
	// 	console.log('aqui', view);
	// }
	onCancel(resolve, reject) {
		console.log('Really cancel?');
		resolve();
		// this.$powerUi.request({
		// 		url: 'somecomponent.html',
		// 		method: 'GET',
		// 		status: "Loading page",
		// 		withCredentials: false,
		// }).then(function (response, xhr) {
		// 	console.log('success');
		// 	resolve();
		// }).catch(function (response, xhr) {
		// 	console.log('error', response, xhr);
		// 	reject();
		// });
	}

	onCommit(resolve, reject) {
		console.log('It is confirmed!');
		resolve();
	}

	onCancelError() {
		console.log('cancel fails');
	}

	onCommitError() {
		console.log('confirm fails');
	}
}

class FakeModal extends PowerModal {
	constructor({$powerUi, lock, viewId, routeId}) {
		super({$powerUi});
	}

	init() {
		const parts = window.location.hash.split('/');
		this.$title = 'My books: ' + decodeURI(parts[parts.length - 1]);
	}

	ctrl({lock, $powerUi, $shared}) {
		this.cats = [
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
		this.cands = [
			['bala', 'chiclete'],
			['brigadeiro', 'cajuzinho'],
			['bolo', 'torta'],
		];

		this.flowers = {
			Rose: 'Pink',
			Orchidy: 'White',
			Violet: 'Blue',
			Daisy: 'Yellow',

		}
		this.languages = {
			good: {name: 'Python', kind: 'Not typed'},
			hard: {name: 'Java', kind: 'Typed'},
			bad: {name: 'EcmaScript', kind: 'Not typed'},
			old: {name: 'COBOL', kind: 'Not typed'},
			cool: {name: 'C++', kind: 'typed'},
		}

		this.myName = 'Eu sou o Pity o bom!';
		this.oldName = this.myName;
		this.currentIf = false;
	}

	showIf() {
		const route = this.$powerUi.router.getOpenedRoute({routeId: this._routeId, viewId: this._viewId});
		if (this.currentIf) {
			this.currentIf = false;
			return route.params[0].value;
		} else {
			this.currentIf = true;
			return route.params[1].value;
		}
	}

	getCandNumber(currentCand) {
		this.candCounter = 1;
		for (const group of this.cands) {
			for (const cand of group) {
				if (cand === currentCand) {
					return this.candCounter;
				}
				this.candCounter = this.candCounter + 1;
			}
		}
		return this.candCounter;
	}

	changeModel(kind) {
		this.currentIf = !this.currentIf;
		if (this.oldName === this.myName) {
			this.myName = 'My name is Bond, James Bond!';
		} else {
			this.changeName = this.myName;
			this.myName = this.oldName;
			this.oldName = this.changeName;
		}
		if (this.myName == 'My name is Bond, James Bond!') {
			this.languages.garbage = {name: 'PHP', kind: 'Not typed'};
		} else {
			delete this.languages.garbage;
		}
		this.showIf();
		if (this.cats.length === 12) {
			this.cats[10].name = 'Luke';
			this.cats[10].gender = 'male';
			this.cats.push({name: 'Floquinho', gender: 'male'});
			this.cats.push({name: '4 gatinhos', gender: 'unknow'});
			this.cands.push(['caramelo', 'pirulito']);
			this.cands.push(['pipoca', 'cocada']);
		} else {
			this.cats[10].name = 'Florzinha';
			this.cats[10].gender = 'female';
			this.cats.pop();
			this.cands.pop();
		}
		if (kind === 'pwReload') {
			this.$powerUi.pwReload();
		} else if (kind === 'hardRefresh') {
			this.$powerUi.hardRefresh(document);
		} else if (kind === 'softRefresh') {
			this.$powerUi.softRefresh(document);
		}
	}

	onViewLoad(view) {

	}

	openSimpleModal() {
		this.openRoute({
			routeId: 'simple-template',
			target: '_blank',
		});
	}

	openModal(params) {
		this.openRoute({
			params: params,
			target: '_self',
		});
	}
}

const routes = [
		{
			id: 'front-page',
			title: 'PowerUi - Rich UI made easy',
			route: '/',
			templateUrl: 'front_page.html',
			ctrl: {
				component: FrontPage,
				params: {lock: true},
			},
		},
		{
			id: 'power-only',
			title: 'Power only page | PowerUi',
			route: 'power_only',
			templateUrl: 'power_only.html',
			avoidCacheTemplate: false,
			ctrl: {
				component: PowerOnlyPage,
				params: {lock: true},
			},
		},
		{
			id: 'power-only2',
			route: 'power_only/:id/:name/:title',
			templateUrl: 'power_only.html',
			ctrl: {
				component: PowerOnlyPage,
				params: {lock: true},
			},
		},
		{
			id: 'simple-dialog',
			route: 'dialog',
			title: 'Confirm dialog',
			template: `<p>This is a dialog</p>`,
			hidden: true,
			ctrl: {
				component: SimpleDialog,
				params: {pity: true},
			},
		},
		{
			id: 'component1',
			title: 'Books | PowerUi',
			route: 'component/:name/:title',
			templateUrl: 'somecomponent.html',
			avoidCacheTemplate: false,
			ctrl: {
				component: FakeModal,
				params: {lock: false},
			},
		},
		{
			id: 'simple-template',
			title: 'The simple one | PowerUi',
			route: 'simple',
			template: someViewTemplate,
			ctrl: {
				component: SimpleModal,
				params: {lock: false},
			},
		},
		{
			id: 'otherwise',
			title: 'Not found | PowerUi',
			route: '404',
			templateUrl: '404.html',
		}
	];

const services = {
	widget: {
		component: WidgetService,
		params: {},
	}
};

const t0 = performance.now();
let app = new PowerUi({
	routes: routes,
	services: services,
});

console.log('app', app);
app.pity = function() {
	return myName;
}
app.pity2 = function(name, phase) {
	return name + ' ' + phase;
}

app.variable = 'obj';
app.obj = {obj: {obj: 'obj'}};
app.piii = {pity: {pity: 'pity'}};
app.teste = {pity: {obj: true}, lu: {obj: false}};

app.num = function (num) {
	return num;
}

const num = app.num;

app.nSum = function (num1, num2) {
	return num1 + num2;
}

const nSum = app.nSum;
app.nov = {nSum: nSum};

const nov = {nSum: nSum};

app.nMult = function (num1, num2, num3) {
	return (num1 + num2) * num3;
}

const nMult = app.nMult;

function a () {
	return b;
}
const someDict = {aqui: 25, nossa: {cool: {final: 63}}};
function b () {
	return someDict;
}
window.c = {'2d': {e: function() {return function() {return 'eu';};}}};

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
