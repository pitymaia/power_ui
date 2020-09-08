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
		const param = this._routeParams.find((p)=> p.key === key);
		return param ? parseInt(this._routeParams.find((p)=> p.key === key).value) : null;
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
}

export { PowerController };
