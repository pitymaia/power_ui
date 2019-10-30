// Create DOM elements with all ineerHTML for each "for in" or "for of"
class PowFor extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);
		this._$pwActive = false;
		this._pwEvaluateValue = '';
	}

	// element attr allow to recursivelly call it with another element
	compile(element) {
		if (!this.element.dataset.powFor) {
			return;
		}
		const scope = {};
		const parts = decodeURIComponent(this.element.dataset.powFor).split(' ');
		const item = `\\b(${parts[0]})\\b`;
		const operation = parts[1];
		// Remove parts[0]
		parts.shift();
		// Remove parts[1]
		parts.shift();
		// Recreate the final string to evaluate with the remaining parts
		let obj = parts.join(' ');
		if (operation === 'in') {
			// Verify if user type a dictionary direct on the template
			const objRegex = '{[^]*?}';
			if (obj.match(objRegex)) {
				obj = "this._pwEvaluateValue = " + obj;
			}
		}

		const safeEval = new SafeEval({$powerUi: this.$powerUi});
		obj = safeEval.getObject(obj);

		if (operation === 'of') {
			this.forOf(scope, item, obj);
		} else {
			this.forIn(scope, item, obj);
		}
	}

	forOf(scope, selector, obj) {
		let newHtml = '';
		let pwIndex = 0;
		const regexPwIndex = new RegExp('pwIndex', 'gm');
		for (const item of obj || []) {
			const scope = _Unique.scopeID();
			const regex = new RegExp(selector, 'gm');
			// Replace any pwIndex
			let currentHtml = this.element.innerHTML.replace(regexPwIndex, pwIndex);
			pwIndex = pwIndex + 1;
			// Replace any value
			this.$powerUi._tempScope[scope] = item;
			newHtml = newHtml + currentHtml.replace(regex, encodeURIComponent(`_tempScope['${scope}']`));
		}
		this.element.innerHTML = this.$powerUi.interpolation.removeInterpolationSymbolFromIdOfInnerHTML(newHtml);
	}

	forIn(scope, selector, obj) {
		let newHtml = '';
		let pwIndex = 0;
		const regexPwIndex = new RegExp('pwIndex', 'gm');
		const regexPwKey = new RegExp('pwKey', 'gm');
		for (const pwKey of Object.keys(obj || {})) {
			const scope = _Unique.scopeID();
			const regex = new RegExp(selector, 'gm');
			// Replace any pwKey
			let currentHtml = this.element.innerHTML.replace(regexPwKey, `'${pwKey}'`);
			// Replace any pwIndex
			currentHtml = currentHtml.replace(regexPwIndex, pwIndex);
			pwIndex = pwIndex + 1;
			// Replace any value
			this.$powerUi._tempScope[scope] = obj[pwKey];
			newHtml = newHtml + currentHtml.replace(regex, `_tempScope['${scope}']`);
		}
		this.element.innerHTML = this.$powerUi.interpolation.removeInterpolationSymbolFromIdOfInnerHTML(newHtml);
	}
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-for',
	callback: function(element) {return new PowFor(element);}
});
