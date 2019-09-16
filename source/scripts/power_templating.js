class PowerTemplating {
	constructor(config={}, powerUi) {
		this.config = config;
		this.$powerUi = powerUi;
		this.startSymbol = config.interpolateStartSymbol || '{{';
		this.endSymbol = config.interpolateEndSymbol || '}}';
		this.kind = {
			standard: 'stripStandardInterpolation',
			for: 'stripForInterpolation',
		}
	}

	compile(template) {
		this.replaceForInterpolation(template);
		return template;
		return this.replaceStandardInterpolation(template);
	}
	// REGEX {{[^]*?}} INTERPOLETE THIS {{ }}
	standardRegex() {
		const REGEX = `${this.startSymbol}[^]*?${this.endSymbol}`;
		return new RegExp(REGEX, 'gm');
	}
	// REGEX {{for*?for}} INTERPOLETE THIS {{for= for}}
	forInterpolationRegex() {
		const REGEX = `${this.startSymbol}for=[^]*?for${this.endSymbol}`;
		return new RegExp(REGEX, 'gm');
	}

	replaceForInterpolation(template) {
		const match = template.match(this.forInterpolationRegex());
		if (match) {
			for (const entry of match) {
				const value = this.getForInterpolationValue(entry);
				// template = template.replace(entry, value);
			}
		}
		return template;
	}

	getForInterpolationValue(entry, kind) {
		let newEntry = this.stripWhiteChars(entry);
		// newEntry = this.stripStandardInterpolation(newEntry);
		console.log('match', newEntry);
		// return eval(newEntry);
	}

	replaceStandardInterpolation(template) {
		const match = template.match(this.standardRegex());
		if (match) {
			for (const entry of match) {
				const value = this.getStandardInterpolationValue(entry);
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

	stripStandardInterpolation(entry) {
		// remove interpolation startSymbol
		let newEntry = entry.replace(this.startSymbol,'');
		// Remove interpolation endSymbol
		newEntry = newEntry.replace(this.endSymbol,'');
		return newEntry;
	}

	stripForInterpolation(entry) {
		// remove interpolation startSymbol
		let newEntry = entry.replace(this.startSymbol+'for','');
		// Remove interpolation endSymbol
		newEntry = newEntry.replace('for'+this.endSymbol,'');
		return newEntry;
	}

	getStandardInterpolationValue(entry, kind) {
		let newEntry = this.stripWhiteChars(entry);
		newEntry = this.stripStandardInterpolation(newEntry);
		return eval(newEntry);
	}
}
