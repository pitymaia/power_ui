class PowerTemplate {
	constructor({$powerUi}) {
		this.$powerUi = $powerUi;
		return {template: this._template(), component: this};
	}

	_template() {
		return new Promise(this.template.bind(this));
	}
}

export { PowerTemplate };
