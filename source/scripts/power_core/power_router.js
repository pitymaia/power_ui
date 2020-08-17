function getEmptyRouteObjetc() {
	return {
		params: [],
		id: '',
		viewId: '',
		route: '',
		secundaryRoutes: [],
		hiddenRoutes: [],
		childRoutes: [],
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
		this.init({hiddenRoute: false, secundaryRoute: false, reloading: false});
		this.engine();

		// call init if hash change
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
	hashChange(event, reloading) {
		this.engine();
		// Save a copy of currentRoutes as oldRoutes
		this.oldRoutes = this.cloneRoutes({source: this.currentRoutes});
		// Clean current routes
		this.currentRoutes = getEmptyRouteObjetc();
		this.init({hiddenRoute: false, secundaryRoute: false, reloading: reloading});
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
			childRoutes: [],
		};
		for (const param of source.params) {
			dest.params.push({key: param.key, value: param.value});
		}
		this.cloneRouteList(dest, source, 'secundaryRoutes');
		this.cloneRouteList(dest, source, 'hiddenRoutes');
		this.cloneRouteList(dest, source, 'childRoutes');
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

	recursivelyAddChildRoute(route) {
		if (route && route.childRoute) {
			const childRoute = this.matchRouteAndGetIdAndParamKeys(route.childRoute);
			if (childRoute) {
				// Load route only if it is a new route
				if (!this.oldRoutes.id || (this.oldRoutes.route !== route.childRoute.path)) {
					// Create secundary route viewId
					const childViewId = _Unique.domID('view');
					// Add child route to ordered list
					this.orderedRoutesToLoad.push({
						routeId: childRoute.routeId,
						viewId: childViewId,
					});
					// Register child route on currentRoutes list
					this.setChildRouteState({
						routeId: childRoute.routeId,
						paramKeys: childRoute.paramKeys,
						route: route.childRoute.path,
						viewId: childViewId,
						title: this.routes[childRoute.routeId].title,
						data: this.routes[childRoute.routeId].data,
					});
				}
			}

			if (route.childRoute.childRoute) {
				this.recursivelyAddChildRoute(route.childRoute);
			}
		}
	}

	// http://localhost:3000/#!/power_only&ch=power_only2&ch=power_only3?sr=jsonviews&ch=power_only2
	engine() {
		this.orderedRoutesToLoad = [];
		const currentRoutesTree = this.buildRoutesTree(this.locationHashWithHiddenRoutes() || this.config.rootPath);
		console.log('currentRoutesTree', currentRoutesTree);
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
				});
				// Register main route on currentRoutes list
				this.setMainRouteState({
					routeId: mainRoute.routeId,
					paramKeys: mainRoute.paramKeys,
					route: currentRoutesTree.mainRoute.path,
					viewId: this.config.routerMainViewId,
					title: this.routes[mainRoute.routeId].title,
					data: this.routes[mainRoute.routeId].data,
				});
			}
			this.recursivelyAddChildRoute(currentRoutesTree.mainRoute);
		} else {
			// otherwise if do not mach a route
			const newRoute = this.routes.otherwise ? this.routes.otherwise.route : this.config.rootPath;
			window.location.replace(encodeURI(newRoute));
			return;
		}
		// Third mach any secundary route and its childs
		for (const route of currentRoutesTree.secundaryRoutes) {
			const secundaryRoute = this.matchRouteAndGetIdAndParamKeys(route);
			if (secundaryRoute) {
				// Create secundary route viewId
				const secundaryViewId = _Unique.domID('view');
				// Add secundary route to ordered list
				this.orderedRoutesToLoad.push({
					routeId: secundaryRoute.routeId,
					viewId: secundaryViewId,
				});
				// Register secundary route on currentRoutes list
				this.setSecundaryRouteState({
					routeId: secundaryRoute.routeId,
					paramKeys: secundaryRoute.paramKeys,
					route: route.path,
					viewId: secundaryViewId,
					title: this.routes[secundaryRoute.routeId].title,
					data: this.routes[secundaryRoute.routeId].data,
				});
				// Add any secundary child route to ordered list
				this.recursivelyAddChildRoute(route);
			}
		}
		// Fourth mach any hidden route and its childs
		for (const route of currentRoutesTree.hiddenRoutes) {
			const hiddenRoute = this.matchRouteAndGetIdAndParamKeys(route);
			if (hiddenRoute) {
				// Create hodden route viewId
				const hiddenViewId = _Unique.domID('view');
				// Add hidden route to ordered list
				this.orderedRoutesToLoad.push({
					routeId: hiddenRoute.routeId,
					viewId: hiddenViewId,
				});
				// Register hidden route on currentRoutes list
				this.setHiddenRouteState({
					routeId: hiddenRoute.routeId,
					paramKeys: hiddenRoute.paramKeys,
					route: route.path,
					viewId: hiddenViewId,
					title: this.routes[hiddenRoute.routeId].title,
					data: this.routes[hiddenRoute.routeId].data,
				});
				// Add any hidden child route to ordered list
				this.recursivelyAddChildRoute(route);
			}
		}
		console.log('this.orderedRoutesToLoad', this.orderedRoutesToLoad);
		console.log('this.currentRoutes', this.currentRoutes);
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
						found = {routeId: routeId, paramKeys: paramKeys};
					}
					break;
				}
			}
		}

		return found;
	}
	// Match the current window.location to a route and call the necessary template and callback
	// If location doesn't have a hash, redirect to rootPath
	// the secundaryRoute param allows to manually match secundary routes
	init({secundaryRoute, hiddenRoute, reloading}) {
		const routeParts = this.extractRouteParts(secundaryRoute || hiddenRoute || this.locationHashWithHiddenRoutes() || this.config.rootPath);
		for (const routeId of Object.keys(this.routes || {})) {
			// Only run if not otherwise or if the otherwise have a template
			if (routeId !== 'otherwise' || this.routes[routeId].template) {
				// If the route have some parameters get it /some_page/:page_id/syfy/:title
				const paramKeys = this.getRouteParamKeys(this.routes[routeId].route);
				let regEx = this.buildRegExPatternToRoute(routeId, paramKeys);
				// our route logic is true,
				if (routeParts.path.match(regEx)) {
					if (this.routes[routeId] && this.routes[routeId].title) {
						document.title = this.routes[routeId].title;
					}
					if (!secundaryRoute && !hiddenRoute) {
						// Load main route only if it is a new route
						if (!this.oldRoutes.id || this.oldRoutes.route !== routeParts.path.replace(this.config.rootPath, '')) {
							this.removeMainView({viewId: this.routes[routeId].viewId || this.config.routerMainViewId, reloading: reloading});
							this.loadRoute({
								routeId: routeId,
								paramKeys: paramKeys,
								viewId: this.config.routerMainViewId,
								ctrl: this.routes[routeId].ctrl,
								title: this.routes[routeId].title,
								data: this.routes[routeId].data,
							});
						}
						this.setMainRouteState({
							routeId: routeId,
							paramKeys: paramKeys,
							route: routeParts.path,
							viewId: this.config.routerMainViewId,
							title: this.routes[routeId].title,
							data: this.routes[routeId].data,
						});
						// Recursively run the init for each possible secundaryRoute
						for (const compRoute of routeParts.secundaryRoutes) {
							this.init({secundaryRoute: compRoute, hiddenRoute: false, reloading: reloading});
						}
						// Recursively run the init for each possible hiddenRoute
						for (const compRoute of routeParts.hiddenRoutes) {
							this.init({hiddenRoute: compRoute, secundaryRoute: false, reloading: reloading});
						}
						// Remove all the old views if needed
						this.closeOldSecundaryAndHiddenViews({reloading: reloading});
						return true;
					} else if (secundaryRoute) {
						// Load secundary route if not already open
						// Check if the route already open as old route or as new route
						const thisRoute = secundaryRoute.replace(this.config.rootPath, '');
						const oldSecundaryRoute = this.oldRoutes.secundaryRoutes.find(r=>r && r.route === thisRoute);
						const newSecundaryRoute = this.currentRoutes.secundaryRoutes.find(r=>r && r.route === thisRoute);
						if (!oldSecundaryRoute && !newSecundaryRoute) {
							const secundaryViewId = this.loadSecundaryOrHiddenRoute({
								routeId: routeId,
								paramKeys: paramKeys,
								routeViewId: this.config.routerSecundaryViewId,
								ctrl: this.routes[routeId].ctrl,
								data: this.routes[routeId].data,
								title: this.routes[routeId].title,
							});
							this.setSecundaryRouteState({
								routeId: routeId,
								paramKeys: paramKeys,
								route: secundaryRoute,
								viewId: secundaryViewId,
								title: this.routes[routeId].title,
								data: this.routes[routeId].data,
							});
						} else {
							// If the newSecundaryRoute is already on the list do nothing
							// Only add if it is only on oldSecundaryRoute list
							if (!newSecundaryRoute) {
								this.currentRoutes.secundaryRoutes.push(oldSecundaryRoute);
							}
						}
					} else if (hiddenRoute) {
						// Load hidden route if not already open
						// Check if the route already open as old route or as new route
						const thisRoute = hiddenRoute.replace(this.config.rootPath, '');
						const oldHiddenRoute = this.oldRoutes.hiddenRoutes.find(r=>r && r.route === thisRoute);
						const newHiddenRoute = this.currentRoutes.hiddenRoutes.find(r=>r && r.route === thisRoute);
						if (!oldHiddenRoute && !newHiddenRoute) {
							const hiddenViewId = this.loadSecundaryOrHiddenRoute({
								routeId: routeId,
								paramKeys: paramKeys,
								routeViewId: this.config.routerSecundaryViewId,
								ctrl: this.routes[routeId].ctrl,
								title: this.routes[routeId].title,
								data: this.routes[routeId].data,
							});
							this.setHiddenRouteState({
								routeId: routeId,
								paramKeys: paramKeys,
								route: hiddenRoute,
								viewId: hiddenViewId,
								title: this.routes[routeId].title,
								data: this.routes[routeId].data,
							});
						} else {
							// If the newHiddenRoute is already on the list do nothing
							// Only add if it is only on oldHiddenRoute list
							if (!newHiddenRoute) {
								this.currentRoutes.hiddenRoutes.push(oldHiddenRoute);
							}
						}
					}
				}
			}
		}
		// otherwise
		// (doesn't run otherwise for secundary routes)
		if (!secundaryRoute && !hiddenRoute) {
			const newRoute = this.routes['otherwise'] ? this.routes['otherwise'].route : this.config.rootPath;
			window.location.replace(encodeURI(newRoute));
		}
	}

	// Only close the old secundary and hidden views that are not also in the currentRoutes.secundaryRoutes
	closeOldSecundaryAndHiddenViews({reloading}) {
		for (const route of this.oldRoutes.secundaryRoutes) {
			if (!this.currentRoutes.secundaryRoutes.find(r=>r.route === route.route)) {
				this.removeSecundaryOrHiddenView({viewId: route.viewId, routeId: route.id, reloading: reloading});
			}
		}
		for (const route of this.oldRoutes.hiddenRoutes) {
			if (!this.currentRoutes.hiddenRoutes.find(r=>r.route === route.route)) {
				this.removeSecundaryOrHiddenView({viewId: route.viewId, routeId: route.id, reloading: reloading});
			}
		}
		// Remove 'modal-open' css class from body if all modals are closed
		const modals = document.body.getElementsByClassName('pw-backdrop');
		if (modals.length === 0) {
			document.body.classList.remove('modal-open');
		}
	}

	removeSecundaryOrHiddenView({viewId, routeId, reloading}) {
		// If this is a volatile(hidden) route remove it from routes
		if (!reloading && this.routes[routeId] && this.routes[routeId].isVolatile) {
			delete this.routes[routeId];
		}
		// Remove all view power Objects and events
		if (this.$powerUi.powerTree.allPowerObjsById[viewId] && this.$powerUi.powerTree.allPowerObjsById[viewId].$shared) {
			this.$powerUi.powerTree.allPowerObjsById[viewId].$shared.removeElementAndInnersFromPower();
		}
		// Remove view node
		const node = document.getElementById(viewId);
		node.parentNode.removeChild(node);
		// Remove custom css of this view if exists
		this.removeCustomCssNode(viewId);

		// Delete the controller instance of this view if exists
		if (this.$powerUi.controllers[viewId]) {
			if (!reloading) {
				this.removeVolatileViews({viewId: viewId});
			}
			if(this.$powerUi.controllers[viewId].instance && this.$powerUi.controllers[viewId].instance._$closeCurrentRouteCallback) {
				this.$powerUi.controllers[viewId].instance._$closeCurrentRouteCallback();
			}
			if(this.$powerUi.controllers[viewId].instance && this.$powerUi.controllers[viewId].instance.onRouteClose) {
				this.$powerUi.controllers[viewId].instance.onRouteClose();
			}
			delete this.$powerUi.controllers[viewId];
		}
	}

	removeMainView({viewId, reloading}) {
		if (!this.$powerUi.powerTree) {
			return;
		}
		if (!reloading) {
			this.removeVolatileViews({viewId: viewId});
		}

		// Remove custom css of this view if exists
		this.removeCustomCssNode(viewId);

		// delete all inner elements and events from this.allPowerObjsById[id]
		this.$powerUi.powerTree.allPowerObjsById[viewId]['$shared'].removeInnerElementsFromPower();
	}
	// Dialogs and modals with a hidden route opened throw a widget service are volatile routes
	// One route are create for each instante, so we need remove it when the controller are distroyed
	removeVolatileViews({viewId}) {
		if (this.$powerUi.controllers[viewId] && this.$powerUi.controllers[viewId].instance && this.$powerUi.controllers[viewId].instance.volatileRouteIds && this.$powerUi.controllers[viewId].instance.volatileRouteIds.length) {
			for (const volatileId of this.$powerUi.controllers[viewId].instance.volatileRouteIds) {
				delete this.routes[volatileId];
			}
		}
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

	loadRoute({routeId, paramKeys, viewId, ctrl, title, data}) {
		const _viewId = this.routes[routeId].viewId || viewId;
		if (ctrl) {
			// Register the controller with $powerUi
			this.$powerUi.controllers[_viewId] = {
				component: ctrl,
				data: data,
			};
			// Instanciate the controller
			const $data = data || {};
			$data.$powerUi = this.$powerUi;
			$data.viewId = _viewId;
			$data.routeId = routeId;
			$data.title = title;
			this.$powerUi.controllers[_viewId].instance = new ctrl($data);
			this.$powerUi.controllers[_viewId].instance._viewId = _viewId;
			this.$powerUi.controllers[_viewId].instance._routeId = routeId;
			this.$powerUi.controllers[_viewId].instance._routeParams = paramKeys ? this.getRouteParamValues({routeId: routeId, paramKeys: paramKeys}) : {};
			this.$powerUi.controllers[_viewId].instance.$root = (this.$powerUi.controllers['root-view'] && this.$powerUi.controllers['root-view'].instance) ? this.$powerUi.controllers['root-view'].instance : null;
		}

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
				});
			} else {
				this.$powerUi.loadTemplate({
					template: this.routes[routeId].template,
					viewId: _viewId,
					currentRoutes: this.currentRoutes,
					routeId: routeId,
					routes: this.routes,
					title: title,
				});
			}
		}
		// If have a callback run it
		if (this.routes[routeId].callback) {
			return this.routes[routeId].callback.call(this, this.routes[routeId]);
		}
	}
	loadSecundaryOrHiddenRoute({routeId, paramKeys, routeViewId, ctrl, title, data}) {
		// Create a new element to this view and add it to secundary-view element (where all secundary views are)
		const newViewNode = document.createElement('div');
		const viewId = getIdAndCreateIfDontHave(newViewNode);
		newViewNode.id = viewId;
		newViewNode.classList.add('power-view');
		document.getElementById(routeViewId).appendChild(newViewNode);
		// Load the route inside the new element view
		this.loadRoute({
			title: title,
			routeId: routeId,
			paramKeys: paramKeys,
			viewId: viewId,
			ctrl: ctrl,
			data: data,
		});
		return viewId;
	}

	routeKind(routeId) {
		return this.routes[routeId].hidden ? 'hr' : 'sr';
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

		if (this.routeExists({routeId, params})) {
			return;
		} else {
			// Close the current view and open the route in a new secundary view
			if (target === '_self') {
				const selfRoute = this.getOpenedRoute({routeId: currentRouteId, viewId: currentViewId});
				const oldHash = this.getOpenedSecundaryOrHiddenRoutesHash({filter: [selfRoute.route]});
				const newRoute = oldHash + `?${routeKind}=${this.buildHash({routeId, params, paramKeys})}`;
				this.navigate({hash: newRoute, title: title});
			// Open the route in a new secundary view without closing any view
			} else if (target === '_blank') {
				const oldHash = this.getOpenedSecundaryOrHiddenRoutesHash({});
				const newRoute = oldHash + `?${routeKind}=${this.buildHash({routeId, params, paramKeys})}`;
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
				route = route.replace(`:${key}`, params[key]);
			}
		}
		return route;
	}

	routeExists({routeId, params}) {
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
			data: data,
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
		this.currentRoutes.childRoutes.push(
			this.setOtherRouteState(params));
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
			for (const route of this.currentRoutes.secundaryRoutes.concat(this.currentRoutes.hiddenRoutes)) {
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
