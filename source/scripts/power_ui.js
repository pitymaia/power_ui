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
		this.ctrlWaitingToRun = [];
		this.controllers = {};
		this.config = config;
		this.waitingViews = 0;
		this.waitingInit = [];
		this.initAlreadyRun = false;
		this.interpolation = new PowerInterpolation(config, this);
		this._events = {};
		this._events['ready'] = new UEvent();
		this.request = new Request(config);
		this.router = new Router(config, this); // Router calls this.init();

		console.log('POWER UI IS INSTANCIATED');
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

		if (this.controllers[viewId] && this.controllers[viewId].instance && this.controllers[viewId].instance.onViewLoad) {
			this.controllers[viewId].instance.onViewLoad(this.powerTree.allPowerObjsById[viewId].$shared.element);
		}
		const t1 = performance.now();
		console.log('PowerUi init run in ' + (t1 - t0) + ' milliseconds.');
	}

	pwReload() {
		this.initAlreadyRun = false;
		this.router._reload();
	}

	initNodes({template, routeId, viewId}) {
		const t0 = performance.now();
		for (const item of this.waitingInit) {
			this.powerTree.createAndInitObjectsFromCurrentNode({id: item.node.id});
			document.getElementById(item.node.id).style.visibility = null;
		}

		if (this.controllers[viewId] && this.controllers[viewId].instance && this.controllers[viewId].instance.onViewLoad) {
			this.controllers[viewId].instance.onViewLoad(this.powerTree.allPowerObjsById[viewId].$shared.element);
		}
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
				this.controllers[ctrl.viewId].instance.ctrl(this.controllers[ctrl.viewId].params);
			}
		}
		this.ctrlWaitingToRun = [];
	}

	loadTemplateUrl({template, viewId, currentRoutes, routeId, routes}) {
		const self = this;
		const view = this.prepareViewToLoad({viewId: viewId, routeId: routeId});
		this.request({
				url: template,
				method: 'GET',
				status: "Loading page",
				withCredentials: false,
		}).then(function (response, xhr) {
			view.innerHTML = xhr.responseText;
			self.ifNotWaitingServerCallInit({template: response, routeId: routeId, viewId: viewId});
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

	loadTemplate({template, viewId, currentRoutes, routeId, routes}) {
		const view = this.prepareViewToLoad({viewId: viewId, routeId: routeId});
		view.innerHTML = template;
		this.ifNotWaitingServerCallInit({template: template, routeId: routeId, viewId: viewId});
	}

	ifNotWaitingServerCallInit({template, routeId, viewId}) {
		const self = this;
		console.log('!!!!! ifNotWaitingServerCallInit', self, routeId, viewId);
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
