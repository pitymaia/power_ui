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
		this._width = this._window.offsetWidth;
		this._height = this._window.offsetHeight;
		this._top = this._window.offsetTop;
		this._left = this._window.offsetLeft;
		// Make it draggable
		this.dragElement();

		if (this._top && this._left) {
			this._window.style.top = this._top + 'px';
			this._window.style.left = this._left + 'px';
		}

		// Make it resizable
		this.bodyEl = this.currentView.getElementsByClassName('pw-body')[0];
		this.resizableEl = this.currentView.getElementsByClassName('pw-window-resizable')[0];
		this.titleBarEl = this.currentView.getElementsByClassName('pw-title-bar')[0];
		// this.resizeElement();

		if (this._width && this._height) {
			// Keep the size if user refresh the window
			this.bodyEl.style.width = this._width;
			this.bodyEl.style.height = this._bodyHeight;
			this.resizableEl.style.width = this._width;
			this.resizableEl.style.height = this._height;
		} else {
			// Makes an initial adjustiment on window size to avoid it starts with a scrollbar
			const height = (this.bodyEl.offsetHeight + 50) + 'px';
			const width = (this.bodyEl.offsetWidth + 50) + 'px';
			this.bodyEl.style.height = height;
			this.resizableEl.style.height = height;
			this.bodyEl.style.width = width;
			this.resizableEl.style.width = width;
		}
		this.addOnMouseBorderEvents();
		// this.resizeWindow();

		this.windowsOrder();

		super._onViewLoad(this.currentView);
	}

	addOnMouseBorderEvents() {
		this._window.onmousemove = this.onMouseMoveBorder.bind(this);
		this._window.onmouseout = this.onMouseOutBorder.bind(this);
		this._window.onmousedown = this.onMouseDownBorder.bind(this);
	}

	onMouseMoveBorder(e) {
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget) {
			return;
		}

		window.onmouseup = this.onMouseUp.bind(this);
		window.onmousemove = this.changeWindowSize.bind(this);

		e.preventDefault();
		const viewId = this.$root ? 'root-view' : this._viewId;

		this.cursorPositionOnWindowBound(e);
		if (this._window.cursor === 'top-left' || this._window.cursor === 'botton-right') {
			this.$powerUi.addCss(viewId, 'window-left-top');
		} else if (this._window.cursor === 'top-right' || this._window.cursor === 'botton-left') {
			this.$powerUi.addCss(viewId, 'window-left-botton');
		} else if (this._window.cursor === 'top' || this._window.cursor === 'botton') {
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
			// botton left corner
			this._window.cursor = 'botton-left';
		} else if (x >= width - 15 && y <= 15) {
			// top right corner
			this._window.cursor = 'top-right';
		} else if (x >= width - 15 && y >= height - 15) {
			// botton left corner
			this._window.cursor = 'botton-right';
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
			// botton
			this._window.cursor = 'botton';
		}
	}

	onMouseOutBorder() {
		if (!this._mouseIsDown) {
			this.removeAllCursorClasses();
		}
	}

	onMouseDownBorder(e) {
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget) {
			return;
		}
		e.preventDefault();
		console.log('mouse down', e);
		// Re-order the windows z-index
		this.windowsOrder(true);
		this._mouseIsDown = true;
		this.allowResize = true;
		this._initialX = e.clientX;
		this._initialLeft = this._left;
		this._initialOffsetWidth = this._window.offsetWidth + this._window.offsetLeft;
	}

	changeWindowSize(e) {
		e.preventDefault();
		const rect = this._window.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const minWidth = 130;
		const minHeight = 130;


		if (this.allowResize) {
			if (this._window.cursor === 'right') {
				this.resizeRightBorder(x);
			} else if (this._window.cursor === 'left') {
				this.resizeLeftBorder(x);
			}

			if (this._width < minWidth) {
				this._width = minWidth;
			}
			if (this._height < minHeight) {
				this._height = minHeight;
			}

			this._window.style.width =  this._width + 'px';
			this._window.style.left = this._left + 'px';
			// console.log('resize', this._window.style.width);

			// Add the classes to create a css "midia query" for the window
			this.replaceWindowSizeQuery();
			this.replaceMenuBreakQuery();
		}
	}

	resizeRightBorder(x) {
		// This avoid cursor inside the window (if it is over the scroll the cursor changes to pointer)
		const adjust = 10;
		this._width = this._initialOffsetWidth + (x - this._initialX) - adjust;
	}

	resizeLeftBorder(x) {
		// This avoid cursor inside the window (if it is over the scroll the cursor changes to pointer)
		const adjust = 10;
		const diff = (x - this._initialX);
		this._left = this._initialLeft + this._left + diff;
		this._width = this._width - (this._initialLeft + diff);
		console.log(this._left, diff);
	}

	onMouseUp() {
		this.allowResize = false;
		window.onmousemove = null;
		window.onmouseup = null;
		this._mouseIsDown = false;
		this.removeAllCursorClasses();
		if (this.onResize) {
			this.onResize();
		}
	}

	removeAllCursorClasses() {
		const viewId = this.$root ? 'root-view' : this._viewId;
		this.$powerUi.removeCss(viewId, 'window-left-top');
		this.$powerUi.removeCss(viewId, 'window-left-botton');
		this.$powerUi.removeCss(viewId, 'window-width');
		this.$powerUi.removeCss(viewId, 'window-height');
	}

	template({$title}) {
		// This allow the user define a this.$title on controller constructor or compile, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-window${this.$powerUi.touchdevice ? ' pw-touchdevice': ''}">
					<div class="pw-window-resizable">
						${super.template({$title})}
					</div>
				</div>`;
	}

	// resizeElement() {
	// 	// or move it from anywhere inside the container
	// 	this.bodyEl.onmousedown = this.resizeMouseDown.bind(this);
	// }


	// resizeMouseDown() {
	// 	// Re-order the windows z-index
	// 	this.windowsOrder(true);
	// 	// Cancel if user giveup
	// 	document.onmouseup = this.closeDragElement.bind(this);
	// 	// call a function when the cursor moves
	// 	document.onmousemove = this.resizeWindow.bind(this);
	// }

	// resizeWindow() {
	// 	const minWidth = 130;
	// 	const minHeight = 130;
	// 	// set the _window's new size
	// 	this._width = this.bodyEl.offsetWidth;
	// 	const bodyHeight = this.bodyEl.offsetHeight;
	// 	const titleHeight = this.titleBarEl.offsetHeight;
	// 	this._height = bodyHeight + titleHeight;

	// 	if (this._width < minWidth) {
	// 		this._width = minWidth;
	// 	}
	// 	if (this._height < minHeight) {
	// 		this._height = minHeight;
	// 	}

	// 	// Add the classes to create a css "midia query" for the window
	// 	this.replaceWindowSizeQuery();
	// 	this.replaceMenuBreakQuery();

	// 	this._width = `${this._width}px`;
	// 	this._height = `${this._height}px`;

	// 	this.resizableEl.style.width = this._width;
	// 	this.resizableEl.style.height = this._height;
	// 	this.bodyEl.style.width = this._width;
	// 	this.bodyEl.style.height = this.resizableEl.offsetHeight - titleHeight + 'px';
	// 	if (this.onResize) {
	// 		this.onResize();
	// 	}
	// }

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
		document.onmouseup = this.closeDragElement.bind(this);
		// call a function when the cursor moves
		document.onmousemove = this.elementDrag.bind(this);
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
		this._window.style.top = (this._window.offsetTop - this.pos2) + 'px';
		this._window.style.left = (this._window.offsetLeft - this.pos1) + 'px';
		this._top = this._window.offsetTop;
		this._left = this._window.offsetLeft;
	}

	closeDragElement() {
		this._window.classList.add('pw-active');
		// this.resizeWindow();
		this._bodyHeight = window.getComputedStyle(this.bodyEl).height;
		// stop moving when mouse button is released:
		document.onmouseup = null;
		document.onmousemove = null;
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
		// Make it draggable
		this.currentView = view;
		// Make it resizable
		this.iframe = this.currentView.getElementsByTagName('iframe')[0];
		super._onViewLoad(view);
	}

	// resizeWindow() {
	// 	super.resizeWindow();
	// 	this.iframe.style.width = parseInt(this._width.replace('px', '')) -10 + 'px';
	// 	this.iframe.style.height = parseInt(this._height.replace('px', '')) -53 + 'px';
	// }

	template({$title, $url}) {
		// This allow the user define a this.$title on controller constructor or compile, otherwise use the route title
		this.$title = this.$title || $title;
		const id = `iframe_${this.$powerUi._Unique.next()}`;
		return `<div class="pw-window${this.$powerUi.touchdevice ? ' pw-touchdevice': ''}">
					<div class="pw-window-resizable">
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
					</div>
				</div>`;
	}

	// Override PowerWidget $buildTemplate
	$buildTemplate({template, title}) {
		return this.template({$title: title || null, $url: template});
	}
}

export { PowerWindow, PowerWindowIframe };
