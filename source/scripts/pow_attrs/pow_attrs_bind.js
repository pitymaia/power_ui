// Hide DOM element if value is false
class PowBind extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
        this.originalHTML = element.innerHTML;
    }

    init() {
        const view = this.$pwView;
        // The scope of the controller of the view of this element
        const ctrlScope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;
        const value = this.$powerUi.safeEval({text: this.$powerUi.interpolation.decodeHtml(this.element.dataset.powBind), $powerUi: this.$powerUi, scope: ctrlScope});
        const el = this.element;
        el.value = value;
        this.subscribe({event: 'change', fn: this.onchange });
    }

    onchange() {
        const view = this.$pwView;
        const ctrlScope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;
        this.$powerUi.setValueOnScope({text: this.$powerUi.interpolation.decodeHtml(this.element.dataset.powBind), $powerUi: this.$powerUi, scope: ctrlScope, valueToSet: this.element.value});
    }
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-bind',
    callback: function(element) {return new PowBind(element);}
});
