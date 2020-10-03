class PowerSplitBar extends _PowerBarsBase {
	constructor(menu, $powerUi) {
		super(menu, $powerUi);
		this.isMenu = true;
		this.borderSize = 5;
		this._currentHeight = null;
		this._currentWidth = null;
	}

	onRemove() {
		this.unsubscribe({event: 'click', fn: this.onClick, bar: this});
		super.onRemove();
	}

	init() {
		super.init();

		const split = this.element.classList.contains('pw-split');
		this.resizeRight = this.element.classList.contains('pw-left');
		this.resizeLeft = this.element.classList.contains('pw-right');
		this.resizeTop = this.element.classList.contains('pw-bottom');
		this.resizeBottom = this.element.classList.contains('pw-top');

		if (split) {
			this._changeMenuSize = this.changeMenuSize.bind(this);
			this._onMouseUp = this.onMouseUp.bind(this);
			this.$powerUi.windowModeChange.subscribe(this.onWindowModeChange, this);
			this.subscribe({event: 'click', fn: this.onClick, bar: this});
			this.setBorder();
			this.addOnMouseBorderEvents();
		}
	}

	subscribeToPowerWindowModeChange() {
		this._window.powerWindowModeChange.subscribe(this.onPowerWindowModeChange, this);
	}

	onPowerWindowModeChange() {
		if (this._window.currentBarBreakQuery === false) {
			this.removeStyles();
		} else {
			this.element.style.width = this._currentWidth;
			this.element.style.height = this._currentHeight;
		}
	}

	onWindowModeChange() {
		if (this.$powerUi.componentsManager.smallWindowMode) {
			this.removeStyles();
		} else {
			this.element.style.width = this._currentWidth;
			this.element.style.height = this._currentHeight;
		}
	}

	onClick(fn, self) {
		self.$powerUi.componentsManager.runObserverFewTimes(10);
	}

	setBorder() {
		this.defaultBorderSize = this.element.getAttribute('data-pw-border');
		if (this.defaultBorderSize) {
			const borderSide = this.resizeRight ? 'right' : this.resizeLeft ? 'left' : this.resizeTop ? 'top' : this.resizeBottom ? 'bottom' : null;
			this.borderSize = parseInt(this.defaultBorderSize);
			this.element.style[`border-${borderSide}-width`] = this.defaultBorderSize + 'px';
		}
	}

	cursorPositionOnMenuBound(e) {
		const rect = this.element.getBoundingClientRect();
		this.x = e.clientX - rect.left;
		this.y = e.clientY - rect.top;
		this.width = this.element.offsetWidth;
		this.height = this.element.offsetHeight;

		if (this.resizeRight) {
			if (this.isOverRightBorder()) {
				this.$powerUi.addCss(this.element.id, 'cursor-width');
			} else if (this.x < this.width - this.borderSize) {
				this.removeAllCursorClasses();
			}
		} else if (this.resizeLeft) {
			if (this.isOverLeftBorder()) {
				this.$powerUi.addCss(this.element.id, 'cursor-width');
			} else if (this.x > this.borderSize) {
				this.removeAllCursorClasses();
			}
		} else if (this.resizeBottom) {
			if (this.isOverBottomBorder()) {
				this.$powerUi.addCss(this.element.id, 'cursor-height');
			} else if (this.y < this.height - this.borderSize) {
				this.removeAllCursorClasses();
			}
		} else if (this.resizeTop) {
			if (this.isOverTopBorder()) {
				this.$powerUi.addCss(this.element.id, 'cursor-height');
			} else if ((this.y <= this.borderSize) === false) {
				this.removeAllCursorClasses();
			}
		}
	}

	removeAllCursorClasses() {
		this.$powerUi.removeCss(this.element.id, 'cursor-width');
		this.$powerUi.removeCss(this.element.id, 'cursor-height');
	}

	addOnMouseBorderEvents() {
		this.element.onmouseout = this.onMouseOutBorder.bind(this);
		this.element.onmousemove = this.onMouseMoveBorder.bind(this);
		this.element.onmousedown = this.onMouseDownBorder.bind(this);
		this.element.ondblclick = this.onDoubleClickBorder.bind(this);
	}

	onDoubleClickBorder(e) {
		e.preventDefault();
		if (this.isOverRightBorder() || this.isOverLeftBorder() || this.isOverBottomBorder() || this.isOverTopBorder()) {
			this._currentHeight = null;
			this._currentWidth = null;
			this.removeStyles();
			this.onMouseUp(e);
		}
	}

	removeStyles() {
		this.element.style.width = null;
		this.element.style.height = null;
	}

	onMouseOutBorder(e) {
		this.removeAllCursorClasses();
	}

	onMouseMoveBorder(e) {
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget || this.$powerUi._mouseIsDown || this.$powerUi._dragging || window.innerWidth < 768 || (this._window && this._window.currentBarBreakQuery !== false)) {
			return;
		}

		e.preventDefault();
		this.cursorPositionOnMenuBound(e);
	}

	getBrowserWindowContext() {
		const component = this.$powerUi.componentsManager;
		const win = {
			_currentWidth: window.innerWidth,
			_currentHeight: window.innerHeight,
			rightTotalWidth: component.rightTotalWidth,
			bottomTotalHeight: component.bottomTotalHeight,
			leftTotalWidth: component.leftTotalWidth,
			topTotalHeight: component.topTotalHeight,
			defaultMinWidth: 250,
			defaultMinHeight: 150,
		};
		return win;
	}

	getPowerWindowContext() {
		const win = {
			_currentWidth: this._window._currentWidth,
			_currentHeight: this._window._currentHeight,
			rightTotalWidth: this._window.rightTotalWidth - this._window._dialog.offsetLeft,
			bottomTotalHeight: this._window.bottomTotalHeight - this._window._dialog.offsetTop,
			leftTotalWidth: this._window.leftTotalWidth + this._window._dialog.offsetLeft,
			topTotalHeight: this._window.topTotalHeight + this._window._dialog.offsetTop + this._window.bodyEl.offsetTop,
			defaultMinWidth: this._window.defaultMinWidth,
			defaultMinHeight: this._window.defaultMinHeight,
		};
		this._initialBottomTotalHeightDiff = win.bottomTotalHeight - this._initialOffsetHeight;
		return win;
	}

	onMouseDownBorder(e) {
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget) {
			return;
		}
		e.preventDefault();
		this.$powerUi._mouseIsDown = true;
		window.addEventListener("mousemove", this._changeMenuSize);
		window.addEventListener("mouseup", this._onMouseUp);
		this.ctx = (this.isWindowFixed === true && this._window !== undefined) ? this.getPowerWindowContext() : this.getBrowserWindowContext();
		this.allowResize = true;
		this._initialX = e.clientX;
		this._initialY = e.clientY;
		this._initialLeft = this.element.offsetLeft;
		this._initialTop = this.element.offsetTop;
		this._initialOffsetWidth = this.element.offsetWidth;
		this._initialOffsetHeight = this.element.offsetHeight;
		this._initialRightTotalWidthDiff = this.ctx.rightTotalWidth - this._initialOffsetWidth;
		this._initialBottomTotalHeightDiff = this.ctx.bottomTotalHeight - this._initialOffsetHeight;

		if (this.resizeRight && this.isOverRightBorder()) {
			this.resizingRight = true;
		}

		if (this.resizeLeft && this.isOverLeftBorder()) {
			this.resizingLeft = true;
		}

		if (this.resizeBottom && this.isOverBottomBorder()) {
			this.resizingBottom = true;
		}

		if (this.resizeTop && this.isOverTopBorder()) {
			this.resizingTop = true;
		}
	}

	onMouseUp(e) {
		this.resizingRight = false;
		this.resizingLeft = false;
		this.resizingBottom = false;
		this.allowResize = false;
		window.removeEventListener("mousemove", this._changeMenuSize);
		window.removeEventListener("mouseup", this._onMouseUp);
		this.$powerUi._mouseIsDown = false;
		this.removeAllCursorClasses();
		this.$powerUi.componentsManager.runObserver();
	}

	changeMenuSize(e) {
		if (this.allowResize === false) {
			return;
		}
		this.ctx = (this.isWindowFixed === true && this._window !== undefined) ? this.getPowerWindowContext() : this.getBrowserWindowContext();
		const rect = this.element.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		if (this.resizingRight) {
			this.resizeRightBorder(x);
		} else if (this.resizingLeft) {
			this.resizeLeftBorder(x);
		} else if (this.resizingBottom) {
			this.resizeBottomBorder(y);
		} else if (this.resizingTop) {
			this.resizeTopBorder(y);
		}

		if (this.isWindowFixed === true) {
			// this._window.changeWindowBars();
			this.$powerUi.componentsManager.setWindowFixedBarsSizeAndPosition(this._window.windowBars, this._window);
		}
	}

	isOverRightBorder() {
		return (this.y > 0 && this.y <= this.height) && (this.x >= this.width - this.borderSize) && (this.x < this.width - this.borderSize) === false;
	}

	resizeRightBorder(x) {
		let width = this._initialOffsetWidth + this._initialLeft + (x - this._initialX) - 10;
		if (width + this.element.offsetLeft > this.ctx._currentWidth - this.ctx.rightTotalWidth - this.ctx.defaultMinWidth) {
			width = this.ctx._currentWidth - this.element.offsetLeft - this.ctx.rightTotalWidth - this.ctx.defaultMinWidth;
		}
		this._currentWidth = width + 'px';
		this.element.style.width = this._currentWidth;
	}

	isOverLeftBorder() {
		return (this.y > 0 && this.y <= this.height - this.borderSize) && (this.x <= this.borderSize) === true;
	}

	resizeLeftBorder(x) {
		let width = (this.element.offsetWidth - x);
		if (this.ctx.leftTotalWidth + this.ctx.defaultMinWidth > this.ctx._currentWidth - width - this._initialRightTotalWidthDiff) {
			width = this.ctx._currentWidth - this._initialRightTotalWidthDiff - this.ctx.leftTotalWidth - this.ctx.defaultMinWidth;
		}
		this._currentWidth = width + 'px';
		this.element.style.width = this._currentWidth;
	}

	isOverBottomBorder() {
		return this.y >= this.height - this.borderSize && (this.x > 0 && this.x <= this.width);
	}

	resizeBottomBorder(y) {
		let height = this._initialOffsetHeight + this._initialTop + (y - this._initialY) - 10;
		if (this.ctx._currentHeight - this.ctx.defaultMinHeight < this._initialTop + height + this.ctx.bottomTotalHeight) {
			height = this.ctx._currentHeight - this._initialTop - this.ctx.bottomTotalHeight - this.ctx.defaultMinHeight;
		}
		this._currentHeight = height + 'px';
		this.element.style.height = this._currentHeight;
	}

	isOverTopBorder() {
		return this.y > 0 && this.y <= this.borderSize && (this.x > 0 && this.x <= this.width);
	}

	resizeTopBorder(y) {
		let height = this.element.offsetHeight - y;
		const maxHeight = this.ctx._currentHeight - (this._initialBottomTotalHeightDiff + this.ctx.topTotalHeight + this.ctx.defaultMinHeight);
		if (height > maxHeight) {
			height = maxHeight;
		}
		this._currentHeight = height + 'px';
		this.element.style.height = this._currentHeight;
	}

	toggle() {
		// PowerAction implements an optional "click out" system to allow toggles to hide
		this.powerAction.ifClickOut();
	}

	// The powerToggle call this action method
	action() {
		this.toggle();
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-split-bar', isMain: true});
