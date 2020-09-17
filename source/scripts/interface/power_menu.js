class PowerMenu extends PowerTarget {
	constructor(menu, $powerUi) {
		super(menu);
		this.isMenu = true;
		this.$powerUi = $powerUi;
		this.order = 0;
		this._$pwActive = false;
		// this.element = menu;
		this.id = this.element.getAttribute('id');
		this.powerTarget = true;
		// The position the dropmenu will try to appear by default
		this.defaultPosition = this.element.getAttribute('data-pw-dropmenu');
		// Menu priority
		this.priority = this.element.getAttribute('data-pw-priority');
		this.priority = this.priority ? parseInt(this.priority) : null;
		// If user does not define a default position, see if is horizontal or vertical menu and set a defeult value
		if (this.element.classList.contains('pw-horizontal')) {
			this.orientation = 'horizontal';
			this.defaultPosition = this.defaultPosition || 'bottom-right';
		} else {
			this.orientation = 'vertical';
			this.defaultPosition = this.defaultPosition || 'right-bottom';
		}
		if (this.element.classList.contains('pw-menu-fixed')) {
			this.isFixed = true;
		} else {
			this.isFixed = false;
		}
		if (this.element.classList.contains('pw-top')) {
			this.barPosition = 'top';
		} else if (this.element.classList.contains('pw-bottom')) {
			this.barPosition = 'bottom';
		} else if (this.element.classList.contains('pw-left')) {
			this.barPosition = 'left';
		} else if (this.element.classList.contains('pw-right')) {
			this.barPosition = 'right';
		}
		if (this.element.classList.contains('pw-ignore')) {
			this.ignore = true;
		}
	}

	onRemove() {
		// Remove this menu bar from componentsManager.bars
		this.$powerUi.componentsManager.bars = this.$powerUi.componentsManager.bars.filter(bar=> bar.id !== this.id);
		if (this.isFixed) {
			this.$powerUi.componentsManager.stopObserve(this.element);
		}

		for (const action of this.childrenPowerActions) {
			// Only atach the windows like behaviour if not a touchdevice
			if (!this.$powerUi.touchdevice) {
				action.unsubscribe({event: 'click', fn: this.hoverModeOn, menu: this});
				action.unsubscribe({event: 'toggle', fn: this.maySetHoverModeOff, action: action, menu: this});
			}
		}
	}

	init() {
		// Add this menu bar to componentsManager.bars
		this.$powerUi.componentsManager.bars.push({id: this.id, bar: this});
		if (this.isFixed) {
			this.$powerUi.componentsManager.observe(this.element);
		}

		// Child powerActions - Hold all the power actions in this menu, but not the children of childrens (the ones on the internal Power dropmenus)
		this.childrenPowerActions = this.getChildrenByPowerCss('powerAction');
		// Child powerItem - Hold all the power items in this menu, but not the ones on the internal Power dropmenus
		this.childrenPowerItems = this.getChildrenByPowerCss('powerItem');
		// Inner powerActions without the childrens - Hold all the power actions in the internal Power dropmenus, but not the childrens directly in this menu
		this.innerPowerActionsWithoutChildren = this.getInnerWithoutChildrenByPowerCss('powerAction');
		// Child powerDropmenus - Hold all the power Dropmenus in this menu, but not the children of childrens (the ones on the internal Power dropmenus)
		this.childrenPowerDropmenus = this.getChildrenByPowerCss('powerDropmenu');
		// Inner powerDropmenus - Hold all the power Dropmenus in this menu, including the childrens directly in this menu
		this.innerPowerDropmenus = this.getInnerByPowerCss('powerDropmenu');

		// Define the position to show all the dropmenus
		// The dropmenus directly on the menu may start as a dropdown or dropup and the children dropmenus may start on left or right
		for (const dropmenu of this.innerPowerDropmenus) {
			if (dropmenu.isRootElement) {
				defineRootDropmenusPosition(this, dropmenu);
			} else {
				defineInnerDropmenusPosition(this, dropmenu);
			}
		}

		// Menu subscribe to any action to allow "windows like" behaviour on Power dropmenus
		// When click the first menu item on Windows and Linux, the other Power dropmenus opens on hover
		for (const action of this.childrenPowerActions) {
			// Only atach the windows like behaviour if not a touchdevice
			if (!this.$powerUi.touchdevice) {
				action.subscribe({event: 'click', fn: this.hoverModeOn, menu: this});
				action.subscribe({event: 'toggle', fn: this.maySetHoverModeOff, action: action, menu: this});
			}
		}
	}

	hoverModeOn(ctx, event, params) {
		// Abort if is moving
		if (params.menu.$powerUi.tmp.menu._mouseIsMovingTo) {
			// User may move over the same element, only add new target if not the same target
			if (params.menu.$powerUi.tmp.menu._mouseIsMovingTo.id !== params.menu.id) {
				params.menu.moveOverPossibleNewTarget(params.action);
			}
			return;
		}
		for (const action of params.menu.childrenPowerActions) {
			action.subscribe({event: 'mouseenter', fn: params.menu.onMouseEnterAction, action: action, menu: params.menu});
			action.subscribe({event: 'click', fn: params.menu.onMouseEnterAction, action: action, menu: params.menu});
		}
	}

	onMouseEnterAction(ctx, event, params) {
		// Abort if is moving
		if (params.menu.$powerUi.tmp.menu._mouseIsMovingTo) {
			// User may moving over the same element, only add new target if not the same target
			if (params.menu.$powerUi.tmp.menu._mouseIsMovingTo.id !== params.action.id) {
				params.menu.moveOverPossibleNewTarget(params.action);
			}
			return;
		}
		if (params.action._$pwActive) {
			return;
		}
		params.action.toggle();
		params.menu.onMouseEnterItem(ctx, event, params, true);
		for (const item of params.menu.childrenPowerItems) {
			item.subscribe({event: 'mouseenter', fn: params.menu.onMouseEnterItem, action: params.action, menu: params.menu, item: item});
		}
		params.menu.startWatchMouseMove(ctx, event, params);
	}

	onMouseEnterItem(ctx, event, params, onMouseEnterAction) {
		// Abort if is moving
		if (this.$powerUi.tmp.menu._mouseIsMovingTo) {
			// User may moving over the same element, only add new target if not the same target
			if (this.$powerUi.tmp.menu._mouseIsMovingTo.id !== params.action.id) {
				params.menu.moveOverPossibleNewTarget(params.action);
			}
			return;
		}
		// This can be called from onMouseEnterAction and in this case we don't want call the toggle
		if (!onMouseEnterAction) {
			// Only call toggle if is active
			if (params.action._$pwActive) {
				params.action.toggle();
			}

		}

		// Close any child possible active dropmenu
		for (const action of params.menu.innerPowerActionsWithoutChildren) {
			if (action._$pwActive) {
				action.toggle();
			}
		}
		// Close any first level possible active dropmenu if not the current dropmenu
		for (const action of params.menu.childrenPowerActions) {
			if (action._$pwActive && (action.id !== params.action.id)) {
				action.toggle();
			}
		}

		// Unsubscribe from all the power items mouseenter
		for (const item of params.menu.childrenPowerItems) {
			item.unsubscribe({event: 'mouseenter', fn: params.menu.onMouseEnterItem, action: params.action, menu: params.menu});
		}

	}

	maySetHoverModeOff(ctx, event, params) {
		setTimeout(function() {
			let someDropdownIsOpen = false;
			// See if there is any childrenPowerActions active
			for (const action of params.menu.childrenPowerActions) {
				if (action._$pwActive) {
					someDropdownIsOpen = true;
				}
			}

			// If there is no active action, set hover mode to off
			if (someDropdownIsOpen === false) {
				params.menu.hoverModeOff(ctx, event, params);
			} else {
				params.menu.startWatchMouseMove(ctx, event, params);
			}
		}, 50);
	}
	// Deactivate hover mode
	hoverModeOff(ctx, event, params) {
		params.menu.stopWatchMouseMove();
		for (const action of params.menu.childrenPowerActions) {
			action.unsubscribe({event: 'mouseenter', fn: params.menu.onMouseEnterAction, action: action, menu: params.menu});
			action.unsubscribe({event: 'click', fn: params.menu.onMouseEnterAction, action: action, menu: params.menu});
		}
	}

	// Bellow functions temporary abort the hover mode to give time to users move to the opened dropmenu
	moveOverPossibleNewTarget(item) {
		this.$powerUi.tmp.menu._possibleNewTarget = item;
	}
	onmousestop() {
		// Only stopWatchMouseMove if the _possibleNewTarget are not already active
		// If it is already active then wait user to mover over it
		if (this.$powerUi.tmp.menu._possibleNewTarget && !this.$powerUi.tmp.menu._possibleNewTarget._$pwActive) {
			const item = this.$powerUi.tmp.menu._possibleNewTarget;
			setTimeout(function () {
				item.broadcast('mouseenter');
			}, 10);
			this.stopWatchMouseMove();
		} else {
			this.$powerUi.tmp.menu._resetMouseTimeout();
		}
	}
	// Called when mouse move
	resetMouseTimeout() {
		clearTimeout(this.$powerUi.tmp.menu.timeout);
		this.$powerUi.tmp.menu.timeout = setTimeout(this.$powerUi.tmp.menu._onmousestop, 120);
	}
	startWatchMouseMove(ctx, event, params) {
		if (this.$powerUi.tmp.menu._mouseIsMovingTo) {
			return;
		}
		params.action.targetObj.subscribe({event: 'mouseenter', fn: this.stopWatchMouseMove, action: params.action, menu: params.menu});
		this.$powerUi.tmp.menu._mouseIsMovingTo = params.action.targetObj;
		this.$powerUi.tmp.menu._onmousestop = this.onmousestop.bind(this);
		this.$powerUi.tmp.menu._resetMouseTimeout = this.resetMouseTimeout.bind(this);
		this.$powerUi.tmp.menu.timeout = setTimeout(this.$powerUi.tmp.menu._onmousestop, 300);
		document.addEventListener('mousemove', this.$powerUi.tmp.menu._resetMouseTimeout, true);
	}
	stopWatchMouseMove() {
		this.$powerUi.tmp.menu._mouseIsMovingTo = false;
		this.$powerUi.tmp.menu._possibleNewTarget = false;
		clearTimeout(this.$powerUi.tmp.menu.timeout);
		document.removeEventListener('mousemove', this.$powerUi.tmp.menu._resetMouseTimeout, true);
		this.unsubscribe({event: 'mouseenter', fn: this.stopWatchMouseMove});
	}

	toggle() {
		// PowerAction implements an optional "click out" system to allow toggles to hide
		this.powerAction.ifClickOut();
		// Broadcast toggle custom event
		this.powerAction.broadcast('toggle', true);
	}

	// The powerToggle call this action method
	action() {
		this.toggle();
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-menu', isMain: true});
