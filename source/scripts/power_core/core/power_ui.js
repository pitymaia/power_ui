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

	startObserver() {
		const self = this;
		setInterval(function () {
			self.runObserver();
		}, 500);
	}

	runObserver() {
		let hasChange = false;
		for (const key of Object.keys(this.observing)) {
			const active = this.observing[key]._$pwActive;
			const lastWidth = this.observing[key].lastWidth;
			const currentWidth = this.observing[key].element.offsetWidth;
			const lastHeight = this.observing[key].lastHeight;
			const currentHeight = this.observing[key].element.offsetHeight;
			if (!active) {
				if (lastWidth && lastHeight && ((lastWidth !== currentWidth) || (lastHeight !== currentHeight))) {
					hasChange = true;
				}

				if (this.observing[key].isToolbar && this.observing[key].powerAction.element.offsetLeft > this.observing[key].element.offsetWidth) {
					hasChange = true;
				}
			}
			this.observing[key].lastWidth = currentWidth;
			this.observing[key].lastHeight = currentHeight;
		}

		if (hasChange) {
			this.onBarSizeChange();
			this.hasChange = false;
		}
	}

	toggleSmallWindowMode() {
		const _appContainer = document.getElementById('app-container');
		if (window.innerWidth <= 768 || this.$powerUi.touchdevice) {
			this.smallWindowMode = true;
			_appContainer.classList.add('pw-small-window-mode');
		} else {
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
		this.barsSizeAndPosition();
		this._addMarginToBody();
		this._setAppContainerHeight();
		this.toggleSmallWindowMode();
		for (const dialog of this.$powerUi.dialogs) {
			if (dialog.ctrl.isWindow && (dialog.ctrl.isMaximized || this.smallWindowMode)) {
				dialog.ctrl.adjustWindowWithComponents();
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
		this.barsSizeAndPosition();
		this._addMarginToBody();
		this._setAppContainerHeight();
		this.toggleSmallWindowMode();
	}

	_orientationChange() {
		// window.alert(window.innerWidth);
		this._browserWindowResize();
	}

	_routeChange() {
		// This change the "app-container" and body element to allow adjust for fixed bars/menus
		this.barsSizeAndPosition();
		this._addMarginToBody();
		this._setAppContainerHeight();
		this.toggleSmallWindowMode();
	}

	powerWindowChange() {
		// This change the "app-container" and body element to allow adjust for fixed bars/menus
		this.barsSizeAndPosition();
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
	getBarsWithPrioritySizes() {
		const fixedBars = this.bars.filter(b=> b.bar.isFixed === true && window.getComputedStyle(b.bar.element).visibility !== 'hidden');
		this._reorderBars(fixedBars);

		let currentTotalTopHeight = 0;
		let currentTotalBottomHeight = 0;
		let currentTotalLeftWidth = 0;
		let currentTotalRightWidth = 0;
		for (const bar of fixedBars) {
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
				currentTotalRightWidth = currentTotalRightWidth + this.$powerUi._offsetComputedWidth(bar.bar.element);//bar.bar.element.offsetWidth;
			}
		}

		return fixedBars;
	}
	// This change the position for fixed bars/menus so it shows one after another
	// also register the info so "app-container" and body element can adjust for fixed bars/menus
	barsSizeAndPosition() {
		const fixedBars = this.getBarsWithPrioritySizes();
		this.topTotalHeight = 0;
		this.bottomTotalHeight = 0;
		this.leftTotalWidth = 0;
		this.rightTotalWidth = 0;
		this.totalHeight = 0;
		let zIndex = 1000 + fixedBars.length;
		for (const bar of fixedBars) {
			bar.zIndex = zIndex;
			zIndex = zIndex - 1;
			bar.bar.element.style.zIndex = zIndex;
			if (bar.bar.barPosition === 'top') {
				this.totalHeight = this.totalHeight + bar.bar.element.offsetHeight;
				this.topTotalHeight = this.topTotalHeight + bar.bar.element.offsetHeight;
				bar.bar.element.style.top = bar.adjusts.top + 'px';
				bar.bar.element.style.left = bar.adjusts.left + 'px';
				bar.bar.element.style.width = null;
				bar.bar.element.style.width = this.$powerUi._offsetComputedWidth(bar.bar.element) - (bar.adjusts.left + bar.adjusts.right) + 'px';
			}
			if (bar.bar.barPosition === 'bottom') {
				this.totalHeight = this.totalHeight + bar.bar.element.offsetHeight;
				this.bottomTotalHeight = this.bottomTotalHeight + bar.bar.element.offsetHeight;
				bar.bar.element.style.bottom = bar.adjusts.bottom + 'px';
				bar.bar.element.style.left = bar.adjusts.left + 'px';
				bar.bar.element.style.width = null;
				bar.bar.element.style.width = this.$powerUi._offsetComputedWidth(bar.bar.element) - (bar.adjusts.left + bar.adjusts.right) + 'px';
			}
			if (bar.bar.barPosition === 'left') {
				this.leftTotalWidth = this.leftTotalWidth + bar.bar.element.offsetWidth;
				bar.bar.element.style.left = bar.adjusts.left + 'px';
				bar.bar.element.style.top = bar.adjusts.top + 'px';
				bar.bar.element.style.height = null;
				bar.bar.element.style.height = (window.innerHeight - this.$powerUi._offsetComputedPadding(bar.bar.element)) - bar.adjusts.top - bar.adjusts.bottom + 'px';
			}
			if (bar.bar.barPosition === 'right') {
				this.rightTotalWidth = this.rightTotalWidth + bar.bar.element.offsetWidth;
				bar.bar.element.style.right = bar.adjusts.right + 'px';
				bar.bar.element.style.top = bar.adjusts.top + 'px';
				bar.bar.element.style.height = null;
				bar.bar.element.style.height = (window.innerHeight - this.$powerUi._offsetComputedPadding(bar.bar.element)) - bar.adjusts.top - bar.adjusts.bottom + 'px';
			}
			if (bar.bar.isToolbar) {
				bar.bar.setStatus();
			}
		}
	}
}

class PowerUi extends _PowerUiBase {
	constructor(config) {
		super();

		if (config.devMode) {
			window.addEventListener('message', event => {
				// IMPORTANT: check the origin of the data!
				if (event.origin.startsWith(config.devMode.main) || event.origin.startsWith(config.devMode.iframe)) {
					// The data was sent from your site.
					// Data sent with postMessage is stored in event.data:
					if (event.data.click === true && event.data.id) {
						const ctrl = this.getCurrentElementCtrl(document.getElementById(event.data.id));
						ctrl.windowsOrder();
					}

					// Commands only to iframe element
					if (window.location.href.startsWith(config.devMode.iframe)) {
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
						}
					}

				} else {
					console.log('DANGER', event.origin);
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
		this.addScopeEventListener();
		this.numberOfopenModals = 0;
		this.ctrlWaitingToRun = [];
		this.config = config;
		this.waitingViews = 0;
		this.waitingInit = [];
		this.initAlreadyRun = false;
		this._services = config.services || {}; // TODO is done, need document it. Format 'widget', {component: WidgetService, params: {foo: 'bar'}}
		this._addPowerServices();

		this.onPowerWindowChange = new UEvent('onPowerWindowChange');
		this.componentsManager = new ComponentsManager(this);
		this.interpolation = new PowerInterpolation(config, this);
		this._events = {};
		this._events.ready = new UEvent();
		this._events.Escape = new UEvent();
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
		this.router.onRouteChange.subscribe(this.componentsManager._routeChange.bind(this.componentsManager));
		this.router.onRouteChange.subscribe(this.componentsManager.runObserver.bind(this.componentsManager));
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

	closeAllSecundaryRoutes(supressNavigate=false) {
		const original = this.router.locationHashWithHiddenRoutes();
		let currentHash = original;
		for (const sr of this.router.currentRoutes.secundaryRoutes) {
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

	closeAllHiddenRoutes(hashFromSecundary=false) {
		const original = this.router.locationHashWithHiddenRoutes();
		let currentHash = hashFromSecundary ? hashFromSecundary : original;
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
		const hash = this.closeAllSecundaryRoutes(true);
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
		const element = (event && event.detail && event.detail.elementId) ? document.getElementById(event.detail.elementId) : false;
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
		return parseInt(getComputedStyle(element).height.split('px')[0] || 0) - parseInt(getComputedStyle(element)['margin-top'].split('px')[0] || 0)  + parseInt(getComputedStyle(element)['border-top-width'].split('px')[0] || 0) - parseInt(getComputedStyle(element)['margin-bottom'].split('px')[0] || 0)  + parseInt(getComputedStyle(element)['border-bottom-width'].split('px')[0] || 0) - parseInt(getComputedStyle(element)['padding-top'].split('px')[0] || 0) - parseInt(getComputedStyle(element)['padding-bottom'].split('px')[0] || 0);
	}

	_offsetComputedPadding(element) {
		return parseInt(getComputedStyle(element)['padding-top'].split('px')[0] || 0) + parseInt(getComputedStyle(element)['padding-bottom'].split('px')[0] || 0);
	}

	_offsetComputedWidth(element) {
		return parseInt(getComputedStyle(element).width.split('px')[0] || 0) - (parseInt(getComputedStyle(element)['padding-left'].split('px')[0] || 0) + parseInt(getComputedStyle(element)['padding-right'].split('px')[0] || 0));
	}
	_offsetComputedAdjustSides(element) {
		return parseInt(getComputedStyle(element).width.split('px')[0] || 0) + parseInt(getComputedStyle(element)['padding-left'].split('px')[0] || 0) + parseInt(getComputedStyle(element)['padding-right'].split('px')[0] || 0);
	}
}

export { PowerUi };
