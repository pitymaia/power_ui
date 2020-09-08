class PowerWindow extends PowerDialogBase {
	constructor({$powerUi, promise=false}) {
		super({$powerUi: $powerUi, noEsc: true, promise: promise});
		this.isWindow = true;
		this._minWidth = 250;
		this._minHeight = 250;
	}

	// Allow async calls to implement onCancel
	// _cancel(...args) {
	// 	super._cancel(args);
	// }

	_onViewLoad(view) {
		super._onViewLoad(view);

		this.currentView = view;

		if (this.isHiddenRoute === false) {
			this.loadWindowState();
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
		// Make it draggable
		this.addDragWindow();

		// Make it resizable
		this.bodyEl = this.currentView.getElementsByClassName('pw-body')[0];
		this.titleBarEl = this.currentView.getElementsByClassName('pw-title-bar')[0];

		this.bodyEl.style.height = this._height - this.titleBarEl.offsetHeight + 'px';
		let minHeight = parseInt(window.getComputedStyle(this._dialog).getPropertyValue('min-height').replace('px', ''));
		minHeight = minHeight + this.titleBarEl.offsetHeight;
		this._dialog.style['min-height'] = minHeight + 'px';
		this._minHeight = minHeight;

		this.addOnMouseBorderEvents();
		this.setAllWindowElements();
	}

	saveWindowState() {
		const winState = {
			width: this._width,
			height: this._height,
			top: this._top,
			left: this._left,
			zIndex: this.zIndex,
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
			return true;
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

		window.onmouseup = this.onMouseUp.bind(this);
		window.onmousemove = this.changeWindowSize.bind(this);

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
		e.preventDefault();

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
		}
	}

	topLeftLimits() {
		if (this._left < 0) {
			this._left = 0;
		}
		if (this._top < 0) {
			this._top = 0;
		}
	}

	avoidExceedingLimits() {
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
		this.topLeftLimits();
		// Left limits
		if (this._width === this._minWidth && this._dialog.cursor.includes('left')) {
			this._left = this._left + widthFix;
		} else if (this._left <= 0 && this._lastWidth < this._width && this._dialog.cursor.includes('left')) {
			this._width = this._lastWidth;
		}
		// Top limits
		if (this._height === this._minHeight && this._dialog.cursor.includes('top')) {
			this._top = this._top + heightFix;
		} else if (this._top <= 0 && this._lastHeight < this._height && this._dialog.cursor.includes('top')) {
			this._height = this._lastHeight;
		}
		// Right limits
		if (this._left + this._width + 10 > window.innerWidth) {
			this._width = window.innerWidth - this._left - 10;
		}
		// Bottom limits
		if (this._top + this._height + 10 > window.innerHeight) {
			this._height = window.innerHeight - this._top - 10;
		}
		this.topLeftLimits();
		this._lastHeight = this._height;
		this._lastWidth = this._width;
		this._lastTop = this._top;
		this._lastLeft = this._left;
	}

	setAllWindowElements() {
		this._dialog.style.width =  this._width + 'px';
		this._dialog.style.height =  this._height + 'px';
		this.bodyEl.style.height = this._height - this.titleBarEl.offsetHeight + 'px';
		this._dialog.style.left = this._left + 'px';
		this._dialog.style.top = this._top + 'px';

		// Add the classes to create a css "midia query" for the window
		this.replaceWindowSizeQuery();
		this.replaceMenuBreakQuery();
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
		window.onmousemove = null;
		window.onmouseup = null;
		this.$powerUi._mouseIsDown = false;
		this.removeAllCursorClasses();
		this.endDragWindow();
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

		if (this._width <= 600) {
			changeWindowQueryTo = 'pw-wsize-tinny';
		} else if (this._width >= 601 && this._width <= 900) {
			changeWindowQueryTo = 'pw-wsize-small';
		} else if (this._width >= 901 && this._width <= 1200) {
			changeWindowQueryTo = 'pw-wsize-medium';
		} else if (this._width >= 1201 && this._width <= 1500) {
			changeWindowQueryTo = 'pw-wsize-large';
		} else {
			changeWindowQueryTo = 'pw-wsize-extra-large';
		}

		if (this.currentWindowQuery === undefined || this.currentWindowQuery !== changeWindowQueryTo) {
			this.removeWindowQueries();
			this._dialog.classList.add(changeWindowQueryTo);
			this.currentWindowQuery = changeWindowQueryTo;
		}
	}

	// Remove any window midia query from window classes
	removeWindowQueries() {
		this._dialog.classList.remove('pw-wsize-tinny');
		this._dialog.classList.remove('pw-wsize-small');
		this._dialog.classList.remove('pw-wsize-medium');
		this._dialog.classList.remove('pw-wsize-large');
		this._dialog.classList.remove('pw-wsize-extra-large');
	}

	replaceMenuBreakQuery() {
		let changeMenuBreakQueryTo = this.currentMenuBreakQuery;


		if (this._width <= 768) {
			changeMenuBreakQueryTo = 'pw-menu-break';
		} else {
			changeMenuBreakQueryTo = false;
		}

		if (this.currentMenuBreakQuery === undefined || this.currentMenuBreakQuery !== changeMenuBreakQueryTo) {
			this.removeMenuBreakQuery();
			if (changeMenuBreakQueryTo) {
				this._dialog.classList.add(changeMenuBreakQueryTo);
			}
			this.currentMenuBreakQuery = changeMenuBreakQueryTo;
		}
	}

	removeMenuBreakQuery() {
		this._dialog.classList.remove('pw-menu-break');
	}

	addDragWindow() {
		this.pos1 = 0;
		this.pos2 = 0;
		this.pos3 = 0;
		this.pos4 = 0;

		const titleBar = this.currentView.getElementsByClassName('pw-title-bar')[0];
		if (titleBar) {
			// if the title bar existis move from it
			titleBar.onmousedown = this.dragMouseDown.bind(this);
		} else {
			// or move from anywhere inside the container
			this._dialog.onmousedown = this.dragMouseDown.bind(this);
		}
	}

	dragMouseDown(event) {
		event = event || window.event;
		event.preventDefault();
		this.$powerUi._dragging = true;
		// get initial mouse cursor position
		this.pos3 = event.clientX;
		this.pos4 = event.clientY;
		// Cancel if user giveup
		window.onmouseup = this.endDragWindow.bind(this);
		// call a function when the cursor moves
		window.onmousemove = this.elementDrag.bind(this);
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
	}

	avoidDragOutOfScreen() {
		if (this._top + this._height + 10 > window.innerHeight) {
			this._top = window.innerHeight - this._height - 10;
		}
		if (this._top < 0) {
			this._top = 0;
		}
		if (this._left + this._width + 10 >= window.innerWidth) {
			this._left = window.innerWidth - this._width - 10;
		}
		if (this._left < 0) {
			this._left = 0;
		}
	}

	endDragWindow() {
		this._dialog.classList.add('pw-active');
		this._bodyHeight = window.getComputedStyle(this.bodyEl).height;
		// stop moving when mouse button is released:
		window.onmouseup = null;
		window.onmousemove = null;
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
		}

		this.zIndex = biggerIndex + 1;
		this._dialog.style.zIndex = this.zIndex;
		this.$powerUi.dialogs.push({id: this.dialogId, ctrl: this});
		// Prevent set the active if dragging or resizing
		if (!preventActivateWindow) {
			this._dialog.classList.add('pw-active');
		} else {
			this._dialog.classList.remove('pw-active');
		}
		this.saveWindowState();
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

	setAllWindowElements() {
		super.setAllWindowElements();
		this.iframe.style.height = this.bodyEl.style.height;
		this.coverIframe.style.height = this.iframe.style.height;
		this.coverIframe.style.width = this._width + 'px';
		this.coverIframe.style.top = this.titleBarEl.offsetHeight + 5 + 'px';
	}

	template({$title, $url}) {
		// This allow the user define a this.$title on controller constructor or compile, otherwise use the route title
		this.$title = this.$title || $title;
		const id = `iframe_${this.$powerUi._Unique.next()}`;
		return `<div class="pw-window${this.$powerUi.touchdevice ? ' pw-touchdevice': ''} pw-dialog-container">
					<div class="pw-title-bar">
						<span class="pw-title-bar-label">${this.$title}</span>
						<div data-pow-event onmousedown="_cancel()" class="pw-bt-close pw-icon icon-cancel-black"></div>
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
