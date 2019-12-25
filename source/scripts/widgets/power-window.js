class PowerWindow extends PowerDialogBase {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
		this.isWindow = true;
	}

	_onViewLoad() {
		// Make it draggable
		const currentView = document.getElementById(this._viewId);
		this.element = currentView.getElementsByClassName('pw-window')[0];
		this.dragElement();

		if (this._top && this._left) {
			this.element.style.top = this._top;
			this.element.style.left = this._left;
		}

		// Make it resizable
		this.bodyEl = currentView.getElementsByClassName('pw-body')[0];
		this.resizableEl = currentView.getElementsByClassName('pw-window-resizable')[0];
		this.titleBarEl = currentView.getElementsByClassName('pw-title-bar')[0];
		this.resizeElement();

		if (this._width && this._height) {
			this.bodyEl.style.width = this._width;
			this.bodyEl.style.height = this._bodyHeight;
			this.resizableEl.style.width = this._width;
			this.resizableEl.style.height = this._height;
		}

		super._onViewLoad(currentView);
	}

	template({$title}) {
		// This allow the user define a this.$title on controller constructor or compile, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-window pw-window-container">
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
		// Cancel if user giveup
		document.onmouseup = this.closeDragElement.bind(this);
		// call a function when the cursor moves
		document.onmousemove = this.resizeMove.bind(this);
	}

	resizeMove() {
		// set the element's new size
		this.resizableEl.style.width = window.getComputedStyle(this.bodyEl).width;
		this.resizableEl.style.height = parseInt(window.getComputedStyle(this.bodyEl).height.replace('px', '')) + parseInt(window.getComputedStyle(this.titleBarEl).height.replace('px', '')) + 'px';
		this.bodyEl.style.height = parseInt(window.getComputedStyle(this.resizableEl).height.replace('px', '')) - parseInt(window.getComputedStyle(this.titleBarEl).height.replace('px', '')) + 'px';
		this._width = this.resizableEl.style.width;
		this._height = this.resizableEl.style.height;
	}

	dragElement() {
		this.pos1 = 0;
		this.pos2 = 0;
		this.pos3 = 0;
		this.pos4 = 0;

		const titleBar = document.getElementsByClassName('pw-title-bar')[0];
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
		this.bodyEl.style.height = parseInt(window.getComputedStyle(this.resizableEl).height.replace('px', '')) - parseInt(window.getComputedStyle(this.titleBarEl).height.replace('px', '')) + 'px';
		this._bodyHeight = window.getComputedStyle(this.bodyEl).height;
		// stop moving when mouse button is released:
		document.onmouseup = null;
		document.onmousemove = null;
	}
}
