class PowerTemplate extends PowerScope {
	constructor({$powerUi, viewId, routeId}) {
		super({$powerUi: $powerUi});
		this._viewId = viewId;
		this._routeId = routeId;
		return {template: this._template(), component: this};
	}

	_template() {
		return new Promise(this.template.bind(this));
	}
}

export { PowerTemplate };
