function getEmptyRouteObjetc() {
	return {
		params: [],
		id: '',
		viewId: '',
		route: '',
		secundaryRoutes: [],
		hiddenRoutes: [],
		mainChildRoutes: [],
		secundaryChildRoutes: [],
		hiddenChildRoutes: [],
	};
}

class Router {
	constructor(config, powerUi) {
		this.config = config || {};
		this.$powerUi = powerUi;
		this.routes = {};
		this.oldRoutes = getEmptyRouteObjetc();
		this.currentRoutes = getEmptyRouteObjetc();
		if (!this.config.rootPath) {
			this.config.rootPath = '#!/';
		}
		if (config.routes) {
			for (const route of config.routes) {
				this.add(route);
			}
		}
		this.engine();

		// call engine if hash change
		window.onhashchange = this.hashChange.bind(this);
	}

	add(route) {
		route.template = route.templateUrl || route.template || route.templateComponent || route.url;
		// main route and secundary routes view id
		this.config.routerMainViewId = 'main-view';
		this.config.routerSecundaryViewId = 'secundary-view';
		// Ensure that the parameters are not empty
		if (!route.id) {
			throw new Error('A route ID must be given');
		}
		if (!route.ctrl && route.id !== 'otherwise') {
			window.console.log('route missing ctrl:', route);
			throw new Error('A route "ctrl" must be given');
		}
		// Ensure that the parameters have the correct types
		if (typeof route.route !== "string" && route.id !== '$root') {
			throw new TypeError('typeof route must be a string');
		}

		// Rewrite root route difined as '/' to an empty string so the final route can be '#!/'
		if (route.route === '/') {
			route.route = '';
		}

		route.route = this.config.rootPath + route.route;

		// throw an error if the route already exists to avoid confilicting routes
		// the "otherwise" route can be duplicated only if it do not have a template
		if (route.id !== 'otherwise' || route.template) {
			for (const routeId of Object.keys(this.routes || {})) {
				// the "otherwise" route can be duplicated only if it do not have a template
				if (this.routes[routeId].route === route.route && (routeId !== 'otherwise' || this.routes[routeId].template)) {
					if (routeId === 'otherwise' || route.id === 'otherwise') {
						throw new Error(`the route "${route || '/'}" already exists, so "${route.id}" can't use it if you use a template. You can remove the template or use another route.`);
					} else {
						throw new Error(`the route "${route || '/'}" already exists, so "${route.id}" can't use it.`);
					}
				}
			}
		}
		// throw an error if the route id already exists to avoid confilicting routes
		if (this.routes[route.id]) {
			throw new Error(`the id ${route.id} already exists`);
		} else {
			this.routes[route.id] = route;
		}
	}

	// Copy the current open secundary route, and init the router with the new route
	hashChange(event) {
		// Save a copy of currentRoutes as oldRoutes
		this.oldRoutes = this.cloneRoutes({source: this.currentRoutes});
		// Clean current routes
		this.currentRoutes = getEmptyRouteObjetc();
		this.engine();
	}

	cloneRouteList(dest, source, listName) {
		for (const route of source[listName]) {
			const list = {
				id: route.id,
				viewId: route.viewId,
				route: route.route,
				params: [],
			};
			for (const param of route.params) {
				list.params.push({key: param.key, value: param.value});
			}
			dest[listName].push(list);
		}
	}

	cloneRoutes({source}) {
		const dest = {
			params: [],
			id: source.id,
			viewId: source.viewId,
			route: source.route,
			secundaryRoutes: [],
			hiddenRoutes: [],
			mainChildRoutes: [],
			secundaryChildRoutes: [],
			hiddenChildRoutes: [],
		};
		for (const param of source.params) {
			dest.params.push({key: param.key, value: param.value});
		}
		this.cloneRouteList(dest, source, 'secundaryRoutes');
		this.cloneRouteList(dest, source, 'hiddenRoutes');
		this.cloneRouteList(dest, source, 'mainChildRoutes');
		this.cloneRouteList(dest, source, 'secundaryChildRoutes');
		this.cloneRouteList(dest, source, 'hiddenChildRoutes');
		return dest;
	}

	_refresh(viewId, reloadCtrl) {
		// If have a rootScope and need refresh it or refresh all views user _refreshAll()
		if (viewId === 'root-view' || (!viewId && this.$powerUi._rootScope)) {
			this._refreshAll(reloadCtrl);
			return;
		}

		// This refresh a single view or multiple views if have a $root scope
		let openedRoutes = this.getOpenedRoutesRefreshData();

		if (viewId) {
			openedRoutes = openedRoutes.filter((r)=> r.viewId === viewId);
		}

		for (const route of openedRoutes) {
			if (route.$tscope) {
				const self = this;
				route.$tscope._template().then(function (response) {
					const template = response;

					self.replaceViewContent({
						view: route.view,
						viewId: route.viewId,
						routeId: route.routeId,
						title: route.title,
						template: template,
						reloadCtrl: reloadCtrl,
					});
				}).catch(function (response, xhr) {
					window.console.log('_refresh fails', route);
				});
			} else {
				this.replaceViewContent({
					view: route.view,
					viewId: route.viewId,
					routeId: route.routeId,
					title: route.title,
					template: route.template,
					reloadCtrl: reloadCtrl,
				});
			}

		}
	}

	_removeElementsAndEvents(openedRoutes) {
		const openedRoutesWithRoot = [];
		for (const route of openedRoutes) {
			openedRoutesWithRoot.push(route);
		}

		openedRoutesWithRoot.unshift(this.$powerUi._rootScope);

		for (const route of openedRoutesWithRoot) {
			// delete all inner elements and events from this.allPowerObjsById[id]
			if (this.$powerUi.powerTree.allPowerObjsById[route.viewId]) {
				this.$powerUi.powerTree.allPowerObjsById[route.viewId]['$shared'].removeInnerElementsFromPower();
			}
		}
	}

	_refreshRootThanOthers(openedRoutes, reloadCtrl) {
		const self = this;
		const route = this.$powerUi._rootScope;
		let view = this.$powerUi.prepareViewToLoad({viewId: route.viewId, routeId: route.routeId});

		if (route.$tscope) {
			route.$tscope._template().then(function (response) {
				const template = response;

				self.$powerUi.buildViewTemplateAndMayCallInit({
					self: self.$powerUi,
					view: view,
					template: template,
					routeId: route.routeId,
					viewId: route.viewId,
					title: route.title,
					refreshing: true,
					reloadCtrl: reloadCtrl,
					initAll: true,
				});

				self._refreshAllOthers(reloadCtrl, openedRoutes);
			}).catch(function (response, xhr) {
				window.console.log('_rootScope fails', response, route);
			});
		}
	}
	_refreshAllOthers(reloadCtrl, openedRoutes) {
		// Second prepare and load
		for (const route of openedRoutes) {
			if (!document.getElementById(route.view.id)) {
				const secundary = document.getElementById('secundary-view');
				secundary.appendChild(route.view);
			}
			let view = this.$powerUi.prepareViewToLoad({viewId: route.viewId, routeId: route.routeId});

			if (route.$tscope) {
				const self = this;
				route.$tscope._template().then(function (response) {
					const template = response;

					self.$powerUi.buildViewTemplateAndMayCallInit({
						self: self.$powerUi,
						view: view,
						template: template,
						routeId: route.routeId,
						viewId: route.viewId,
						title: route.title,
						refreshing: true,
						reloadCtrl: reloadCtrl,
						initAll: true,
					});
				}).catch(function (response, xhr) {
					window.console.log('_refreshAll fails', response, route);
				});
			} else {
				this.$powerUi.buildViewTemplateAndMayCallInit({
					self: this.$powerUi,
					view: view,
					template: route.template,
					routeId: route.routeId,
					viewId: route.viewId,
					title: route.title,
					refreshing: true,
					reloadCtrl: reloadCtrl,
					initAll: true,
				});
			}
		}
	}

	// Refresh with root-view
	_refreshAll(reloadCtrl) {
		let openedRoutes = this.getOpenedRoutesRefreshData();

		// TODO: Check this
		// First remove elements and events
		// this._removeElementsAndEvents(openedRoutes);
		this._refreshRootThanOthers(openedRoutes, reloadCtrl);
	}

	replaceViewContent({view, viewId, routeId, title, template, reloadCtrl}) {
		// delete all inner elements and events from this.allPowerObjsById[id]
		if (this.$powerUi.powerTree.allPowerObjsById[viewId]) {
			this.$powerUi.powerTree.allPowerObjsById[viewId]['$shared'].removeInnerElementsFromPower();
		}
		this.$powerUi.addSpinnerAndHideView(view);
		this.$powerUi.waitingInit.push({node: view, viewId: viewId});

		this.$powerUi.buildViewTemplateAndMayCallInit({
			self: this.$powerUi,
			view: view,
			template: template,
			routeId: routeId,
			viewId: viewId,
			title: title,
			refreshing: true,
			reloadCtrl: reloadCtrl,
		});
	}

	getOpenedRoutesRefreshData() {
		const viewsList = [];
		viewsList.push({
			view: document.getElementById(this.currentRoutes.viewId),
			routeId: this.currentRoutes.id,
			viewId: this.currentRoutes.viewId,
			title: this.currentRoutes.title,
			template: this.routes[this.currentRoutes.id].template,
			$tscope: this.routes[this.currentRoutes.id].$tscope || null,
		});
		for (const route of this.currentRoutes.secundaryRoutes) {
			viewsList.push({
				view: document.getElementById(route.viewId),
				routeId: route.id,
				viewId: route.viewId,
				title: route.title,
				template: this.routes[route.id].template,
				$tscope: this.routes[route.id].$tscope || null,
			});
		}
		for (const route of this.currentRoutes.hiddenRoutes) {
			viewsList.push({
				view: document.getElementById(route.viewId),
				routeId: route.id,
				viewId: route.viewId,
				title: route.title,
				template: this.routes[route.id].template,
				$tscope: this.routes[route.id].$tscope || null,
			});
		}
		return viewsList;
	}

	locationHashWithHiddenRoutes() {
		const hash = decodeURI(window.location.hash + (this.hiddenLocationHash || ''));
		return hash;
	}

	addSpinnerAndHideContent(viewId) {
		// Only add one spinner when the first view is added to waitingViews
		if (!document.getElementById('_power-spinner')) {
			// Backdrop
			const spinnerBackdrop = document.createElement('div');
			spinnerBackdrop.classList.add('pw-spinner-backdrop');
			spinnerBackdrop.id = '_power-spinner';

			// Spinner label
			const spinnerLabel = document.createElement('p');
			spinnerLabel.classList.add('pw-spinner-label');
			spinnerLabel.innerText = this.config.spinnerLabel || 'LOADING';
			spinnerBackdrop.appendChild(spinnerLabel);

			// Spinner
			const spinner = document.createElement('div');
			spinner.classList.add('pw-spinner');
			spinnerBackdrop.appendChild(spinner);

			// Add to body
			document.body.appendChild(spinnerBackdrop);
		}
		// Avoid blink uninterpolated data before call compile and interpolate
		const node = document.getElementById(viewId) || document.getElementById('main-view').parentNode;
		node.style.visibility = 'hidden';
	}

	removeSpinnerAndShowContent(viewId) {
		const spinner = document.getElementById('_power-spinner');
		// return;
		spinner.parentNode.removeChild(spinner);
		if (viewId) {
			const view = document.getElementById(viewId);
			view.style.visibility = null;
		}
	}

	buildRoutesTree(path) {
		const routeParts = {
			full_path: path,
			mainRoute: {path: path},
			secundaryRoutes: [],
			hiddenRoutes: [],
		};
		if (path.includes('?')) {
			const splited = path.split('?');
			routeParts.mainRoute = this.buildPathAndChildRoute(splited[0]);
			for (const part of splited) {
				if (part.includes('sr=')) {
					for (const fragment of part.split('sr=')) {
						if (fragment) {
							const sroute = this.buildPathAndChildRoute(
								this.config.rootPath + fragment);
							routeParts.secundaryRoutes.push(sroute);
						}
					}
				} else	if (part.includes('hr=')) {
					for (const fragment of part.split('hr=')) {
						if (fragment) {
							const hroute = this.buildPathAndChildRoute(
								this.config.rootPath + fragment);
							routeParts.hiddenRoutes.push(hroute);
						}
					}
				}
			}
		} else {
			routeParts.mainRoute = this.buildPathAndChildRoute(path);
		}
		return routeParts;
	}

	buildPathAndChildRoute(fragment) {
		fragment = fragment.replace(this.config.rootPath, '');
		const route = {};
		let current = route;
		const parts = fragment.split('&ch=');
		if (fragment.includes('&ch=')) {
			for (const child of parts) {
				// Jump the first entry becouse it's not a child route
				if (child !== parts[0]) {
					current.childRoute = {path: child};
					current = current.childRoute;
				}
			}
		}
		route.path = parts[0];
		return route;
	}

	recursivelyAddChildRoute(route, mainKind, powerViewNodeId) {
		const routesListName = `${mainKind}ChildRoutes`;
		if (route && route.childRoute) {
			const childRoute = this.matchRouteAndGetIdAndParamKeys(route.childRoute);
			if (childRoute) {
				let childViewId = this.getVewIdIfRouteExists(route.childRoute.path, routesListName);
				// Load child route only if it's a new route
				if (childViewId === false) {
					childViewId = _Unique.domID('view');
					// Add child route to ordered list
					this.orderedRoutesToLoad.push({
						routeId: childRoute.routeId,
						viewId: childViewId,
						paramKeys: childRoute.paramKeys,
						kind: 'child',
						powerViewNodeId: powerViewNodeId,
					});
				}
				// Register child route on currentRoutes list
				this.setChildRouteState({
					routeId: childRoute.routeId,
					paramKeys: childRoute.paramKeys,
					route: route.childRoute.path,
					viewId: childViewId,
					title: this.routes[childRoute.routeId].title,
					data: this.routes[childRoute.routeId].data,
					mainKind: mainKind,
				});
			}

			if (route.childRoute.childRoute) {
				this.recursivelyAddChildRoute(route.childRoute, mainKind, childRoute.powerViewNodeId);
			}
		}
	}

	setMainRouteAndAddToOrderedRoutesToLoad(currentRoutesTree) {
		// First check main route
		const mainRoute = this.matchRouteAndGetIdAndParamKeys(currentRoutesTree.mainRoute);
		// Second recursively add main route child and any level of child of childs
		if (mainRoute) {
			// Add main route to ordered list
			// Load main route only if it is a new route
			if (!this.oldRoutes.id || (this.oldRoutes.route !== currentRoutesTree.mainRoute.path)) {
				this.orderedRoutesToLoad.push({
					routeId: mainRoute.routeId,
					viewId: this.config.routerMainViewId,
					paramKeys: mainRoute.paramKeys,
					kind: 'main',
				});
			}
			// Register main route on currentRoutes list
			this.setMainRouteState({
				routeId: mainRoute.routeId,
				paramKeys: mainRoute.paramKeys,
				route: currentRoutesTree.mainRoute.path,
				viewId: this.config.routerMainViewId,
				title: this.routes[mainRoute.routeId].title,
				data: this.routes[mainRoute.routeId].data,
			});
			// Add any main child route to ordered list
			this.recursivelyAddChildRoute(currentRoutesTree.mainRoute, 'main', mainRoute.powerViewNodeId);
		} else {
			// otherwise if do not mach a route
			const newRoute = this.routes.otherwise ? this.routes.otherwise.route : this.config.rootPath;
			window.location.replace(encodeURI(newRoute));
			return;
		}
	}
	// Secundary and hidden routes
	setOtherRoutesAndAddToOrderedRoutesToLoad(routesList, routesListName, kind, setRouteState) {
		for (const route of routesList) {
			const currentRoute = this.matchRouteAndGetIdAndParamKeys(route);
			if (currentRoute) {
				let viewId = this.getVewIdIfRouteExists(route.path, routesListName);
				// Load route only if it's a new route
				if (viewId === false) {
					// Create route viewId
					viewId = _Unique.domID('view');
					// Add route to ordered list
					this.orderedRoutesToLoad.push({
						routeId: currentRoute.routeId,
						viewId: viewId,
						paramKeys: currentRoute.paramKeys,
						kind: kind,
					});
				}
				// Register route on currentRoutes list
				setRouteState({
					routeId: currentRoute.routeId,
					paramKeys: currentRoute.paramKeys,
					route: route.path,
					viewId: viewId,
					title: this.routes[currentRoute.routeId].title,
					data: this.routes[currentRoute.routeId].data,
				});
				// Add any child route to ordered list
				this.recursivelyAddChildRoute(route, kind, currentRoute.powerViewNodeId);
			}
		}
	}

	setNewRoutesAndbuildOrderedRoutesToLoad() {
		const currentRoutesTree = this.buildRoutesTree(this.locationHashWithHiddenRoutes() || this.config.rootPath);
		// First mach any main route and its children
		this.setMainRouteAndAddToOrderedRoutesToLoad(currentRoutesTree);
		// Second mach any secundary route and its children
		this.setOtherRoutesAndAddToOrderedRoutesToLoad(
			currentRoutesTree.secundaryRoutes, 'secundaryRoutes', 'secundary', this.setSecundaryRouteState.bind(this));
		// Third mach any hidden route and its children
		this.setOtherRoutesAndAddToOrderedRoutesToLoad(
			currentRoutesTree.hiddenRoutes, 'hiddenRoutes', 'hidden', this.setHiddenRouteState.bind(this));
	}

	async engine() {
		this.orderedRoutesToLoad = [];
		this.orderedRoutesToClose = [];
		this.addSpinnerAndHideContent('root-view');
		this.setNewRoutesAndbuildOrderedRoutesToLoad();
		this.buildOrderedRoutesToClose();
		this.removeViewInOrder(this.orderedRoutesToClose, 0, this);
		await this.resolveWhenListIsPopulated(
			this.runOnRouteCloseAndRemoveController, this.orderedRoutesToClose, 0, this);
		await this.resolveWhenListIsPopulated(
			this.initRouteControllerAndCallLoadInOrder, this.orderedRoutesToLoad, 0, this);
		await this.resolveWhenListIsPopulated(
			this.runControllerInOrder, this.orderedRoutesToLoad, 0, this);
		await this.resolveWhenListIsPopulated(
			this.loadRouteInOrder, this.orderedRoutesToLoad, 0, this);
		await this.resolveWhenListIsPopulated(
			this.callOnViewLoadInOrder, this.orderedRoutesToLoad, 0, this);
	}

	// This is the first link in a chain of recursive loop with promises
	// We are calling recursive functions that may contain promises
	// When the function detects it's done it calls the this function resolve
	resolveWhenListIsPopulated(fn, orderedList, index, ctx) {
		const _promise = new Promise(function(resolve) {
			const _resolve = resolve;
			fn(orderedList, index, ctx, _resolve);
		});
		return _promise;
	}

	removeViewInOrder(orderedRoutesToClose, routeIndex, ctx) {
		const route = orderedRoutesToClose[routeIndex];
		if (!route) {
			return;
		}
		ctx.removeView(route.viewId);
		ctx.removeViewInOrder(orderedRoutesToClose, routeIndex + 1, ctx);
	}

	// Run the controller instance for the route
	initRouteControllerAndCallLoadInOrder(orderedRoutesToLoad, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToLoad[routeIndex];
		if (!route) {
			return	_resolve();
		}

		const $data = ctx.routes[route.routeId].data || {};
		const ctrl = ctx.routes[route.routeId].ctrl;
		// Register the controller with $powerUi
		ctx.$powerUi.controllers[route.viewId] = {
			component: ctrl,
			data: $data,
		};
		// Instanciate the controller
		$data.$powerUi = ctx.$powerUi;
		$data.viewId = route.viewId;
		$data.routeId = route.routeId;
		$data.title = ctx.routes[route.routeId].title;
		ctx.$powerUi.controllers[route.viewId].instance = new ctrl($data);
		ctx.$powerUi.controllers[route.viewId].instance._viewId = route.viewId;
		ctx.$powerUi.controllers[route.viewId].instance._routeId = route.routeId;
		ctx.$powerUi.controllers[route.viewId].instance._routeParams = route.paramKeys ? ctx.getRouteParamValues({routeId: route.routeId, paramKeys: route.paramKeys}) : {};
		ctx.$powerUi.controllers[route.viewId].instance.$root = (ctx.$powerUi.controllers['root-view'] && ctx.$powerUi.controllers['root-view'].instance) ? ctx.$powerUi.controllers['root-view'].instance : null;

		// Run the controller load
		if (ctx.$powerUi.controllers[route.viewId] &&
			ctx.$powerUi.controllers[route.viewId].instance &&
			ctx.$powerUi.controllers[route.viewId].instance.load) {
			const loadPromise = ctx.$powerUi.controllers[route.viewId].instance._load(ctx.$powerUi.controllers[route.viewId].data);
			loadPromise.then(function () {
				ctx.initRouteControllerAndCallLoadInOrder(ctx.orderedRoutesToLoad, routeIndex + 1, ctx, _resolve);
			}).catch(function (error) {
				window.console.log('Error load CTRL: ', error);
			});
		} else {
			ctx.initRouteControllerAndCallLoadInOrder(ctx.orderedRoutesToLoad, routeIndex + 1, ctx, _resolve);
		}
	}

	runControllerInOrder(orderedRoutesToLoad, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToLoad[routeIndex];
		if (!route) {
			return	_resolve();
		}

		if (ctx.$powerUi.controllers[route.viewId] &&
			ctx.$powerUi.controllers[route.viewId].instance &&
			ctx.$powerUi.controllers[route.viewId].instance.ctrl) {
			const result = ctx.$powerUi.controllers[route.viewId].instance.ctrl(
				ctx.$powerUi.controllers[route.viewId].data);
			if (result && result.promise) {
				result.promise.then(function () {
					ctx.runControllerInOrder(
						ctx.orderedRoutesToLoad, routeIndex + 1, ctx, _resolve);
				}).catch(function (error) {
					window.console.log('Error running CTRL: ', error);
				});
			} else {
				ctx.runControllerInOrder(
					ctx.orderedRoutesToLoad, routeIndex + 1, ctx, _resolve);
			}
		} else {
			ctx.runControllerInOrder(
				ctx.orderedRoutesToLoad, routeIndex + 1, ctx, _resolve);
		}
	}

	runOnRouteCloseAndRemoveController(orderedRoutesToClose, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToClose[routeIndex];
		if (!route) {
			return _resolve();
		}

		// Delete the controller instance of this view if exists
		if (ctx.$powerUi.controllers[route.viewId] &&
			ctx.$powerUi.controllers[route.viewId].instance &&
			ctx.$powerUi.controllers[route.viewId].instance._$closeCurrentRouteCallback) {
			ctx.$powerUi.controllers[route.viewId].instance._$closeCurrentRouteCallback();
		}
		if (ctx.$powerUi.controllers[route.viewId] &&
			ctx.$powerUi.controllers[route.viewId].instance &&
			ctx.$powerUi.controllers[route.viewId].instance.onRouteClose) {
			const result = ctx.$powerUi.controllers[route.viewId].instance.onRouteClose();

			if (result && result.promise) {
				result.promise.then(function () {
					delete ctx.$powerUi.controllers[route.viewId];
					ctx.runOnRouteCloseAndRemoveController(
						orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
				}).catch(function (error) {
					window.console.log('Error running onRouteClose: ', route.routeId, error);
				});
			} else {
				delete ctx.$powerUi.controllers[route.viewId];
				ctx.runOnRouteCloseAndRemoveController(
					orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
			}
		} else {
			ctx.runOnRouteCloseAndRemoveController(orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
		}
	}

	callOnViewLoadInOrder(orderedRoutesToLoad, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToLoad[routeIndex];
		if (!route) {
			return _resolve();
		}

		if (ctx.$powerUi.controllers[route.viewId] && ctx.$powerUi.controllers[route.viewId].instance) {
			if (ctx.$powerUi.controllers[route.viewId].instance.onViewLoad) {
				const result = ctx.$powerUi.controllers[route.viewId].instance.onViewLoad(
					ctx.$powerUi.powerTree.allPowerObjsById[route.viewId].$shared.element); // passing the view element
				if (result && result.promise) {
					result.promise.then(function () {
						ctx.afterOnViewLoad(ctx, route);
						ctx.callOnViewLoadInOrder(orderedRoutesToLoad, routeIndex + 1, ctx, _resolve);
					}).catch(function (error) {
						window.console.log('Error running onViewLoad: ', route.routeId, error);
					});
				} else {
					ctx.afterOnViewLoad(ctx, route);
					ctx.callOnViewLoadInOrder(orderedRoutesToLoad, routeIndex + 1, ctx, _resolve);
				}
			} else {
				ctx.afterOnViewLoad(ctx, route);
				ctx.callOnViewLoadInOrder(orderedRoutesToLoad, routeIndex + 1, ctx, _resolve);
			}
		} else {
			ctx.callOnViewLoadInOrder(orderedRoutesToLoad, routeIndex + 1, ctx, _resolve);
		}
	}

	afterOnViewLoad(ctx, route) {
		if (ctx.$powerUi.controllers[route.viewId].instance._onViewLoad) {
			ctx.$powerUi.controllers[route.viewId].instance._onViewLoad(
				ctx.$powerUi.powerTree.allPowerObjsById[route.viewId].$shared.element); // passing the view element
		}
		ctx.$powerUi.controllers[route.viewId].instance._ready = true;
		// Close the route if user ask to close before it is ready
		if (ctx.$powerUi.controllers[route.viewId].instance._cancelOpenRoute) {
			ctx.$powerUi.controllers[route.viewId].instance.closeCurrentRoute();
		}
	}

	removeView(viewId) {
		if (!this.$powerUi.powerTree) {
			return;
		}
		// Remove custom css of this view if exists
		this.removeCustomCssNode(viewId);

		const powerViewNode = document.getElementById(viewId);
		// delete all inner elements and events from this.allPowerObjsById[id]
		if (this.$powerUi.powerTree.allPowerObjsById[viewId] &&
			this.$powerUi.powerTree.allPowerObjsById[viewId].$shared) {
			if (viewId === 'main-view') {
				this.$powerUi.powerTree.allPowerObjsById[viewId].$shared.removeInnerElementsFromPower();
			} else {
				this.$powerUi.powerTree.allPowerObjsById[viewId].$shared.removeElementAndInnersFromPower(powerViewNode)
			}
		}
		// Remove the node it self if not main-view
		if (viewId !== 'main-view' && powerViewNode) {
			powerViewNode.parentNode.removeChild(powerViewNode);
		}

		// Remove 'modal-open' css class from body if all modals are closed
		const modals = document.body.getElementsByClassName('pw-backdrop');
		if (modals && modals.length === 0) {
			document.body.classList.remove('modal-open');
		}
	}

	buildOrderedRoutesToClose() {
		// Add the old main route if have one
		if (this.oldRoutes.id && (this.oldRoutes.route !== this.currentRoutes.route)) {
			this.orderedRoutesToClose.unshift({
				routeId: this.oldRoutes.id,
				viewId: this.oldRoutes.viewId,
				params: this.oldRoutes.params,
				kind: 'main',
			});
		}
		// Add old child route from main route if have some
		this.markToRemoveRouteViews('mainChildRoutes', 'child');
		// Add old child route and secundary routes if have some
		this.markToRemoveRouteViews('secundaryChildRoutes', 'child');
		this.markToRemoveRouteViews('secundaryRoutes', 'secundary');
		// Add old child route from hidden routes if have some
		this.markToRemoveRouteViews('hiddenChildRoutes', 'child');
		this.markToRemoveRouteViews('hiddenRoutes', 'hidden');
	}

	markToRemoveRouteViews(routesListName, kind) {
		for (const old of this.oldRoutes[routesListName]) {
			if (!this.currentRoutes[routesListName].find(o=> o.route === old.route)) {
				this.orderedRoutesToClose.unshift({
					routeId: old.id,
					viewId: old.viewId,
					params: old.params,
					kind: kind,
				});
			}
		}
	}

	getVewIdIfRouteExists(route, listName) {
		const oldRoute = this.oldRoutes[listName].find(r=>r && r.route === route);
		const newRoute = this.currentRoutes[listName].find(r=>r && r.route === route);
		if (!oldRoute && !newRoute) {
			return false;
		} else {
			return oldRoute.viewId;
		}
	}

	addNewViewNode(viewId, routeViewNodeId) {
		// Create a new element to this view and add it to secundary-view element (where all secundary views are)
		const newViewNode = document.createElement('div');
		newViewNode.id = viewId;
		newViewNode.classList.add('power-view');
		const viewNode = document.getElementById(routeViewNodeId);
		viewNode.appendChild(newViewNode);
	}

	loadRouteInOrder(orderedRoutesToLoad, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToLoad[routeIndex];
		if (!route) {
			ctx.$powerUi.callInitViews();
			ctx.removeSpinnerAndShowContent('root-view');
			return _resolve();
		}
		if (route.kind === 'secundary' || route.kind === 'hidden') {
			ctx.addNewViewNode(route.viewId, ctx.config.routerSecundaryViewId);
		} else if (route.kind === 'child') {
			// Add the new node inside it's main route power-view node
			ctx.addNewViewNode(route.viewId, route.powerViewNodeId);
		}

		ctx.loadRoute({
			routeId: route.routeId,
			paramKeys: route.paramKeys,
			viewId: route.viewId,
			ctrl: ctx.routes[route.routeId].ctrl,
			title: ctx.routes[route.routeId].title,
			data: ctx.routes[route.routeId].data,
			loadRouteInOrder: ctx.loadRouteInOrder,
			orderedRoutesToLoad: ctx.orderedRoutesToLoad,
			routeIndex: routeIndex + 1,
			ctx: ctx,
			_resolve: _resolve,
		});
	}

	matchRouteAndGetIdAndParamKeys(route) {
		let found = false;
		for (const routeId of Object.keys(this.routes || {})) {
			// Only run if not otherwise or if the otherwise have a template
			if (routeId !== 'otherwise') {
				// If the route have some parameters get it /some_page/:page_id/syfy/:title
				const paramKeys = this.getRouteParamKeys(this.routes[routeId].route);
				let regEx = this.buildRegExPatternToRoute(routeId, paramKeys);
				// our route logic is true,
				const checkRoute = this.config.rootPath + route.path;
				if (checkRoute.match(regEx)) {
					if (this.routes[routeId] && this.routes[routeId].title) {
						document.title = this.routes[routeId].title;
					}

					if (routeId !== 'otherwise') {
						found = {routeId: routeId, paramKeys: paramKeys, powerViewNodeId: this.routes[routeId].powerViewNodeId || null};
					}
					break;
				}
			}
		}

		return found;
	}

	removeCustomCssNode(viewId) {
		// Remove custom css of this view if exists
		const nodeCss = document.getElementById('_css' + viewId);

		if (nodeCss) {
			const head = nodeCss.parentNode;
			if (head) {
				head.removeChild(nodeCss);
			}
		}
	}

	loadRoute({routeId, paramKeys, viewId, ctrl, title, data, loadRouteInOrder, orderedRoutesToLoad, routeIndex, ctx, _resolve}) {
		const _viewId = this.routes[routeId].viewId || viewId;

		// If have a template to load let's do it
		if (this.routes[routeId].template && !this.config.noRouterViews) {
			// If user defines a custom viewId to this route, but the router don't find it alert the user
			if (this.routes[routeId].viewId && !document.getElementById(this.routes[routeId].viewId)) {
				throw new Error(`You defined a custom viewId "${this.routes[routeId].viewId}" to the route "${this.routes[routeId].route}" but there is no element on DOM with that id.`);
			}
			if (this.routes[routeId].templateUrl && this.routes[routeId].templateIsCached !== true) {
				this.$powerUi.loadTemplateUrl({
					template: this.routes[routeId].template,
					viewId: _viewId,
					currentRoutes: this.currentRoutes,
					routeId: routeId,
					routes: this.routes,
					title: title,
					loadRouteInOrder: loadRouteInOrder,
					orderedRoutesToLoad: orderedRoutesToLoad,
					routeIndex: routeIndex,
					ctx: ctx,
					_resolve: _resolve,
				});
			} else if (this.routes[routeId].templateComponent) {
				this.$powerUi.loadTemplateComponent({
					template: this.routes[routeId].templateComponent,//this.routes[routeId].template,
					viewId: _viewId,
					currentRoutes: this.currentRoutes,
					routeId: routeId,
					routes: this.routes,
					title: title,
					$ctrl: this.$powerUi.controllers[_viewId].instance,
					loadRouteInOrder: loadRouteInOrder,
					orderedRoutesToLoad: orderedRoutesToLoad,
					routeIndex: routeIndex,
					ctx: ctx,
					_resolve: _resolve,
				});
			} else {
				this.$powerUi.loadTemplate({
					template: this.routes[routeId].template,
					viewId: _viewId,
					currentRoutes: this.currentRoutes,
					routeId: routeId,
					routes: this.routes,
					title: title,
					loadRouteInOrder: loadRouteInOrder,
					orderedRoutesToLoad: orderedRoutesToLoad,
					routeIndex: routeIndex,
					ctx: ctx,
					_resolve: _resolve,
				});
			}
		}
	}

	routeKind(routeId) {
		return this.routes[routeId].hidden ? 'hr' : 'sr';
	}

	buildNewHash(oldHash, fragment) {
		const splitedChild = fragment.split('&ch=');
		const splitedOld = oldHash.split('?');
		const splitedFragment = fragment.split('?');
		// If the fragment is already in old hash do not change it
		if (splitedOld.includes(splitedFragment[1])) {
			return oldHash;
		} else if (splitedChild.length > 1 && oldHash.includes(splitedChild[0])) {
			// Secundary or hidden route with a new child must be replaced
			const newEntry = splitedChild[0].split('?')[1];
			let index = 0;
			for (const item of splitedOld) {
				const oldMain = item.split('&ch=')[0];
				if (oldMain === newEntry) {
					splitedOld[index] = splitedFragment[1];
					return splitedOld.join('?');
				}
				index = index + 1;
			}
		} else {
			return oldHash + fragment;
		}
	}

	openRoute({routeId, params, target, currentRouteId, currentViewId, title}) {
		const routeKind = this.routeKind(routeId);
		const paramKeys = this.getRouteParamKeysWithoutDots(this.routes[routeId].route);
		if (paramKeys) {
			for (const key of paramKeys) {
				if (!params || !params[key]) {
					throw `The parameter "${key}" of route "${routeId}" is missing!`;
				}
			}
		}

		if (this.routeNotExists({routeId, params})) {
			return;
		} else {
			// Close the current view and open the route in a new secundary view
			if (target === '_self') {
				const selfRoute = this.getOpenedRoute({routeId: currentRouteId, viewId: currentViewId});
				const oldHash = this.getOpenedSecundaryOrHiddenRoutesHash({filter: [selfRoute.route]});
				const fragment = `?${routeKind}=${this.buildHash({routeId, params, paramKeys})}`;
				const newRoute = this.buildNewHash(oldHash, fragment);
				this.navigate({hash: newRoute, title: title});
			// Open the route in a new secundary view without closing any view
			} else if (target === '_blank') {
				const oldHash = this.getOpenedSecundaryOrHiddenRoutesHash({});
				const fragment = `?${routeKind}=${this.buildHash({routeId, params, paramKeys})}`;
				const newRoute = this.buildNewHash(oldHash, fragment);
				this.navigate({hash: newRoute, title: title});
			// Close all secundary views and open the route in the main view
			} else {
				this.navigate({hash: this.buildHash({routeId, params, paramKeys}), title: title, isMainView: true});
			}
		}
	}

	// Get the hash definition of current secundary and hidden routes
	getOpenedSecundaryOrHiddenRoutesHash({filter=[]}) {
		const routeParts = this.extractRouteParts(this.locationHashWithHiddenRoutes());
		let oldHash = routeParts.path.replace(this.config.rootPath, '');
		for (let route of routeParts.secundaryRoutes.concat(routeParts.hiddenRoutes)) {
			const routeKind = routeParts.hiddenRoutes.includes(route) ? 'hr' : 'sr';
			route = route.replace(this.config.rootPath, '');
			if (filter.lenght === 0 || !filter.includes(route)) {
				oldHash = oldHash + `?${routeKind}=${route}`;
			}
		}
		return oldHash;
	}

	navigate({hash, title, isMainView}) {
		const newHashParts = this.extractRouteParts(hash);
		let newHash = newHashParts.path || '';
		let newHiddenHash = '';
		for (const part of newHashParts.secundaryRoutes) {
			newHash = `${newHash}?sr=${part.replace(this.config.rootPath, '')}`;
		}
		for (const part of newHashParts.hiddenRoutes) {
			newHiddenHash = `${newHiddenHash}?hr=${part.replace(this.config.rootPath, '')}`;
		}

		this.hiddenLocationHash = encodeURI(newHiddenHash);
		// If there is some new secundary or main route
		if (window.location.hash !== encodeURI(this.config.rootPath + newHash)) {
			window.history.pushState(null, title, window.location.href);
			window.location.replace(encodeURI(this.config.rootPath) + encodeURI(newHash));
			if (isMainView){
				window.scrollTo(0, 0);
			}
		} else {
			// If there is only a new hidden rote
			// Only the hiddenLocationHash change, manually call hasChange
			this.hashChange();
		}
	}

	buildHash({routeId, params, paramKeys}) {
		let route = this.routes[routeId].route.slice(3, this.routes[routeId].length);
		if (params && paramKeys.length) {
			for (const key of paramKeys) {
				if (params[key]) {
					route = route.replace(`:${key}`, params[key]);
				}
			}
		}
		// If it's a child view recursively get the main view route
		if (this.routes[routeId].mainRouteId) {
			route = `${this.buildHash({routeId: this.routes[routeId].mainRouteId, params: params, paramKeys: paramKeys})}&ch=${route}`;
		}
		return route;
	}

	routeNotExists({routeId, params}) {
		let exists = false;
		// Test the main route
		if (routeId === this.currentRoutes.id) {
			if (!params) {
				return true;
			}
			let keyValueExists = false;
			for (const targetParamKey of Object.keys(params || {})) {
				for (const currentParam of this.currentRoutes.params) {
					if (targetParamKey === currentParam.key && params[targetParamKey] === currentParam.value) {
						keyValueExists = true;
					}
				}

				exists = keyValueExists;
				keyValueExists = false; // reset the flag to false
			}

			if (exists) {
				return true;
			}
		}

		// Test the secundary and hidden routes
		for (const sroute of this.currentRoutes.secundaryRoutes.concat(this.currentRoutes.hiddenRoutes)) {
			if (routeId === sroute.id) {
				let keyValueExists = false;
				for (const targetParamKey of Object.keys(params || {})) {
					for (const currentParam of sroute.params) {
						if (targetParamKey === currentParam.key && params[targetParamKey] === currentParam.value) {
							keyValueExists = true;
						}
					}

					exists = keyValueExists;
					keyValueExists = false; // reset the flag to false
				}
			}
		}
		return exists;
	}

	setMainRouteState({routeId, paramKeys, route, viewId, title, data}) {
		// Register current route id
		this.currentRoutes.id = routeId;
		this.currentRoutes.route = route.replace(this.config.rootPath, ''); // remove #!/
		this.currentRoutes.viewId = this.routes[routeId].viewId || viewId;
		this.currentRoutes.isMainView = true;
		this.currentRoutes.title = title;
		this.currentRoutes.data = data;
		// Register current route parameters keys and values
		if (paramKeys) {
			this.currentRoutes.params = this.getRouteParamValues({routeId: routeId, paramKeys: paramKeys});
		} else {
			this.currentRoutes.params = [];
		}
	}
	setOtherRouteState({routeId, paramKeys, route, viewId, title, data}) {
		const newRoute = {
			title: title,
			isMainView: false,
			params: [],
			id: '',
			route: route.replace(this.config.rootPath, ''), // remove #!/
			viewId: this.routes[routeId].viewId || viewId,
			data: data || null,
		};
		// Register current route id
		newRoute.id = routeId;
		// Register current route parameters keys and values
		if (paramKeys) {
			newRoute.params = this.getRouteParamValues({routeId: routeId, paramKeys: paramKeys, route: route});
		}
		return newRoute;
	}
	setSecundaryRouteState(params) {
		this.currentRoutes.secundaryRoutes.push(
			this.setOtherRouteState(params));
	}
	setHiddenRouteState(params) {
		this.currentRoutes.hiddenRoutes.push(
			this.setOtherRouteState(params));
	}
	setChildRouteState(params) {
		if (params.mainKind === 'main') {
			this.currentRoutes.mainChildRoutes.push(
				this.setOtherRouteState(params));
		} else if (params.mainKind === 'secundary') {
			this.currentRoutes.secundaryChildRoutes.push(
				this.setOtherRouteState(params));
		} else {
			this.currentRoutes.hiddenChildRoutes.push(
				this.setOtherRouteState(params));
		}
	}

	extractRouteParts(path) {
		const routeParts = {
			path: path,
			secundaryRoutes: [],
			hiddenRoutes: [],
		};
		if (path.includes('?')) {
			const splited = path.split('?');
			routeParts.path = splited[0];
			for (const part of splited) {
				if (part.includes('sr=')) {
					for (const fragment of part.split('sr=')) {
						if (fragment) {
							routeParts.secundaryRoutes.push(this.config.rootPath + fragment);
						}
					}
				} else	if (part.includes('hr=')) {
					for (const fragment of part.split('hr=')) {
						if (fragment) {
							routeParts.hiddenRoutes.push(this.config.rootPath + fragment);
						}
					}
				}
			}
		}
		return routeParts;
	}

	buildRegExPatternToRoute(routeId, paramKeys) {
		// This regular expression below avoid detect /some_page_2 and /some_page as the same route
		let regEx = new RegExp(`^${this.routes[routeId].route}$`);
		// If the route have some parameters like in /some_page/:page_id/syfy/:title
		// the code bellow modify the regEx pattern to allow (alphanumeric plus _ and -) values by
		// replacing the param keys :page_id and :title with the regex [a-zA-Z0-9_-]+
		if (paramKeys) {
			// replace the keys on regEx with a kegex to allow any character
			let newRegEx = regEx.toString();
			// Trim first and last char from regex string
			newRegEx = newRegEx.substring(1);
			newRegEx = newRegEx.slice(0, -1);

			for (const key of paramKeys) {
				// allow all [^]*
				newRegEx = newRegEx.replace(key, '[^]*');
			}
			regEx = new RegExp(newRegEx);
		}
		return regEx;
	}

	getRoute({routeId}) {
		return this.routes[routeId];
	}

	getOpenedRoute({routeId, viewId}) {
		if (this.currentRoutes.id === routeId && this.currentRoutes.viewId) {
			return this.currentRoutes;
		} else {
			for (const route of this.currentRoutes.secundaryRoutes.concat(
				this.currentRoutes.hiddenRoutes).concat(
				this.currentRoutes.mainChildRoutes).concat(
				this.currentRoutes.secundaryChildRoutes).concat(
				this.currentRoutes.hiddenChildRoutes)) {
				if (route.id === routeId && route.viewId === viewId) {
					return route;
				}
			}
		}
	}

	getRouteParamKeys(route) {
		const regex = new RegExp(/:[^\s/]+/g);
		return route.match(regex);
	}

	getRouteParamKeysWithoutDots(route) {
		const keys = [];
		for (const key of this.getRouteParamKeys(route) || []) {
			keys.push(key.substring(1));
		}
		return keys;
	}

	getRouteParamValues({routeId, paramKeys, route}) {
		const routeParts = this.routes[routeId].route.split('/');
		const hashParts = (route || this.locationHashWithHiddenRoutes() || this.config.rootPath).split('/');
		const params = [];
		for (const key of paramKeys) {
			// Get key and value
			params.push({key: key.substring(1), value: hashParts[routeParts.indexOf(key)]});
			// Also remove any ?sr=route from the value
			// params.push({key: key.substring(1), value: hashParts[routeParts.indexOf(key)].replace(/(\?sr=[^]*)/, '')});
		}
		return params;
	}

	getParamValue(key) {
		const param = this.currentRoutes.params.find(p => p.key === key);
		return param ? param.value : null;
	}
}
