class PowerController {
    constructor({$powerUi}) {
        // Add $powerUi to controller
        this.$powerUi = $powerUi;
    }

    openRoute({routeId, params}) {
        return this.$powerUi.router.openRoute({routeId, params});
    }

    safeEval(string) {
        return this.$powerUi.safeEval({text: string, scope: this});
    }
}
