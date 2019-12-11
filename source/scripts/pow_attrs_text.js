// Replace a value form an attribute when is mouseover some element and undo on mouseout
class powText extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
    }

    compile({view}) {
        // The scope of the controller of the view of this element
        const ctrlScope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;
        this.element.innerHTML = this.$powerUi.interpolation.getDatasetResult(this.element.dataset.powText, ctrlScope);
    }
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-text',
    callback: function(element) {return new powText(element);}
});
