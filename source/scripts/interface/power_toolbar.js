class PowerToolbar extends PowerActionsBar {
	constructor(bar, $powerUi) {
		super(bar, $powerUi);
		this.isToolbar = true;
		this.isColapsed = false;
		// this.$powerUi.router.onRouteChange.subscribe(this.setStatus, this);
	}

	onRemove() {
		this.powerAction.unsubscribe({event: 'toggle', fn: this._setStatus, bar: this});
		super.onRemove();
	}

	init() {
		super.init();
	}

	getChildrenTotalWidth() {
		let totalChildrenWidth = 0;
		for (const action of this.childrenPowerActions) {
			totalChildrenWidth = totalChildrenWidth + action.element.offsetWidth;
		}

		for (const item of this.childrenPowerItems) {
			totalChildrenWidth = totalChildrenWidth + item.element.offsetWidth;
		}
		totalChildrenWidth = totalChildrenWidth + this.powerToggle.offsetWidth;
		return totalChildrenWidth;
	}

	getChildrenTotalHeight() {
		let totalChildrenHeight = 0;
		for (const action of this.childrenPowerActions) {
			totalChildrenHeight = totalChildrenHeight + action.element.offsetHeight;
		}

		for (const item of this.childrenPowerItems) {
			totalChildrenHeight = totalChildrenHeight + item.element.offsetHeight;
		}
		return totalChildrenHeight;
	}

	_setStatus(ctx, event, params) {
		params.bar.setStatus.bind(params.bar)();
	}

	setStatus() {
		if (!this.powerToggle) {
			if (!this.powerAction || !this.powerAction.element) {
				throw `Toolbar ${this.id} is missing the "power-toggle" element or it's "data-power-target" attribute value is different from the toolbar id. See documentation for more details.`;
			} else {
				this.powerToggle = this.powerAction.element;
				this.powerAction.subscribe({event: 'toggle', fn: this._setStatus, bar: this});
			}
		}
		this.barWidth = parseInt(this.element.style.width.replace('px', '')) || this.element.offsetWidth;
		this.barHeight = parseInt(this.element.style.height.replace('px', '')) || this.element.offsetHeight;
		this.toggleWidth = this.powerToggle.offsetWidth;
		this.toggleHeight = this.powerToggle.offsetHeight;
		if (this.orientation === 'vertical') {
			this.VerticalShowAndHiddeItems();
		} else {
			this.horizontalShowAndHiddeItems();
		}
	}

	VerticalShowAndHiddeItems() {
		if (this.getChildrenTotalHeight() >= this.barHeight) {
			if (this.isColapsed === false) {
				this.element.classList.add('pw-show-toggle');
				this.isColapsed = true;
			}
		} else if (this.isColapsed === true) {
			this.element.classList.remove('pw-show-toggle');
			this.isColapsed = false;
		}
		let currentHeight = 0;
		for (const child of this.element.children) {
			const isAction = child.classList.contains('power-action');
			const isItem = child.classList.contains('power-item');
			if (isItem || isAction) {
				currentHeight = currentHeight + child.offsetHeight;
				if (this._$pwActive || (currentHeight < this.barHeight - this.toggleHeight)) {
					child.classList.add('pw-force-show');
					child.style['margin-top'] = null;
					child.style['margin-bottom'] = null;
				} else {
					child.classList.remove('pw-force-show');
					child.style['margin-top'] = -(child.offsetHeight) + 'px';
				}
			}
		}
		this.setMaxWidthOnActiveVerticalBar();
	}

	setMaxWidthOnActiveVerticalBar() {
		if (!this._$pwActive) {
			this.element.style.width = null;
			return;
		}
		const firstItem = this.childrenPowerActions[0] || this.childrenPowerItems[0];
		const firstItemWidth = firstItem.element.offsetWidth;

		let maxWidth =  firstItemWidth + firstItemWidth;
		let needIncrease = true;
		let loops = 0;
		while (needIncrease && loops < 30) {
			loops = loops + 1;
			this.element.style.width = maxWidth + 'px';
			needIncrease = false;
			for (const action of this.childrenPowerActions) {
				if (action.element.offsetTop >= this.barHeight - firstItemWidth) {
					needIncrease = true;
				}
			}

			for (const item of this.childrenPowerItems) {
				if (item.element.offsetTop >= this.barHeight - firstItemWidth) {
					needIncrease = true;
				}
			}
			maxWidth = maxWidth + firstItemWidth;
		}

		if (loops >= 30) {
			this.element.style.width = null;
		}
	}

	horizontalShowAndHiddeItems() {
		if (this.getChildrenTotalWidth() >= this.barWidth) {
			if (this.isColapsed === false) {
				this.element.classList.add('pw-show-toggle');
				this.isColapsed = true;
			}
		} else if (this.isColapsed === true) {
			this.element.classList.remove('pw-show-toggle');
			this.isColapsed = false;
		}
		let currentWidth = 0;
		for (const child of this.element.children) {
			const isAction = child.classList.contains('power-action');
			const isItem = child.classList.contains('power-item');
			if (isItem || isAction) {
				currentWidth = currentWidth + child.offsetWidth;
				if (this._$pwActive || (currentWidth < this.barWidth - this.toggleWidth)) {
					child.style['margin-left'] = null;
					child.style['margin-right'] = null;
					child.classList.add('pw-force-show');
				} else {
					child.classList.remove('pw-force-show');
					child.style['margin-left'] = -(child.offsetWidth) + 'px';
					// child.style['margin-right'] = -(child.offsetWidth*0.5) + 'px';
				}
				this.lastTotalChildrenWidth = currentWidth;
			}
		}
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-toolbar', isMain: true});
