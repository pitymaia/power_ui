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
		if (this.pwSplit) {
			this.$powerUi.windowModeChange.unsubscribe(this.onWindowModeChange, this, this.id);
			this.unsubscribe({event: 'click', fn: this.onClick, bar: this});
			window.removeEventListener("mousemove", this._changeMenuSize);
			window.removeEventListener("mouseup", this._onMouseUp);
			this.$powerUi._mouseIsDown = false;
			if (this.pwSplit) {
				this._window.powerWindowModeChange.unsubscribe(this.onPowerWindowModeChange, this);
				this.$powerUi.onBrowserWindowResize.unsubscribe(this.onBrowserWindowResize, this);
				if (this.isWindowFixed && this._window) {
					this._window.onPowerWindowResize.unsubscribe(this.onPowerWindowResize, this);
				}
			}
		}
		super.onRemove();
	}

	init() {
		super.init();

		this.pwSplit = this.element.classList.contains('pw-split');
		this.resizeRight = this.element.classList.contains('pw-left');
		this.resizeLeft = this.element.classList.contains('pw-right');
		this.resizeTop = this.element.classList.contains('pw-bottom');
		this.resizeBottom = this.element.classList.contains('pw-top');

		if (this.pwSplit) {
			this._changeMenuSize = this.changeMenuSize.bind(this);
			this._onMouseUp = this.onMouseUp.bind(this);
			this.$powerUi.windowModeChange.subscribe(this.onWindowModeChange, this);
			this.$powerUi.onBrowserWindowResize.subscribe(this.onBrowserWindowResize, this);
			this.subscribe({event: 'click', fn: this.onClick, bar: this});
			this.setBorder();
			this.addOnMouseBorderEvents();
		}
	}

	broadcastFixedBarWhenSizeChange() {
		if (this.isFixed && this.element) {
			this.$powerUi.onFixedPowerSplitBarChange.broadcast();
		}
	}

	subscribeToOnPowerWindowResize() {
		this._window.onPowerWindowResize.subscribe(this.onPowerWindowResize, this);
	}
	subscribeToPowerWindowModeChange() {
		this._window.powerWindowModeChange.subscribe(this.onPowerWindowModeChange, this);
	}

	// Only for powerWindow split bars
	onPowerWindowModeChange() {
		if (!this.element || !this._window) {
			return;
		}
		if (this._window.currentBarBreakQuery === 'pw-bar-break') {
			this.setSmallWindowModeSize();
		} else {
			this.removeStyles();
			this.element.style.width = this._currentWidth;
			this.element.style.height = this._currentHeight;
		}
	}

	onPowerWindowResize() {
		this.adjustBarSizeIfNeeded();
	}

	onBrowserWindowResize() {
		this.onPowerWindowModeChange();
		this.adjustBarSizeIfNeeded();
	}

	// Only for powerWindow split bars
	onWindowModeChange() {
		if (!this.element || !this._window) {
			return;
		}
		if (this.$powerUi.componentsManager.smallWindowMode) {
			this.setSmallWindowModeSize();
		} else {
			this.removeStyles();
			this.element.style.width = this._currentWidth;
			this.element.style.height = this._currentHeight;
		}
	}

	// Size when menu is colapsed
	setSmallWindowModeSize(keepWidth) {
		this.removeStyles(keepWidth);
		if (this.barPosition === 'top') {
			this.setTopColapsedMenuSize();
		} else if (this.barPosition === 'bottom') {
			this.setBottomColapsedMenuSize();
		} else if (this.barPosition === 'left') {
			this.setLeftColapsedMenuSize();
		} else if (this.barPosition === 'right') {
			this.setRightColapsedMenuSize();
		}
	}
	// Size when menu is colapsed
	setTopColapsedMenuSize() {
		// When counting position we need compensate a pixel
		const fixOffsetPosition = 1;
		if (this.isWindowFixed && this._window) {
			const bodyHeight = this._window.bodyEl.offsetHeight;
			const diff = this.element.offsetTop - this._window._dialog.offsetTop - this._window.defaultBorderSize - this._window.bodyEl.offsetTop + fixOffsetPosition;
			let height = bodyHeight + diff + this._window.titleBarEl.offsetHeight + this.element.offsetHeight;
			if (this._window.isMaximized || this.$powerUi.componentsManager.smallWindowMode) {
				height = height - this._window.defaultBorderSize;
			}
			this.element.style['max-height'] = height + 'px';
			this.element.style['min-width'] = this._currentWidth + 'px';
		}
	}
	// Size when menu is colapsed
	setBottomColapsedMenuSize() {
		// When counting position we need compensate a pixel
		const fixOffsetPosition = 1;
		if (this.isWindowFixed && this._window) {
			const diff = this.element.offsetTop - this._window._dialog.offsetTop;
			let height = diff - this._window.defaultBorderSize - this._window.defaultBorderSize + fixOffsetPosition;
			this.element.style['max-height'] = height + 'px';
			this.element.style['min-width'] = this._currentWidth + 'px';
		}
	}
	// Size when menu is colapsed
	setLeftColapsedMenuSize() {
		// When counting position we need compensate a pixel
		const fixOffsetPosition = 1;
		if (this.isWindowFixed && this._window) {
			const height = this._window.bodyEl.offsetHeight - this._window.defaultBorderSize - fixOffsetPosition;
			const diff = (this.element.offsetLeft - this._window._dialog.offsetLeft) - this._window.bodyEl.offsetLeft;
			let width = this._window.bodyEl.offsetWidth - diff - this._window.defaultBorderSize - fixOffsetPosition;
			this.element.style.height = height + 'px';
			this.element.style['min-height'] = height + 'px';
			this.element.style['max-width'] = width + 'px';
		}
	}
	// Size when menu is colapsed
	setRightColapsedMenuSize() {
		// When counting position we need compensate a pixel
		const fixOffsetPosition = 1;
		if (this.isWindowFixed && this._window) {
			const height = this._window.bodyEl.offsetHeight - this._window.defaultBorderSize - fixOffsetPosition;
			const diff = (this._window._dialog.offsetLeft + this._window.bodyEl.offsetLeft) - this.element.offsetLeft;
			let width = this.element.offsetWidth - diff - this._window.defaultBorderSize - fixOffsetPosition;
			this.element.style.height = height + 'px';
			this.element.style['min-height'] = height + 'px';
			this.element.style['max-width'] = width + 'px';
		}
	}

	onClick(fn, self) {
		self.$powerUi.componentsManager.runObserverFewTimes(10);
		setTimeout(function () {
			self.adjustBarSizeIfNeeded();
		}, 50);
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
		if (this.$powerUi.componentsManager.smallWindowMode || (this._window && this._window.isMaximized && this.$powerUi.componentsManager.smallWindowMode)) {
			return;
		}
		if (this.isOverRightBorder() || this.isOverLeftBorder() || this.isOverBottomBorder() || this.isOverTopBorder()) {
			this._currentHeight = null;
			this._currentWidth = null;
			this.removeStyles();
			this.onMouseUp(e);
		}
		this.broadcastFixedBarWhenSizeChange();
		this.adjustBarSizeIfNeeded();
		if (this.isWindowFixed && this._window) {
			this._window.changeWindowBars();
		}
	}

	removeStyles(keepWidth) {
		if (!this.element) {
			 return;
		}
		if (!keepWidth) {
			this.element.style.width = null;
		}
		this.element.style.height = null;
		this.element.style['min-height'] = null;
		this.element.style['max-height'] = null;
		this.element.style['min-width'] = null;
		this.element.style['max-width'] = null;
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
			defaultMinWidth: 270,
			defaultMinHeight: 170,
			defaultBorderSize: 0,
		};
		return win;
	}

	getPowerWindowContext() {
		const win = {
			_currentWidth: this._window._currentWidth,
			_currentHeight: this._window._currentHeight,
			rightTotalWidth: this._window.rightTotalWidth - this._window._dialog.offsetLeft,
			bottomTotalHeight: this._window.bottomTotalHeight - (this._window._dialog.offsetTop - this._window.titleBarEl.offsetHeight),
			leftTotalWidth: this._window.leftTotalWidth + this._window._dialog.offsetLeft,
			topTotalHeight: this._window.topTotalHeight + this._window._dialog.offsetTop + this._window.bodyEl.offsetTop,
			defaultMinWidth: this._window.defaultMinWidth + 20,
			defaultMinHeight: this._window.defaultMinHeight + this._window.defaultBorderSize + 20,
			defaultBorderSize: this._window.defaultBorderSize + 1,
		};
		return win;
	}

	setInitialValues() {
		this._initialLeft = this.element.offsetLeft;
		this._initialTop = this.element.offsetTop;
		this._initialOffsetWidth = this.element.offsetWidth;
		this._initialOffsetHeight = this.element.offsetHeight;
		this._initialRightTotalWidthDiff = this.ctx.rightTotalWidth - this._initialOffsetWidth;
		this._initialBottomTotalHeightDiff = this.ctx.bottomTotalHeight - this._initialOffsetHeight;
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
		this.setInitialValues();

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
		this.broadcastFixedBarWhenSizeChange();
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
			this.$powerUi.componentsManager.setWindowFixedBarsSizeAndPosition(this._window.windowBars, this._window);
		}
	}

	adjustBarSizeIfNeeded() {
		if (this._window && this._window.currentBarBreakQuery === 'pw-bar-break') {
			return;
		}
		if (this.$powerUi.componentsManager.smallWindowMode) {
			this.removeStyles();
			return;
		}

		const minHeight = 30;

		this.ctx = (this.isWindowFixed === true && this._window !== undefined) ? this.getPowerWindowContext() : this.getBrowserWindowContext();
		this.setInitialValues();

		let width = this.element.style.width;
		if (width) {
			width = parseInt(width.replace('px', ''));
		}
		let height = this.element.style.height;
		if (height) {
			height = parseInt(height.replace('px', ''));
		}
		if (this.barPosition === 'top') {
			if (!height && this.topHeightIsTooBig(this.element.offsetHeight)) {
				height = this.element.offsetHeight;
			}
			if (!height || height < minHeight) return;
			this.setTopMenuSize(height);
		} else if (this.barPosition === 'bottom') {
			if (!height && this.bottomHeightIsTooBig(this.element.offsetHeight)) {
				height = this.element.offsetHeight;
			}
			if (!height || height < minHeight) return;
			this.setBottomMenuSize(height);
		} else if (this.barPosition === 'left') {
			if (!width) return;
			this.setLeftMenuSize(width);
		} else if (this.barPosition === 'right') {
			if (!width) return;
			this.setRightMenuSize(width);
		}
	}

	topHeightIsTooBig(height) {
		let titleBar = 0;
		if (this.isFixed) {
			titleBar = 40;
		}
		const result = this.ctx._currentHeight - (this.ctx.defaultMinHeight + titleBar) < this._initialTop + height + this.ctx.bottomTotalHeight;
		return result;
	}

	setTopMenuSize(height) {
		// Compesate for window title bar if there is some opened and maximized
		let titleBar = 0;
		if (this.isFixed) {
			titleBar = 40;
		}
		if (this.topHeightIsTooBig(height)) {
			height = this.ctx._currentHeight - this._initialTop - this.ctx.bottomTotalHeight - (this.ctx.defaultMinHeight + titleBar) - this.ctx.defaultBorderSize;
		}
		this._currentHeight = height + 'px';
		this.element.style.height = this._currentHeight;
	}

	bottomHeightIsTooBig(height) {
		const maxHeight = this.ctx._currentHeight - (this._initialBottomTotalHeightDiff + this.ctx.topTotalHeight + this.ctx.defaultMinHeight);
		return height > maxHeight;
	}

	setBottomMenuSize(height) {
		const maxHeight = this.ctx._currentHeight - (this._initialBottomTotalHeightDiff + this.ctx.topTotalHeight + this.ctx.defaultMinHeight);
		if (this.bottomHeightIsTooBig(height)) {
			height = maxHeight;
		}
		this._currentHeight = height + 'px';
		this.element.style.height = this._currentHeight;
	}

	setLeftMenuSize(width) {
		if (width + this.element.offsetLeft > this.ctx._currentWidth - this.ctx.rightTotalWidth - this.ctx.defaultMinWidth) {
			width = this.ctx._currentWidth - this.element.offsetLeft - this.ctx.rightTotalWidth - this.ctx.defaultMinWidth;
		}
		this._currentWidth = width + 'px';
		this.element.style.width = this._currentWidth;
	}

	setRightMenuSize(width) {
		if (this.ctx.leftTotalWidth + this.ctx.defaultMinWidth > this.ctx._currentWidth - width - this._initialRightTotalWidthDiff) {
			width = this.ctx._currentWidth - this._initialRightTotalWidthDiff - this.ctx.leftTotalWidth - this.ctx.defaultMinWidth;
		}
		this._currentWidth = width + 'px';
		this.element.style.width = this._currentWidth;
	}

	isOverRightBorder() {
		return (this.y > 0 && this.y <= this.height) && (this.x >= this.width - this.borderSize) && (this.x < this.width - this.borderSize) === false;
	}

	resizeRightBorder(x) {
		let width = this._initialOffsetWidth + this._initialLeft + (x - this._initialX) - 10;
		this.setLeftMenuSize(width);
	}

	isOverLeftBorder() {
		return (this.y > 0 && this.y <= this.height - this.borderSize) && (this.x <= this.borderSize) === true;
	}

	resizeLeftBorder(x) {
		let width = (this.element.offsetWidth - x);
		this.setRightMenuSize(width);
	}

	isOverBottomBorder() {
		return this.y >= this.height - this.borderSize && (this.x > 0 && this.x <= this.width);
	}

	resizeBottomBorder(y) {
		let height = this._initialOffsetHeight + this._initialTop + (y - this._initialY) - 10;
		this.setTopMenuSize(height);
	}

	isOverTopBorder() {
		return this.y > 0 && this.y <= this.borderSize && (this.x > 0 && this.x <= this.width);
	}

	resizeTopBorder(y) {
		let height = this.element.offsetHeight - y;
		this.setBottomMenuSize(height);
	}

	toggle() {
		if (this.isWindowFixed && this._window && this._window.currentBarBreakQuery === 'pw-bar-break') {
			this.setSmallWindowModeSize(true);
		}
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
