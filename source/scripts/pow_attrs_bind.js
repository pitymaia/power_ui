// Replace a value form an attribute when is mouseover some element and undo on mouseout
class PowBind extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
    }

    compile() {
        this.element.innerHTML = this.$powerUi.interpolation.getDatasetResult(this.element.dataset.powBind);
    }
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-bind',
    callback: function(element) {return new PowBind(element);}
});
