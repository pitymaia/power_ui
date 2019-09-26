// Replace a value form an attribute when is mouseover some element and undo on mouseout
class PowIf extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
        this.originalHTML = this.element.innerHTML;
    }

    compile() {
        const value = this.$powerUi.interpolation.compileAttrs(this.element.dataset.powIf) == 'true';
        // Hide if element is false
        if (value === false) {
            this.element.style.display = 'none';
            this.element.innerHTML = '';
        } else {
            this.element.style.display = null;
            this.element.innerHTML = this.originalHTML;
        }
    }
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-if',
    callback: function(element) {return new PowIf(element);}
});
