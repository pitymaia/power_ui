class _PowerBarsBase extends PowerTarget {
	constructor(bar, $powerUi) {
		super(bar);
		this.isMenu = true;
		this.$powerUi = $powerUi;
		this.order = 0;
		this._$pwActive = false;
		// this.element = bar;
		this.id = this.element.getAttribute('id');
		this.powerTarget = true;
		// The position the dropmenu will try to appear by default
		this.defaultPosition = this.element.getAttribute('data-pw-dropmenu');
		// Bar priority
		this.priority = this.element.getAttribute('data-pw-priority');
		this.priority = this.priority ? parseInt(this.priority) : null;
		// If user does not define a default position, see if is horizontal or vertical bar and set a defeult value
		if (this.element.classList.contains('pw-horizontal')) {
			this.orientation = 'horizontal';
			this.defaultPosition = this.defaultPosition || 'bottom-right';
		} else {
			this.orientation = 'vertical';
			this.defaultPosition = this.defaultPosition || 'right-bottom';
		}
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
