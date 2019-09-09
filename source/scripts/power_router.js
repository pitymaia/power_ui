
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
		for (const id in this.routes) {
			if (this.routes[id].route === this.config.rootRoute + entry) {
				throw new Error(`the route "${id}" already exists`);
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
		console.log('window.location.hash', window.location.hash);
		for (const id in this.routes) {
			// This regular expression below avoid detect /some-page-2 and /some-page as the same route
			let regEx = new RegExp(`^${this.routes[id].route}$`);
			let path = window.location.hash || this.config.rootRoute;
			console.log('path', path, 'window.location.hash', window.location.hash);

			// our route logic is true,
			if (path.match(regEx)) {
				match = true;
				// If have a template to load let's do it
				if (this.routes[id].template && !this.config.noRouterViews) {
					// If user defines a custom vieId to this route, but router don't find it alert the user
					if (this.routes[id].viewId && !document.getElementById(this.routes[id].viewId)) {
						throw new Error(`You defined a custom viewId "${this.routes[id].viewId}" to this route but it do not exists in DOM.`);
					}
					this.$powerUi.loadHtmlView(this.routes[id].template, this.routes[id].viewId || this.config.routerMainViewId);
				}
				// If have a callback run it
				if (this.routes[id].callback) {
					return this.routes[id].callback.call(this, this.routes[id]);
				}
			}
		};
		// otherwise
		if (match === false) {
			const newRoute = this.routes['otherwise'] ? this.routes['otherwise'].route : this.config.rootRoute;
			window.location.replace(newRoute);
		}
	}
}
