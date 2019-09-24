// Replace a value form an attribute when is mouseover some element and undo on mouseout
class PowFor extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
    }

    // element attr allow to recursivelly call it with another element
    compile(element) {
        const el = element || this.element;
        if (!el.dataset.powFor) return;
        const parts = el.dataset.powFor.split(' ');
        const obj = eval(this.$powerUi.interpolation.sanitizeEntry(parts[2]));
        const scope = {};
        if (parts[1] === 'of') {
            this.forOf(scope, parts[0], obj, el);
        } else {
            forIn(scope, parts[0], obj, el);
        }
    }

    forOf(scope, selector, obj, el) {
        let newHtml = '';
        for (const item of obj) {
            const scope = _Unique.scopeID();
            var regex = new RegExp(selector, 'gm');
            _PowerUiBase.tempScope[scope] = item;
            newHtml = newHtml + el.innerHTML.replace(regex, `_PowerUiBase.tempScope['${scope}']`);
        }
        el.innerHTML = newHtml;
    }

    forIn(scope, selector, obj) {

    }
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-for',
    callback: function(element) {return new PowFor(element);}
});
