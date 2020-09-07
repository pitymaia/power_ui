class PowerWindow extends PowerDialogBase {
	constructor({$powerUi, promise=false}) {
		super({$powerUi: $powerUi, noEsc: true, promise: promise});
		this.isWindow = true;

		// Add it to _resizeWindow allow remove the listner
		// this._resizeWindow = this.resizeWindow.bind(this);
		// window.addEventListener('resize', this._resizeWindow, false);
	}

	// Allow async calls to implement onCancel
	_cancel(...args) {
		window.removeEventListener('resize', this._resizeWindow, false);

		super._cancel(args);
	}

	_onViewLoad(view) {
		this.currentView = view;
		this._window = this.currentView.getElementsByClassName('pw-window')[0];

		if (this._top !== undefined && this._left !== undefined) {
			this._window.style.top = this._top + 'px';
			this._window.style.left = this._left + 'px';
		}

		if (this._width !== undefined && this._height !== undefined) {
			this._window.style.width = this._width + 'px';
			this._window.style.height = this._height + 'px';
		}

		this._width = this._window.offsetWidth;
		this._height = this._window.offsetHeight;
		this._top = this._window.offsetTop;
		this._left = this._window.offsetLeft;
		// Make it draggable
		this.dragElement();

		// Make it resizable
		this.bodyEl = this.currentView.getElementsByClassName('pw-body')[0];
		this.titleBarEl = this.currentView.getElementsByClassName('pw-title-bar')[0];

		this.bodyEl.style.height = this._height - this.titleBarEl.offsetHeight + 'px';
		this._minWidth = window.getComputedStyle(this._window).getPropertyValue('min-width');
		this._minHeight = parseInt(window.getComputedStyle(this._window).getPropertyValue('min-height').replace('px', ''));
		this._minHeight = this._minHeight + this.titleBarEl.offsetHeight;
		this._window.style['min-height'] = this._minHeight + 'px';

		this.addOnMouseBorderEvents();
		// this.resizeWindow();

		this.windowsOrder();

		this.setAllWindowElements();

		super._onViewLoad(this.currentView);
	}

	addOnMouseBorderEvents() {
		this._window.onmousemove = this.onMouseMoveBorder.bind(this);
		this._window.onmouseout = this.onMouseOutBorder.bind(this);
		this._window.onmousedown = this.onMouseDownBorder.bind(this);
	}

	onMouseMoveBorder(e) {
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget || this._mouseIsDown) {
			return;
		}

		window.onmouseup = this.onMouseUp.bind(this);
		window.onmousemove = this.changeWindowSize.bind(this);

		e.preventDefault();
		const viewId = this.$root ? 'root-view' : this._viewId;

		this.removeAllCursorClasses();
		this.cursorPositionOnWindowBound(e);
		if (this._window.cursor === 'top-left' || this._window.cursor === 'bottom-right') {
			this.$powerUi.addCss(viewId, 'window-left-top');
		} else if (this._window.cursor === 'top-right' || this._window.cursor === 'bottom-left') {
			this.$powerUi.addCss(viewId, 'window-left-bottom');
		} else if (this._window.cursor === 'top' || this._window.cursor === 'bottom') {
			this.$powerUi.addCss(viewId, 'window-height');
		} else {
			this.$powerUi.addCss(viewId, 'window-width');
		}
	}

	cursorPositionOnWindowBound(e) {
		const rect = this._window.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const width = this._window.offsetWidth;
		const height = this._window.offsetHeight;
		if ((x <= 15 && y <= 15)) {
			// top left corner
			this._window.cursor = 'top-left';
		} else if (x <= 15 && (y > 15 && y >= height - 15)) {
			// bottom left corner
			this._window.cursor = 'bottom-left';
		} else if (x >= width - 15 && y <= 15) {
			// top right corner
			this._window.cursor = 'top-right';
		} else if (x >= width - 15 && y >= height - 15) {
			// bottom left corner
			this._window.cursor = 'bottom-right';
		} else if ((y > 15 && y <= height - 15) && x < 15) {
			// left
			this._window.cursor = 'left';
		} else if ((y > 15 && y <= height - 15) && x >= width - 15) {
			// right
			this._window.cursor = 'right';
		} else if (y < 15 && (x > 15 && x <= width - 15)) {
			// top
			this._window.cursor = 'top';
		} else if (y >= height - 15 && (x > 15 && x <= width - 15)) {
			// bottom
			this._window.cursor = 'bottom';
		}
	}

	onMouseOutBorder() {
		if (this._mouseIsDown) {
			return;
		}
		this.removeAllCursorClasses();
	}

	onMouseDownBorder(e) {
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget) {
			return;
		}
		e.preventDefault();

		// Re-order the windows z-index
		this.windowsOrder(true);
		this._mouseIsDown = true;
		this.allowResize = true;
		this._initialX = e.clientX;
		this._initialY = e.clientY;
		this._initialLeft = this._left;
		this._initialTop = this._top;
		this._initialOffsetWidth = this._window.offsetWidth;
		this._initialOffsetHeight = this._window.offsetHeight;
	}

	changeWindowSize(e) {
		e.preventDefault();

		if (this.allowResize) {
			const rect = this._window.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			const minWidth = 130;
			const minHeight = 130;

			if (this._window.cursor === 'right') {
				this.resizeRightBorder(x);
			} else if (this._window.cursor === 'left') {
				this.resizeLeftBorder(x);
			} else if (this._window.cursor === 'top') {
				this.resizeTopBorder(y);
			} else if (this._window.cursor === 'bottom') {
				this.resizeBottomBorder(y);
			} else if (this._window.cursor === 'top-right') {
				this.resizeTopBorder(y);
				this.resizeRightBorder(x);
			} else if (this._window.cursor === 'top-left') {
				this.resizeTopBorder(y);
				this.resizeLeftBorder(x);
			} else if (this._window.cursor === 'bottom-right') {
				this.resizeBottomBorder(y);
				this.resizeRightBorder(x);
			} else if (this._window.cursor === 'bottom-left') {
				this.resizeBottomBorder(y);
				this.resizeLeftBorder(x);
			}

			if (this._width < minWidth) {
				this._width = minWidth;
			}
			if (this._height < minHeight) {
				this._height = minHeight;
			}

			this.setAllWindowElements();
		}
	}

	setAllWindowElements() {
		this._window.style.width =  this._width + 'px';
		this._window.style.height =  this._height + 'px';
		this.bodyEl.style.height = this._height - this.titleBarEl.offsetHeight + 'px';
		this._window.style.left = this._left + 'px';
		this._window.style.top = this._top + 'px';

		if (this.iframe) {
			this.iframe.style.height = this.bodyEl.style.height;
		}

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
		if (this._left < 0) {
			this._left = 0;
		} else {
			this._width = this._width - (this._initialLeft + diff);
		}
	}

	resizeTopBorder(y) {
		const diff = (y - this._initialY);
		this._top = this._initialTop + this._top + diff;
		if (this._top < 0) {
			this._top = 0;
		} else {
			this._height = this._height - (this._initialTop + diff);
		}
	}

	resizeBottomBorder(y) {
		this._height = this._initialOffsetHeight + this._initialTop + (y - this._initialY) - 10;
	}

	onMouseUp() {
		this.allowResize = false;
		window.onmousemove = null;
		window.onmouseup = null;
		this._mouseIsDown = false;
		this.removeAllCursorClasses();
		this.closeDragElement();
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
		return `<div class="pw-window${this.$powerUi.touchdevice ? ' pw-touchdevice': ''}">
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
			this._window.classList.add(changeWindowQueryTo);
			this.currentWindowQuery = changeWindowQueryTo;
		}
	}

	// Remove any window midia query from window classes
	removeWindowQueries() {
		this._window.classList.remove('pw-wsize-tinny');
		this._window.classList.remove('pw-wsize-small');
		this._window.classList.remove('pw-wsize-medium');
		this._window.classList.remove('pw-wsize-large');
		this._window.classList.remove('pw-wsize-extra-large');
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
				this._window.classList.add(changeMenuBreakQueryTo);
			}
			this.currentMenuBreakQuery = changeMenuBreakQueryTo;
		}
	}

	removeMenuBreakQuery() {
		this._window.classList.remove('pw-menu-break');
	}

	dragElement() {
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
			this._window.onmousedown = this.dragMouseDown.bind(this);
		}
	}

	dragMouseDown(event) {
		event = event || window.event;
		event.preventDefault();
		// Re-order the windows z-index
		this.windowsOrder(true);
		// get initial mouse cursor position
		this.pos3 = event.clientX;
		this.pos4 = event.clientY;
		// Cancel if user giveup
		window.onmouseup = this.closeDragElement.bind(this);
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
		// set the _window's new position
		let top = this._window.offsetTop - this.pos2;
		let left = this._window.offsetLeft - this.pos1;
		if (top < 0) {
			top = 0;
		}
		if (left < 0) {
			left = 0;
		}
		this._window.style.top = top + 'px';
		this._window.style.left = left + 'px';
		this._top = this._window.offsetTop;
		this._left = this._window.offsetLeft;
	}

	closeDragElement() {
		this._window.classList.add('pw-active');
		// this.resizeWindow();
		this._bodyHeight = window.getComputedStyle(this.bodyEl).height;
		// stop moving when mouse button is released:
		window.onmouseup = null;
		window.onmousemove = null;
	}

	windowsOrder(preventActivateWindow) {
		const self = this;
		// The timeout avoid call the windowOrder multiple times (one for each opened window)
		if (this.$powerUi._windowsOrderTimeout) {
			return;
		}
		this.$powerUi._windowsOrderInterval = setTimeout(function () {
			let windows = document.getElementsByClassName('pw-window');
			const currentWindow = self.currentView.getElementsByClassName('pw-window')[0];

			let zindex = 1002;
			const windowsTosort = {};
			for (const win of windows) {
				let winZindex = parseInt(win.style.zIndex || zindex);
				if (win !== currentWindow) {
					windowsTosort[winZindex] = win;
					if (winZindex >= zindex) {
						// Set zindex to it's bigger value
						zindex = winZindex + 1;
					}
				}
			}
			// Sort it
			const sorted = Object.keys(windowsTosort).sort((a,b) => parseInt(a)-parseInt(b));

			zindex = 1002;
			// Reorder the real windows z-index
			for (const key of sorted) {
				windowsTosort[key].style.zIndex = zindex;
				zindex = zindex + 1;
				windowsTosort[key].classList.remove('pw-active');
			}
			currentWindow.style.zIndex = zindex + 1;
			// Prevent set the active if dragging or resizing
			if (!preventActivateWindow) {
				currentWindow.classList.add('pw-active');
			} else {
				currentWindow.classList.remove('pw-active');
			}
		}, 10);
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
		super._onViewLoad(view);
	}

	changeWindowSize(e) {
		super.changeWindowSize(e);
		// this.iframe.style.width = this.bodyEl.style.width;
		this.iframe.style.height = this.bodyEl.style.height;
	}

	template({$title, $url}) {
		// This allow the user define a this.$title on controller constructor or compile, otherwise use the route title
		this.$title = this.$title || $title;
		const id = `iframe_${this.$powerUi._Unique.next()}`;
		return `<div class="pw-window${this.$powerUi.touchdevice ? ' pw-touchdevice': ''}">
					<div class="pw-title-bar">
						<span class="pw-title-bar-label">${this.$title}</span>
						<div data-pow-event onmousedown="_cancel()" class="pw-bt-close pw-icon icon-cancel-black"></div>
					</div>
					<div class="pw-body pw-body-iframe">
						<iframe frameBorder="0" name="${id}" id="${id}" data-pw-content src="${$url}">
						</iframe>
					</div>
					<div class="pw-cover-iframe" data-pow-event onmousedown="dragMouseDown()">
					</div>
				</div>`;
	}

	// Override PowerWidget $buildTemplate
	$buildTemplate({template, title}) {
		return this.template({$title: title || null, $url: template});
	}
}

export { PowerWindow, PowerWindowIframe };
