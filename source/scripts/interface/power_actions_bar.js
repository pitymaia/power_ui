class PowerActionsBar extends _PowerBarsBase {
	constructor(bar, $powerUi) {
		super(bar, $powerUi);
		// The position the dropmenu will try to appear by default
		this.defaultPosition = this.element.getAttribute('data-pw-position');
		// If user does not define a default position, see if is horizontal or vertical bar
		if (this.element.classList.contains('pw-horizontal')) {
			this.orientation = 'horizontal';
		} else {
			this.orientation = 'vertical';
		}
	}

	onRemove() {
		super.onRemove();

		for (const action of this.childrenPowerActions) {
			// Only atach the windows like behaviour if not a touchdevice
			if (!this.$powerUi.touchdevice) {
				action.unsubscribe({event: 'click', fn: this.hoverModeOn, bar: this});
				action.unsubscribe({event: 'toggle', fn: this.maySetHoverModeOff, action: action, bar: this});
			}
		}
	}

	init() {
		super.init();
		// Child powerActions - Hold all the power actions in this bar, but not the children of childrens (the ones on the internal Power dropmenus)
		this.childrenPowerActions = this.getChildrenByPowerCss('powerAction');
		// Child powerItem - Hold all the power items in this bar, but not the ones on the internal Power dropmenus
		this.childrenPowerItems = this.getChildrenByPowerCss('powerItem');
		// Inner powerActions without the childrens - Hold all the power actions in the internal Power dropmenus, but not the childrens directly in this bar
		this.innerPowerActionsWithoutChildren = this.getInnerWithoutChildrenByPowerCss('powerAction');
		// Child powerDropmenus - Hold all the power Dropmenus in this bar, but not the children of childrens (the ones on the internal Power dropmenus)
		this.childrenPowerDropmenus = this.getChildrenByPowerCss('powerDropmenu');
		// Inner powerDropmenus - Hold all the power Dropmenus in this bar, including the childrens directly in this bar
		this.innerPowerDropmenus = this.getInnerByPowerCss('powerDropmenu');

		// Define the position to show all the dropmenus
		// The dropmenus directly on the bar may start as a dropdown or dropup and the children dropmenus may start on left or right
		for (const dropmenu of this.innerPowerDropmenus) {
			if (dropmenu.isRootElement) {
				defineRootDropmenusPosition(this, dropmenu);
			} else {
				defineInnerDropmenusPosition(this, dropmenu);
			}
		}

		// Bar subscribe to any action to allow "windows like" behaviour on Power dropmenus
		// When click the first bar item on Windows and Linux, the other Power dropmenus opens on hover
		for (const action of this.childrenPowerActions) {
			// Only atach the windows like behaviour if not a touchdevice
			if (!this.$powerUi.touchdevice) {
				action.subscribe({event: 'click', fn: this.hoverModeOn, bar: this});
				action.subscribe({event: 'toggle', fn: this.maySetHoverModeOff, action: action, bar: this});
			}
		}
	}

	hoverModeOn(ctx, event, params) {
		// Abort if is moving
		if (params.bar.$powerUi.tmp.bar._mouseIsMovingTo) {
			// User may move over the same element, only add new target if not the same target
			if (params.bar.$powerUi.tmp.bar._mouseIsMovingTo.id !== params.bar.id) {
				params.bar.moveOverPossibleNewTarget(params.action);
			}
			return;
		}
		for (const action of params.bar.childrenPowerActions) {
			action.subscribe({event: 'mouseenter', fn: params.bar.onMouseEnterAction, action: action, bar: params.bar});
			action.subscribe({event: 'click', fn: params.bar.onMouseEnterAction, action: action, bar: params.bar});
		}
	}

	onMouseEnterAction(ctx, event, params) {
		// Abort if is moving
		if (params.bar.$powerUi.tmp.bar._mouseIsMovingTo) {
			// User may moving over the same element, only add new target if not the same target
			if (params.bar.$powerUi.tmp.bar._mouseIsMovingTo.id !== params.action.id) {
				params.bar.moveOverPossibleNewTarget(params.action);
			}
			return;
		}
		if (params.action._$pwActive) {
			return;
		}
		params.action.toggle();
		params.bar.onMouseEnterItem(ctx, event, params, true);
		for (const item of params.bar.childrenPowerItems) {
			item.subscribe({event: 'mouseenter', fn: params.bar.onMouseEnterItem, action: params.action, bar: params.bar, item: item});
		}
		params.bar.startWatchMouseMove(ctx, event, params);
	}

	onMouseEnterItem(ctx, event, params, onMouseEnterAction) {
		// Abort if is moving
		if (this.$powerUi.tmp.bar._mouseIsMovingTo) {
			// User may moving over the same element, only add new target if not the same target
			if (this.$powerUi.tmp.bar._mouseIsMovingTo.id !== params.action.id) {
				params.bar.moveOverPossibleNewTarget(params.action);
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
		for (const action of params.bar.innerPowerActionsWithoutChildren) {
			if (action._$pwActive) {
				action.toggle();
			}
		}
		// Close any first level possible active dropmenu if not the current dropmenu
		for (const action of params.bar.childrenPowerActions) {
			if (action._$pwActive && (action.id !== params.action.id)) {
				action.toggle();
			}
		}

		// Unsubscribe from all the power items mouseenter
		for (const item of params.bar.childrenPowerItems) {
			item.unsubscribe({event: 'mouseenter', fn: params.bar.onMouseEnterItem, action: params.action, bar: params.bar});
		}

	}

	maySetHoverModeOff(ctx, event, params) {
		setTimeout(function() {
			let someDropdownIsOpen = false;
			// See if there is any childrenPowerActions active
			for (const action of params.bar.childrenPowerActions) {
				if (action._$pwActive) {
					someDropdownIsOpen = true;
				}
			}

			// If there is no active action, set hover mode to off
			if (someDropdownIsOpen === false) {
				params.bar.hoverModeOff(ctx, event, params);
			} else {
				params.bar.startWatchMouseMove(ctx, event, params);
			}
		}, 50);
	}
	// Deactivate hover mode
	hoverModeOff(ctx, event, params) {
		params.bar.stopWatchMouseMove();
		for (const action of params.bar.childrenPowerActions) {
			action.unsubscribe({event: 'mouseenter', fn: params.bar.onMouseEnterAction, action: action, bar: params.bar});
			action.unsubscribe({event: 'click', fn: params.bar.onMouseEnterAction, action: action, bar: params.bar});
		}
	}

	// Bellow functions temporary abort the hover mode to give time to users move to the opened dropmenu
	moveOverPossibleNewTarget(item) {
		this.$powerUi.tmp.bar._possibleNewTarget = item;
	}
	onmousestop() {
		// Only stopWatchMouseMove if the _possibleNewTarget are not already active
		// If it is already active then wait user to mover over it
		if (this.$powerUi.tmp.bar._possibleNewTarget && !this.$powerUi.tmp.bar._possibleNewTarget._$pwActive) {
			const item = this.$powerUi.tmp.bar._possibleNewTarget;
			setTimeout(function () {
				item.broadcast('mouseenter');
			}, 10);
			this.stopWatchMouseMove();
		} else {
			this.$powerUi.tmp.bar._resetMouseTimeout();
		}
	}
	// Called when mouse move
	resetMouseTimeout() {
		clearTimeout(this.$powerUi.tmp.bar.timeout);
		this.$powerUi.tmp.bar.timeout = setTimeout(this.$powerUi.tmp.bar._onmousestop, 120);
	}
	startWatchMouseMove(ctx, event, params) {
		if (this.$powerUi.tmp.bar._mouseIsMovingTo) {
			return;
		}
		params.action.targetObj.subscribe({event: 'mouseenter', fn: this.stopWatchMouseMove, action: params.action, bar: params.bar});
		this.$powerUi.tmp.bar._mouseIsMovingTo = params.action.targetObj;
		this.$powerUi.tmp.bar._onmousestop = this.onmousestop.bind(this);
		this.$powerUi.tmp.bar._resetMouseTimeout = this.resetMouseTimeout.bind(this);
		this.$powerUi.tmp.bar.timeout = setTimeout(this.$powerUi.tmp.bar._onmousestop, 300);
		document.addEventListener('mousemove', this.$powerUi.tmp.bar._resetMouseTimeout, true);
	}
	stopWatchMouseMove() {
		this.$powerUi.tmp.bar._mouseIsMovingTo = false;
		this.$powerUi.tmp.bar._possibleNewTarget = false;
		clearTimeout(this.$powerUi.tmp.bar.timeout);
		document.removeEventListener('mousemove', this.$powerUi.tmp.bar._resetMouseTimeout, true);
		this.unsubscribe({event: 'mouseenter', fn: this.stopWatchMouseMove});
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
