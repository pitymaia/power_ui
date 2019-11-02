class PowerLexer {
	constructor({text, tokensTable}) {
		this.originalText = String(text);
		this.tokensTable = tokensTable || [
			{name: 'blank', values: [' ', '\t', '\n']},
			{name: 'escape', values: ['\\']},
			{name: 'especial', values: ['_', '$']},
			{name: 'quote', values: ['"', '`', "'"]},
			{name: 'separator', values: ['(', ')', '[', ']', '{', '}', '.']},
			{name: 'operator', values: ['+', '-', '*', '/', '%', '^', '|', '=', '<', '>']},
			{name: 'number', values: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']},
			{name: 'letter', values: [
				'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i',
				'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
				's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
				'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
				'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
				'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
			},
			{name: 'ambiguous', values: ['!', '&', '?', ':']},
		];

		this.syntaxHelper = this.emptySyntaxHelper();
		this.scan();
	}

	scan() {
		console.log('originalText', this.originalText);
		const tokens = [];
		for (const char of this.originalText) {
			const token = this.convertToToken(char);
			tokens.push(token);
			const syntax = this.identifySyntaxElements(token);
		}
		console.log('tokens', tokens);
	}

	convertToToken(char) {
		for (const kind of this.tokensTable) {
			if (kind.values.includes(char)) {
				return {name: kind.name, value: char};
			}
		}

		return {name: 'undefined', value: char};
	}

	identifySyntaxElements(token) {
		let found = false;
		if (this.syntaxHelper.discardEmpty && token.name === 'blank') {
			return;
		}
		if (!found && (this.syntaxHelper.candidate === 'string' || this.syntaxHelper.candidate === null)) {
			found = this.caseString(token);
		}
		if (!found && (this.syntaxHelper.candidate === 'variable' || this.syntaxHelper.candidate === null)) {
			found = this.caseVariable(token);
		}
	}

	emptySyntaxHelper() {
		const self = this;
		return {
			discardEmpty: true,
			candidate: null,
			open: null,
			escape: null,
			elementTokens: [],
			nodes: [],
			reset: function () {
				self.syntaxHelper.open = null;
				self.syntaxHelper.discardEmpty = true;
				self.syntaxHelper.candidate === null;
			},
		}
	}

	caseVariable(token) {
		if ((token.name === 'letter' || token.name === 'especial') && !this.syntaxHelper.open && !this.syntaxHelper.candidate) {
			this.syntaxHelper.discardEmpty = false;
			this.syntaxHelper.open = token.value;
			this.syntaxHelper.candidate = 'variable';
			this.syntaxHelper.elementTokens.push(token);
		} else if ((token.name === 'letter' || token.name === 'especial' || token.name === 'number') && this.syntaxHelper.open) {
			this.syntaxHelper.elementTokens.push(token);
		} else if (token.name === 'blank' && this.syntaxHelper.open) {
			let varName = '';
			for (const t of this.syntaxHelper.elementTokens) {
				varName = varName + t.value;
			}
			this.syntaxHelper.nodes.push({syntax: 'variable', tokens: this.syntaxHelper.elementTokens, varName: varName});
			this.syntaxHelper.reset();
			console.log('IS VARIABLE:', this.syntaxHelper.nodes[0].varName, this.syntaxHelper.nodes);
		} else {

		}
	}

	caseString(token) {
		if (token.name === 'quote' && !this.syntaxHelper.open && !this.syntaxHelper.candidate) {
			this.syntaxHelper.discardEmpty = false;
			this.syntaxHelper.open = token.value;
			this.syntaxHelper.candidate = 'string';
			this.syntaxHelper.elementTokens.push(token);
		} else if (token.name === 'quote' && (token.value !== this.syntaxHelper.open || this.syntaxHelper.escape === true)) {
			this.syntaxHelper.elementTokens.push(token);
		} else if (token.name === 'quote' && (token.value === this.syntaxHelper.open && this.syntaxHelper.escape === null)) {
			this.syntaxHelper.elementTokens.push(token);
			let string = '';
			for (const t of this.syntaxHelper.elementTokens) {
				string = string + t.value;
			}
			this.syntaxHelper.nodes.push({syntax: 'string', tokens: this.syntaxHelper.elementTokens, value: string});
			this.syntaxHelper.reset();
			console.log('IS ISTRING:', this.syntaxHelper.nodes[0].value, this.syntaxHelper.nodes);
		} else if (this.syntaxHelper.open) {
			this.syntaxHelper.elementTokens.push(token);
		}
	}
}
