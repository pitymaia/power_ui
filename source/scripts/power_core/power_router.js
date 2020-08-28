function getEmptyRouteObjetc() {
	return {
		params: [],
		id: '',
		viewId: '',
		route: '',
		parentRouteId: null,
		parentViewId: null,
		kind: '',
		secundaryRoutes: [],
		hiddenRoutes: [],
		mainChildRoutes: [],
		secundaryChildRoutes: [],
		hiddenChildRoutes: [],
	};
}

class EngineCommands {
	constructor(router) {
		this.bootstraping = true;
		this.pending = {};
		this.router = router;
		this.routes = {};
		this.default = {
			close: {
				runBeforeClose: true,
				removeView: true,
				runOnRouteClose: true,
				removeCtrl: true,
			},
			open: {
				addCtrl: true,
				runLoad: true,
				runCtrl: true,
				addView: true,
				runOnViewLoad: true,
			},
		};
		this.command = {
			refresh: {
				close: {
					runBeforeClose: false,
					removeView: true,
					runOnRouteClose: false,
					removeCtrl: false,
				},
				open: {
					addCtrl: false,
					runLoad: false,
					runCtrl: false,
					addView: true,
					runOnViewLoad: false,
				},
			},
			reload: {
				close: {
					runBeforeClose: true,
					removeView: true,
					runOnRouteClose: true,
					removeCtrl: true,
				},
				open: {
					addCtrl: true,
					runLoad: true,
					runCtrl: true,
					addView: true,
					runOnViewLoad: true,
				},
			}
		};

		if (this.router.config.routerMode === 'root') {
			this.default.close.rootView = {refresh: true};
		} else if (this.router.config.routerMode === 'parent') {
			this.default.close.parentView = {refresh: true};
		}
	}

	buildOtherCicleCommands() {
		if (this.bootstraping) {
			this.bootstraping = false;
			return;
		}
		this.buildPendingCloseCommands();
		this.buildPendingOpenCommands();
		this.buildPendingListCommands();
		// this.ensureRootIsLastToClose();
		this.pending = {};
	}

	// ensureRootIsLastToClose() {
	// 	let root = false;
	// 	this.router.orderedRoutesToClose = this.router.orderedRoutesToClose.filter(
	// 		function (route) {
	// 			if (route.routeId === '$root') {
	// 				root = route;
	// 			} else {
	// 				return true;
	// 			}
	// 	});

	// 	if (root) {
	// 		this.router.orderedRoutesToClose.push(root);
	// 	}
	// }

	addPendingComand(routeId, command) {
		if (!this.pending[routeId]) {
			this.pending[routeId] = {};
		}
		this.pending[routeId][command.name] = command.value;
	}

	addCommands(commands) {
		for (const item of Object.keys(commands)) {
			for (const routeId of Object.keys(commands[item])) {
				for (const name of Object.keys(commands[item][routeId])) {
					const command = {};
					command.name = name;
					command.value = commands[item][routeId][name];
					this.addPendingComand(routeId, command);
				}
			}
		}
	}

	override(commandsList, routeId, source) {
		for (const command of Object.keys(this.pending[routeId])) {
			for (const index of Object.keys(this.command[command][source])) {
				commandsList[index] = this.command[command][source][index];
			}
		}
	}

	buildRouteOpenCommands(routeId, viewId, shouldUpdate) {
		// Only apply default commands if the route is new
		if (shouldUpdate) {
			const commandsList = {};
			this.override(commandsList, routeId, 'open');
			return commandsList;
		} else {
			return this.default.open;
		}
	}

	buildRouteCloseCommands(routeId, viewId, shouldUpdate) {
		// Only apply default commands if the route is new
		if (shouldUpdate) {
			const commandsList = {};
			this.override(commandsList, routeId, 'close');
			return commandsList;
		} else {
			return this.default.close;
		}
	}

	buildPendingCloseCommands() {
		let index = 0;
		this.routesToAdd = [];
		for (const route of this.router.orderedRoutesToClose) {
			// May need apply parentView commands
			if (route.parentRouteId && route.commands.parentView && route.commands.parentView.refresh === true) {
				this.parentCommands(route, index);
			}
		}

		for (const route of this.routesToAdd) {
			this.router.orderedRoutesToClose.splice(route.index + 1, 0, route.route_close);
		}
	}

	buildPendingOpenCommands() {
		for (const route of this.routesToAdd) {
			const index = this.router.orderedRoutesToOpen.findIndex(r=> r.parentRouteId === route.route_open.routeId);
			this.router.orderedRoutesToOpen.splice(index, 0, route.route_open);
		}
	}

	buildPendingListCommands() {
		// May need apply some pending $root commands (root commands goes as last in close list)
		const _rootCommands = this.pending.$root;
		if (_rootCommands) {
			this.rootCommands(_rootCommands);
		}
	}

	overrideCommands(open, close, command) {
		for (const index of Object.keys(command.close)) {
			if (close.commands[index] === undefined || command.close[index] === true) {
				close.commands[index] = command.close[index];
			}
		}
		for (const index of Object.keys(command.open)) {
			if (open.commands[index] === undefined || command.open[index] === true) {
				open.commands[index] = command.open[index];
			}
		}
	}

	parentCommands(route, index) {
		// Only refresh if not removing the parent and if it is still on currentRoutes list
		let parent = this.router.getOpenedRoute({routeId: route.parentRouteId, viewId: route.parentViewId});
		if (!parent && route.parentRouteId === '$root') {
			parent = {id: '$root', viewId: 'root-view', params: null, kind: 'root', parentRouteId: null, parentViewId: null, powerViewNodeId: 'root-view'};
		}
		if (!this.router.orderedRoutesToClose.find(r => r.routeId === route.parentRouteId) && parent) {
			const newRoute = {
				routeId: parent.id,
				viewId: parent.viewId,
				params: parent.params,
				kind: parent.kind,
				parentRouteId: parent.parentRouteId,
				parentViewId: parent.parentViewId,
				powerViewNodeId: this.router.routes[parent.parentRouteId] ? this.router.routes[parent.parentRouteId].powerViewNodeId : null,
			};
			const open = Object.assign({}, newRoute);
			open.commands = {};
			const close = Object.assign({}, newRoute);
			close.commands = {};

			for (const index of Object.keys(route.commands.parentView)) {
				if (this.command[index]) {
					this.overrideCommands(open, close, this.command[index]);
				}
			}
			this.routesToAdd.push({index: index, route_close: close, route_open: open});
		}
		index = index + 1;
	}

	rootCommands(commands) {
		const newRoute = {routeId: "$root", viewId: "root-view", paramKeys: null, kind: "root"};
		const open = Object.assign({}, newRoute);
		open.commands = {};
		const close = Object.assign({}, newRoute);
		close.commands = {};

		for (const index of Object.keys(commands)) {
			if (this.command[index]) {
				this.overrideCommands(open, close, this.command[index]);
			}
		}

		this.router.orderedRoutesToOpen.unshift(open);
		this.router.orderedRoutesToClose.push(close);
	}
}

class Router {
	constructor(config, powerUi) {
		this.config = config || {};
		this.$powerUi = powerUi;
		this.routes = {};
		this.routeData = {};
		this.pendingCallbacks = [];
		this.oldRoutesBkp = getEmptyRouteObjetc();
		this.oldRoutes = getEmptyRouteObjetc();
		this.currentRoutes = getEmptyRouteObjetc();
		this.phantomRouter = null;
		this.engineCommands = new EngineCommands(this);
		this.cicleEnds = new UEvent('cicleEnds');
		if (!this.config.rootPath) {
			this.config.rootPath = '#!/';
		}
		if (config.routes) {
			for (const route of config.routes) {
				this.add(route);
			}
		}
		if (!this.config.phantomMode) {
			this.initRootScopeAndRunEngine();
			// call engine if hash change
			window.onhashchange = this.hashChange.bind(this);
		}
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

		if (route.id === '$root') {
			route.route = '';
		} else {
			route.route = this.config.rootPath + (route.route || '');
		}

		// throw an error if the route already exists to avoid confilicting routes
		// the "otherwise" route can be duplicated only if it do not have a template
		if (route.id !== 'otherwise' || route.template) {
			for (const routeId of Object.keys(this.routes || {})) {
				// the "otherwise" route can be duplicated only if it do not have a template
				if (this.routes[routeId].route === route.route && (routeId !== 'otherwise' || this.routes[routeId].template)) {
					if (routeId === 'otherwise' || route.id === 'otherwise') {
						throw new Error(`the route "${route.route || '/'}" already exists, so "${route.id}" can't use it if you use a template. You can remove the template or use another route.`);
					} else {
						throw new Error(`the route "${route.route || '/'}" already exists, so "${route.id}" can't use it.`);
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
		// This support the abort a cicle
		if (this.engineIsRunning === true) {
			this.engineIsRunning = false;
			return;
		}
		this.currentUrl = event ? event.newURL : window.location.href;
		this.previousUrl = event ? event.oldURL : window.location.href;
		// Save the old routes if user abort and need restore it
		this.oldRoutesBkp = this.cloneRoutes({source: this.oldRoutes});
		// Save a copy of currentRoutes as oldRoutes
		this.oldRoutes = this.cloneRoutes({source: this.currentRoutes});
		// Clean current routes
		this.currentRoutes = getEmptyRouteObjetc();
		this.engine();
	}

	cloneRoutesAndRunEngine() {
		this.currentUrl = window.location.href;
		this.previousUrl = window.location.href;
		// Save the old routes if user abort and need restore it
		this.oldRoutesBkp = this.cloneRoutes({source: this.oldRoutes});
		// Save a copy of currentRoutes as oldRoutes
		this.oldRoutes = this.cloneRoutes({source: this.currentRoutes});
		// Clean current routes
		this.currentRoutes = getEmptyRouteObjetc();
		this.engine();
	}

	abortCicle() {
		// Restore routes, location and stop engine;
		this.currentRoutes = this.cloneRoutes({source: this.oldRoutes});
		this.oldRoutes = this.cloneRoutes({source: this.oldRoutesBkp});
		this.clearPhantomRouter();
		window.location.href = this.previousUrl;
		this.engineIsRunning = false;
	}

	clearPhantomRouter() {
		delete this.phantomRouter;
		this.phantomRouter = null;
	}

	cloneRouteList(dest, source, listName) {
		for (const route of source[listName]) {
			const list = {
				id: route.id,
				viewId: route.viewId,
				route: route.route,
				parentRouteId: route.parentRouteId,
				parentViewId: route.parentViewId,
				kind: route.kind,
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
			parentRouteId: source.parentRouteId,
			parentViewId: source.parentViewId,
			kind: source.kind,
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
		if (spinner) {
			spinner.parentNode.removeChild(spinner);
		}
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

	recursivelyAddChildRoute(route, mainKind, powerViewNodeId, parentRouteId, parentViewId, forceRefresh) {
		const routesListName = `${mainKind}ChildRoutes`;
		if (route && route.childRoute) {
			const childRoute = this.matchRouteAndGetIdAndParamKeys(route.childRoute);
			let childViewId = false;
			if (childRoute) {
				if (forceRefresh) {
					this.engineCommands.addPendingComand(childRoute.routeId, {name: 'refresh', value: true});
				}
				childViewId = this.getVewIdIfRouteExists(route.childRoute.path, routesListName);
				const routeIsNew = (childViewId === false);
				const shouldUpdate = (routeIsNew === false && this.engineCommands.pending[childRoute.routeId] !== undefined);
				// Load child route only if it's a new route
				if (routeIsNew === true || shouldUpdate || forceRefresh) {
					childViewId = childViewId || _Unique.domID('view');
					// Add child route to ordered list
					this.orderedRoutesToOpen.push({
						routeId: childRoute.routeId,
						viewId: childViewId,
						paramKeys: childRoute.paramKeys,
						kind: 'child',
						powerViewNodeId: powerViewNodeId,
						parentRouteId: parentRouteId,
						parentViewId: parentViewId,
						commands: this.engineCommands.buildRouteOpenCommands(childRoute.routeId, childViewId, shouldUpdate),
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
					parentRouteId: parentRouteId,
					parentViewId: parentViewId,
					kind: 'child',
				});
			}

			if (route.childRoute.childRoute) {
				this.recursivelyAddChildRoute(
					route.childRoute, mainKind, childRoute.powerViewNodeId, (childRoute ? childRoute.routeId : null), (childViewId ? childViewId : null), forceRefresh);
			}
		}
	}

	setMainRouteAndAddToOrderedRoutesToLoad(currentRoutesTree) {
		// First check main route
		const mainRoute = this.matchRouteAndGetIdAndParamKeys(currentRoutesTree.mainRoute);
		// Second recursively add main route child and any level of child of childs
		if (mainRoute) {
			let forceRefresh = false;
			// If root has pending commands forces all routes to refresh
			if (this.engineCommands.pending['$root']) {
				forceRefresh = true;
				this.engineCommands.addPendingComand(mainRoute.routeId, {name: 'refresh', value: true});
			}
			// Add main route to ordered list
			// Load main route only if it is a new route or if has some pending command to run
			const routeIsNew = (!this.oldRoutes.id || (this.oldRoutes.route !== currentRoutesTree.mainRoute.path));
			const shouldUpdate = (routeIsNew === false && this.engineCommands.pending[mainRoute.routeId] !== undefined);
			if (forceRefresh || shouldUpdate || (!this.oldRoutes.id || (this.oldRoutes.route !== currentRoutesTree.mainRoute.path))) {
				this.orderedRoutesToOpen.push({
					routeId: mainRoute.routeId,
					viewId: this.config.routerMainViewId,
					paramKeys: mainRoute.paramKeys,
					kind: 'main',
					parentRouteId: this.hasRoot ? '$root' : null,
					parentViewId: this.hasRoot ? 'root-view' : null,
					powerViewNodeId: 'root-view',
					commands: this.engineCommands.buildRouteOpenCommands(
						mainRoute.routeId, this.config.routerMainViewId, shouldUpdate),
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
				parentRouteId: this.hasRoot ? '$root' : null,
				parentViewId: this.hasRoot ? 'root-view' : null,
				powerViewNodeId: 'root-view',
				kind: 'main',
			});
			// Add any main child route to ordered list
			this.recursivelyAddChildRoute(
				currentRoutesTree.mainRoute, 'main', mainRoute.powerViewNodeId, mainRoute.routeId, 'main-view', forceRefresh);
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
				let forceRefresh = false;
				// If root has pending commands forces all routes to refresh
				if (this.engineCommands.pending['$root']) {
					forceRefresh = true;
					this.engineCommands.addPendingComand(currentRoute.routeId, {name: 'refresh', value: true});
				}

				let viewId = this.getVewIdIfRouteExists(route.path, routesListName);
				const routeIsNew = (viewId === false);
				const shouldUpdate = (routeIsNew === false && this.engineCommands.pending[currentRoute.routeId] !== undefined);
				// Load route only if it's a new route
				if (viewId === false || shouldUpdate || forceRefresh) {
					// Create route viewId
					viewId = viewId || _Unique.domID('view');
					// Add route to ordered list
					this.orderedRoutesToOpen.push({
						routeId: currentRoute.routeId,
						viewId: viewId,
						paramKeys: currentRoute.paramKeys,
						kind: kind,
						parentRouteId: null,
						parentViewId: null,
						commands: this.engineCommands.buildRouteOpenCommands(
							currentRoute.routeId, viewId, shouldUpdate),
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
					parentRouteId: null,
					parentViewId: null,
					kind: kind,
				});
				// Add any child route to ordered list
				this.recursivelyAddChildRoute(
					route, kind, currentRoute.powerViewNodeId, currentRoute.routeId, (viewId ? viewId : null), forceRefresh);
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

	// Render the rootScope if exists and only boostrap after promise returns
	initRootScopeAndRunEngine() {
		const $root = this.$powerUi.config.routes.find(r=> r.id === '$root');
		const openCommands = this.engineCommands.buildRouteOpenCommands('$root', 'root-view', false);
		const closeCommands = this.engineCommands.buildRouteCloseCommands('$root', 'root-view', false);
		const commands = Object.assign(openCommands, closeCommands);
		delete commands.parentView;
		delete commands.rootView;
		const loadRoot = {routeId: "$root", viewId: "root-view", paramKeys: null, kind: "root", commands: commands};
		if ($root) {
			this.hasRoot = true;
			this.engine(loadRoot);
		} else {
			this.engine();
		}
	}

	setDefaultCommands() {
		if (this.engineCommands.default.close.rootView && this.engineCommands.default.close.rootView.refresh) {
			// Only refresh when some route changes or closes, but not when opens a secundary route.
			if (this.previousUrl && this.currentUrl) {
				const c_secundaryParts = this.currentUrl.split('?');
				const p_secundaryParts = this.previousUrl.split('?');
				if (c_secundaryParts.length < p_secundaryParts.length || (c_secundaryParts.length === p_secundaryParts.length && (this.previousUrl !== this.currentUrl))) {
					this.engineCommands.addPendingComand('$root', {name: 'refresh', value: true});
				}
			}
		}
	}

	async engine($root) {
		if (!this.config.phantomMode) {
			this.addSpinnerAndHideContent('root-view');
			this.setDefaultCommands();
		} else {
			this.removeSpinnerAndShowContent('root-view');
		}
		this.engineIsRunning = true;
		this.orderedRoutesToOpen = $root ? [$root] : [];
		this.orderedRoutesToClose = [];
		this.setNewRoutesAndbuildOrderedRoutesToLoad();
		this.buildOrderedRoutesToClose();
		this.engineCommands.buildOtherCicleCommands();
		const abort = await this.resolveWhenListIsPopulated(
			this.runBeforeCloseInOrder, this.orderedRoutesToClose, 0, this);
		if (abort === 'abort') {
			this.abortCicle();
			return;
		}
		this.clearPhantomRouter();
		this.removeViewInOrder(this.orderedRoutesToClose, 0, this);
		await this.resolveWhenListIsPopulated(
			this.runOnRouteCloseAndRemoveController, this.orderedRoutesToClose, 0, this);
		await this.resolveWhenListIsPopulated(
			this.initRouteControllerAndRunLoadInOrder, this.orderedRoutesToOpen, 0, this);
		await this.resolveWhenListIsPopulated(
			this.runControllerInOrder, this.orderedRoutesToOpen, 0, this);
		await this.resolveWhenListIsPopulated(
			this.loadViewInOrder, this.orderedRoutesToOpen, 0, this);
		await this.resolveWhenListIsPopulated(
			this.runOnViewLoadInOrder, this.orderedRoutesToOpen, 0, this);
		this.engineIsRunning = false;

		if (this.pendingCallbacks.length) {
			for (const callback of this.pendingCallbacks) {
				callback();
			}
			this.pendingCallbacks = [];
		}
		if (!this.config.phantomMode) {
			this.cicleEnds.broadcast();
		}
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

	callNextLinkWhenReady(runInOrder, orderedList, index, ctx, _resolve) {
		if (ctx.phantomRouter) {
			ctx.phantomRouter.ready.subscribe(function () {
				runInOrder(orderedList, index, ctx, _resolve);
			});
		} else {
			runInOrder(orderedList, index, ctx, _resolve);
		}
	}

	runBeforeCloseInOrder(orderedRoutesToClose, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToClose[routeIndex];
		if (!route) {
			return	_resolve();
		}
		// Run the controller beforeClose
		if (route.commands.runBeforeClose === true &&
			ctx.$powerUi.controllers[route.viewId] &&
			ctx.$powerUi.controllers[route.viewId].instance &&
			ctx.$powerUi.controllers[route.viewId].instance.beforeClose) {
			const result = ctx.$powerUi.controllers[route.viewId].instance.beforeClose();
			if (result && result.then) {
				result.then(function (response) {
					ctx.callNextLinkWhenReady(
						ctx.runBeforeCloseInOrder, orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
				}).catch(function (error) {
					_resolve('abort');
					if (error) {
						window.console.log('Error running beforeClose: ', route.routeId, error);
					}
				});
			} else {
				ctx.runBeforeCloseInOrder(
					orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
			}
		} else {
			ctx.runBeforeCloseInOrder(orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
		}
	}

	// Run the controller instance for the route
	initRouteControllerAndRunLoadInOrder(orderedRoutesToOpen, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToOpen[routeIndex];
		if (!route) {
			return	_resolve();
		}
		if (route.commands.addCtrl) {
			let $data = {};
			if (ctx.routeData[route.routeId]) {
				$data = Object.assign(ctx.routeData[route.routeId], ctx.routes[route.routeId].data || {});
				delete ctx.routeData[route.routeId];
			} else {
				$data = Object.assign({}, ctx.routes[route.routeId].data || {});
			}
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
			ctx.$powerUi.controllers[route.viewId].instance._routeParams = route.paramKeys ? ctx.getRouteParamValues(
				{routeId: route.routeId, paramKeys: route.paramKeys}) : {};
			ctx.$powerUi.controllers[route.viewId].instance.$root = (ctx.$powerUi.controllers['root-view'] && ctx.$powerUi.controllers['root-view'].instance) ? ctx.$powerUi.controllers['root-view'].instance : null;
		}
		// Run the controller load
		if (route.commands.runLoad &&
			ctx.$powerUi.controllers[route.viewId] &&
			ctx.$powerUi.controllers[route.viewId].instance &&
			ctx.$powerUi.controllers[route.viewId].instance.load) {
			const loadPromise = ctx.$powerUi.controllers[route.viewId].instance._load(
				ctx.$powerUi.controllers[route.viewId].data);
			loadPromise.then(function () {
				ctx.initRouteControllerAndRunLoadInOrder(
					orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
			}).catch(function (error) {
				window.console.log('Error load CTRL: ', error);
			});
		} else {
			ctx.initRouteControllerAndRunLoadInOrder(
				orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
		}
	}

	runControllerInOrder(orderedRoutesToOpen, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToOpen[routeIndex];
		if (!route) {
			return	_resolve();
		}

		if (route.commands.runCtrl &&
			ctx.$powerUi.controllers[route.viewId] &&
			ctx.$powerUi.controllers[route.viewId].instance &&
			ctx.$powerUi.controllers[route.viewId].instance.ctrl) {
			const result = ctx.$powerUi.controllers[route.viewId].instance.ctrl(
				ctx.$powerUi.controllers[route.viewId].data);
			if (result && result.then) {
				result.then(function () {
					ctx.callNextLinkWhenReady(
						ctx.runControllerInOrder, orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
				}).catch(function (error) {
					window.console.log('Error running CTRL: ', error);
				});
			} else {
				ctx.runControllerInOrder(
					orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
			}
		} else {
			ctx.runControllerInOrder(
				orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
		}
	}

	runOnRouteCloseAndRemoveController(orderedRoutesToClose, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToClose[routeIndex];
		if (!route) {
			return _resolve();
		}

		if (ctx.$powerUi.controllers[route.viewId] &&
			ctx.$powerUi.controllers[route.viewId].instance) {
			const result = (route.commands.runOnRouteClose && ctx.$powerUi.controllers[route.viewId].instance.onRouteClose) ? ctx.$powerUi.controllers[route.viewId].instance.onRouteClose() : false;

			if (result && result.then) {
				result.then(function () {
					if (route.commands.removeCtrl) {
						ctx.removeVolatileViews(route.viewId);
						delete ctx.$powerUi.controllers[route.viewId];
					}
					ctx.callNextLinkWhenReady(
						ctx.runOnRouteCloseAndRemoveController, orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
				}).catch(function (error) {
					window.console.log('Error running onRouteClose: ', route.routeId, error);
				});
			} else {
				if (route.commands.removeCtrl) {
					ctx.removeVolatileViews(route.viewId);
					delete ctx.$powerUi.controllers[route.viewId];
				}
				ctx.runOnRouteCloseAndRemoveController(
					orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
			}
		} else {
			ctx.runOnRouteCloseAndRemoveController(orderedRoutesToClose, routeIndex + 1, ctx, _resolve);
		}
	}

	// Dialogs and modals with a hidden route opened throw a widget service are volatile routes
	// One route are create for each instante, so we need remove it when the controller are distroyed
	removeVolatileViews(viewId) {
		if (this.$powerUi.controllers[viewId] && this.$powerUi.controllers[viewId].instance && this.$powerUi.controllers[viewId].instance.volatileRouteIds && this.$powerUi.controllers[viewId].instance.volatileRouteIds.length) {
			for (const volatileId of this.$powerUi.controllers[viewId].instance.volatileRouteIds) {
				delete this.routes[volatileId];
			}
		}
	}

	runOnViewLoadInOrder(orderedRoutesToOpen, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToOpen[routeIndex];
		if (!route) {
			return _resolve();
		}

		if (route.commands.runOnViewLoad &&
			ctx.$powerUi.controllers[route.viewId] &&
			ctx.$powerUi.controllers[route.viewId].instance) {
			if (ctx.$powerUi.controllers[route.viewId].instance.onViewLoad) {
				const result = ctx.$powerUi.controllers[route.viewId].instance.onViewLoad(
					ctx.$powerUi.powerTree.allPowerObjsById[route.viewId].$shared.element); // passing the view element
				if (result && result.then) {
					result.then(function () {
						ctx.afterOnViewLoad(ctx, route);
						ctx.runOnViewLoadInOrder(orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
					}).catch(function (error) {
						window.console.log('Error running onViewLoad: ', route.routeId, error);
					});
				} else {
					ctx.afterOnViewLoad(ctx, route);
					ctx.runOnViewLoadInOrder(orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
				}
			} else {
				ctx.afterOnViewLoad(ctx, route);
				ctx.runOnViewLoadInOrder(orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
			}
		} else {
			ctx.runOnViewLoadInOrder(orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
		}
	}

	afterOnViewLoad(ctx, route) {
		if (ctx.$powerUi.controllers[route.viewId].instance._onViewLoad) {
			ctx.$powerUi.controllers[route.viewId].instance._onViewLoad(
				ctx.$powerUi.powerTree.allPowerObjsById[route.viewId].$shared.element); // passing the view element
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
			} else if (viewId === 'root-view') {
				this.$powerUi.powerTree.allPowerObjsById[viewId].$shared.removeInnerElementsFromPower();
			} else {
				this.$powerUi.powerTree.allPowerObjsById[viewId].$shared.removeElementAndInnersFromPower(powerViewNode)
			}
		}
		// Remove the node it self if not main-view
		if (viewId !== 'main-view' && viewId !== 'root-view' && powerViewNode) {
			powerViewNode.parentNode.removeChild(powerViewNode);
		}

		// Remove 'modal-open' css class from body if all modals are closed
		const modals = document.body.getElementsByClassName('pw-backdrop');
		if (modals && modals.length === 0) {
			document.body.classList.remove('modal-open');
		}
	}

	buildOrderedRoutesToClose() {
		let forceRefresh = false;
		// If root has pending commands forces all routes to refresh
		if (this.engineCommands.pending['$root']) {
			forceRefresh = true;
			this.engineCommands.addPendingComand(this.oldRoutes.id, {name: 'refresh', value: true});
		}
		// Will keep the route and only apply commands
		const routeIsNew = (this.oldRoutes.id !== this.currentRoutes.id);
		const shouldUpdate = (routeIsNew === false && this.engineCommands.pending[this.oldRoutes.id] !== undefined);
		// Add the old main route if have one
		if (forceRefresh || shouldUpdate || (this.oldRoutes.id && (this.oldRoutes.route !== this.currentRoutes.route))) {
			this.orderedRoutesToClose.unshift({
				routeId: this.oldRoutes.id,
				viewId: this.oldRoutes.viewId,
				params: this.oldRoutes.params,
				kind: 'main',
				parentRouteId: this.oldRoutes.parentRouteId,
				parentViewId: this.oldRoutes.parentViewId,
				powerViewNodeId: 'root-view',
				commands: this.engineCommands.buildRouteCloseCommands(
					this.oldRoutes.id, this.oldRoutes.viewId, shouldUpdate),
			});
		}
		// Add old child route from main route if have some
		this.markToRemoveRouteViews('mainChildRoutes', 'child', forceRefresh);
		// Add old child route and secundary routes if have some
		this.markToRemoveRouteViews('secundaryChildRoutes', 'child', forceRefresh);
		this.markToRemoveRouteViews('secundaryRoutes', 'secundary', forceRefresh);
		// Add old child route from hidden routes if have some
		this.markToRemoveRouteViews('hiddenChildRoutes', 'child', forceRefresh);
		this.markToRemoveRouteViews('hiddenRoutes', 'hidden', forceRefresh);
	}

	markToRemoveRouteViews(routesListName, kind, forceRefresh) {
		for (const old of this.oldRoutes[routesListName]) {
			const current = this.currentRoutes[routesListName].find(r=>r.id === old.id && r.viewId === old.viewId) || null;
			// Will keep the route and only apply commands
			const shouldUpdate = (current !== null && this.engineCommands.pending[old.id] !== undefined);
			if (forceRefresh || shouldUpdate || !this.currentRoutes[routesListName].find(o=> o.route === old.route)) {
				this.orderedRoutesToClose.unshift({
					routeId: old.id,
					viewId: old.viewId,
					params: old.params,
					kind: kind,
					parentRouteId: old.parentRouteId,
					parentViewId: old.parentViewId,
					powerViewNodeId: this.routes[old.parentRouteId] ? this.routes[old.parentRouteId].powerViewNodeId : null,
					commands: this.engineCommands.buildRouteCloseCommands(old.id, old.viewId, shouldUpdate),
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
			return oldRoute ? oldRoute.viewId : newRoute.viewId;
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

	loadViewInOrder(orderedRoutesToOpen, routeIndex, ctx, _resolve) {
		const route = orderedRoutesToOpen[routeIndex];
		if (!route) {
			ctx.$powerUi.callInitViews();
			if (!ctx.config.phantomMode) {
				ctx.removeSpinnerAndShowContent('root-view');
			}
			return _resolve();
		}
		if (route.commands.addView) {
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
				loadViewInOrder: ctx.loadViewInOrder,
				orderedRoutesToOpen: orderedRoutesToOpen,
				routeIndex: routeIndex + 1,
				ctx: ctx,
				_resolve: _resolve,
			});
		} else {
			ctx.loadViewInOrder(orderedRoutesToOpen, routeIndex + 1, ctx, _resolve);
		}
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

	loadRoute({routeId, paramKeys, viewId, ctrl, title, data, loadViewInOrder, orderedRoutesToOpen, routeIndex, ctx, _resolve}) {
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
					loadViewInOrder: loadViewInOrder,
					orderedRoutesToOpen: orderedRoutesToOpen,
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
					loadViewInOrder: loadViewInOrder,
					orderedRoutesToOpen: orderedRoutesToOpen,
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
					loadViewInOrder: loadViewInOrder,
					orderedRoutesToOpen: orderedRoutesToOpen,
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

	closePhantomRoute(routeId, ctx) {
		this.phantomRouter.closePhantomRoute(routeId, ctx);
	}

	openRoute({routeId, params, target, currentRouteId, currentViewId, title, data, commands}) {
		const routeKind = this.routeKind(routeId);
		console.log('routeKind', routeKind);
		// Only hidden route can open a second router (This is for dialog messages only)
		if (this.engineIsRunning && routeKind === 'hr') {
			const routes = [this.routes[routeId]];
			const newRouter = new PhantomRouter({rootPath: window.location.hash, routes: routes, phantomMode: true}, this.$powerUi);
			this.phantomRouter = newRouter;
			newRouter.openRoute({routeId, params, target, currentRouteId, currentViewId, title, data, commands});
			return;
		} else if (this.engineIsRunning && routeKind !== 'hr') {
			const self = this;
			this.cicleEnds.subscribe(function () {
				self.openRoute({routeId, params, target, currentRouteId, currentViewId, title, data, commands});
			});
		}


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
				this.navigate({hash: newRoute, title: title, data: data, commands: commands, routeId: routeId});
			// Open the route in a new secundary view without closing any view
			} else if (target === '_blank') {
				const oldHash = this.getOpenedSecundaryOrHiddenRoutesHash({});
				const fragment = `?${routeKind}=${this.buildHash({routeId, params, paramKeys})}`;
				const newRoute = this.buildNewHash(oldHash, fragment);
				this.navigate({hash: newRoute, title: title, data: data, commands: commands, routeId: routeId});
			// Close all secundary views and open the route in the main view
			} else {
				this.navigate({hash: this.buildHash({routeId, params, paramKeys}), title: title, isMainView: true, data: data, commands: commands, routeId: routeId});
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

	navigate({hash, title, isMainView, data={}, commands=[], routeId=null}) {
		const newHashParts = this.extractRouteParts(hash);
		let newHash = newHashParts.path || '';
		let newHiddenHash = '';
		for (const part of newHashParts.secundaryRoutes) {
			newHash = `${newHash}?sr=${part.replace(this.config.rootPath, '')}`;
		}
		for (const part of newHashParts.hiddenRoutes) {
			newHiddenHash = `${newHiddenHash}?hr=${part.replace(this.config.rootPath, '')}`;
		}

		const newLoacationHash = encodeURI(this.config.rootPath + newHash);
		// If route has change
		if ((newLoacationHash + encodeURI(newHiddenHash) || '') !== this.locationHashWithHiddenRoutes()) {
			this.hiddenLocationHash = encodeURI(newHiddenHash);
			// Pass data to new route and add pending commands before navigate
			if (routeId) {
				this.routeData[routeId] = data;
			}
			if (commands.length) {
				this.engineCommands.addCommands(commands);
			}

			// If there is some new secundary or main route
			if (window.location.hash !== newLoacationHash) {
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

	setMainRouteState({routeId, paramKeys, route, viewId, title, data, parentRouteId, parentViewId}) {
		// Register current route id
		this.currentRoutes.id = routeId;
		this.currentRoutes.route = route.replace(this.config.rootPath, ''); // remove #!/
		this.currentRoutes.viewId = this.routes[routeId].viewId || viewId;
		this.currentRoutes.isMainView = true;
		this.currentRoutes.kind = 'main';
		this.currentRoutes.title = title;
		this.currentRoutes.data = data;
		this.currentRoutes.parentRouteId = parentRouteId;
		this.currentRoutes.parentViewId = parentViewId;
		// Register current route parameters keys and values
		if (paramKeys) {
			this.currentRoutes.params = this.getRouteParamValues({routeId: routeId, paramKeys: paramKeys});
		} else {
			this.currentRoutes.params = [];
		}
	}
	setOtherRouteState({routeId, paramKeys, route, viewId, title, data, parentRouteId, parentViewId, kind}) {
		const newRoute = {
			title: title,
			isMainView: false,
			params: [],
			id: '',
			route: route.replace(this.config.rootPath, ''), // remove #!/
			viewId: this.routes[routeId].viewId || viewId,
			data: data || null,
			parentRouteId: parentRouteId,
			parentViewId: parentViewId,
			kind: kind,
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
		return this.getRouteOnList({
			routeId: routeId,
			viewId: viewId,
			listName: 'currentRoutes',
		});
	}

	getOldRoute({routeId, viewId}) {
		return this.getRouteOnList({
			routeId: routeId,
			viewId: viewId,
			listName: 'oldRoutes',
		});
	}

	getRouteOnList({routeId, viewId, listName}) {
		if (this[listName].id === routeId && this[listName].viewId) {
			return this[listName];
		} else {
			for (const route of this[listName].mainChildRoutes) {
				if (route.id === routeId && route.viewId === viewId) {
					return route;
				}
			}
			for (const route of this[listName].secundaryRoutes) {
				if (route.id === routeId && route.viewId === viewId) {
					return route;
				}
			}
			for (const route of this[listName].secundaryChildRoutes) {
				if (route.id === routeId && route.viewId === viewId) {
					return route;
				}
			}
			for (const route of this[listName].hiddenRoutes) {
				if (route.id === routeId && route.viewId === viewId) {
					return route;
				}
			}
			for (const route of this[listName].hiddenChildRoutes) {
				if (route.id === routeId && route.viewId === viewId) {
					return route;
				}
			}
			return null;
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


class PhantomRouter extends Router {
	openRoute({routeId, params, target, currentRouteId, currentViewId, title}) {
		this.ready = new UEvent('phantomRouter');
		const newRoute = {
			routeId: routeId,
			title: title,
			isMainView: false,
			kind: 'hidden',
			params: params,
			id: routeId,
			route: routeId, // the route and routeId is the same
			viewId: _Unique.domID('view'),
			data: null,
		};
		const route = this.setOtherRouteState(newRoute);
		this.currentRoutes.hiddenRoutes = [];
		this.currentRoutes.hiddenRoutes.push(route);
		this.routes[routeId].viewId = newRoute.viewId;

		const openCommands = this.engineCommands.buildRouteOpenCommands(routeId, newRoute.viewId, false);
		const closeCommands = this.engineCommands.buildRouteCloseCommands(routeId, newRoute.viewId, false);
		const commands = Object.assign(openCommands, closeCommands);
		delete commands.parentView;
		delete commands.rootView;
		// Add route to ordered list
		const $fakeRoot = {
			routeId: routeId,
			viewId: newRoute.viewId,
			paramKeys: '',
			kind: 'hidden',
			parentRouteId: null,
			parentViewId: null,
			commands: commands,
		};
		this.engine($fakeRoot);
	}

	closePhantomRoute(routeId, ctx) {
		const currentRoute = this.routes[routeId];
		this.oldRoutes.hiddenRoutes.push(currentRoute);
		this.engine();
		this.ready.broadcast();
	}
}
