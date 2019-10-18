function getEmptyRouteObjetc() {
	return {
		params: [],
		id: '',
		viewId: '',
		route: '',
		secundaryRoutes: [],
	};
}

class Router {
	constructor(config={}, powerUi) {
		this.config = config;
		this.$powerUi = powerUi;
		this.routes = {};
		this.oldRoutes = getEmptyRouteObjetc();
		this.currentRoutes = getEmptyRouteObjetc();
		if (!this.config.rootRoute) {
			this.config.rootRoute = '#!/';
		}
		if (config.routes) {
			for (const route of config.routes) {
				this.add(route);
			}
		}
		this.init();

		// call init if hash change
		window.onhashchange = this.hashChange.bind(this);
	}

	add({id, route, template, callback, viewId}) {
		// Ensure user have a element to render the main view
		// If the user doesn't define an id to use as main view, "main-view" will be used as id
		if (!this.config.routerMainViewId && this.config.routerMainViewId !== false) {
			this.config.routerMainViewId = 'main-view';
			// If there are no element with the id defined to render the main view throw an error
			if (!document.getElementById(this.config.routerMainViewId)) {
				throw new Error('The router needs a element with an ID to render views, you can define some HTML element with the id "main-view" or set your on id in the config using the key "routerMainViewId" with the choosen id. If you not want render any view in a main view, set the config key "routerMainViewId" to false and a "viewId" flag to each route with a view.');
			}
		}
		// If the user doesn't define an id to use as secundary view, "secundary-view" will be used as id
		if (!this.config.routerSecundaryViewId && this.config.routerSecundaryViewId !== false) {
			this.config.routerSecundaryViewId = 'secundary-view';
			// If there are no element with the id defined to render the secundary view throw an error
			if (!document.getElementById(this.config.routerSecundaryViewId)) {
				throw new Error('The router needs a element with an ID to render views, you can define some HTML element with the id "secundary-view" or set your on id in the config using the key "routerSecundaryViewId" with the choosen id. If you not want render any view in a secundary view, set the config key "routerSecundaryViewId" to false and a "viewId" flag to each route with a view.');
			}
		}
		// Ensure that the parameters are not empty
		if (!id) {
			throw new Error('A route ID must be given');
		}
		if (!route && !template && !callback) {
			throw new Error('route, template or callback must be given');
		}
		if (this.config.routerMainViewId === false && template && !viewId) {
			throw new Error(`You set the config flag "routerMainViewId" to false, but do not provide a custom "viewId" to the route "${route}" and id "${id}". Please define some element with some id to render the template, and pass it as "viewId" paramenter to the router.`);
		}
		if (this.config.routerSecundaryViewId === false && template && !viewId) {
			throw new Error(`You set the config flag "routerSecundaryViewId" to false, but do not provide a custom "viewId" to the route "${route}" and id "${id}". Please define some element with some id to render the template, and pass it as "viewId" paramenter to the router.`);
		}
		// Ensure that the parameters have the correct types
		if (typeof route !== "string") {
			throw new TypeError('typeof route must be a string');
		}
		if (callback && (typeof callback !== "function")) {
			throw new TypeError('typeof callback must be a function');
		}

		// Rewrite root route difined as '/' to an empty string so the final route can be '#!/'
		if (route === '/') {
			route = '';
		}

		const entry = {
			route: this.config.rootRoute + route,
			callback: callback || null,
			template: template || null,
			viewId: viewId || null,
		};
		// throw an error if the route already exists to avoid confilicting routes
		// the "otherwise" route can be duplicated only if it do not have a template
		if (id !== 'otherwise' || template) {
			for (const routeId of Object.keys(this.routes || {})) {
				// the "otherwise" route can be duplicated only if it do not have a template
				if (this.routes[routeId].route === entry.route && (routeId !== 'otherwise' || this.routes[routeId].template)) {
					if (routeId === 'otherwise' || id === 'otherwise') {
						throw new Error(`the route "${route || '/'}" already exists, so "${id}" can't use it if you use a template. You can remove the template or use another route.`);
					} else {
						throw new Error(`the route "${route || '/'}" already exists, so "${id}" can't use it.`);
					}
				}
			}
		}
		// throw an error if the route id already exists to avoid confilicting routes
		if (this.routes[id]) {
			throw new Error(`the id ${route.id} already exists`);
		} else {
			this.routes[id] = entry;
		}
	}

	// Copy the current open secundary route, and init the router with the new route
	hashChange(event) {
		// Save a copy of currentRoutes as oldRoutes
		this.cloneCurrentRoutesAsOldRoutes();
		// Clean current routes
		this.currentRoutes = getEmptyRouteObjetc();
		this.init({onHashChange: event});
		console.log('router', this);
	}

	cloneCurrentRoutesAsOldRoutes() {
		this.oldRoutes = {
			params: [],
			id: this.currentRoutes.id,
			viewId: this.currentRoutes.viewId,
			route: this.currentRoutes.route,
			secundaryRoutes: [],
		};
		for (const param of this.currentRoutes.params) {
			this.oldRoutes.params.push({key: param.key, value: param.value});
		}
		for (const route of this.currentRoutes.secundaryRoutes) {
			const oldRoute = {
				id: route.id,
				viewId: route.viewId,
				route: route.route,
				params: [],
			}
			for (const param of route.params) {
				oldRoute.params.push({key: param.key, value: param.value});
			}
			this.oldRoutes.secundaryRoutes.push(oldRoute);
		}
		console.log('oldRoutes', this.oldRoutes);
		console.log('currentRoutes', this.currentRoutes);
	}
	// Match the current window.location to a route and call the necessary template and callback
	// If location doesn't have a hash, redirect to rootRoute
	// the secundaryRoute param allows to manually match secundary routes
	init({secundaryRoute, onHashChange}={}) {
		const routeParts = this.extractRouteParts(secundaryRoute || window.location.hash || this.config.rootRoute);

		for (const routeId of Object.keys(this.routes || {})) {
			// Only run if not otherwise or if the otherwise have a template
			if (routeId !== 'otherwise' || this.routes[routeId].template) {
				// If the route have some parameters get it /some_page/:page_id/syfy/:title
				const paramKeys = this.getRouteParamKeys(this.routes[routeId].route);
				let regEx = this.buildRegExPatternToRoute(routeId, paramKeys);
				// our route logic is true,
				if (routeParts.path.match(regEx)) {
					if (!secundaryRoute) {
						// Load main route only if it is a new route
						if (!this.oldRoutes.id || this.oldRoutes.route !== routeParts.path.replace(this.config.rootRoute, '')) {
							this.removeMainView({viewId: this.routes[routeId].viewId || this.config.routerMainViewId})
							this.loadRoute({routeId: routeId, paramKeys: paramKeys, viewId: this.config.routerMainViewId});
						}
						this.setMainRouteState({routeId: routeId, paramKeys: paramKeys, route: routeParts.path, viewId: this.config.routerMainViewId});
						// Recursively run the init for each possible secundaryRoute
						for (const compRoute of routeParts.secundaryRoutes) {
							this.init({secundaryRoute: compRoute});
						}
						// After create all new secundary views remove the old ones if needed
						this.closeOldSecundaryViews();
						return true;
					} else {
						// Load secundary route if not already open
						// Check if the route already open as old route or as new route
						const thisRoute = secundaryRoute.replace(this.config.rootRoute, '');
						const oldSecundaryRoute = this.oldRoutes.secundaryRoutes.find(r=>r && r.route === thisRoute);
						const newSecundaryRoute = this.currentRoutes.secundaryRoutes.find(r=>r && r.route === thisRoute);
						if (!oldSecundaryRoute && !newSecundaryRoute) {
							const secundaryViewId = this.loadSecundaryRoute({routeId: routeId, paramKeys: paramKeys, routerSecundaryViewId: this.config.routerSecundaryViewId});
							this.setSecundaryRouteState({routeId: routeId, paramKeys: paramKeys, secundaryRoute: secundaryRoute, secundaryViewId: secundaryViewId});
						} else {
							// If the newSecundaryRoute is already on the list do nothing
							// Only add if it is only on oldSecundaryRoute list
							if (!newSecundaryRoute) {
								this.currentRoutes.secundaryRoutes.push(oldSecundaryRoute);
							}
						}
					}
				}
			}
		}
		// otherwise
		// (doesn't run otherwise for secundary routes)
		if (!secundaryRoute) {
			const newRoute = this.routes['otherwise'] ? this.routes['otherwise'].route : this.config.rootRoute;
			window.location.replace(newRoute);
		}
	}

	// Only close the old secundary views that are not also in the currentRoutes.secundaryRoutes
	closeOldSecundaryViews() {
		for (const route of this.oldRoutes.secundaryRoutes) {
			if (!this.currentRoutes.secundaryRoutes.find(r=>r.route === route.route)) {
				this.removeSecundaryView({secundaryViewId: route.viewId});
			}
		}
	}

	removeSecundaryView({secundaryViewId}) {
		// Remove all view power Objects and events
		this.$powerUi.powerTree.allPowerObjsById[secundaryViewId]['$shared'].removeElementAndInnersFromPower();
		// Remove all view nodes
		const node = document.getElementById(secundaryViewId);
		node.parentNode.removeChild(node);
		console.log('secundaryViewId', secundaryViewId, this.$powerUi.powerTree.allPowerObjsById);
	}

	removeMainView({viewId}) {
		if (!this.$powerUi.powerTree) {
			return;
		}
		// delete all inner elements and events from this.allPowerObjsById[id]
		this.$powerUi.powerTree.allPowerObjsById[viewId]['$shared'].removeInnerElementsFromPower();
	}

	loadRoute({routeId, paramKeys, viewId}) {
		// If have a template to load let's do it
		if (this.routes[routeId].template && !this.config.noRouterViews) {
			// If user defines a custom vieId to this route, but the router don't find it alert the user
			if (this.routes[routeId].viewId && !document.getElementById(this.routes[routeId].viewId)) {
				throw new Error(`You defined a custom viewId "${this.routes[routeId].viewId}" to the route "${this.routes[routeId].route}" but there is no element on DOM with that id.`);
			}
			this.$powerUi.loadHtmlView(this.routes[routeId].template, this.routes[routeId].viewId || viewId, this.currentRoutes);
		}
		// If have a callback run it
		if (this.routes[routeId].callback) {
			return this.routes[routeId].callback.call(this, this.routes[routeId]);
		}
	}
	loadSecundaryRoute({routeId, paramKeys, routerSecundaryViewId}) {
		// Create a new element to this view and add it to secundary-view element (where all secundary views are)
		const newViewNode = document.createElement('div');
		const viewId = getIdAndCreateIfDontHave(newViewNode);
		newViewNode.id = viewId;
		newViewNode.classList.add('power-view');
		document.getElementById(routerSecundaryViewId).appendChild(newViewNode);
		// Load the route inside the new element view
		this.loadRoute({routeId: routeId, paramKeys: paramKeys, viewId: viewId});
		return viewId;
	}

	removeSecundaryViews() {
		const secundaryView = document.getElementById(this.config.routerSecundaryViewId);
		secundaryView.innerHTML = '';
	}

	setMainRouteState({routeId, paramKeys, route, viewId}) {
		// Register current route id
		this.currentRoutes.id = routeId;
		this.currentRoutes.route = route.replace(this.config.rootRoute, ''); // remove #!/
		this.currentRoutes.viewId = this.routes[routeId].viewId || viewId;
		// Register current route parameters keys and values
		if (paramKeys) {
			this.currentRoutes.params = this.getRouteParamValues({routeId: routeId, paramKeys: paramKeys});
		} else {
			this.currentRoutes.params = [];
		}
	}
	setSecundaryRouteState({routeId, paramKeys, secundaryRoute, secundaryViewId}) {
		const route = {
			params: [],
			id: '',
			route: secundaryRoute.replace(this.config.rootRoute, ''), // remove #!/
			viewId: this.routes[routeId].viewId || secundaryViewId,
		}
		// Register current route id
		route.id = routeId;
		// Register current route parameters keys and values
		if (paramKeys) {
			route.params = this.getRouteParamValues({routeId: routeId, paramKeys: paramKeys, secundaryRoute: secundaryRoute});
		}
		this.currentRoutes.secundaryRoutes.push(route);
	}

	extractRouteParts(path) {
		const routeParts = {
			path: path,
			secundaryRoutes: [],
		};
		if (path.includes('?')) {
			const splited = path.split('?');
			routeParts.path = splited[0];
			for (const part of splited) {
				if (part.includes('sr=')) {
					for (const fragment of part.split('sr=')) {
						if (fragment) {
							routeParts.secundaryRoutes.push(this.config.rootRoute + fragment);
						}
					}
				}
			}
		}
		return routeParts;
	}

	buildRegExPatternToRoute(routeId, paramKeys) {
		// This regular expression below avoid detect /some_page_2 and /some_page as the same route
		// allow all [^]*
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
				// [a-zA-Z0-9_-]+ (alphanumeric plus _ and -)
				newRegEx = newRegEx.replace(key, '[a-zA-Z0-9_-]+');
			}
			regEx = new RegExp(newRegEx);
		}
		return regEx;
	}

	getRouteParamKeys(route) {
		const regex = new RegExp(/:[^\s/]+/g);
		return route.match(regex);
	}

	getRouteParamValues({routeId, paramKeys, secundaryRoute}) {
		const routeParts = this.routes[routeId].route.split('/');
		const hashParts = (secundaryRoute || window.location.hash || this.config.rootRoute).split('/');
		const params = [];
		for (const key of paramKeys) {
			// Get key and value
			// Also remove any ?sr=route from the value
			params.push({key: key.substring(1), value: hashParts[routeParts.indexOf(key)].replace(/(\?sr=[^]*)/, '')});
		}
		return params;
	}

	getParamValue(key) {
		const param = this.currentRoutes.params.find(p => p.key === key);
		return param ? param.value : null;
	}
}
