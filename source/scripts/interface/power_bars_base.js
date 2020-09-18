class _PowerBarsBase extends PowerTarget {
	constructor(bar, $powerUi) {
		super(bar);
		this.$powerUi = $powerUi;
		this._$pwActive = false;
		this.order = 0; // This helps keep zIndex
		this.id = this.element.getAttribute('id');
		this.powerTarget = true;
		// Bar priority
		this.priority = this.element.getAttribute('data-pw-priority');
		this.priority = this.priority ? parseInt(this.priority) : null;
		if (this.element.classList.contains('pw-bar-fixed')) {
			this.isFixed = true;
		} else {
			this.isFixed = false;
		}
		if (this.element.classList.contains('pw-top')) {
			this.barPosition = 'top';
		} else if (this.element.classList.contains('pw-bottom')) {
			this.barPosition = 'bottom';
		} else if (this.element.classList.contains('pw-left')) {
			this.barPosition = 'left';
		} else if (this.element.classList.contains('pw-right')) {
			this.barPosition = 'right';
		}
		if (this.element.classList.contains('pw-ignore')) {
			this.ignore = true;
		}
	}

	onRemove() {
		// Remove this menu bar from componentsManager.bars
		this.$powerUi.componentsManager.bars = this.$powerUi.componentsManager.bars.filter(bar=> bar.id !== this.id);
		if (this.isFixed) {
			this.$powerUi.componentsManager.stopObserve(this.element);
		}
	}

	init() {
		// Add this bar to componentsManager.bars
		this.$powerUi.componentsManager.bars.push({id: this.id, bar: this});
		if (this.isFixed) {
			this.$powerUi.componentsManager.observe(this.element);
		}
	}
}
