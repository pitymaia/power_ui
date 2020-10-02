class PowerSplitBar extends _PowerBarsBase {
	constructor(menu, $powerUi) {
		super(menu, $powerUi);
		this.isMenu = true;
		this.borderSize = 5;
	}

	onRemove() {
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
			this.setBorder();
			this.addOnMouseBorderEvents();
		}
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
			} else if (this.x > this.borderSize) {
				this.removeAllCursorClasses();
			}
		}
	}

	removeAllCursorClasses() {
		this.$powerUi.removeCss(this.element.id, 'cursor-width');
		this.$powerUi.removeCss(this.element.id, 'cursor-height');
	}

	addOnMouseBorderEvents() {
		this.element.onmousemove = this.onMouseMoveBorder.bind(this);
		this.element.onmouseout = this.onMouseOutBorder.bind(this);
		this.element.onmousedown = this.onMouseDownBorder.bind(this);
		this.element.ondblclick = this.onDoubleClickBorder.bind(this);
	}

	onDoubleClickBorder(e) {
		e.preventDefault();

		if (this.isOverRightBorder() || this.isOverLeftBorder() || this.isOverBottomBorder()) {
			this.element.style.width = null;
			this.element.style.height = null;
			this.onMouseUp(e);
		}
	}

	onMouseOutBorder(e) {
		this.removeAllCursorClasses();
	}

	onMouseMoveBorder(e) {
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget || this.$powerUi._mouseIsDown || this.$powerUi._dragging || window.innerWidth < 768) {
			return;
		}

		window.onmouseup = this.onMouseUp.bind(this);
		window.onmousemove = this.changeMenuSize.bind(this);

		e.preventDefault();
		this.cursorPositionOnMenuBound(e);
	}

	onMouseDownBorder(e) {
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget) {
			return;
		}
		e.preventDefault();
		const manager = this.$powerUi.componentsManager;
		this.allowResize = true;
		this._initialX = e.clientX;
		this._initialY = e.clientY;
		this._initialLeft = this.element.offsetLeft;
		this._initialTop = this.element.offsetTop;
		this._initialOffsetWidth = this.element.offsetWidth;
		this._initialOffsetHeight = this.element.offsetHeight;
		this._initialRightTotalWidthDiff = manager.rightTotalWidth - this._initialOffsetWidth;

		if (this.resizeRight && this.isOverRightBorder()) {
			this.resizingRight = true;
		}

		if (this.resizeLeft && this.isOverLeftBorder()) {
			this.resizingLeft = true;
		}

		if (this.resizeBottom && this.isOverBottomBorder()) {
			this.resizingBottom = true;
		}
	}

	onMouseUp(e) {
		this.resizingRight = false;
		this.resizingLeft = false;
		this.resizingBottom = false;
		this.allowResize = false;
		window.onmousemove = null;
		window.onmouseup = null;
		this.$powerUi._mouseIsDown = false;
		this.removeAllCursorClasses();
		this.$powerUi.componentsManager.runObserver();
	}

	changeMenuSize(e) {
		if (this.allowResize === false) {
			return;
		}
		const rect = this.element.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		if (this.resizingRight) {
			this.resizeRightBorder(x);
		} else if (this.resizingLeft) {
			this.resizeLeftBorder(x);
		} else if (this.resizingBottom) {
			this.resizeBottomBorder(y);
		}
	}

	isOverRightBorder() {
		return (this.y > 0 && this.y <= this.height) && (this.x >= this.width - this.borderSize) && (this.x < this.width - this.borderSize) === false;
	}

	resizeRightBorder(x) {
		const manager = this.$powerUi.componentsManager;
		let width = this._initialOffsetWidth + this._initialLeft + (x - this._initialX) - 10;
		if (width + this.element.offsetLeft > window.innerWidth - manager.rightTotalWidth - 50) {
			width = window.innerWidth - this.element.offsetLeft - manager.rightTotalWidth - 50;
		}
		this.element.style.width = width + 'px';
	}

	isOverLeftBorder() {
		return (this.y > 0 && this.y <= this.height - this.borderSize) && (this.x <= this.borderSize) === true;
	}

	resizeLeftBorder(x) {
		const manager = this.$powerUi.componentsManager;
		let width = this.element.offsetWidth - x;
		if (manager.leftTotalWidth + 50 > window.innerWidth - width - this._initialRightTotalWidthDiff) {
			width = window.innerWidth - this._initialRightTotalWidthDiff - manager.leftTotalWidth - 60;
		}
		this.element.style.width = width + 'px';
	}

	isOverBottomBorder() {
		return this.y >= this.height - this.borderSize && (this.x > 0 && this.x <= this.width);
	}

	resizeBottomBorder(y) {
		this.element.style.height = this._initialOffsetHeight + this._initialTop + (y - this._initialY) - 10 + 'px';
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
