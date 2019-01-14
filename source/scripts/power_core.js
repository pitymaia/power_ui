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

	// This is the normal subscribe for custom events
	// If the event doesn't exists create it and subscribe
	// If it already exists just subscribe
	subscribe({event, fn, useCapture=false, ...params}) {
		const ctx = this;
		// Create the event
		if (!this._events[event]) {
			this._events[event] = new Event(this.id);
		}
		// Subscribe to the element
		this._events[event].subscribe(fn, ctx, params);
	}

	// This is a subscribe for native envents that broadcast when the event is dispached
	// If the event doesn't exists create it and subscribe
	// If it already exists just subscribe
	nativeSubscribe({event, fn, useCapture=false, ...params}) {
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
	{name: 'power-heading'},
	{name: 'power-item'},
	{name: 'power-label'},
	{name: 'power-action'},
	{name: 'power-dropdown'},
	{name: 'power-link'},
	{name: 'power-status'},
	{name: 'power-icon'},
];


class PowerDOM {
	constructor($powerUi) {
		this.$powerUi = $powerUi;
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
					// Don't add siblings to $shared
					if (attr != '$shared') {
						if (!this.allPwElementsById[id][attr].siblings) {
							this.allPwElementsById[id][attr].siblings = {};
						}
						// To avoid add this element as a sibling of it self we need iterate over attrs again
						for (const siblingAttr in this.allPwElementsById[id]) {
							// Also don't add $shared siblings
							if (siblingAttr !== attr && siblingAttr != '$shared') {
								this.allPwElementsById[id][attr].siblings[siblingAttr] = this.allPwElementsById[id][siblingAttr];
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
			if (!ctx.allPwElementsById[id]) {
				ctx.allPwElementsById[id] = {};
			} else {
				const selectorToTest = document.querySelectorAll(`[id=${id}]`);
				if (selectorToTest.length > 1) {
					// Check if there is some duplicated ID
					console.error('DUPLICATED IDs:', selectorToTest);
					throw `HTML element can't have duplicated IDs: ${id}`;
				}
			}
			ctx.allPwElementsById[id][datasetKey] = ctx[attribute][datasetKey][id];
			// Add to any element some desired variables
			ctx.allPwElementsById[id][datasetKey]._id = id;
			ctx.allPwElementsById[id][datasetKey].$_pwName = datasetKey;
			ctx.allPwElementsById[id][datasetKey].$powerUi = ctx.$powerUi;
			// Create a $shared scope for each element
			if (!ctx.allPwElementsById[id].$shared) {
				ctx.allPwElementsById[id].$shared = {};
			}
			// add the shered scope to all elements
			ctx.allPwElementsById[id][datasetKey].$shared = ctx.allPwElementsById[id].$shared;
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
