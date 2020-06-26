class PowerTemplate extends PowerScope {
	constructor({$powerUi, viewId, routeId}) {
		super({$powerUi: $powerUi});
		this._viewId = viewId;
		this._routeId = routeId;

		if (this.css) {
			const css = new Promise(this.css.bind(this));
			css.then(function (response) {
				const head = document.getElementsByTagName('head')[0];
				let style = document.createElement('style');
				style.innerHTML = response;
				style.id = '_css' + viewId;
				head.appendChild(style);
			}).catch(function (response) {
				console.log('catch', response);
			});
		}

		return {template: this._template(), component: this};
	}

	_template() {
		return new Promise(this.template.bind(this));
	}
}

export { PowerTemplate };
