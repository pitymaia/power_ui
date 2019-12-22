class WidgetService extends PowerServices {

	open({title, template, ctrl, target, params}) {
		const routeId = `pow_route_${this.$powerUi._Unique.next()}`;
		// Register the route for remotion with the controller
		this.$ctrl.volatileRouteIds.push(routeId);
		this._open({
			routeId: routeId,
			target: target || '_blank',
			title: title,
			template: template,
			ctrl: ctrl,
			params: params,
		});
	}

	_open({routeId, params, target, title, template, ctrl}) {
		// Add it as a hidden route
		const newRoute = {
			id: routeId,
			title: title,
			route: this.$powerUi.router.config.rootRoute + routeId, // Use the routeId as unique route
			template: template,
			hidden: true,
			ctrl: ctrl,
			isVolatile: true,
		};

		this.$powerUi.router.routes[routeId] = newRoute;

		console.log('route', this.$powerUi.router.routes);
		// Now open the new route
		this.$powerUi.router.openRoute({
			routeId: routeId || this.$ctrl._routeId, // destRouteId
			currentRouteId: this.$ctrl._routeId,
			currentViewId: this.$ctrl._viewId,
			params: params,
			target: target,
			title: title || null,
		});
	}
}
