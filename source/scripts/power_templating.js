class PowerTemplating {
	constructor(config={}, powerUi) {
		this.config = config;
		this.$powerUi = powerUi;
		this.startSymbol = config.interpolateStartSymbol || '{{';
		this.endSymbol = config.interpolateEndSymbol || '}}';
	}

	compile(template) {
		return this.replaceInterpolation(template);
	}
	// REGEX {{[^]*?}} INTERPOLETE THIS {{ }}
	standardRegex() {
		const REGEX = `${this.startSymbol}[^]*?${this.endSymbol}`;
		return new RegExp(REGEX, 'gm');
	}

	replaceInterpolation(template) {
		const match = template.match(this.standardRegex());
		if (match) {
			for (const entry of match) {
				const value = this.getInterpolationValue(entry);
				template = template.replace(entry, value);
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

	// TODO: This is not really safe, just good to use during ALPHA phase of development
	// remove functions, arrow functions, document.*() and window.*(), script and more
	sanitizeEntry(entry) {
		const REGEXLIST = [
			/function[^]*?\)/gm,
			/function/gm,
			/=>[^]*?/gm,
			/=>/gm,
			/localStorage\.[^]*?\)/gm,
			/localStorage/gm,
			/window\.[^]*?\)/gm,
			/window/gm,
			/document\.[^]*?\)/gm,
			/document/gm,
			/write/gm,
			/console\.[^]*?\)/gm,
			/console/gm,
			/alert[^]*?\)/gm,
			/alert/gm,
			/eval[^]*?\)/gm,
			/eval/gm,
			/request/gm,
			/ajaxRequest/gm,
			/loadHtmlView/gm,
			/XMLHttpRequest/gm,
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
