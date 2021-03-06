class PowEvent extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
    }

    compile({view}) {
        // The controller scope of this view
        const ctrlScope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;
        for (const attr of this.element.attributes) {
            if (attr.name.includes('on') && !attr.name.includes('data')) {
                const name = attr.name.slice(2, attr.name.length);
                this.element.setAttribute(`data-pow-${name}`, this.$powerUi.interpolation.encodeHtml(attr.value));
                // attr.value = `document.dispatchEvent(new CustomEvent('pwScope', {detail: {viewId: '${view.id}', elementId: '${this.element.id}', attrName: '${name}'}}))`;
                attr.value = `window._$dispatchPowerEvent(event, this, '${view.id}', '${name}')`;
            }
        }
    }
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-event',
    callback: function(element) {return new PowEvent(element);}
});
