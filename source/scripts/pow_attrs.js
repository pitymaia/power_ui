// Replace a value form an attribute on mouseover some element and undo on mouseout
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


// Replace a value form an attribute on mouseover some MAIN element and undo on mouseout
class _pwMainBasicHover extends _pwBasicHover {
    constructor(element, target, pwAttrName) {
        super(element, target, pwAttrName);
    }

    // Atach the listner/Event to que main element
    addEventListener(event, callback, useCapture) {
        this.$pwMain.element.addEventListener(event, callback, useCapture);
    }
}


// Add a list of CSS classes selectors on mouseover some element and remove it on mouseout
class _pwBasicCssHover extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
    }

    init() {
        if (!this.$_pwHoverValues) {
            this.$_pwHoverValues = this.element.getAttribute(this.$_pwAttrName).split(' ') || [];
        }
        this.subscribe({event: 'mouseover', fn: this.mouseover});
        this.subscribe({event: 'mouseout', fn: this.mouseout});
    }

    mouseover() {
        if (!this._$pwActive && !this.$shared._priorityActive) {
            // Add all CSS selector on list
            for (const css of this.$_pwHoverValues) {
                this.element.classList.add(css);
            }
            this._$pwActive = true;
            // This flag allows hover attrs have priority over attrs like the main attrs
            this.$shared._priorityActive = true;
        }
    }

    mouseout() {
        if (this._$pwActive) {
            // Remove the added classes
            for (const css of this.$_pwHoverValues) {
                this.element.classList.remove(css);
            }
            this._$pwActive = false;
            this.$shared._priorityActive = false;
        }
    }
}

// Add to some element a list of CSS classes selectors on mouseover some MAIN element and remove it on mouseout
class _pwMainBasicCssHover extends _pwBasicCssHover {
    constructor(element, target, pwAttrName) {
        super(element, target, pwAttrName);
    }

    // Atach the listner/Event to que main element
    addEventListener(event, callback, useCapture) {
        this.$pwMain.element.addEventListener(event, callback, useCapture);
    }
}


class PowMainCssHover extends _pwMainBasicCssHover {
    constructor(element) {
        super(element);
        this.$_pwAttrName = 'data-pow-main-css-hover';
    }

    mouseover() {
        if (!this._$pwActive && !this.$shared._priorityActive) {
            // Add all CSS selector on list
            for (const css of this.$_pwHoverValues) {
                this.element.classList.add(css);
            }
            this._$pwActive = true;
            this.$shared._priorityActive = true;
        }
    }

    mouseout() {
        if (this._$pwActive) {
            this._$pwActive = false;
            this.$shared._priorityActive = false;
            // Remove the added classes
            for (const css of this.$_pwHoverValues) {
                this.element.classList.remove(css);
            }
        }
    }
}


class PowCssHover extends _pwBasicCssHover {
    constructor(element) {
        super(element);
        this.$_pwAttrName = 'data-pow-css-hover';
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


class PowCssHoverRemove extends PowCssHover {
    constructor(element) {
        super(element);
        this.$_pwAttrName = 'data-pow-css-hover-remove';
    }

    mouseover() {
        if (!this._$pwActive) {
            for (const css of this.$_pwHoverValues) {
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
    }

    mouseover() {
        if (!this._$pwActive && !this.$shared._priorityActive) {
            for (const css of this.$_pwHoverValues) {
                this.element.classList.remove(css);
            }
            this._$pwActive = true;
        }
    }
}
