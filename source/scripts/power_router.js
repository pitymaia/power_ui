
class Router {
	constructor(config={}, powerUi) {
		this.config = config;
		this.$powerUi = powerUi;
		this.routes = {};
		if (config.routes) {
			for (const route of config.routes) {
				this.add(route);
			}
		}
		this.init();

		// call init if has change
		window.onhashchange = this.init.bind(this);
	}

	add({id, route, view, callback}) {
		// ensure that the parameters are not empty
		if (!id) {
			throw new Error('A route ID must be given');
		}
		if (!route && !view && !callback) {
			throw new Error('route, view or callback must be given');
		}

		// ensure that the parameters have the correct types
		if (typeof route !== "string") {
			throw new TypeError('typeof route must be a string');
		}
		if (callback && (typeof callback !== "function")) {
			throw new TypeError('typeof callback must be a function');
		}

		const entry = {
			route: '#' + route,
			callback: callback,
			view: view,
		};
		// throw an error if the route already exists to avoid confilicting routes
		for (const id in this.routes) {
			if (this.routes[id].route === '#' + entry) {
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

	init() {
		for (const id in this.routes) {
			// This regular expression below avoid detect /some-page-2 and /some-page as the same route
			let regEx = new RegExp(`^${this.routes[id].route}$`);
			let path = window.location.hash || '#/';

			// our route logic is true,
			if (path.match(regEx)) {
				// If have a view to load let's do it
				if (this.routes[id].view) {
					this.$powerUi.loadHtmlView(this.routes[id].view, this.config.routerMainViewId);
				}
				// If have a callback run it
				if (this.routes[id].callback) {
					return this.routes[id].callback.call(this, this.routes[id]);
				}
			}
		};
	}
}
