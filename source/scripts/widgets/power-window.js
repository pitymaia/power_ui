class PowerWindow extends PowerDialogBase {
	constructor({$powerUi, promise=false}) {
		super({$powerUi: $powerUi, noEsc: true, promise: promise});
		this.isWindow = true;
		this.defaultMinHeight = 100;
		this.defaultMinWidth = 250;
		this.defaultBorderSize = 5;
		this._minWidth = this.defaultMinWidth;
		this._minHeight = this.defaultMinHeight;
		this.maximizeBt = true;
		this.restoreBt = true;
		this.isMaximized = false;
		this.topTotalHeight = 0;
		this.bottomTotalHeight = 0;
		this.leftTotalWidth = 0;
		this.rightTotalWidth = 0;
		this.totalHeight = 0;
		this.powerWindowModeChange = new UEvent('powerWindowModeChange');
		this.powerWindowStateChange = new UEvent('powerWindowStateChange');
		this.onPowerWindowResize = new UEvent('onPowerWindowResize');
		this.$powerUi.onFixedPowerSplitBarChange.subscribe(this.onFixedPowerSplitBarChange, this);
	}

	// Allow async calls to implement onCancel
	// _cancel(...args) {
	// 	super._cancel(args);
	// }

	_onViewLoad(view) {
		super._onViewLoad(view, true, true);
		this.currentView = view;
		this.fixedBars = {left: [], right: [], top: [], bottom: []};
		const fixedBars = this.currentView.getElementsByClassName('pw-bar-fixed');
		for (const bar of fixedBars) {
			if (bar.classList.contains('pw-left')) {
				this.fixedBars.left.push(bar);
			} else if (bar.classList.contains('pw-right')) {
				this.fixedBars.right.push(bar);
			} else if (bar.classList.contains('pw-top')) {
				this.fixedBars.top.push(bar);
			} else if (bar.classList.contains('pw-bottom')) {
				this.fixedBars.bottom.push(bar);
			}
		}
		this.windowBars = [];
		this.windowToolbars = [];
		const winBars = this.currentView.getElementsByClassName('pw-bar-window-fixed');
		for (const bar of winBars) {
			const _bar = this.$powerUi.componentsManager.bars.find(b=> b.id === bar.id);
			if (_bar) {
				_bar.bar._window = this;
				if (_bar.bar.subscribeToPowerWindowModeChange) {
					_bar.bar.subscribeToPowerWindowModeChange();
				}
				if (_bar.bar.subscribeToOnPowerWindowResize) {
					_bar.bar.subscribeToOnPowerWindowResize();
				}
				this.windowBars.push(_bar);
				if (_bar.bar.isToolbar) {
					this.windowToolbars.push(_bar);
				}
			}
		}

		if (!this.isHiddenRoute) {
			this.loadWindowState();
			// Run a single reorder function at the end of the cycle
			if (!this.$powerUi.reorder) {
				this.$powerUi.reorder = true;
				this.$powerUi.router.onCycleEnds.subscribe(this.reorderDialogsList.bind(this));
			}
		}

		if (this._top !== undefined && this._left !== undefined) {
			this._dialog.style.top = this._top + 'px';
			this._dialog.style.left = this._left + 'px';
		}

		if (this._width !== undefined && this._height !== undefined) {
			this._dialog.style.width = this._width + 'px';
			this._dialog.style.height = this._height + 'px';
		}

		this._width = this._dialog.offsetWidth;
		this._height = this._dialog.offsetHeight;
		this._top = this._dialog.offsetTop;
		this._left = this._dialog.offsetLeft;
		this._lastHeight = 0;
		this._lastwidth = 0;
		// Register events
		this._changeWindowSize = this.changeWindowSize.bind(this);
		this._onMouseUp = this.onMouseUp.bind(this);
		// Make it draggable
		this.addDragWindow();

		// Make it resizable
		this.maximizeBt = this._dialog.getElementsByClassName('icon-maximize')[0];
		this.restoreBt = this._dialog.getElementsByClassName('icon-windows')[0];

		this.bodyEl.style.height = this._height - this.titleBarEl.offsetHeight + 'px';
		let minHeight = parseInt(window.getComputedStyle(this._dialog).getPropertyValue('min-height').replace('px', ''));
		minHeight = minHeight + this.titleBarEl.offsetHeight;
		this._dialog.style['min-height'] = minHeight + 'px';
		this._minHeight = minHeight;

		this.addOnMouseBorderEvents();
		this.setAllWindowElements();

		const minTop = this.minTop();
		const minLeft = this.minLeft();

		this.topLeftLimits(minTop + this.defaultBorderSize, minLeft + this.defaultBorderSize);

		if (this.isMaximized) {
			this.maximize(null, true);
		} else {
			this.restore(null, true);
		}

		this.replaceSizeQueries();
		this.restoreScrollPosition(view);
		this.refreshWindowToolbars();
	}

	onFixedPowerSplitBarChange() {
		this.browserWindowResize();
	}

	changeWindowBars() {
		const manager = this.$powerUi.componentsManager;
		if ((this.isMaximized === true && !manager.smallWindowMode) || (this.isMaximized === false && manager.smallWindowMode)) {
			this._currentTop = -this.defaultBorderSize + this._dialog.offsetTop;
			this._currentBottom = -this.defaultBorderSize + this._dialog.offsetTop;
			this._currentLeft = -this.defaultBorderSize + this.respectLeft;
			this._currentWidth = this._dialog.offsetWidth;
			this._currentHeight = this._dialog.offsetHeight + this.ignoreTop + this.ignoreBottom;
		} else if (this.isMaximized === true && manager.smallWindowMode) {
			this._currentTop = -this.defaultBorderSize;
			this._currentBottom = this._currentTop;
			this._currentLeft = -this.defaultBorderSize;
			this._currentWidth = this._dialog.offsetWidth - (this.defaultBorderSize + this.defaultBorderSize);
			this._currentHeight = this._dialog.offsetHeight - (this.defaultBorderSize + this.defaultBorderSize);
		} else {
			this._currentTop = this._top;
			this._currentBottom = this._currentTop;
			this._currentLeft = this._left;
			this._currentWidth = this._width;
			this._currentHeight = this._height;
		}
		this.$powerUi.componentsManager.setWindowFixedBarsSizeAndPosition(this.windowBars, this);
	}

	refreshWindowToolbars() {
		for (const bar of this.windowToolbars) {
			bar.bar.setStatus();
		}
	}

	// Adapt window to fixed bars and maybe also other power components
	adjustWindowWithComponents() {
		this.respectTop = 0;
		this.ignoreTop = 0;
		this.respectBottom = 0; //this.totalHeight;
		this.ignoreBottom = 0;
		this.respectRight = 0;
		this.respectLeft = 0;
		this.ignoreLeft = 0;
		const manager = this.$powerUi.componentsManager;
		const bars = manager.bars.filter(b=> b.bar.isFixed === true);
		for (const bar of bars) {
			if (!bar.bar.ignore && bar.bar.barPosition === 'top') {
				this.respectTop = this.respectTop + bar.bar.element.offsetHeight;
			} else if (bar.bar.ignore && bar.bar.barPosition === 'top') {
				this.ignoreTop = this.ignoreTop + bar.bar.element.offsetHeight;
			} else if (!bar.bar.ignore && bar.bar.barPosition === 'bottom') {
				this.respectBottom = this.respectBottom + bar.bar.element.offsetHeight;
			} else if (bar.bar.ignore && bar.bar.barPosition === 'bottom') {
				this.ignoreBottom = this.ignoreBottom + bar.bar.element.offsetHeight;
			} else if (bar.bar.ignore && bar.bar.barPosition === 'right') {
				this.respectRight = this.respectRight + bar.bar.element.offsetWidth;//this.$powerUi._offsetComputedAdjustSides(bar.bar.element);
			} else if (!bar.bar.ignore && bar.bar.barPosition === 'left') {
				this.respectLeft = this.respectLeft + bar.bar.element.offsetWidth;//this.$powerUi._offsetComputedAdjustSides(bar.bar.element);
			} else if (bar.bar.ignore && bar.bar.barPosition === 'left') {
				this.ignoreLeft = this.ignoreLeft + bar.bar.element.offsetWidth;//this.$powerUi._offsetComputedAdjustSides(bar.bar.element);
			}
		}

		if (this.isMaximized && !(manager.smallWindowMode) || (!this.isMaximized && manager.smallWindowMode)) {
			const _appContainer = document.getElementById('app-container');
			this._dialog.style.left = _appContainer.offsetLeft - this.ignoreLeft + 'px';
			this._dialog.style.width = _appContainer.offsetWidth + this.respectRight + this.ignoreLeft + 'px';
			// this._dialog.style.width = this.$powerUi._offsetComputedWidth(_appContainer) + this.respectRight + this.respectLeft + 'px';
			this._dialog.style['padding-left'] = 0;
			this._dialog.style['padding-right'] = 0;

			if (this._dialog.offsetTop < this.respectTop) {
				this._dialog.style['padding-top'] = 0;
				this._dialog.style.top = this.respectTop + 'px';
				this._dialog.style.height = window.innerHeight - this.respectTop + 'px';
				this.bodyEl.style.height = window.innerHeight - this.respectTop - this.titleBarEl.offsetHeight + 'px';
			}

			if (this.respectBottom) {
				this._dialog.style.height = window.innerHeight - manager.totalHeight + 'px';
				this.bodyEl.style.height = window.innerHeight - this.respectTop - this.respectBottom - this.titleBarEl.offsetHeight + 'px';
				this._dialog.style['padding-bottom'] = 0;
			}
		} else {
			this._dialog.style['padding-top'] = this.defaultBorderSize + 'px';
			this._dialog.style['padding-bottom'] = this.defaultBorderSize + 'px';
			this._dialog.style['padding-left'] = this.defaultBorderSize + 'px';
			this._dialog.style['padding-right'] = this.defaultBorderSize + 'px';
		}
	}

	_onRemoveCtrl() {
		delete this.zIndex;
		this.saveWindowState();
		this.removeWindowIsMaximizedFromBody();
		this.$powerUi.onFixedPowerSplitBarChange.unsubscribe(this.onFixedPowerSplitBarChange, this);
	}

	_onRemoveView() {
		delete this.currentWindowQuery;
		delete this.currentBarBreakQuery;
		super._onRemoveView();
	}

	removeWindowIsMaximizedFromBody() {
		if (document.body && document.body.classList) {
			document.body.classList.remove('window-is-maximized');
		}
	}

	saveWindowState() {
		if (!this.dialogId) {
			return;
		}
		const winState = {
			width: this._width,
			height: this._height,
			top: this._top,
			left: this._left,
			zIndex: this.zIndex,
			isMaximized: this.isMaximized,
		};
		sessionStorage.setItem(this.dialogId, JSON.stringify(winState));
	}

	loadWindowState() {
		let winState = sessionStorage.getItem(this.dialogId);
		if (winState) {
			winState = JSON.parse(winState);
			this._width = winState.width;
			this._height = winState.height;
			this._top = winState.top;
			this._left = winState.left;
			this.zIndex = winState.zIndex || this.zIndex;
			this._dialog.style.zIndex = this.zIndex;
			this.isMaximized = winState.isMaximized || this.isMaximized;
		}
	}

	addOnMouseBorderEvents() {
		this._dialog.onmousemove = this.onMouseMoveBorder.bind(this);
		this._dialog.onmouseout = this.onMouseOutBorder.bind(this);
		this._dialog.onmousedown = this.onMouseDownBorder.bind(this);
	}

	onMouseMoveBorder(e) {
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget || this.$powerUi._mouseIsDown || this.$powerUi._dragging) {
			return;
		}

		e.preventDefault();
		const viewId = this.$root ? 'root-view' : this._viewId;

		this.removeAllCursorClasses();
		this.cursorPositionOnWindowBound(e);
		if (this._dialog.cursor === 'top-left' || this._dialog.cursor === 'bottom-right') {
			this.$powerUi.addCss(viewId, 'window-left-top');
		} else if (this._dialog.cursor === 'top-right' || this._dialog.cursor === 'bottom-left') {
			this.$powerUi.addCss(viewId, 'window-left-bottom');
		} else if (this._dialog.cursor === 'top' || this._dialog.cursor === 'bottom') {
			this.$powerUi.addCss(viewId, 'window-height');
		} else {
			this.$powerUi.addCss(viewId, 'window-width');
		}
	}

	cursorPositionOnWindowBound(e) {
		const rect = this._dialog.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const width = this._dialog.offsetWidth;
		const height = this._dialog.offsetHeight;
		if ((x <= 15 && y <= 15)) {
			// top left corner
			this._dialog.cursor = 'top-left';
		} else if (x <= 15 && (y > 15 && y >= height - 15)) {
			// bottom left corner
			this._dialog.cursor = 'bottom-left';
		} else if (x >= width - 15 && y <= 15) {
			// top right corner
			this._dialog.cursor = 'top-right';
		} else if (x >= width - 15 && y >= height - 15) {
			// bottom left corner
			this._dialog.cursor = 'bottom-right';
		} else if ((y > 15 && y <= height - 15) && x < 15) {
			// left
			this._dialog.cursor = 'left';
		} else if ((y > 15 && y <= height - 15) && x >= width - 15) {
			// right
			this._dialog.cursor = 'right';
		} else if (y < 15 && (x > 15 && x <= width - 15)) {
			// top
			this._dialog.cursor = 'top';
		} else if (y >= height - 15 && (x > 15 && x <= width - 15)) {
			// bottom
			this._dialog.cursor = 'bottom';
		}
	}

	onMouseOutBorder() {
		if (this.$powerUi._mouseIsDown) {
			return;
		}
		this.removeAllCursorClasses();
	}

	onMouseDownBorder(e) {
		// Re-order the windows z-index
		this.setWindowsOrder(true);
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget) {
			return;
		}
		window.addEventListener("mousemove", this._changeWindowSize);
		window.addEventListener("mouseup", this._onMouseUp);
		e.preventDefault();
		if (this.isMaximized) {
			this._height = window.innerHeight - (this.defaultBorderSize + this.defaultBorderSize);
			this._width = window.innerWidth - (this.defaultBorderSize + this.defaultBorderSize);
			this._top = this.defaultBorderSize;
			this._left = this.defaultBorderSize;
			this.setAllWindowElements();
			this.restore();
		}
		this.$powerUi._mouseIsDown = true;
		this.allowResize = true;
		this._initialX = e.clientX;
		this._initialY = e.clientY;
		this._initialLeft = this._left;
		this._initialTop = this._top;
		this._initialOffsetWidth = this._dialog.offsetWidth;
		this._initialOffsetHeight = this._dialog.offsetHeight;
	}

	changeWindowSize(e) {
		e.preventDefault();
		if (this.allowResize) {
			const rect = this._dialog.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			if (this._dialog.cursor === 'right') {
				this.resizeRightBorder(x);
			} else if (this._dialog.cursor === 'left') {
				this.resizeLeftBorder(x);
			} else if (this._dialog.cursor === 'top') {
				this.resizeTopBorder(y);
			} else if (this._dialog.cursor === 'bottom') {
				this.resizeBottomBorder(y);
			} else if (this._dialog.cursor === 'top-right') {
				this.resizeTopBorder(y);
				this.resizeRightBorder(x);
			} else if (this._dialog.cursor === 'top-left') {
				this.resizeTopBorder(y);
				this.resizeLeftBorder(x);
			} else if (this._dialog.cursor === 'bottom-right') {
				this.resizeBottomBorder(y);
				this.resizeRightBorder(x);
			} else if (this._dialog.cursor === 'bottom-left') {
				this.resizeBottomBorder(y);
				this.resizeLeftBorder(x);
			}

			this.avoidExceedingLimits();
			this.setAllWindowElements();
			this.onPowerWindowResize.broadcast();
		}
	}

	topLeftLimits(minTop, minLeft) {
		if (this._left < minLeft) {
			this._left = minLeft;
		}
		if (this._top < minTop) {
			this._top = minTop;
		}
	}

	avoidExceedingLimits() {
		const minTop = this.minTop();
		const maxBottom = this.maxBottom();
		const minLeft = this.minLeft();
		const maxRight = this.maxRight();
		let widthFix = 0;
		let heightFix = 0;
		if (this._width < this._minWidth) {
			widthFix = this._width - this._minWidth;
			this._width = this._minWidth;
		}
		if (this._height < this._minHeight) {
			heightFix = this._height - this._minHeight;
			this._height = this._minHeight;
		}
		this.topLeftLimits(minTop, minLeft);
		// Left limits
		if (this._width === this._minWidth && this._dialog.cursor.includes('left')) {
			this._left = this._left + widthFix;
		} else if (this._left <= minLeft && this._lastWidth < this._width && this._dialog.cursor.includes('left')) {
			this._width = this._lastWidth;
		}
		// Top limits
		if (this._height === this._minHeight && this._dialog.cursor.includes('top')) {
			this._top = this._top + heightFix;
		} else if (this._top <= minTop && this._lastHeight < this._height && this._dialog.cursor.includes('top')) {
			this._height = this._lastHeight;
		}
		// Right limits
		if ((this._left + this._width) + maxRight + (this.defaultBorderSize + this.defaultBorderSize) > window.innerWidth) {
			this._width = (window.innerWidth - this._left) - maxRight - (this.defaultBorderSize + this.defaultBorderSize);
		}
		// Bottom limits
		if ((this._top + this._height) + maxBottom + (this.defaultBorderSize + this.defaultBorderSize) > window.innerHeight) {
			this._height = (window.innerHeight - this._top) - maxBottom - (this.defaultBorderSize + this.defaultBorderSize);
		}
		this.topLeftLimits(minTop, minLeft);

		this._lastHeight = this._height;
		this._lastWidth = this._width;
		this._lastTop = this._top;
		this._lastLeft = this._left;
	}

	browserWindowResize() {
		if (this.isMaximized) {
			this.maximize();
		} else {
			this.restore();
		}
	}

	orientationChange() {
		this.browserWindowResize();
		this.powerWindowStateChange.broadcast();
	}

	_maximizeDialog() {
		this._dialog.style.top = -this.defaultBorderSize + 'px';
		this._dialog.style.left = -this.defaultBorderSize + 'px';
		this._dialog.style.height = window.innerHeight + 'px';
		this._dialog.style.width = window.innerWidth + 'px';
		this.bodyEl.style.height = window.innerHeight - this.titleBarEl.offsetHeight + 'px';
	}

	maximize(event, preventBroadcast) {
		if (event) {
			event.preventDefault();
		}
		this._maximizeDialog();
		this.maximizeBt.style.display = 'none';
		this.restoreBt.style.display = 'block';
		this.isMaximized = true;
		this.saveWindowState();
		if (document.body && document.body.classList) {
			document.body.classList.add('window-is-maximized');
		}
		this.adjustWindowWithComponents();
		// Run once to adjust bars and other elements
		this.replaceSizeQueries();
		this.changeWindowBars();
		this.refreshWindowToolbars();

		if (!preventBroadcast) {
			this.powerWindowStateChange.broadcast();
			this.$powerUi.onPowerWindowChange.broadcast();
		}
		this.$powerUi.componentsManager.restartObserver();
		// Run final to adjust final positions after body change size
		this.replaceSizeQueries();
	}

	restore(event, preventBroadcast) {
		if (event) {
			event.preventDefault();
		}
		this.maximizeBt.style.display = 'block';
		this.restoreBt.style.display = 'none';
		if (!this.$powerUi.componentsManager.smallWindowMode) {
			this._dialog.style.top = this._top + 'px';
			this._dialog.style.left = this._left + 'px';
			this._dialog.style.height = this._height + 'px';
			this._dialog.style.width = this._width + 'px';
			this.bodyEl.style.height = this._height - this.titleBarEl.offsetHeight + 'px';
		} else {
			this._maximizeDialog();
		}
		this.isMaximized = false;
		this.saveWindowState();
		this.removeWindowIsMaximizedFromBody();
		this.adjustWindowWithComponents();
		// Run once to adjust bars and other elements
		this.replaceSizeQueries();
		this.changeWindowBars();
		this.refreshWindowToolbars();

		if (!preventBroadcast) {
			this.powerWindowStateChange.broadcast();
			this.$powerUi.onPowerWindowChange.broadcast();
		}
		this.$powerUi.componentsManager.restartObserver();
		// Run final to adjust final positions after body change size
		this.replaceSizeQueries();
	}

	setBorderSizes() {
		this._top = this._top - this.defaultBorderSize;
		this._left = this._left - this.defaultBorderSize;
		this._width = this._width - this.defaultBorderSize;
		this._height = this._height - this.defaultBorderSize;
	}

	setAllWindowElements() {
		this._dialog.style.width =  this._width +'px';
		this._dialog.style.height =  this._height + 'px';
		this.bodyEl.style.height = this._height - this.titleBarEl.offsetHeight + 'px';
		this._dialog.style.left = this._left + 'px';
		this._dialog.style.top = this._top + 'px';

		// Add the classes to create a css "midia query" for the window
		this.replaceSizeQueries();
		this.saveWindowState();
		this.changeWindowBars();
		this.refreshWindowToolbars();
	}

	replaceSizeQueries() {
		this.replaceWindowSizeQuery();
		this.replaceBarBreakQuery();
	}

	resizeRightBorder(x) {
		this._width = this._initialOffsetWidth + this._initialLeft + (x - this._initialX) - 10;
	}

	resizeLeftBorder(x) {
		const diff = (x - this._initialX);
		this._left = this._initialLeft + this._left + diff;
		this._width = this._width - (this._initialLeft + diff);
	}

	resizeTopBorder(y) {
		const diff = (y - this._initialY);
		this._top = this._initialTop + this._top + diff;
		this._height = this._height - (this._initialTop + diff);
	}

	resizeBottomBorder(y) {
		this._height = this._initialOffsetHeight + this._initialTop + (y - this._initialY) - 10;
	}

	onMouseUp() {
		this.allowResize = false;
		this.$powerUi._mouseIsDown = false;
		this.removeAllCursorClasses();
		window.removeEventListener("mousemove", this._changeWindowSize);
		window.removeEventListener("mouseup", this._onMouseUp);
		if (this.onResize) {
			this.onResize();
		}
	}

	removeAllCursorClasses() {
		const viewId = this.$root ? 'root-view' : this._viewId;
		this.$powerUi.removeCss(viewId, 'window-left-top');
		this.$powerUi.removeCss(viewId, 'window-left-bottom');
		this.$powerUi.removeCss(viewId, 'window-width');
		this.$powerUi.removeCss(viewId, 'window-height');
	}

	template({$title}) {
		// This allow the user define a this.$title on controller constructor or compile, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-window${this.$powerUi.touchdevice ? ' pw-touchdevice': ''} pw-dialog-container">
					${super.template({$title})}
				</div>`;
	}

	// Allow simulate midia queries with power-window
	replaceWindowSizeQuery() {
		let changeWindowQueryTo = this.currentWindowQuery;
		let width = this.bodyEl.offsetWidth;
		if (width <= 600) {
			changeWindowQueryTo = 'pw-wsize-tinny';
		} else if (width >= 601 && width <= 900) {
			changeWindowQueryTo = 'pw-wsize-small';
		} else if (width >= 901 && width <= 1200) {
			changeWindowQueryTo = 'pw-wsize-medium';
		} else if (width >= 1201 && width <= 1500) {
			changeWindowQueryTo = 'pw-wsize-large';
		} else {
			changeWindowQueryTo = 'pw-wsize-extra-large';
		}
		this.removeWindowQueries();
		this._dialog.classList.add(changeWindowQueryTo);
		this.currentWindowQuery = changeWindowQueryTo;
	}

	// Remove any window midia query from window classes
	removeWindowQueries() {
		this._dialog.classList.remove('pw-wsize-tinny');
		this._dialog.classList.remove('pw-wsize-small');
		this._dialog.classList.remove('pw-wsize-medium');
		this._dialog.classList.remove('pw-wsize-large');
		this._dialog.classList.remove('pw-wsize-extra-large');
	}

	replaceBarBreakQuery() {
		let changeBarBreakQueryTo = this.currentBarBreakQuery;
		let width = this._width;
		if (this.isMaximized) {
			width = this._dialog.offsetWidth;
		}

		if (width <= 768 || this.$powerUi.componentsManager.smallWindowMode) {
			changeBarBreakQueryTo = 'pw-bar-break';
		} else {
			changeBarBreakQueryTo = false;
		}

		this.removeBarBreakQuery();
		if (changeBarBreakQueryTo) {
			this._dialog.classList.add(changeBarBreakQueryTo);
		}
		this.currentBarBreakQuery = changeBarBreakQueryTo;
		this.powerWindowModeChange.broadcast();
	}

	removeBarBreakQuery() {
		this._dialog.classList.remove('pw-bar-break');
	}

	addDragWindow() {
		this.pos1 = 0;
		this.pos2 = 0;
		this.pos3 = 0;
		this.pos4 = 0;

		const titleBar = this.currentView.getElementsByClassName('pw-title-bar')[0];
		if (titleBar) {
			// if the title bar exists move from it
			titleBar.onmousedown = this.dragMouseDown.bind(this);
			titleBar.ondblclick = this.onDoubleClickTitle.bind(this);
		} else {
			// or move from anywhere inside the container
			this._dialog.onmousedown = this.dragMouseDown.bind(this);
		}
	}

	onDoubleClickTitle(event) {
		event.preventDefault();
		if (this.isMaximized) {
			this.restore(event);
		} else {
			this.maximize(event);
		}
	}

	dragMouseDown(event) {
		event = event || window.event;
		event.preventDefault();
		if (this.isMaximized || this.$powerUi.componentsManager.smallWindowMode) {
			this._dialog.classList.add('pw-active');
			return;
		}
		this.$powerUi._dragging = true;
		// get initial mouse cursor position
		this.pos3 = event.clientX;
		this.pos4 = event.clientY;
		// call a function when the cursor moves
		this._elementDrag = this.elementDrag.bind(this);
		// Cancel if user giveup
		this._endDragWindow = this.endDragWindow.bind(this);
		window.addEventListener("mousemove", this._elementDrag);
		window.addEventListener("mouseup", this._endDragWindow);
	}

	elementDrag(event) {
		event = event || window.event;
		event.preventDefault();
		// calculate the new cursor position
		this.pos1 = this.pos3 - event.clientX;
		this.pos2 = this.pos4 - event.clientY;
		this.pos3 = event.clientX;
		this.pos4 = event.clientY;
		// set the _dialog's new position
		this._top = this._dialog.offsetTop - this.pos2;
		this._left = this._dialog.offsetLeft - this.pos1;

		this.avoidDragOutOfScreen();

		this._dialog.style.top = this._top + 'px';
		this._dialog.style.left = this._left + 'px';
		this._top = this._dialog.offsetTop;
		this._left = this._dialog.offsetLeft;
		this.changeWindowBars();
	}

	minTop() {
		let minTop = 0;
		for (const bar of this.fixedBars.top) {
			minTop = minTop + bar.offsetHeight;
		}
		return minTop;
	}

	maxBottom() {
		let maxBottom = 0;
		for (const bar of this.fixedBars.bottom) {
			maxBottom = maxBottom + bar.offsetHeight;
		}
		return maxBottom;
	}

	minLeft() {
		let minLeft = 0;
		for (const bar of this.fixedBars.left) {
			minLeft = minLeft + bar.offsetWidth;
		}
		return minLeft;
	}

	maxRight() {
		let maxRight = 0;
		for (const bar of this.fixedBars.right) {
			maxRight = maxRight + bar.offsetWidth;
		}
		return maxRight;
	}

	avoidDragOutOfScreen() {
		const minTop = this.minTop();
		const maxBottom = this.maxBottom();
		const minLeft = this.minLeft();
		const maxRight = this.maxRight();
		if (this._top + this._height + 10 > window.innerHeight - maxBottom) {
			this._top = window.innerHeight - (this._height + maxBottom) - 10;
		}
		if (this._top < minTop) {
			this._top = minTop;
		}
		if (this._left + this._width + 10 >= window.innerWidth - maxRight) {
			this._left = window.innerWidth - (this._width + maxRight) - 10;
		}
		if (this._left < minLeft) {
			this._left = minLeft;
		}
	}

	endDragWindow() {
		this._dialog.classList.add('pw-active');
		this._bodyHeight = window.getComputedStyle(this.bodyEl).height;
		// stop moving when mouse button is released:
		window.removeEventListener("mouseup", this._endDragWindow);
		window.removeEventListener("mousemove", this._elementDrag);
		this.$powerUi._dragging = false;
		this.$powerUi._mouseIsDown = false;
		this.saveWindowState();
	}

	setWindowsOrder(preventActivateWindow) {
		this.$powerUi.dialogs = this.$powerUi.dialogs.filter(d => d.id !== this.dialogId);
		let biggerIndex = 1999;
		for (const dialog of this.$powerUi.dialogs) {
			biggerIndex = biggerIndex + 1;
			dialog.ctrl.zIndex = biggerIndex;
			dialog.ctrl._dialog.style.zIndex = biggerIndex;
			dialog.ctrl._dialog.classList.remove('pw-active');
			dialog.ctrl.saveWindowState();
		}

		this.zIndex = biggerIndex + 1;
		this._dialog.style.zIndex = this.zIndex;
		this.$powerUi.dialogs.push({id: this.dialogId, ctrl: this});
		// Prevent set the active if dragging or resizing
		if (!preventActivateWindow || this.isMaximized || this.$powerUi.componentsManager.smallWindowMode) {
			this._dialog.classList.add('pw-active');
		} else {
			this._dialog.classList.remove('pw-active');
		}
		this.saveWindowState();
	}

	reorderDialogsList() {
		// Run once and reset reorder to false so refresh can re-run it
		this.$powerUi.reorder = false;
		if (this.$powerUi.dialogs.length <= 1) {
			return;
		}
		this.$powerUi.dialogs.sort(function (a, b) {
			if (a.ctrl.zIndex > b.ctrl.zIndex) {
				return 1;
			} else {
				return -1;
			}
		});
	}
}

class PowerWindowIframe extends PowerWindow {
	constructor({$powerUi, promise=true}) {
		super({$powerUi: $powerUi, noEsc: true, promise: promise});
		this.isWindow = true;
	}

	_onViewLoad(view) {
		// Make it resizable
		this.iframe = view.getElementsByTagName('iframe')[0];
		this.coverIframe = view.getElementsByClassName('pw-cover-iframe')[0];
		super._onViewLoad(view);
	}

	maximize(event) {
		if (event) {
			event.preventDefault();
		}
		this._dialog.classList.add('pw-active');
		super.maximize(event);
		this.resizeIframeAndCover();
	}

	restore(event) {
		if (event) {
			event.preventDefault();
		}
		if (this.$powerUi.componentsManager.smallWindowMode) {
			this._dialog.classList.add('pw-active');
		}
		super.restore(event);
		this.resizeIframeAndCover();
	}

	resizeIframeAndCover() {
		this.iframe.style.height = this._currentHeight - this.titleBarEl.offsetHeight + 'px';
		this.coverIframe.style.height = this.iframe.style.height;
		this.coverIframe.style.width = this._currentWidth + 'px';
		this.coverIframe.style.top = this.titleBarEl.offsetHeight + this.defaultBorderSize + 'px';
	}

	setAllWindowElements() {
		super.setAllWindowElements();
		this.resizeIframeAndCover();
	}

	template({$title, $url}) {
		// This allow the user define a this.$title on controller constructor or compile, otherwise use the route title
		this.$title = this.$title || $title;
		const id = `iframe_${this.$powerUi._Unique.next()}`;
		return `<div class="pw-window${this.$powerUi.touchdevice ? ' pw-touchdevice': ''} pw-dialog-container">
					<div class="pw-title-bar">
						<span class="pw-title-bar-label">${this.$title}</span>
						<div data-pow-event onmousedown="_cancel()" class="pw-bt-dialog-title pw-icon icon-cancel-black"></div>
						${this.restoreBt ? '<div style="display:none;" data-pow-event onclick="restore(event)" class="pw-bt-dialog-title pw-icon icon-windows"></div>' : ''}
						${this.maximizeBt ? '<div data-pow-event onclick="maximize(event)" class="pw-bt-dialog-title pw-icon icon-maximize"></div>' : ''}
					</div>
					<div class="pw-body pw-body-iframe">
						<iframe frameBorder="0" name="${id}" id="${id}" data-pw-content src="${$url}">
						</iframe>
						<div class="pw-cover-iframe" data-pow-event onmousedown="dragMouseDown()">
						</div>
					</div>
				</div>`;
	}

	// Override PowerWidget $buildTemplate
	$buildTemplate({template, title}) {
		return this.template({$title: title || null, $url: template});
	}
}

export { PowerWindow, PowerWindowIframe };
