class PowerRoot extends PowerController {
    constructor({$powerUi, viewId, routeId}) {
        super({$powerUi: $powerUi});
        this._viewId = viewId;
        this._routeId = routeId;
    }

    _template() {
        return this.template.bind(this);
    }
}

export { PowerRoot };
