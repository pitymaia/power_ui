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
		this.addOnMouseBorderEvents();
	}

	cursorPositionOnMenuBound(e) {
		const rect = this.element.getBoundingClientRect();
		this.x = e.clientX - rect.left;
		this.y = e.clientY - rect.top;
		this.width = this.element.offsetWidth;
		this.height = this.element.offsetHeight;

		// right
		if (this.isOverRightBorder()) {
			this.$powerUi.addCss(this.element.id, 'cursor-width');
		} else if (this.x < this.width - 5) {
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
		this.allowResize = true;
		this._initialX = e.clientX;
		this._initialY = e.clientY;
		this._initialLeft = this.element.offsetLeft;
		this._initialTop = this.element.offsetTop;
		this._initialOffsetWidth = this.element.offsetWidth;
		this._initialOffsetHeight = this.element.offsetHeight;

		if (this.isOverRightBorder()) {
			this.resizingRight = true;
		}
	}

	onMouseUp(e) {
		this.resizingRight = false;
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
		}
	}

	isOverRightBorder() {
		return (this.y > 0 && this.y <= this.height) && (this.x >= this.width - this.borderSize) && (this.x < this.width - this.borderSize) === false;
	}

	resizeRightBorder(x) {
		this.element.style.width = this._initialOffsetWidth + this._initialLeft + (x - this._initialX) - 10 + 'px';
	}

	toggle() {
		// PowerAction implements an optional "click out" system to allow toggles to hide
		this.powerAction.ifClickOut();

		// Removed becouse power-toggle already implement a toggle event
		// Broadcast toggle custom event
		// this.powerAction.broadcast('toggle', true);
	}

	// The powerToggle call this action method
	action() {
		this.toggle();
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-split-menu', isMain: true});
