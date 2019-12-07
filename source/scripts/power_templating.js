class PowerInterpolation {
	constructor(config={}, powerUi) {
		this.config = config;
		this.$powerUi = powerUi;
		this.startSymbol = config.interpolateStartSymbol || '{{';
		this.endSymbol = config.interpolateEndSymbol || '}}';
	}

	compile(template, scope) {
		return this.replaceInterpolation(template, scope);
	}
	// Add the {{ }} to pow interpolation values
	getDatasetResult(template) {
		return this.compile(`${this.startSymbol} ${decodeURIComponent(template)} ${this.endSymbol}`);
	}
	// REGEX {{[^]*?}} INTERPOLETE THIS {{ }}
	standardRegex() {
		const REGEX = `${this.startSymbol}[^]*?${this.endSymbol}`;
		return new RegExp(REGEX, 'gm');
	}

	replaceInterpolation(template, scope) {
		template = this.stripWhiteChars(template);
		const templateWithoutComments = template.replace(/<!--[\s\S]*?-->/gm, '');
		const match = templateWithoutComments.match(this.standardRegex());
		if (match) {
			for (const entry of match) {
				const value = this.getInterpolationValue(entry, scope);
				template = template.replace(entry, value);
			}
		}
		return template.trim();
	}

	interpolationToPowText(template, tempTree, scope) {
		const templateWithoutComments = template.replace(/<!--[\s\S]*?-->/gm, '');
		const match = templateWithoutComments.match(this.standardRegex());
		if (match) {
			for (const entry of match) {
				const id = _Unique.domID('span');
				const innerTEXT = this.getInterpolationValue(entry, scope);
				const value = `<span data-pow-text="${encodeURIComponent(this.stripInterpolation(entry).trim())}"
					data-pwhascomp="true" id="${id}">${innerTEXT}</span>`;
				template = template.replace(entry, value);

				// Regiter any new element on tempTree pending to add after interpolation
				tempTree.pending.push(id);
			}
		}
		return template;
	}

	stripWhiteChars(entry) {
		// Replace multiple spaces with a single one
		let newEntry = entry.replace(/ +(?= )/g,'');
		// Remove all other white chars like tabs and newlines
		newEntry = newEntry.replace(/[\t\n\r]/g,'');
		return newEntry;
	}

	stripInterpolation(entry) {
		// remove interpolation startSymbol
		let newEntry = entry.replace(this.startSymbol,'');
		// Remove interpolation endSymbol
		newEntry = newEntry.replace(this.endSymbol,'');
		return newEntry;
	}

	// Arbitrary replace a value with another (so dont look for it on scope)
	replaceWith({entry, oldValue, newValue}) {
		const regexOldValue = new RegExp(oldValue, 'gm');

		const match = entry.match(this.standardRegex());
		if (match) {
			for (const item of match) {
				let newItem = item.replace(regexOldValue, newValue);
				entry = entry.replace(item, newItem);
			}
		}

		entry = this.replaceChildAttrs({
			entry: entry,
			regexOldValue: regexOldValue,
			newValue: newValue
		});

		return entry;
	}

	replaceChildAttrs({entry, regexOldValue, newValue}) {
		const tmp = document.createElement('div');
		tmp.innerHTML = entry;
		for (const child of tmp.children) {
			for (const attr of child.attributes) {
				attr.value = attr.value.replace(regexOldValue, newValue);
			}
			if (child.children.length) {
				child.innerHTML = this.replaceChildAttrs({
					entry: child.innerHTML,
					regexOldValue: regexOldValue,
					newValue: newValue
				});
			}
		}
		return tmp.innerHTML;
	}

	getInterpolationValue(entry, scope) {
		let newEntry = this.stripWhiteChars(entry);
		newEntry = this.stripInterpolation(newEntry);
		return this.safeEvaluate(newEntry, scope);
	}

	removeInterpolationSymbolFromIdOfInnerHTML(innerHTML) {
		// Find id attributes like id="pity_{{$pwIndex}}_f"
		const IdRegex = new RegExp('\\b(id)\\b[^]*?[\'\"][^]*?[\'\"]', 'gm');
		const matchs = innerHTML.match(new RegExp(IdRegex));
		if (matchs) {
			for (const match of matchs) {
				// Strip {{}} (or custom symbol) from ID ATTRIBUTE
				let newIdEntry = match.replace(this.startSymbol, '');
				newIdEntry = newIdEntry.replace(this.endSymbol, '');
				// Replace the ID entry with the striped one
				innerHTML = innerHTML.replace(match, newIdEntry);
			}
		}
		return innerHTML;
	}

	safeEvaluate(entry, scope) {
		let result;
		try {
			result = this.$powerUi.safeEval({text: decodeURIComponent(entry), scope: scope, $powerUi: this.$powerUi});
		} catch(e) {
			result = '';
		}
		if (result === undefined) {
			return '';
		} else {
			return result;
		}
	}

	safeString(content) {
		const tmp = document.createElement('div');
		tmp.textContent = content;
		return tmp.innerHTML;
	};
}
