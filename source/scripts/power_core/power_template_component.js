class PowerTemplate {
    constructor({$powerUi, ctrl}) {
        this.$powerUi = $powerUi;
        this.ctrl = ctrl;
        return this._template();
    }

    _template() {
        return new Promise(this.template.bind(this));
    }
}

export { PowerTemplate };
