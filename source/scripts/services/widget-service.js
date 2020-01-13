class WidgetService extends PowerServices {

	mayAddCtrlParams({params, onCommit, onCancel, onCancelError, onCommitError}) {
		if (params === undefined) {
			params = {};
		}
		if (onCommit) {
			params.onCommit = onCommit;
		}
		if (onCancel) {
			params.onCancel = onCancel;
		}
		if (onCommitError) {
			params.onCommitError = onCommitError;
		}
		if (onCancelError) {
			params.onCancelError = onCancelError;
		}

		return params;
	}

	alert(options) {
		options.kind = 'alert';
		this.open(options);
	}

	confirm(options) {
		options.kind = 'confirm';
		this.open(options);
	}

	yesno(options) {
		options.kind = 'yesno';
		this.open(options);
	}

	modal(options) {
		options.kind = 'modal';
		this.open(options);
	}
	window(options) {
		options.kind = 'window';
		this.open(options);
	}

	open({title, template, ctrl, target, params, controller, kind, onCommit, onCommitError, onCancel, onCancelError, templateUrl, templateComponent}) {
		// Allow to create some empty controller so it can open without define one
		if (!ctrl && !controller) {
			controller = function () {};
		}
		if (!ctrl && controller && (typeof controller === 'function')) {
			// Wrap the functions inside an PowerAlert controller
			params = this.mayAddCtrlParams({
				params: params,
				onCommit: onCommit,
				onCancel: onCancel,
				onCommitError: onCommitError,
				onCancelError: onCancelError
			});
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
			templateComponent: templateComponent,
			ctrl: ctrl,
			params: params,
		});
	}

	_open({routeId, params, target, title, template, ctrl, templateUrl, templateComponent}) {
		// Add it as a hidden route
		const newRoute = {
			id: routeId,
			title: title,
			route: this.$powerUi.router.config.rootRoute + routeId, // Use the routeId as unique route
			template: templateUrl || templateComponent || template,
			templateUrl: templateUrl,
			templateComponent: templateComponent,
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
