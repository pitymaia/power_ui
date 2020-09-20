class PowerToolbar extends PowerActionsBar {
	constructor(bar, $powerUi) {
		super(bar, $powerUi);
		this.isToolbar = true;
		this.isColapsed = false;
	}

	onRemove() {
		super.onRemove();
	}

	init() {
		super.init();
		console.log("this.powerAction", this.powerAction);
		if (!this.powerAction || !this.powerAction.element) {
			throw `Toolbar ${this.id} is missing the "power-toggle" element or it's "data-power-target" attribute value is different from the toolbar id. See documentation for more details.`;
		} else {
			this.powerToggle = this.powerAction.element;
		}
	}

	getChildrenTotalWidth() {
		let totalChildrenWidth = 0;
		for (const action of this.childrenPowerActions) {
			totalChildrenWidth = totalChildrenWidth + action.element.offsetWidth;
		}

		for (const item of this.childrenPowerItems) {
			totalChildrenWidth = totalChildrenWidth + item.element.offsetWidth;
		}
		return totalChildrenWidth;
	}

	setStatus() {
		this.barWidth = parseInt(this.element.style.width.replace('px', ''));
		this.toggleWidth = this.powerToggle.offsetWidth;
		if (this.getChildrenTotalWidth() >= this.barWidth) {
			if (this.isColapsed === false) {
				this.element.classList.add('pw-show-toggle');
				this.isColapsed = true;
			}
		} else if (this.isColapsed === true) {
			this.element.classList.remove('pw-show-toggle');
			this.isColapsed = false;
		}
		this.showAndHiddeItems();
	}

	showAndHiddeItems() {
		let currentWidth = 0;
		for (const child of this.element.children) {
			const isAction = child.classList.contains('power-action');
			const isItem = child.classList.contains('power-item');
			if (isItem || isAction) {
				currentWidth = currentWidth + child.offsetWidth;
				if (currentWidth < this.barWidth - this.toggleWidth) {
					child.classList.add('pw-force-show');
					child.style['margin-left'] = null;
					child.style['margin-right'] = null;
				} else {
					child.classList.remove('pw-force-show');
					child.style['margin-left'] = -(child.offsetWidth*0.5) + 'px';
					child.style['margin-right'] = -(child.offsetWidth*0.5) + 'px';
				}
			}
		}
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-toolbar', isMain: true});
