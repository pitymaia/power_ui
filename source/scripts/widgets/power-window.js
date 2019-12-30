class PowerWindow extends PowerDialogBase {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi, noEsc: true});
		this.isWindow = true;
	}

	_onViewLoad(view) {
		// Make it draggable
		this.currentView = view;
		this.element = this.currentView.getElementsByClassName('pw-window')[0];
		this.dragElement();

		if (this._top && this._left) {
			this.element.style.top = this._top;
			this.element.style.left = this._left;
		}

		// Make it resizable
		this.bodyEl = this.currentView.getElementsByClassName('pw-body')[0];
		this.resizableEl = this.currentView.getElementsByClassName('pw-window-resizable')[0];
		this.titleBarEl = this.currentView.getElementsByClassName('pw-title-bar')[0];
		this.resizeElement();

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

		this.resizeWindow();

		this.windowsOrder();

		super._onViewLoad(this.currentView);
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

	resizeElement() {
		// or move it from anywhere inside the container
		this.bodyEl.onmousedown = this.resizeMouseDown.bind(this);
	}


	resizeMouseDown() {
		// Re-order the windows z-index
		this.windowsOrder();
		// Cancel if user giveup
		document.onmouseup = this.closeDragElement.bind(this);
		// call a function when the cursor moves
		document.onmousemove = this.resizeWindow.bind(this);
	}

	resizeWindow() {
		const minWidth = 130;
		const minHeight = 130;
		// set the element's new size
		this._width = this.bodyEl.offsetWidth;
		const bodyHeight = this.bodyEl.offsetHeight;
		const titleHeight = this.titleBarEl.offsetHeight;
		this._height = bodyHeight + titleHeight;

		if (this._width < minWidth) {
			this._width = minWidth;
		}
		if (this._height < minHeight) {
			this._height = minHeight;
		}

		this._width = `${this._width}px`;
		this._height = `${this._height}px`;

		this.resizableEl.style.width = this._width;
		this.resizableEl.style.height = this._height;
		this.bodyEl.style.width = this._width;
		this.bodyEl.style.height = this.resizableEl.offsetHeight - titleHeight + 'px';
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
			this.element.onmousedown = this.dragMouseDown.bind(this);
		}
	}

	dragMouseDown(event) {
		event = event || window.event;
		event.preventDefault();
		// Re-order the windows z-index
		this.windowsOrder();
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
		// set the element's new position
		this.element.style.top = (this.element.offsetTop - this.pos2) + 'px';
		this.element.style.left = (this.element.offsetLeft - this.pos1) + 'px';
		this._top = this.element.style.top;
		this._left = this.element.style.left;
	}

	closeDragElement() {
		this.resizeWindow();
		this._bodyHeight = window.getComputedStyle(this.bodyEl).height;
		// stop moving when mouse button is released:
		document.onmouseup = null;
		document.onmousemove = null;
	}

	windowsOrder() {
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
			}
			currentWindow.style.zIndex = zindex + 1;
		}, 10);
	}
}

export { PowerWindow };
