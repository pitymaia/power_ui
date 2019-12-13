class PowerController {
    constructor({$powerUi}) {
        // Add $powerUi to controller
        this.$powerUi = $powerUi;
    }

    get router() {
        return this.$powerUi.router;
    }

    closeCurrentRoute() {
        const route = this.router.getOpenedRoute({routeId: this._routeId, viewId: this._viewId});
        const parts = decodeURIComponent(window.location.hash).split('?');
        let counter = 0;
        let newHash = '';

        for (let part of parts) {
            if (!part.includes(route.route)) {
                if (counter !== 0) {
                    part = encodeURIComponent('?' + part);
                }
                newHash = newHash + part;
                counter = counter + 1;
            }
        }
        window.location.hash = newHash;
    }

    safeEval(string) {
        return this.$powerUi.safeEval({text: string, scope: this});
    }
}
