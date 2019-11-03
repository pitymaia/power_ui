class SyntaxTree {
	constructor() {
		this.nodes = [];
		this.escape = false;
		this.candidate = false;
		this.open = false;
		this.discardEmpty = true;
		this.currentTokens = [];
		this.currentNodeIndex = false;
	}

	resetTempAttrs() {
		this.currentNodeIndex = false;
		this.open = false;
		this.discardEmpty = true;
		this.candidate = false;
		this.currentTokens = [];
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

		console.log('this.syntaxTree', this.syntaxTree);
	}

	identifySyntaxElements(token, counter) {
		// console.log('TOKEN', token.value, token);
		let found = false;
		if (this.syntaxTree.discardEmpty && token.name === 'blank') {
			return;
		}
		if (!found && (this.syntaxTree.candidate === 'string' || this.syntaxTree.candidate === false)) {
			found = this.caseString(token);
			// If the string name ends before have a quote
			// Any wrong syntax is cast as string, so the string can end without a final quote
			if (!found && this.syntaxTree.candidate === 'string' && counter === this.originalText.length -1) {
				this.setAsString();
			}
		}
		if (!found && (this.syntaxTree.candidate === 'variable' || this.syntaxTree.candidate === 'dotDict' || this.syntaxTree.candidate === false)) {
			found = this.caseVariableOrDictNode(token);
			// If the variable name ends before have a space or enter
			if (!found && counter === this.originalText.length -1) {
				this.setAsVarOrDictNode({end: true});
				found = true;
			}
		}
		// if (!found && (this.syntaxTree.candidate === 'dotDict' || this.syntaxTree.candidate === false)) {
		// 	console.log('maybe is a dot dictionary');
		// 	found = this.caseDotDict(token);
		// }
		// if (!found && (this.syntaxTree.candidate === 'braketDict' || this.syntaxTree.candidate === false)) {
		// 	console.log('maybe is a braket dictionary');
		// 	// found = this.caseString(token);
		// }
		if (!found && (this.syntaxTree.candidate === 'function' || this.syntaxTree.candidate === false)) {
			console.log('maybe is a function');
			// found = this.caseString(token);
		}
	}

	caseVariableOrDictNode(token) {
		if ((token.name === 'letter' || token.name === 'especial') && !this.syntaxTree.open && !this.syntaxTree.candidate) {
			this.syntaxTree.discardEmpty = false;
			this.syntaxTree.open = token.value;
			this.syntaxTree.candidate = 'variable';
			this.syntaxTree.currentTokens.push(token);
		} else if ((token.name === 'letter' || token.name === 'especial' || token.name === 'number') && this.syntaxTree.open) {
			this.syntaxTree.currentTokens.push(token);
		} else if (token.name === 'blank' && this.syntaxTree.open) {
			this.setAsVarOrDictNode({end: true});
			return true;
		// This maybe a dictionary
		} else if (token.name === 'separator' && (token.value === '.' || token.value === '[') && this.syntaxTree.open) {
			if (token.value === '.') {
				this.syntaxTree.candidate = 'dotDict';
				this.setDotDictNode({end: false});
			} else {
				this.syntaxTree.candidate = 'braketDict';
			}
		// This maybe a function
		} else if (token.name === 'separator' && (token.value === '(') && this.syntaxTree.open) {
			this.syntaxTree.candidate = 'function';
		// If have any other kind of char set this as a string
		} else {
			this.syntaxTree.currentTokens.push(token);
			this.syntaxTree.candidate = 'string';
		}
	}

	setDotDictNode({end}) {
		let varName = '';
		for (const t of this.syntaxTree.currentTokens) {
			varName = varName + t.value;
		}
		if (this.syntaxTree.currentNodeIndex === false) {
			this.syntaxTree.nodes.push({
				syntax: 'dictionary',
				nodes: [{
					syntax: 'variable',
					tokens: this.syntaxTree.currentTokens,
					label: varName,
					separator: '.',
				}],
			});
			this.syntaxTree.currentNodeIndex = this.syntaxTree.nodes.length - 1;
		} else {
			this.syntaxTree.nodes[this.syntaxTree.currentNodeIndex].nodes.push({
				syntax: 'variable',
				tokens: this.syntaxTree.currentTokens,
				label: varName,
				separator: end ? null : '.',
			})
		}
		this.syntaxTree.currentTokens = [];

		if (end) {
			this.syntaxTree.currentNodeIndex = false;
			console.log('IS DICT:', this.syntaxTree.currentNodeIndex, this.syntaxTree.nodes[this.syntaxTree.nodes.length-1], this.syntaxTree.nodes);
		}
	}

	setAsVar() {
		let varName = '';
		for (const t of this.syntaxTree.currentTokens) {
			varName = varName + t.value;
		}
		this.syntaxTree.nodes.push({syntax: 'variable', tokens: this.syntaxTree.currentTokens, label: varName});
		this.syntaxTree.resetTempAttrs();
		console.log('IS VARIABLE:', this.syntaxTree.nodes[this.syntaxTree.nodes.length-1], this.syntaxTree.nodes);
	}

	setAsVarOrDictNode({end}) {
		if (this.syntaxTree.candidate === 'variable') {
			this.setAsVar();
		} else {
			this.setDotDictNode({end: end});
		}
	}

	caseString(token) {
		if (token.name === 'quote' && !this.syntaxTree.open && !this.syntaxTree.candidate) {
			this.syntaxTree.discardEmpty = false;
			this.syntaxTree.open = token.value;
			this.syntaxTree.candidate = 'string';
			this.syntaxTree.currentTokens.push(token);
		} else if (token.name === 'quote' && (token.value !== this.syntaxTree.open || this.syntaxTree.escape === true)) {
			this.syntaxTree.currentTokens.push(token);
			this.syntaxTree.escape = false;
		} else if (token.name === 'quote' && (token.value === this.syntaxTree.open && this.syntaxTree.escape === false)) {
			this.syntaxTree.currentTokens.push(token);
			this.syntaxTree.open = ' '; // Set open to space so it's end in the next blank char
		} else if (token.name === 'blank' && this.syntaxTree.open === ' ') {
			this.setAsString();
			return true;
		} else if (token.name === 'escape' && this.syntaxTree.escape === false) {
			this.syntaxTree.escape = true;
		} else if (token.name === 'escape' && this.syntaxTree.escape === true) {
			this.syntaxTree.currentTokens.push(token);
			this.syntaxTree.escape = false;
		} else if (this.syntaxTree.open || this.syntaxTree.open === ' ') {
			this.syntaxTree.currentTokens.push(token);
		}
	}

	setAsString() {
		let string = '';
		for (const t of this.syntaxTree.currentTokens) {
			string = string + t.value;
		}
		this.syntaxTree.nodes.push({syntax: 'string', tokens: this.syntaxTree.currentTokens, label: string});
		this.syntaxTree.resetTempAttrs();
		console.log('IS ISTRING:', this.syntaxTree.nodes[this.syntaxTree.nodes.length-1], this.syntaxTree.nodes);
	}
}
