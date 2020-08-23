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

	alert(options) {
		options.kind = 'alert';
		return this.open(options);
	}

	confirm(options) {
		options.kind = 'confirm';
		return this.open(options);
	}

	yesno(options) {
		options.kind = 'yesno';
		return this.open(options);
	}

	modal(options) {
		options.kind = 'modal';
		return this.open(options);
	}
	window(options) {
		options.kind = 'window';
		return this.open(options);
	}
	windowIframe(options) {
		options.kind = 'windowIframe';
		return this.open(options);
	}

	open({title, template, ctrl, target, params, controller, kind, onCommit, onCancel, templateUrl, templateComponent, url}) {
		const self = this;
		const _promise = new Promise(function (resolve, reject) {
			// Allow to create some empty controller so it can open without define one
			if (!ctrl && !controller) {
				controller = function () {};
			}
			if (!ctrl && controller && (typeof controller === 'function')) {
				// Wrap the functions inside an PowerAlert controller
				params = self.mayAddCtrlParams({
					params: params,
					onCommit: onCommit,
					onCancel: onCancel,
				});
				ctrl = wrapFunctionInsideDialog({controller: controller, kind: kind, params: params, resolve: resolve, reject: reject});
			}
		});


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
			url: url,
			ctrl: ctrl,
			params: params,
		});
		return _promise;
	}

	_open({routeId, params, target, title, template, ctrl, templateUrl, templateComponent, url}) {
		// Add it as a hidden route
		const newRoute = {
			id: routeId,
			title: title,
			route: this.$powerUi.router.config.rootPath + routeId, // Use the routeId as unique route
			template: templateUrl || templateComponent || template || url,
			templateUrl: templateUrl,
			templateComponent: templateComponent,
			hidden: true,
			ctrl: ctrl,
			isHidden: true,
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
