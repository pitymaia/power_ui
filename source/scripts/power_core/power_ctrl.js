class PowerController extends PowerScope {
	constructor({$powerUi}) {
		// Add $powerUi to controller
		super({$powerUi: $powerUi});
		this.volatileRouteIds = [];
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

	closeCurrentRoute() {
		const route = this.router.getOpenedRoute({routeId: this._routeId, viewId: this._viewId});
		const parts = decodeURI(this.router.locationHashWithHiddenRoutes()).split('?');
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
		// If view not ready set _cancelOpenRoute to close the route after its full loaded
		if (!this._ready) {
			this._cancelOpenRoute = true;
		}
		if (this._cancelOpenRoute === true) {
			this._cancelOpenRoute = false;
			this._ready = false;
		}
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
