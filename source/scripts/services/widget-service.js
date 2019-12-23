class WidgetService extends PowerServices {

	mayAddCtrlParams({params, onCommit, onCancel}) {
		if (params === undefined) {
			params = {};
		}
		if (onCommit) {
			params.onCommit = onCommit;
		}
		if (onCancel) {
			params.onCancel = onCancel;
		}

		return params;
	}

	alert({title, template, ctrl, target, params, controller, onCommit, onCancel, templateUrl}) {
		this.open({
			title: title,
			template: template,
			templateUrl: templateUrl,
			ctrl: ctrl,
			target: target,
			params: params,
			controller: controller,
			kind: 'alert',
			onCommit: onCommit,
			onCancel: onCancel,
		});
	}

	confirm({title, template, ctrl, target, params, controller, onCommit, onCancel, templateUrl}) {
		this.open({
			title: title,
			template: template,
			templateUrl: templateUrl,
			ctrl: ctrl,
			target: target,
			params: params,
			controller: controller,
			kind: 'confirm',
			onCommit: onCommit,
			onCancel: onCancel,
		});
	}

	modal({title, template, ctrl, target, params, controller, onCommit, onCancel, templateUrl}) {
		this.open({
			title: title,
			template: template,
			templateUrl: templateUrl,
			ctrl: ctrl,
			target: target,
			params: params,
			controller: controller,
			kind: 'modal',
			onCommit: onCommit,
			onCancel: onCancel,
		});
	}

	open({title, template, ctrl, target, params, controller, kind, onCommit, onCancel, templateUrl}) {
		// Allow to create some empty controller so it can open without define one
		if (!ctrl && !controller) {
			controller = function () {};
		}
		if (!ctrl && controller && (typeof controller === 'function')) {
			// Wrap the functions inside an PowerAlert controller
			params = this.mayAddCtrlParams({params: params, onCommit: onCommit, onCancel: onCancel});
			ctrl = {
				component: wrapFunctionInsideDialog({controller: controller, kind: kind, params: params}),
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
			templateUrl: templateUrl,
			ctrl: ctrl,
			params: params,
		});
	}

	_open({routeId, params, target, title, template, ctrl, templateUrl}) {
		// Add it as a hidden route
		const newRoute = {
			id: routeId,
			title: title,
			route: this.$powerUi.router.config.rootRoute + routeId, // Use the routeId as unique route
			template: templateUrl || template,
			templateUrl: templateUrl,
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
