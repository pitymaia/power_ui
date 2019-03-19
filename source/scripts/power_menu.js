class PowerMenu extends PowerTarget {
    constructor(menu, $powerUi) {
        super(menu);
        this.$powerUi = $powerUi;
        this._$pwActive = false;
        this.element = menu;
        this.id = this.element.getAttribute('id');
        this.powerTarget = true;
        this.firstLevelPowerActions = [];
        this.allChildPowerActions = [];
        this.firstLevelPowerDropdowns = [];
        // The position the dropdown will try to appear by default
        this.defaultPosition = this.element.getAttribute('data-power-position');
        // If user does not define a default position, see if is horizontal or vertical menu and set a defeult value
        if (!this.defaultPosition) {
            if (this.element.classList.contains('power-horizontal')) {
                this.defaultPosition = 'bottom-right';
            } else {
                this.defaultPosition = 'right-bottom';
            }
        }
    }

    init() {
        // Add elements to menu and the menu to the elements
        for (const config of PowerUi._powerCssConfig.filter(x => !x.isMain)) {
            const className = config.name;
            // power-brand, power-item, power-dropdown, etc...
            for (const element of this.element.getElementsByClassName(className)) {
                let keyName = className.split('-')[1];
                // Find the apropriate key plural (statuses)
                keyName = (keyName === 'status') ? `${keyName}es` : `${keyName}s`;
                if (!this[keyName]) {
                    this[keyName] = {};
                }
                // find the camelCase name of the className
                const camelCaseName = powerClassAsCamelCase(className);
                const powerElement = this.$powerUi.powerTree.powerCss[camelCaseName][element.id];
                this[keyName][element.id] = powerElement;
                // Add the menu on the powerElement
                powerElement.$powerMenu = this;
                if (camelCaseName === 'powerDropdown') {
                    if (powerElement.isRootElement) {
                        this.firstLevelPowerDropdowns.push(powerElement);
                        defineFirstLevelDropdownsPosition(this, powerElement);
                    } else {
                        defineChildDropdownsPosition(this, powerElement);
                    }
                }
            }
        }

        // Menu subscribe to any action to allow "windows like" behaviour on dropdowns
        // When click the first menu item on Windows and Linux, the other dropdowns opens on hover
        setAllChildElementsAndFirstLevelChildElements('power-action', 'powerAction', this.firstLevelPowerActions, this.allChildPowerActions, this);

        for (const action of this.firstLevelPowerActions) {
            // Only atach the windows like behaviour if not a touchdevice
            if (!this.$powerUi.touchdevice) {
                action.subscribe({event: 'click', fn: this.hoverModeOn, menu: this});
                action.subscribe({event: 'toggle', fn: this.maySetHoverModeOff, menu: this});
            }
        }
    }

    hoverModeOn(ctx, event, params) {
        for (const action of params.menu.firstLevelPowerActions) {
            action.subscribe({event: 'mouseenter', fn: params.menu.onMouseEnterAction, action: action, menu: params.menu});
        }
    }

    onMouseEnterAction(ctx, event, params) {
        params.menu.resetAnyDropdownTmpInfo();
        // Only call toggle if is not active
        if (!params.action._$pwActive) {
            params.action.toggle();
        }

        // Close any child possible active dropdown
        for (const action of params.menu.allChildPowerActions) {
            if (action._$pwActive) {
                action.toggle();
            }
        }
        // Close any first level possible active dropdown if not the current dropdown
        for (const action of params.menu.firstLevelPowerActions) {
            if (action._$pwActive && (action.id !== params.action.id)) {
                action.toggle();
            }
        }
    }

    maySetHoverModeOff(ctx, event, params) {
        setTimeout(function() {
            let someDropdownIsOpen = false;
            // See if there is any firstLevelPowerAction active
            for (const action of params.menu.firstLevelPowerActions) {
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
        for (const action of params.menu.firstLevelPowerActions) {
            action.unsubscribe({event: 'mouseenter', fn: params.menu.onMouseEnterAction, action: action, menu: params.menu});
        }
    }
    resetAnyDropdownTmpInfo() {
        this.$powerUi.tmp.dropdown._mouseIsMovingTo = false;
        this.$powerUi.tmp.dropdown._possibleNewTarget = false;
        clearTimeout(this.$powerUi.tmp.dropdown.timeout);
        document.removeEventListener('mousemove', this.$powerUi.tmp.dropdown._resetMouseTimeout, true);
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
