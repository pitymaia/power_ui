
class Router {
	constructor(config={}, powerUi) {
		this.config = config;
		this.$powerUi = powerUi;
		this.routes = {};
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
		// If the user not define en id to use, main-view will be used as id
		if (!this.config.routerMainViewId) {
			this.config.routerMainViewId = 'main-view';
			// If there are no element with the id difined to render the view throw an error
			if (!document.getElementById(this.config.routerMainViewId) && !this.config.noRouterViews) {
				throw new Error('The router needs a element with a ID to render views, you can define some HTML element with the id "main-view" or set your on id in the config using the key "routerMainViewId" with the choosen id. If you not want render any view, set the config key "noRouterViews" to true.');
			}
		}
		// Ensure that the parameters are not empty
		if (!id) {
			throw new Error('A route ID must be given');
		}
		if (!route && !template && !callback) {
			throw new Error('route, template or callback must be given');
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
			callback: callback,
			template: template,
			viewId: viewId,
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
				// This regular expression below avoid detect /some-page-2 and /some-page as the same route
				let regEx = new RegExp(`^${this.routes[routeId].route}$`);
				let path = window.location.hash || this.config.rootRoute;

				// our route logic is true,
				if (path.match(regEx)) {
					match = true;
					// If have a template to load let's do it
					if (this.routes[routeId].template && !this.config.noRouterViews) {
						// If user defines a custom vieId to this route, but router don't find it alert the user
						if (this.routes[routeId].viewId && !document.getElementById(this.routes[routeId].viewId)) {
							throw new Error(`You defined a custom viewId "${this.routes[routeId].viewId}" to this route but it do not exists in DOM.`);
						}
						this.$powerUi.loadHtmlView(this.routes[routeId].template, this.routes[routeId].viewId || this.config.routerMainViewId);
					}
					// If have a callback run it
					if (this.routes[routeId].callback) {
						return this.routes[routeId].callback.call(this, this.routes[routeId]);
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
}
