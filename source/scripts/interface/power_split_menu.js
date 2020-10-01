class PowerSplitMenu extends _PowerBarsBase {
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
			this.addOnMouseBorderEvents();
		}
	}

	cursorPositionOnMenuBound(e) {
		const rect = this.element.getBoundingClientRect();
		this.x = e.clientX - rect.left;
		this.y = e.clientY - rect.top;
		this.width = this.element.offsetWidth;
		this.height = this.element.offsetHeight;

		// right
		if (this.resizeRight && this.isOverRightBorder()) {
			this.$powerUi.addCss(this.element.id, 'cursor-width');
		} else if (this.resizeRight && (this.x < this.width - this.borderSize)) {
			this.removeAllCursorClasses();
		} else if (this.resizeLeft && this.isOverLeftBorder()) {
			this.$powerUi.addCss(this.element.id, 'cursor-width');
		} else if (this.resizeLeft && (this.x > this.borderSize)) {
			this.removeAllCursorClasses();
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
	}

	onMouseOutBorder(e) {
		this.removeAllCursorClasses();
	}

	onMouseMoveBorder(e) {
		// Return if click in inner elements, not in the border itself
		if (e.target !== e.currentTarget || this.$powerUi._mouseIsDown || this.$powerUi._dragging) {
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
	}

	onMouseUp(e) {
		this.resizingRight = false;
		this.resizingLeft = false;
		this.allowResize = false;
		window.onmousemove = null;
		window.onmouseup = null;
		this.$powerUi._mouseIsDown = false;
		this.removeAllCursorClasses();
		this.$powerUi.componentsManager.runObserver();
	}

	changeMenuSize(e) {
		const rect = this.element.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		if (this.resizingRight) {
			this.resizeRightBorder(x);
		} else if (this.resizingLeft) {
			this.resizeLeftBorder(x);
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
PowerUi.injectPowerCss({name: 'power-split-menu', isMain: true});
