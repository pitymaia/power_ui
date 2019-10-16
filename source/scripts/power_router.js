class Router {
	constructor(config={}, powerUi) {
		this.config = config;
		this.$powerUi = powerUi;
		this.routes = {};
		this.oldComponentRoutes = [];
		this.currentRoute = {
			params: [],
			id: '',
			componentRoutes: [],
		};
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
		// If the user doesn't define an id to use as component view, "component-view" will be used as id
		if (!this.config.routerComponentViewId && this.config.routerComponentViewId !== false) {
			this.config.routerComponentViewId = 'component-view';
			// If there are no element with the id defined to render the component view throw an error
			if (!document.getElementById(this.config.routerComponentViewId)) {
				throw new Error('The router needs a element with an ID to render views, you can define some HTML element with the id "component-view" or set your on id in the config using the key "routerComponentViewId" with the choosen id. If you not want render any view in a component view, set the config key "routerComponentViewId" to false and a "viewId" flag to each route with a view.');
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
		if (this.config.routerComponentViewId === false && template && !viewId) {
			throw new Error(`You set the config flag "routerComponentViewId" to false, but do not provide a custom "viewId" to the route "${route}" and id "${id}". Please define some element with some id to render the template, and pass it as "viewId" paramenter to the router.`);
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

	// Copy the current open component route, and init the router with the new route
	hashChange(event) {
		this.oldComponentRoutes = [];
		for (const route of this.currentRoute.componentRoutes) {
			this.oldComponentRoutes.push(route);
		}
		this.currentRoute.componentRoutes = []; // Clean current routes
		this.init({onHashChange: event});
	}
	// Match the current window.location to a route and call the necessary template and callback
	// If location doesn't have a hash, redirect to rootRoute
	// the componentRoute param allows to manually match component routes
	init({componentRoute, onHashChange}={}) {
		const routeParts = this.extractRouteParts(componentRoute || window.location.hash || this.config.rootRoute);

		for (const routeId of Object.keys(this.routes || {})) {
			// Only run if not otherwise or if the otherwise have a template
			if (routeId !== 'otherwise' || this.routes[routeId].template) {
				// If the route have some parameters get it /some_page/:page_id/syfy/:title
				const paramKeys = this.getRouteParamKeys(this.routes[routeId].route);
				let regEx = this.buildRegExPatternToRoute(routeId, paramKeys);
				// our route logic is true,
				if (routeParts.path.match(regEx)) {
					if (!componentRoute) {
						// Load main route
						this.loadRoute({routeId: routeId, paramKeys: paramKeys, viewId: this.config.routerMainViewId});
						this.setMainRouteState({routeId: routeId, paramKeys: paramKeys});
						// Recursively run the init for each possible componentRoute
						for (const compRoute of routeParts.componentRoutes) {
							this.init({componentRoute: compRoute});
						}
						// After create all new component views remove the old ones if needed
						this.closeOldComponentViews();
						return true;
					} else {
						// Load component route if not already open
						// Check if the route already open as old route or as new route
						const thisRoute = componentRoute.replace(this.config.rootRoute, '');
						const oldComponentRoute = this.oldComponentRoutes.find(r=>r && r.route === thisRoute);
						const newComponentRoute = this.currentRoute.componentRoutes.find(r=>r && r.route === thisRoute);
						if (!oldComponentRoute && !newComponentRoute) {
							const componentViewId = this.loadComponentRoute({routeId: routeId, paramKeys: paramKeys, routerComponentViewId: this.config.routerComponentViewId});
							this.setComponentRouteState({routeId: routeId, paramKeys: paramKeys, componentRoute: componentRoute, componentViewId: componentViewId});
						} else {
							// If the newComponentRoute is already on the list do nothing
							// Only add if it is only on oldComponentRoute list
							if (!newComponentRoute) {
								this.currentRoute.componentRoutes.push(oldComponentRoute);
							}
						}
						console.log('router', this);
					}
				}
			}
		}
		// otherwise
		// (doesn't run otherwise for component routes)
		if (!componentRoute) {
			const newRoute = this.routes['otherwise'] ? this.routes['otherwise'].route : this.config.rootRoute;
			window.location.replace(newRoute);
		}
	}

	// Only close the old component views that are not also in the currentRoute.componentRoutes
	closeOldComponentViews() {
		for (const route of this.oldComponentRoutes) {
			if (!this.currentRoute.componentRoutes.find(r=>r.route === route.route)) {
				this.removeComponentView({componentViewId: route.componentViewId});
			}
		}
	}

	removeComponentView({componentViewId}) {
		const node = document.getElementById(componentViewId);
		node.parentNode.removeChild(node);
	}

	loadRoute({routeId, paramKeys, viewId}) {
		// If have a template to load let's do it
		if (this.routes[routeId].template && !this.config.noRouterViews) {
			// If user defines a custom vieId to this route, but the router don't find it alert the user
			if (this.routes[routeId].viewId && !document.getElementById(this.routes[routeId].viewId)) {
				throw new Error(`You defined a custom viewId "${this.routes[routeId].viewId}" to the route "${this.routes[routeId].route}" but there is no element on DOM with that id.`);
			}
			this.$powerUi.loadHtmlView(this.routes[routeId].template, this.routes[routeId].viewId || viewId, this.currentRoute);
		}
		// If have a callback run it
		if (this.routes[routeId].callback) {
			return this.routes[routeId].callback.call(this, this.routes[routeId]);
		}
	}
	loadComponentRoute({routeId, paramKeys, routerComponentViewId}) {
		// Create a new element to this view and add it to component-view element (where all component views are)
		const newViewNode = document.createElement('div');
		const viewId = getIdAndCreateIfDontHave(newViewNode);
		newViewNode.id = viewId;
		document.getElementById(routerComponentViewId).appendChild(newViewNode);
		// Load the route inside the new element view
		this.loadRoute({routeId: routeId, paramKeys: paramKeys, viewId: viewId});
		return viewId;
	}

	removeComponentViews() {
		const componentView = document.getElementById(this.config.routerComponentViewId);
		componentView.innerHTML = '';
	}

	setMainRouteState({routeId, paramKeys}) {
		// Register current route id
		this.currentRoute.id = routeId;
		// Register current route parameters keys and values
		if (paramKeys) {
			this.currentRoute.params = this.getRouteParamValues({routeId: routeId, paramKeys: paramKeys});
		}
	}
	setComponentRouteState({routeId, paramKeys, componentRoute, componentViewId}) {
		const route = {
			params: [],
			id: '',
			route: componentRoute.replace(this.config.rootRoute, ''),
			componentViewId: componentViewId,
		}
		// Register current route id
		route.id = routeId;
		// Register current route parameters keys and values
		if (paramKeys) {
			route.params = this.getRouteParamValues({routeId: routeId, paramKeys: paramKeys, componentRoute: componentRoute});
		}
		this.currentRoute.componentRoutes.push(route);
	}

	extractRouteParts(path) {
		const routeParts = {
			path: path,
			componentRoutes: [],
		};
		if (path.includes('?')) {
			const splited = path.split('?');
			routeParts.path = splited[0];
			for (const part of splited) {
				if (part.includes('cr=')) {
					for (const fragment of part.split('cr=')) {
						if (fragment) {
							routeParts.componentRoutes.push(this.config.rootRoute + fragment);
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

	getRouteParamValues({routeId, paramKeys, componentRoute}) {
		const routeParts = this.routes[routeId].route.split('/');
		const hashParts = (componentRoute || window.location.hash || this.config.rootRoute).split('/');
		const params = [];
		for (const key of paramKeys) {
			// Get key and value
			// Also remove any ?cr=route from the value
			params.push({key: key.substring(1), value: hashParts[routeParts.indexOf(key)].replace(/(\?cr=[^]*)/, '')});
		}
		return params;
	}

	getParamValue(key) {
		const param = this.currentRoute.params.find(p => p.key === key);
		return param ? param.value : null;
	}
}
