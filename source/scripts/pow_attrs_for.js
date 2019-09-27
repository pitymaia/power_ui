// Replace a value form an attribute when is mouseover some element and undo on mouseout
class PowFor extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
        this._$pwActive = false;
    }

    // element attr allow to recursivelly call it with another element
    compile(element) {
        if (!this.element.dataset.powFor) return;
        const parts = this.element.dataset.powFor.split(' ');
        const obj = eval(this.$powerUi.interpolation.sanitizeEntry(parts[2]));
        const scope = {};
        if (parts[1] === 'of') {
            this.forOf(scope, parts[0], obj);
        } else {
            this.forIn(scope, parts[0], obj);
        }
    }

    forOf(scope, selector, obj) {
        let newHtml = '';
        let pwIndex = 0;
        const regexPwIndex = new RegExp('pwIndex', 'gm');
        for (const item of obj) {
            const scope = _Unique.scopeID();
            const regex = new RegExp(selector, 'gm');
            // Replace any pwIndex
            const currentHtml = this.element.innerHTML.replace(regexPwIndex, pwIndex);
            pwIndex = pwIndex + 1;
            // Replace any value
            _PowerUiBase.tempScope[scope] = item;
            newHtml = newHtml + currentHtml.replace(regex, `_PowerUiBase.tempScope['${scope}']`);
        }
        this.element.innerHTML = newHtml;
    }

    forIn(scope, selector, obj) {
        let newHtml = '';
        let pwIndex = 0;
        const regexPwIndex = new RegExp('pwIndex', 'gm');
        const regexPwKey = new RegExp('pwKey', 'gm');
        for (const pwKey in obj) {
            const scope = _Unique.scopeID();
            const regex = new RegExp(selector, 'gm');
            // Replace any pwKey
            let currentHtml = this.element.innerHTML.replace(regexPwKey, `'${pwKey}'`);
            // Replace any pwIndex
            currentHtml = currentHtml.replace(regexPwIndex, pwIndex);
            pwIndex = pwIndex + 1;
            // Replace any value
            _PowerUiBase.tempScope[scope] = obj[pwKey];
            newHtml = newHtml + currentHtml.replace(regex, `_PowerUiBase.tempScope['${scope}']`);
        }
        this.element.innerHTML = newHtml;
    }
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-for',
    callback: function(element) {return new PowFor(element);}
});
