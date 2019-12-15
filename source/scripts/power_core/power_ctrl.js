class PowerController {
	constructor({$powerUi}) {
		// Add $powerUi to controller
		this.$powerUi = $powerUi;
	}

	get router() {
		return this.$powerUi.router;
	}

	openRoute({routeId, params={}, target}) {
		this.router.openRoute({
			routeId: routeId || this._routeId, // destRouteId
			currentRouteId: this._routeId,
			currentViewId: this._viewId,
			params: params,
			target: target,
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
		this.router.changeHash(newHash);
	}

	safeEval(string) {
		return this.$powerUi.safeEval({text: string, scope: this});
	}
}
