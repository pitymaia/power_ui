// Replace a value form an attribute when is mouseover some element and undo on mouseout
class powText extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
    }

    compile() {
        this.element.innerHTML = this.$powerUi.interpolation.getDatasetResult(this.element.dataset.powText);
    }
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-text',
    callback: function(element) {return new powText(element);}
});
