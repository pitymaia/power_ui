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

	add({name, hash, view, callback}) {
		// ensure that the parameters are not empty
		if (!hash && !view && !callback) throw new Error('hash, view or callback must be given');

		// ensure that the parameters have the correct types
		if (typeof hash !== "string") throw new TypeError('typeof hash must be a string');
		if (callback && (typeof callback !== "function")) throw new TypeError('typeof callback must be a function');


		const route = {
			hash: '#' + hash,
			callback: callback,
			view: view,
		};
		// throw an error if the route hash already exists to avoid confilicting routes
		for (const route in this.routes) {
			if (this.routes[route].hash === '#' + hash) {
				throw new Error(`the hash "${hash}" already exists`);
			}
		}
		// throw an error if the route name already exists to avoid confilicting routes
		if (this.routes[name]) {
			throw new Error(`the name ${route.name} already exists`);
		} else {
			this.routes[name] = route;
		}
	}

	init() {
		for (const route in this.routes) {
			// This regular expression below avoid detect /some-page-2 and /some-page as the same route
			let regEx = new RegExp(`^${this.routes[route].hash}$`);
			let path = window.location.hash || '#/';

			// our route logic is true,
			if (path.match(regEx)) {
				if (this.routes[route].view) {
					this.$powerUi.loadHtmlView(this.routes[route].view, this.config.routerViewId);
				}
				if (this.routes[route].callback) {
					return this.routes[route].callback.call(this, this.routes[route]);
				}
			}
		};
	}
}
