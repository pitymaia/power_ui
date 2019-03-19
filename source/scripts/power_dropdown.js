class PowerDropdown extends PowerTarget {
    constructor(element) {
        super(element);
        // Hold all the power actions in this dropdown, but not the ones on the internal dropdowns
        this.firstLevelPowerActions = [];
        // Hold all the power actions in the internal dropdowns, but not the ones in this dropdown
        this.allChildPowerActions = [];
        // Hold all the power items in this dropdown, but not the ones on the internal dropdowns
        this.firstLevelPowerItems = [];
        // Hold all the power items in the internal dropdowns, but not the ones in this dropdown
        this.allChildPowerItems = [];
        // Hold all child dropdowns
        this.allChildPowerDropdowns = [];
        // The position the dropdown will try to appear by default
        this.defaultPosition = element.getAttribute('data-power-position') || 'bottom-right';

        // Mark the root of the dropdown tree, first level element
        let stop = false;
        let parentElement = element.parentElement;
        while (!stop) {
            if (parentElement.classList.contains('power-dropdown')) {
                this.isRootElement = false;
                return;
            } else if (parentElement.classList.contains('power-menu')) {
                this.isRootElement = true;
                this.isMenuElement = true;
                stop = true;
            } else {
                // Don't let go to parentElement if already found and have the variable 'stop' as true
                // Only select the parentElement if has element but don't found the main class selector
                parentElement = parentElement.parentElement;
                if (!parentElement) {
                    // No more parentElements, than this is first level dropdown
                    this.isRootElement = true;
                    // If there is no more element set stop
                    stop = true;
                }
            }
        }
    }

    init() {
        setAllChildElementsAndFirstLevelChildElements(
            'power-action',
            'powerAction',
            this.firstLevelPowerActions,
            this.allChildPowerActions,
            this,
            this.allChildPowerDropdowns,
        );
        setAllChildElementsAndFirstLevelChildElements(
            'power-item',
            'powerItem',
            this.firstLevelPowerItems,
            this.allChildPowerItems,
            this
        );

        // Set the default position only for menus not inside a menu
        // The default position of menus dropdowns are defined by the menu
        if (this.isRootElement && !this.isMenuElement) {
            defineFirstLevelDropdownsPosition(this, this);
            for (const dropdown of this.allChildPowerDropdowns) {
                defineChildDropdownsPosition(this, dropdown);
            }
        }
    }

    // Remove left, margin-left and border width from absolute elements
    offsetComputedStyles(styles) {
        return parseInt(styles.left.split('px')[0] || 0) + parseInt(styles['margin-left'].split('px')[0] || 0)  + parseInt(styles['border-left-width'].split('px')[0] || 0);
    }

    offsetComputedBodyStyles(styles) {
        return parseInt(styles['margin-left'].split('px')[0] || 0) + parseInt(styles['border-width'].split('px')[0] || 0);
    }

    hoverModeOn() {
        // Abort if is moving
        if (this.$powerUi.tmp.dropdown._mouseIsMovingTo) {
            // Using may moving over the same element, only add new target if not the same target
            if (this.$powerUi.tmp.dropdown._mouseIsMovingTo.id !== this.id) {
                this.moveOverPossibleNewTarget(this);
            }
            return;
        }
        for (const action of this.firstLevelPowerActions) {
            action.subscribe({event: 'mouseenter', fn: this.onMouseEnterAction, action: action, dropdown: this});
            action.subscribe({event: 'click', fn: this.onMouseEnterAction, action: action, dropdown: this});
        }
    }

    onMouseEnterAction(ctx, event, params) {
        // Abort if is moving
        if (this.$powerUi.tmp.dropdown._mouseIsMovingTo) {
            // User may moving over the same element, only add new target if not the same target
            if (this.$powerUi.tmp.dropdown._mouseIsMovingTo.id !== params.dropdown.id) {
                params.dropdown.moveOverPossibleNewTarget(this);
            }
            return;
        }
        if (params.action._$pwActive) {
            return;
        }
        params.action.toggle();
        params.dropdown.onMouseEnterItem(ctx, event, params, true);
        for (const item of params.dropdown.firstLevelPowerItems) {
            item.subscribe({event: 'mouseenter', fn: params.dropdown.onMouseEnterItem, action: params.action, dropdown: params.dropdown, item: item});
        }
        params.dropdown.startWatchMouseMove(ctx, event, params);
    }

    onMouseEnterItem(ctx, event, params, onMouseEnterAction) {
        // Abort if is moving
        if (this.$powerUi.tmp.dropdown._mouseIsMovingTo) {
            // User may moving over the same element, only add new target if not the same target
            if (this.$powerUi.tmp.dropdown._mouseIsMovingTo.id !== params.dropdown.id) {
                params.dropdown.moveOverPossibleNewTarget(params.item);
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

        // Close any child possible active dropdown
        for (const action of params.dropdown.allChildPowerActions) {
            if (action._$pwActive) {
                action.toggle();
            }
        }
        // Close any first level possible active dropdown if not the current dropdown
        for (const action of params.dropdown.firstLevelPowerActions) {
            if (action._$pwActive && (action.id !== params.action.id)) {
                action.toggle();
            }
        }

        // Unsubscribe from all the power items mouseenter
        for (const item of params.dropdown.firstLevelPowerItems) {
            item.unsubscribe({event: 'mouseenter', fn: params.dropdown.onMouseEnterItem, action: params.action, dropdown: params.dropdown});
        }

    }

    hoverModeOff() {
        this.stopWatchMouseMove();
        for (const action of this.firstLevelPowerActions) {
            action.unsubscribe({event: 'mouseenter', fn: this.onMouseEnterAction, action: action, dropdown: this});
            action.unsubscribe({event: 'click', fn: this.onMouseEnterAction, action: action, dropdown: this});
        }
    }

    // Bellow functions temporary abort the hover mode to give time to users move to the opened dropdown
    moveOverPossibleNewTarget(item) {
        this.$powerUi.tmp.dropdown._possibleNewTarget = item;
    }
    onmousestop() {
        // Only stopWatchMouseMove if the _possibleNewTarget are not already active
        // If it is already active then wait user to mover over it
        if (this.$powerUi.tmp.dropdown._possibleNewTarget && !this.$powerUi.tmp.dropdown._possibleNewTarget._$pwActive) {
            const item = this.$powerUi.tmp.dropdown._possibleNewTarget;
            setTimeout(function () {
                item.broadcast('mouseenter');
            }, 10);
            this.stopWatchMouseMove();
        } else {
            this.$powerUi.tmp.dropdown._resetMouseTimeout();
        }
    }
    // Called when mouse move
    resetMouseTimeout() {
        clearTimeout(this.$powerUi.tmp.dropdown.timeout);
        this.$powerUi.tmp.dropdown.timeout = setTimeout(this.$powerUi.tmp.dropdown._onmousestop, 120);
    }
    startWatchMouseMove(ctx, event, params) {
        if (this.$powerUi.tmp.dropdown._mouseIsMovingTo) {
            return;
        }
        params.action.targetObj.subscribe({event: 'mouseenter', fn: this.stopWatchMouseMove, action: params.action, dropdown: params.dropdown});
        this.$powerUi.tmp.dropdown._mouseIsMovingTo = params.action.targetObj;
        this.$powerUi.tmp.dropdown._onmousestop = this.onmousestop.bind(this);
        this.$powerUi.tmp.dropdown._resetMouseTimeout = this.resetMouseTimeout.bind(this);
        this.$powerUi.tmp.dropdown.timeout = setTimeout(this.$powerUi.tmp.dropdown._onmousestop, 300);
        document.addEventListener('mousemove', this.$powerUi.tmp.dropdown._resetMouseTimeout, true);
    }
    stopWatchMouseMove() {
        this.$powerUi.tmp.dropdown._mouseIsMovingTo = false;
        this.$powerUi.tmp.dropdown._possibleNewTarget = false;
        clearTimeout(this.$powerUi.tmp.dropdown.timeout);
        document.removeEventListener('mousemove', this.$powerUi.tmp.dropdown._resetMouseTimeout, true);
        this.unsubscribe({event: 'mouseenter', fn: this.stopWatchMouseMove});
    }


    // Get the dropdown left positon
    getLeftPosition(powerAction) {
        const bodyRect = document.documentElement.getBoundingClientRect();
        const elemRect = powerAction.element.getBoundingClientRect();
        let offset = elemRect.left - bodyRect.left;
        offset  = offset + this.offsetComputedBodyStyles(getComputedStyle(document.documentElement));

        // Select all parent nodes to find the ones positioned as "absolute"
        let curentNode = powerAction.element.parentNode;
        const allParents = [];
        while (curentNode && curentNode.tagName !== 'BODY') {
            allParents.push(curentNode);
            curentNode = curentNode.parentNode;
        }

        // Offset all parent "absolute" nodes
        for (const parent of allParents) {
            const parentStyles = getComputedStyle(parent);
            if (parentStyles.position === 'absolute') {
                offset  = offset - this.offsetComputedStyles(parentStyles);
            }
        }

        return Math.round(offset);
    }

    setPositionRightBottom() {
        this.element.style.left = this.getLeftPosition(this.powerAction) + this.powerAction.element.offsetWidth - 1 + 'px';
        this.element.style.top = this.powerAction.element.offsetTop + 'px';
    }
    setPositionBottomRight() {
        this.element.style.left = this.getLeftPosition(this.powerAction) + 'px';
    }
    setPositionLeftBottom() {
        this.element.style.left = this.getLeftPosition(this.powerAction) - this.element.offsetWidth + 1 + 'px';
        this.element.style.top = this.powerAction.element.offsetTop + 'px';
    }
    setPositionBottomLeft() {
        const dropdownActionWidthDiff = this.powerAction.element.offsetWidth - this.element.offsetWidth;
        this.element.style.left = this.getLeftPosition(this.powerAction) + dropdownActionWidthDiff + 'px';
    }
    setPositionRightTop() {
        this.element.style.left = this.getLeftPosition(this.powerAction) + this.powerAction.element.offsetWidth - 1 + 'px';
        this.element.style.top = this.powerAction.element.offsetTop - (this.element.offsetHeight - this.powerAction.element.offsetHeight)+ 'px';
    }
    setPositionTopRigth() {
        this.element.style.left = this.getLeftPosition(this.powerAction) + 'px';
        this.element.style.top = this.powerAction.element.offsetTop - this.element.offsetHeight + 'px';
    }
    setPositionLeftTop() {
        this.element.style.left = this.getLeftPosition(this.powerAction) - this.element.offsetWidth + 1 + 'px';
        this.element.style.top = this.powerAction.element.offsetTop - (this.element.offsetHeight - this.powerAction.element.offsetHeight)+ 'px';
    }
    setPositionTopLeft() {
        const dropdownActionWidthDiff = this.powerAction.element.offsetWidth - this.element.offsetWidth;
        this.element.style.left = this.getLeftPosition(this.powerAction) + dropdownActionWidthDiff + 'px';
        this.element.style.top = this.powerAction.element.offsetTop - this.element.offsetHeight + 'px';
    }

    ifPositionOutOfScreenChangeDirection() {
        const documentRect = document.documentElement.getBoundingClientRect();
        const elementRect = this.element.getBoundingClientRect();

        const pos = {
            topDown: this.defaultPosition.includes('bottom') ? 'bottom' : 'top',
            leftRight: this.defaultPosition.includes('right') ? 'right' : 'left',
        };
        const changes = {topDown: 0, leftRight: 0};

        // Correct position if right is not allowed anymore
        // Change position if right element is bigger than right document
        if (elementRect.right > documentRect.right) {
            pos.leftRight = 'left';
            changes.leftRight++;
        } else if (elementRect.left < documentRect.left) {
        // Correct position if left is not allowed anymore
        // Change position if left element is bigger than left document
            pos.leftRight = 'right';
            changes.leftRight++;
        }

        // Bottom may also not allowed anymore
        // Change position if bottom element is bigger than bottom document
        if (elementRect.bottom > document.defaultView.innerHeight) {
            pos.topDown = 'top';
            changes.topDown++;
        } else if (elementRect.top < 0) {
            pos.topDown = 'bottom';
            changes.topDown++;
        }

        if (changes.topDown > 0 || changes.leftRight > 0) {
            if (pos.topDown === 'top') {
                if (pos.leftRight === 'left') {
                    this.setPositionLeftTop();
                } else {
                    this.setPositionRightTop();
                }
            } else {
                if (pos.leftRight === 'left') {
                    this.setPositionLeftBottom();
                } else {
                    this.setPositionRightBottom();
                }
            }

            // Top and left can't have negative values
            // Fix it if needed
            this.setPositionLimits();
        }
    }

    // Top and left can't have negative values
    setPositionLimits() {
        const elementRect = this.element.getBoundingClientRect();
        if (elementRect.left < 0) {
            this.element.style.left = '0px';
        }
        if (elementRect.top < 0) {
            this.element.style.top = '0px';
        }
    }

    resetDropdownPosition() {
        this.element.style.top = null;
        this.element.style.left = null;
    }

    toggle() {
        this.resetDropdownPosition();
        // Hide the element when add to DOM
        // This allow get the dropdown sizes and position before adjust and show
        this.element.classList.add('power-hide');
        const self = this;
        if (!this._$pwActive) {
            setTimeout(function () {
                // The powerDropdown base it's position on the powerAction position
                if (self.defaultPosition === 'bottom-right') {
                    self.setPositionBottomRight();
                } else if (self.defaultPosition === 'right-bottom') {
                    self.setPositionRightBottom();
                } else if (self.defaultPosition === 'bottom-left') {
                    self.setPositionBottomLeft();
                } else if (self.defaultPosition === 'left-bottom') {
                    self.setPositionLeftBottom();
                }  else if (self.defaultPosition === 'top-right') {
                    self.setPositionTopRigth();
                } else if (self.defaultPosition === 'right-top') {
                    self.setPositionRightTop();
                } else if (self.defaultPosition === 'left-top') {
                    self.setPositionLeftTop();
                } else if (self.defaultPosition === 'top-left') {
                    self.setPositionTopLeft();
                } else {
                    self.setPositionRightBottom();
                }

                // Find if the position is out of screen and reposition if needed
                self.ifPositionOutOfScreenChangeDirection();
                // After choose the position show the dropdown
                self.element.classList.remove('power-hide');
            }, 50);
            // Dropdowns only behave like windows if the user is not using touch
            if (!this.$powerUi.touchdevice) {
                this.hoverModeOn();
            }
        } else {
            // Dropdowns only behave like windows if the user is not using touch
            if (!this.$powerUi.touchdevice) {
                this.hoverModeOff();
            }
        }
        // PowerAction implements an optional "click out" system to allow toggles to hide
        this.powerAction.ifClickOut();
        // Broadcast toggle custom event
        this.broadcast('toggle', true);
    }

    // The powerAction call this action method
    action() {
        this.toggle();
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-dropdown'});
