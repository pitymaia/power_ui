// Hide DOM element if value is false
class PowIf extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);
		this._$pwActive = false;
		this.originalHTML = element.innerHTML;
	}

	compile({view}) {
		// The scope of the controller of the view of this element
		const ctrlScope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;
		const value = this.$powerUi.safeEval({text: decodeURIComponent(this.element.dataset.powIf), $powerUi: this.$powerUi, scope: ctrlScope});
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
