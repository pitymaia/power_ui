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
		this.controllers = {};
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

		this.interpolation = new PowerInterpolation(config, this);
		this._events = {};
		this._events.ready = new UEvent();
		this._events.Escape = new UEvent();
		this.request = new Request({config, $powerUi: this});
		this.router = new Router(config, this); // Router calls this.init();

		// suport ESC qkey
		document.addEventListener('keyup', this._keyUp.bind(this), false);
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
			const ctrl = this.controllers[sr.viewId].instance;
			currentHash = this.removeRouteFromHash(currentHash, ctrl._routeId, ctrl._viewId);
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
			const ctrl = this.controllers[hr.viewId].instance;
			currentHash = this.removeRouteFromHash(currentHash, ctrl._routeId, ctrl._viewId);
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
		this.tmp = {dropmenu: {}};
		// Detect if is touchdevice (Phones, Ipads, etc)
		this.touchdevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement) ? true : false;
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
	// PowerTemplate (before run any controller)
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

		// Save main-view and secundary-view innerHTML before refresh so can restore it after replace the template
		if (routeId === '#root') {
			let mainView = document.getElementById('main-view');
			const mainViewInnerHTML = mainView.innerHTML;
			let secundaryView = document.getElementById('secundary-view');
			const secundaryViewInnerHTML = secundaryView.innerHTML;

			view.innerHTML = template;

			mainView = document.getElementById('main-view');
			mainView.innerHTML = mainViewInnerHTML;
			secundaryView.innerHTML = secundaryViewInnerHTML;
		} else {
			view.innerHTML = template;
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
}

export { PowerUi };
