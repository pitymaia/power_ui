class PowerController extends PowerScope {
	constructor({$powerUi}) {
		// Add $powerUi to controller
		super({$powerUi: $powerUi});
		this.volatileRouteIds = [];
	}

	_load(data) {
		const self = this;
		return new Promise(
			function (resolve, reject) {
				data.resolve = resolve;
				data.reject = reject;
				self.load(data);
			});
	}

	get router() {
		return this.$powerUi.router;
	}

	refresh(viewId, reloadCtrl) {
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

		this.router._refresh(viewId, reloadCtrl);
	}

	reload(viewId) {
		this.refresh(viewId, true);
	}

	getRouteCtrl(routeId) {
		return this.$powerUi.getRouteCtrl(routeId);
	}

	openRoute({routeId, params, target}) {
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
		});
	}

	closeCurrentRoute(callback) {
		if (this.router.engineIsRunning) {
			this.router.phantomRouter.closePhantomRoute(this._routeId);
			return;
		}
		// Save the callback to run after view is removed
		if (callback) {
			this._$closeCurrentRouteCallback = callback;
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
