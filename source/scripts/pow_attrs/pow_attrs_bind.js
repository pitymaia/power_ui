// All ohter inputs type (text, range, tel, password, textarea, color, date, etc)
function othersInit(self) {
    const el = self.element;
    el.value = self.currentValue;
    self.subscribe({event: 'change', fn: self.onchange });
}

function othersChange(self) {
    self.currentValue = self.element.value;
}

function checkboxInit(self) {
    const el = self.element;
    if (self.currentValue === true) {
        el.checked = 'checked';
    } else {
        delete el.checked;
    }
    self.subscribe({event: 'change', fn: self.onchange });
}

function checkboxChange(self) {
    self.currentValue = !self.currentValue; // Invert the value
}

function radioInit(self) {
    const el = self.element;
    if (self.currentValue === el.value) {
        el.checked = true;
    } else {
        el.checked = false;
    }
    self.subscribe({event: 'change', fn: self.onchange });
}

function radioChange(self) {
    if (self.element.checked === true){
        self.currentValue = self.element.value;
    }
}

function selectMultipleInit(self) {
    const el = self.element;
    for (const child of el.children) {
        if (self.currentValue.includes(child.value)) {
            child.selected = true;
        } else {
            child.selected = false;
        }
    }
    self.subscribe({event: 'change', fn: self.onchange });
}

function selectOneInit(self) {
    const el = self.element;
    for (const child of el.children) {
        if (self.currentValue === child.value) {
            child.selected = true;
        } else {
            child.selected = false;
        }
    }
    self.subscribe({event: 'change', fn: self.onchange });
}

function selectMultipleChange(self) {
    const el = self.element;
    for (const child of el.children) {
        if (child.selected) {
            // Only add if not already have it
            if (!self.currentValue.includes(child.value)) {
                self.currentValue.push(child.value);
            }
        } else {
            const index = self.currentValue.indexOf(child.value);
            if (index > -1) {
              self.currentValue.splice(index, 1);
            }
        }
    }
}

class PowBind extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
        this.originalHTML = element.innerHTML;

    }

    init() {
        const view = this.$pwView;
        // The scope of the controller of the view of this element
        this.ctrlScope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;

        this.type = this.element.type;
        if (this.type === 'checkbox') {
            checkboxInit(this);
        } else if (this.type === 'radio') {
            radioInit(this);
        } else if (this.type ==='select-one') {
            selectOneInit(this);
        } else if (this.type ==='select-multiple') {
            selectMultipleInit(this);
        } else {
            othersInit(this);
        }
    }

    onchange(event) {
        if (this.type === 'checkbox') {
            checkboxChange(this);
        } else if (this.type === 'radio') {
            radioChange(this);
        } else if (this.type ==='select-multiple') {
            selectMultipleChange(this);
        } else {
            othersChange(this);
        }
    }

    // The current scope value of pow-bind model
    get currentValue() {
        return this.$powerUi.safeEval({text: this.$powerUi.interpolation.decodeHtml(
            this.element.dataset.powBind), $powerUi: this.$powerUi, scope: this.ctrlScope});
    }

    set currentValue(valueToSet) {
        this.$powerUi.setValueOnScope({text: this.$powerUi.interpolation.decodeHtml(this.element.dataset.powBind), $powerUi: this.$powerUi, scope: this.ctrlScope, valueToSet: valueToSet});
    }
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-bind',
    callback: function(element) {return new PowBind(element);}
});
