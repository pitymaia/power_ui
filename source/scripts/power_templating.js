class PowerInterpolation {
	constructor(config={}, powerUi) {
		this.config = config;
		this.$powerUi = powerUi;
		this.startSymbol = config.interpolateStartSymbol || '{{';
		this.endSymbol = config.interpolateEndSymbol || '}}';
	}

	compile(template) {
		return this.replaceInterpolation(template);
	}
	// Add the {{ }} to pow interpolation values
	getDatasetResult(template) {
		return this.compile(`${this.startSymbol} ${template} ${this.endSymbol}`);
	}
	// REGEX {{[^]*?}} INTERPOLETE THIS {{ }}
	standardRegex() {
		const REGEX = `${this.startSymbol}[^]*?${this.endSymbol}`;
		return new RegExp(REGEX, 'gm');
	}

	replaceInterpolation(template) {
		template = this.stripWhiteChars(template);
		const match = template.match(this.standardRegex());
		if (match) {
			for (const entry of match) {
				const value = this.getInterpolationValue(entry);
				template = template.replace(entry, value);
			}
		}
		return template.trim();
	}

	interpolationToPowText(template, tempTree, powerTree) {
		const match = template.match(this.standardRegex());
		if (match) {
			for (const entry of match) {
				const id = _Unique.domID('span');
				const innerTEXT = this.getInterpolationValue(entry);
				const value = `<span data-pow-text="${this.stripInterpolation(entry).trim()}"
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

	getInterpolationValue(entry) {
		let newEntry = this.stripWhiteChars(entry);
		newEntry = this.stripInterpolation(newEntry);
		return this.safeEvaluate(newEntry);
	}

	removeInterpolationSymbolFromIdOfInnerHTML(innerHTML) {
		// Find id attributes like id="pity_{{pwIndex}}_f"
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

	// TODO: This is not really safe, just good to use during ALPHA and maybe BETA phase of development
	// remove functions, arrow functions, document.*() and window.*(), script and more
	sanitizeEntry(entry, noLimit) {
		if (!noLimit && entry.length > 250) {
			console.log('Sorry, for security reasons the expressions used in the template cannot contain more than 250 characters.', entry);
			return;
		}
		const REGEXLIST = [
			/function[^]*?\)/gm,
			/function/gm,
			/defineProperty/gm,
			/prototype/gm,
			/Object\./gm,
			/=>[^]*?/gm,
			/=>/gm,
			/localStorage\.[^]*?\)/gm,
			/localStorage/gm,
			/window\.[^]*?\)/gm,
			/window/gm,
			/document\.[^]*?\)/gm,
			/document/gm,
			/while/gm,
			/cookie/gm,
			/write/gm,
			/console\.[^]*?\)/gm,
			/console/gm,
			/alert[^]*?\)/gm,
			/alert\(/gm,
			/alert /gm,
			/eval[^]*?\)/gm,
			/eval\(/gm,
			/eval /gm,
			/request/gm,
			/ajaxRequest/gm,
			/loadHtmlView/gm,
			/XMLHttpRequest/gm,
			/setRequestHeader/gm,
			/new[^]*?\)/gm,
			/new /gm,
			/<[^]*?script[^]*?>[^]*?<[^]*?\/[^]*?script[^]*?>/gm,
			/script/gm,
			/var [^]*?\=/gm,
			/var /gm,
			/let [^]*?\=/gm,
			/let /gm,
			/const [^]*?\=/gm,
			/const /gm,
		];

		let newEntry = entry;

		for (const regex of REGEXLIST) {
			const match = newEntry.match(new RegExp(regex));
			if (match && match.length) {
				console.log('The template interpolation removes some danger or not allowed entry: ', newEntry);
				newEntry = '';
			}
		}
		return this.safeString(newEntry);
	}

	safeEvaluate(entry) {
		let func;
		let result;
		try {
			func = new Function("return " + this.sanitizeEntry(entry));
			result = func();
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
