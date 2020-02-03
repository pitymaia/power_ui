class PowerTemplate extends PowerScope {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
		return {template: this._template(), component: this};
	}

	_template() {
		return new Promise(this.template.bind(this));
	}
}

export { PowerTemplate };
