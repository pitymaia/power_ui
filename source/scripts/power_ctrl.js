class PowerController {
    constructor({$powerUi}) {
        // Add $powerUi to controller
        this.$powerUi = $powerUi;
    }

    safeEval(string) {
        return this.$powerUi.safeEval({text: string, scope: this});
    }
}
