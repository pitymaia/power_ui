class SyntaxTree {
	constructor() {
		this.discardEmpty = true;
		this.candidate = null;
		this.open = null;
		this.escape = null;
		this.currentTokens = [];
		this.nodes = [];
	}

	resetTempAttrs() {
		this.open = null;
		this.discardEmpty = true;
		this.candidate === null;
	}
}

class PowerLexer {
	constructor({text, tokensTable}) {
		this.originalText = String(text);
		this.syntaxTree = new SyntaxTree();
		this.tokens = [];
	}

	scan() {
		for (const char of this.originalText) {
			const token = this.convertToToken(char);
			this.tokens.push(token);
		}
	}

	convertToToken(char) {
		for (const kind of this.tokensTable) {
			if (kind.values.includes(char)) {
				return {name: kind.name, value: char};
			}
		}

		return {name: 'undefined', value: char};
	}
}

class PowerTemplateLexer extends PowerLexer{
	constructor({text, tokensTable}) {
		super({text, tokensTable});
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
		this.scan();
	}

	scan() {
		console.log('originalText', this.originalText);
		let counter = 0;
		for (const char of this.originalText) {
			const token = this.convertToToken(char);
			this.tokens.push(token);
			this.identifySyntaxElements(token, counter);
			counter = counter + 1;
		}
	}

	identifySyntaxElements(token, counter) {
		let found = false;
		if (this.syntaxTree.discardEmpty && token.name === 'blank') {
			return;
		}
		if (!found && (this.syntaxTree.candidate === 'string' || this.syntaxTree.candidate === null)) {
			found = this.caseString(token);
			// If the string name ends before have a quote
			// Any wrong syntax is cast as string, so the string can end without a final quote
			if (!found && this.syntaxTree.candidate === 'string' && counter === this.originalText.length -1) {
				this.setAsString();
			}
		}
		if (!found && (this.syntaxTree.candidate === 'variable' || this.syntaxTree.candidate === null)) {
			found = this.caseVariable(token);
			// If the variable name ends before have a space or enter
			if (!found && this.syntaxTree.candidate === 'variable' && counter === this.originalText.length -1) {
				this.setAsVar();
			}
		}
		if (!found && (this.syntaxTree.candidate === 'function' || this.syntaxTree.candidate === null)) {
			console.log('maybe is a function', token.value);
			// found = this.caseString(token);
		}
	}

	caseVariable(token) {
		if ((token.name === 'letter' || token.name === 'especial') && !this.syntaxTree.open && !this.syntaxTree.candidate) {
			this.syntaxTree.discardEmpty = false;
			this.syntaxTree.open = token.value;
			this.syntaxTree.candidate = 'variable';
			this.syntaxTree.currentTokens.push(token);
		} else if ((token.name === 'letter' || token.name === 'especial' || token.name === 'number') && this.syntaxTree.open) {
			this.syntaxTree.currentTokens.push(token);
		} else if (token.name === 'blank' && this.syntaxTree.open) {
			this.setAsVar();
			return true;
		// This maybe a dictionary
		} else if (token.name === 'separator' && (token.value === '.' || token.value === '[') && this.syntaxTree.open) {
			this.syntaxTree.candidate = 'dictionary';
		// This maybe a function
		} else if (token.name === 'separator' && (token.value === '(') && this.syntaxTree.open) {
			this.syntaxTree.candidate = 'function';
		// If have any other kind of char set this as a string
		} else {
			this.syntaxTree.currentTokens.push(token);
			this.syntaxTree.candidate = 'string';
		}
	}

	setAsVar() {
		let varName = '';
		for (const t of this.syntaxTree.currentTokens) {
			varName = varName + t.value;
		}
		this.syntaxTree.nodes.push({syntax: 'variable', tokens: this.syntaxTree.currentTokens, varName: varName});
		this.syntaxTree.resetTempAttrs();
		console.log('IS VARIABLE:', this.syntaxTree.nodes[0].varName, this.syntaxTree.nodes);
	}

	caseString(token) {
		if (token.name === 'quote' && !this.syntaxTree.open && !this.syntaxTree.candidate) {
			this.syntaxTree.discardEmpty = false;
			this.syntaxTree.open = token.value;
			this.syntaxTree.candidate = 'string';
			this.syntaxTree.currentTokens.push(token);
		} else if (token.name === 'quote' && (token.value !== this.syntaxTree.open || this.syntaxTree.escape === true)) {
			this.syntaxTree.currentTokens.push(token);
		} else if (token.name === 'quote' && (token.value === this.syntaxTree.open && this.syntaxTree.escape === null)) {
			this.syntaxTree.currentTokens.push(token);
			this.setAsString();
			return true;
		} else if (this.syntaxTree.open) {
			this.syntaxTree.currentTokens.push(token);
		}
	}

	setAsString() {
		let string = '';
		for (const t of this.syntaxTree.currentTokens) {
			string = string + t.value;
		}
		this.syntaxTree.nodes.push({syntax: 'string', tokens: this.syntaxTree.currentTokens, value: string});
		this.syntaxTree.resetTempAttrs();
		console.log('IS ISTRING:', this.syntaxTree.nodes[0].value, this.syntaxTree.nodes);
	}
}
