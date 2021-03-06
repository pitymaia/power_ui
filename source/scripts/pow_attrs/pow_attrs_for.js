// Create DOM elements with all ineerHTML for each "for in" or "for of"
class PowFor extends _PowerBasicElementWithEvents {
	constructor(element) {
		super(element);
		this._$pwActive = false;
		this._pwEvaluateValue = '';
	}

	// element attr allow to recursivelly call it with another element
	compile({view}) {
		if (!this.element.dataset.powFor) {
			return;
		}

		const parts = this.$powerUi.interpolation.decodeHtml(this.element.dataset.powFor).split(' ');
		const item = `\\b(${parts[0]})\\b`;
		const operation = parts[1];
		// Remove parts[0]
		parts.shift();
		// Remove parts[1]
		parts.shift();
		// Recreate the final string to evaluate with the remaining parts
		let obj = parts.join(' ');

		// The scope of the controller of the view of this element
		const ctrlScope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;
		obj = this.$powerUi.safeEval({text: obj, $powerUi: this.$powerUi, scope: ctrlScope});

		if (operation === 'of') {
			this.forOf(item, obj);
		} else {
			this.forIn(item, obj);
		}
	}

	forOf(selector, obj) {
		let newHtml = '';
		let $pwIndex = 0;
		for (const item of obj || []) {
			const scope = _Unique.scopeID();
			// Replace any $pwIndex
			let currentHtml = this.$powerUi.interpolation.replaceWith({
				entry: this.element.innerHTML,
				oldValue: '\\$pwIndex',
				newValue: $pwIndex,
			});
			$pwIndex = $pwIndex + 1;
			// Replace any value
			this.$powerUi._tempScope[scope] = item;
			newHtml = newHtml + this.$powerUi.interpolation.replaceWith({
				entry: currentHtml,
				oldValue: selector,
				newValue: this.$powerUi.interpolation.encodeHtml(`_tempScope['${scope}']`),
			});

		}
		this.element.innerHTML = newHtml;
	}

	forIn(selector, obj) {
		let newHtml = '';
		let $pwIndex = 0;
		for (const $pwKey of Object.keys(obj || {})) {
			const scope = _Unique.scopeID();
			// Replace any $pwKey
			let currentHtml = this.$powerUi.interpolation.replaceWith({
				entry: this.element.innerHTML,
				oldValue: '\\$pwKey',
				newValue: `'${$pwKey}'`,
			});
			// Replace any $pwIndex
			currentHtml = this.$powerUi.interpolation.replaceWith({
				entry: currentHtml,
				oldValue: '\\$pwIndex',
				newValue: $pwIndex,
			});
			$pwIndex = $pwIndex + 1;
			// Replace any value
			this.$powerUi._tempScope[scope] = obj[$pwKey];
			newHtml = newHtml + this.$powerUi.interpolation.replaceWith({
				entry: currentHtml,
				oldValue: selector,
				newValue: this.$powerUi.interpolation.encodeHtml(`_tempScope['${scope}']`),
			});
		}
		this.element.innerHTML = newHtml;
	}
}

// Inject the attr on PowerUi
_PowerUiBase.injectPow({name: 'data-pow-for',
	callback: function(element) {return new PowFor(element);}
});
