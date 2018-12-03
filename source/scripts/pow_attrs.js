class _pwBasicHover extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
    }

    init() {
        if (!this.$_pwDefaultValue) {
            this.$_pwDefaultValue =  this.element[this.$_target];
        }
        if (!this.$_pwHoverValue) {
            this.$_pwHoverValue = this.element.getAttribute(this.$_pwAttrName) || '';
        }
        this.subscribe({event: 'mouseover', fn: this.mouseover});
        this.subscribe({event: 'mouseout', fn: this.mouseout});
    }

    mouseover() {
        if (!this._$pwActive && !this.$shared._priorityActive) {
            this.element[this.$_target] = this.$_pwHoverValue;
            this._$pwActive = true;
            // This flag allows hover attrs have priority over attrs like the main attrs
            this.$shared._priorityActive = true;
        }
    }

    mouseout() {
        if (this._$pwActive) {
            this.element[this.$_target] = this.$_pwDefaultValue || '';
            this._$pwActive = false;
            this.$shared._priorityActive = false;
        }
    }
}


class _pwMainBasicHover extends _pwBasicHover {
    constructor(element, target, pwAttrName) {
        super(element, target, pwAttrName);
    }

    // Atach the listner/Event to que main element
    addEventListener(event, callback, useCapture) {
        this.$pwMain.element.addEventListener(event, callback, useCapture);
    }
}


class PowMainCssHover extends _pwMainBasicHover {
    constructor(element) {
        super(element);
        this.$_pwAttrName = 'data-pow-main-css-hover';
        this.$_target = 'className';
    }

    mouseover() {
        if (!this._$pwActive && !this.$shared._priorityActive) {
            this.element[this.$_target] = this.$_pwHoverValue;
            this._$pwActive = true;
            this.$shared._priorityActive = true;
        }
    }

    mouseout() {
        if (this._$pwActive) {
            this._$pwActive = false;
            this.$shared._priorityActive = false;
            this.element[this.$_target] = this.$_pwDefaultValue || '';
        }
    }
}


class PowCssHover extends _pwBasicHover {
    constructor(element) {
        super(element);
        this.$_pwAttrName = 'data-pow-css-hover';
        this.$_target = 'className';
    }
}


class PowSrcHover extends _pwBasicHover {
    constructor(element) {
        super(element);
        this.$_pwAttrName = 'data-pow-src-hover';
        this.$_target = 'src';
    }
}


class PowMainSrcHover extends _pwMainBasicHover {
    constructor(element) {
        super(element);
        this.$_pwAttrName = 'data-pow-main-src-hover';
        this.$_target = 'src';
    }
}


class PowCssHoverAdd extends PowCssHover {
    constructor(element) {
        super(element);
        this.$_pwAttrName = 'data-pow-css-hover-add';
        this.$_target = 'className';
    }

    mouseover() {
        if (!this._$pwActive) {
            const cssSelectors = this.$_pwHoverValue.split(' ');
            for (const css of cssSelectors) {
                this.element.classList.add(css);
            }
            this._$pwActive = true;
            this.$shared._priorityActive = true;
        }
    }
}


class PowMainCssHoverAdd extends PowMainCssHover {
    constructor(element) {
        super(element);
        this.$_pwAttrName = 'data-pow-main-css-hover-add';
        this.$_target = 'className';
    }

    mouseover() {
        if (!this._$pwActive && !this.$shared._priorityActive) {
            const cssSelectors = this.$_pwHoverValue.split(' ');
            for (const css of cssSelectors) {
                this.element.classList.add(css);
            }
            this._$pwActive = true;
        }
    }
}


class PowCssHoverRemove extends PowCssHover {
    constructor(element) {
        super(element);
        this.$_pwAttrName = 'data-pow-css-hover-remove';
        this.$_target = 'className';
    }

    mouseover() {
        if (!this._$pwActive) {
            const cssSelectors = this.$_pwHoverValue.split(' ');
            for (const css of cssSelectors) {
                this.element.classList.remove(css);
            }
            this._$pwActive = true;
            this.$shared._priorityActive = true;
        }
    }
}


class PowMainCssHoverRemove extends PowMainCssHover {
    constructor(element) {
        super(element);
        this.$_pwAttrName = 'data-pow-main-css-hover-remove';
        this.$_target = 'className';
    }

    mouseover() {
        if (!this._$pwActive && !this.$shared._priorityActive) {
            const cssSelectors = this.$_pwHoverValue.split(' ');
            for (const css of cssSelectors) {
                this.element.classList.remove(css);
            }
            this._$pwActive = true;
        }
    }
}
