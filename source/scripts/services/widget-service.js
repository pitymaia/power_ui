class WidgetService extends PowerServices {

	alert({title, template, ctrl, target, params, controller}) {
		this.open({
			title: title,
			template: template,
			ctrl: ctrl,
			target: target,
			params: params,
			controller: controller,
			kind: 'alert',
		});
	}

	confirm({title, template, ctrl, target, params, controller}) {
		this.open({
			title: title,
			template: template,
			ctrl: ctrl,
			target: target,
			params: params,
			controller: controller,
			kind: 'confirm',
		});
	}

	modal({title, template, ctrl, target, params, controller}) {
		this.open({
			title: title,
			template: template,
			ctrl: ctrl,
			target: target,
			params: params,
			controller: controller,
			kind: 'modal',
		});
	}

	open({title, template, ctrl, target, params, controller, kind}) {
		// Allow to create some empty controller so it can open without define one
		if (!ctrl && !controller) {
			controller = function () {};
		}
		if (!ctrl && controller && (typeof controller === 'function')) {
			// Wrap the functions inside an PowerAlert controller
			ctrl = {
				component: wrapFunctionInsideDialog({controller: controller, kind: kind}),
			};
		}
		if (ctrl.params === undefined) {
			ctrl.params = {};
		}

		// Create a new volatile then open it
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
