class PowerScope {
	constructor({$powerUi}) {
		// Add $powerUi to controller
		this.$powerUi = $powerUi;
		this._servicesInstances = {};
	}

	newPowerTextBind(propertyName, bindsArray) {
		return new PowerTextBind(propertyName, bindsArray);
	}

	newPowerStyleBind(propertyName, bindsArray) {
		return new PowerStyleBind(propertyName, bindsArray);
	}

	$service(name) {
		if (this._servicesInstances[name]) {
			return this._servicesInstances[name];
		} else {
			this._servicesInstances[name] = new this.$powerUi._services[name].component({
				$powerUi: this.$powerUi,
				$ctrl: this,
				params: this.$powerUi._services[name].params,
			});
			return this._servicesInstances[name];
		}
	}
}

export { PowerScope };
