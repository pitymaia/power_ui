class Router {
	constructor(config={}, powerUi) {
		this.config = config;
		this.$powerUi = powerUi;
		this.routes = {};
		this.currentRoute = {
			params: [],
			id: '',
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
		window.onhashchange = this.init.bind(this);
	}

	add({id, route, template, callback, viewId}) {
		// Ensure user have a element to render the main view
		// If the user not define an id to use as main view, "main-view" will be used as id
		if (!this.config.routerMainViewId && this.config.routerMainViewId !== false) {
			this.config.routerMainViewId = 'main-view';
			// If there are no element with the id defined to render the main view throw an error
			if (!document.getElementById(this.config.routerMainViewId)) {
				throw new Error('The router needs a element with an ID to render views, you can define some HTML element with the id "main-view" or set your on id in the config using the key "routerMainViewId" with the choosen id. If you not want render any view in a main view, set the config key "routerMainViewId" to false and a "viewId" flag to each route with a view.');
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
			for (const routeId in this.routes) {
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
	// Match the current window.location to a route and call th necessary template and callback
	init() {
		let match = false;
		for (const routeId in this.routes) {
			// Only run if not otherwise or if the otherwise have a template
			if (routeId !== 'otherwise' || this.routes[routeId].template) {
				// This regular expression below avoid detect /some_page_2 and /some_page as the same route
				let regEx = new RegExp(`^${this.routes[routeId].route}$`);
				// If the route have some parameters get it /some_page/:page_id/syfy/:title
				const paramKeys = this.getRouteParamKeys(this.routes[routeId].route);
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
				let path = window.location.hash || this.config.rootRoute;

				// our route logic is true,
				if (path.match(regEx)) {
					match = true;
					// If have a template to load let's do it
					if (this.routes[routeId].template && !this.config.noRouterViews) {
						// If user defines a custom vieId to this route, but router don't find it alert the user
						if (this.routes[routeId].viewId && !document.getElementById(this.routes[routeId].viewId)) {
							throw new Error(`You defined a custom viewId "${this.routes[routeId].viewId}" to the route "${this.routes[routeId].route}" but there is no element on DOM with that id.`);
						}
						this.$powerUi.loadHtmlView(this.routes[routeId].template, this.routes[routeId].viewId || this.config.routerMainViewId);
					}
					// If have a callback run it
					if (this.routes[routeId].callback) {
						return this.routes[routeId].callback.call(this, this.routes[routeId]);
					}
					// Register current route id
					this.currentRoute.id = routeId;
					if (paramKeys) {
						this.currentRoute.params = this.getRouteParamValues(paramKeys);
					}
				}
			}
		}
		// otherwise
		if (match === false) {
			const newRoute = this.routes['otherwise'] ? this.routes['otherwise'].route : this.config.rootRoute;
			window.location.replace(newRoute);
		}
	}

	getRouteParamKeys(route) {
		const regex = new RegExp(/:[^\s/]+/g);
		return route.match(regex);
	}

	getRouteParamValues(paramKeys) {
		const routeParts = this.routes[this.currentRoute.id].route.split('/');
		const hashParts = (window.location.hash || this.config.rootRoute).split('/');
		const params = [];
		for (const key of paramKeys) {
			params.push({key: key.substring(1), value: hashParts[routeParts.indexOf(key)]});
		}
		return params;
	}

	getParamValue(key) {
		const param = this.currentRoute.params.find(p => p.key === key);
		return param ? param.value : null;
	}
}
