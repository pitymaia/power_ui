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
		let value = param ? param.value : null;
		const valueAsInt = value ? parseInt(value) : null;
		if (Number.isNaN(valueAsInt)) {
			return value;
		} else {
			return valueAsInt;
		}
	}

	request(options) {
		return this.$powerUi.request(options);
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
		this.$powerUi._$nodeSelectdToEdit = event.target;
		this.$powerUi._$nodeSelectdToEdit.classList.add('pw-selected-to-edit');
		this._$postToMain({
			command: 'selectNodeToEdit',
			level: this.$powerUi._$nodeSelectdToEdit.dataset.level,
			file: element.dataset.file,
			route: element.dataset.route,
		});
	}

	_$createEditableHtml(template, fileName, routeId) {
		if (!this.$powerUi.devMode.isEditable || !this.$powerUi.devMode.child) {
			return template;
		}

		template = template.replaceAll('onclick', 'ondblclick');
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
					if (node.for) {
						node.for = null;
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
