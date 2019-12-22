class PowerController {
	constructor({$powerUi}) {
		// Add $powerUi to controller
		this.$powerUi = $powerUi;
		this._servicesInstances = {};
		this.volatileRouteIds = [];
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
			target: target, // '_blank' cannot be default like in target: target || '_blank' to allow pages navigation
			title: route.title || null,
		});
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
