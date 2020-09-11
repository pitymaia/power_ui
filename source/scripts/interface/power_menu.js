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
			this.menuPosition = 'top';
		} else if (this.element.classList.contains('pw-bottom')) {
			this.menuPosition = 'bottom';
		}
	}

	onRemove() {
		this.$powerUi.menus = this.$powerUi.menus.filter(menu=> menu.id !== this.id);
		this.removeMarginFromBody();
		this.setAppContainerHeight();
	}

	browserWindowResize() {
		this.setAppContainerHeight();
	}

	setAppContainerHeight() {
		if (!this.isFixed) {
			return;
		}
		this.appContainer.style.height = window.innerHeight - this.topTotalHeight - this.bottomTotalHeight + 'px';
	}

	init() {
		this.appContainer = document.getElementById('app-container');
		this.$powerUi.menus.push({id: this.id, menu: this});
		if (this.isFixed) {
			const fixedMenus = this.$powerUi.menus.filter(m=> m.menu.isFixed === true);
			this.adjustTop = 0;
			this.adjustBottom = 0;
			this.topTotalHeight = 0;
			this.bottomTotalHeight = 0;
			for (const menu of fixedMenus) {
				if (menu.menu.menuPosition === 'top') {
					// Adjust this menu top if have other menus on top, filter itself from the adjustTop
					if (menu.menu.id !== this.id && this.menuPosition === 'top') {
						this.adjustTop = this.adjustTop + menu.menu.element.offsetHeight;
						this.element.style.top = this.adjustTop + 'px';
					}
					this.topTotalHeight = this.topTotalHeight + menu.menu.element.offsetHeight;
				}
				if (menu.menu.menuPosition === 'bottom') {
					// Adjust this menu top if have other menus on top, filter itself from the adjustBottom
					if (menu.menu.id !== this.id && this.menuPosition === 'bottom') {
						this.adjustBottom = this.adjustBottom + menu.menu.element.offsetHeight;
						// this.element.style.top = this.element.offsetTop - this.adjustBottom + 'px';
						this.element.style.bottom = this.adjustTop + this.adjustBottom + 'px';
					}
					this.bottomTotalHeight = this.bottomTotalHeight + menu.menu.element.offsetHeight;
				}
			}
		}
		this.addMarginToBody();
		this.setAppContainerHeight();
		this.$powerUi.onWindowResize.subscribe(this.browserWindowResize.bind(this));
		// Child powerActions - Hold all the power actions in this dropmenu, but not the children of childrens (the ones on the internal Power dropmenus)
		this.childrenPowerActions = this.getChildrenByPowerCss('powerAction');
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
				action.subscribe({event: 'toggle', fn: this.maySetHoverModeOff, menu: this});
			}
		}
	}

	addMarginToBody() {
		if (this.isFixed) {
			const body = document.body;
			const currentStyleMarginTop = parseInt((body.style['margin-top'] || '0').replace('px', ''));
			// const currentStyleMarginBottom = parseInt((body.style['margin-bottom'] || '0').replace('px', ''));
			if (this.menuPosition === 'top') {
				body.style['margin-top'] = currentStyleMarginTop + this.element.offsetHeight + 'px';
			} else if (this.menuPosition === 'bottom') {
				// body.style['margin-bottom'] = currentStyleMarginBottom + this.element.offsetHeight + 'px';
			}
		}
	}

	removeMarginFromBody() {
		if (this.isFixed) {
			const body = document.body;
			const currentStyleMarginTop = parseInt((body.style['margin-top'] || '0').replace('px', ''));
			// const currentStyleMarginBottom = parseInt((body.style['margin-bottom'] || '0').replace('px', ''));
			if (this.menuPosition === 'top') {
				body.style['margin-top'] = currentStyleMarginTop - this.element.offsetHeight + 'px';
			} else if (this.menuPosition === 'bottom') {
				// body.style['margin-bottom'] = currentStyleMarginBottom - this.element.offsetHeight + 'px';
			}
		}
	}

	hoverModeOn(ctx, event, params) {
		for (const action of params.menu.childrenPowerActions) {
			action.subscribe({event: 'mouseenter', fn: params.menu.onMouseEnterAction, action: action, menu: params.menu});
		}
	}

	onMouseEnterAction(ctx, event, params) {
		params.menu.resetAnyDropdownTmpInfo();
		// Only call toggle if is not active
		if (!params.action._$pwActive) {
			params.action.toggle();
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
			}
		}, 50);
	}

	hoverModeOff(ctx, level, params) {
		for (const action of params.menu.childrenPowerActions) {
			action.unsubscribe({event: 'mouseenter', fn: params.menu.onMouseEnterAction, action: action, menu: params.menu});
		}
	}
	resetAnyDropdownTmpInfo() {
		this.$powerUi.tmp.dropmenu._mouseIsMovingTo = false;
		this.$powerUi.tmp.dropmenu._possibleNewTarget = false;
		clearTimeout(this.$powerUi.tmp.dropmenu.timeout);
		document.removeEventListener('mousemove', this.$powerUi.tmp.dropmenu._resetMouseTimeout, true);
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
