class SyntaxTree {
	constructor() {
		this.tokensListener = new TokensListener();
	}
}

class StringPattern {
	constructor(listner) {
		this.listner = listner;
		this.openQuote = null;
		this.escape = false;
	}

	// Condition to start check if is a string
	firstToken(token) {
		if (['quote'].includes(token.name)) {
			this.openQuote = token.value;
			this.listner.candidates = this.listner.candidates.filter(c=> c.name === 'string');
			this.listner.checking = 'middleTokens';
			console.log('string is true', token, this.listner);
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens(token) {
		if (token.value !== this.openQuote && token.name !== 'end') {
			if (token.name === 'escape') {
				this.escape = true;
			}
			return true;
		} else if (token.value === this.openQuote) {
			if (token.name === 'escape') {
				this.escape = false;
			} else {
				this.openQuote = null;
				this.listner.checking = 'endToken';
			}
			return true;
		} else {
			console.log('string is false', token);
			return false;
		}
	}

	// end condition
	endToken(token) {
		if (['end', 'blank'].includes(token.name)) {
			console.log('string is end', token, this.listner);
			return true;
		}
	}
}

class EmptyPattern {
	constructor(listner) {
		this.listner = listner;
	}

	// Condition to start check if is empty chars
	firstToken(token) {
		if (['blank'].includes(token.name)) {
			console.log('empty is true', token);
			listner.candidates
			return true;
		} else {
			console.log('empty is false', token);
			return false;
		}
	}
}

class TokensListener {
	constructor() {
		this.nodes = [];
		this.firstToken = true;
		this.currentTokens = [];
		this.start = null;
		this.end = null;
		this.patterns = [
			{name: 'empty', obj: EmptyPattern},
			{name: 'string', obj: StringPattern},
		];
		this.candidates = [];
		this.checking = 'firstToken';

		this.resetCandidates();
	}

	read({token, counter}) {
		for (const candidate of this.candidates) {
			if (candidate.instance[this.checking](token)) {
				return;
			}
		}
	}

	nextPattern() {
		this.currentTokens = [];
		this.start = null;
		this.end = null;
	}

	resetCandidates() {
		for (const candidate of this.patterns) {
			this.candidates.push({name: candidate.name, instance: new candidate.obj(this)});
		}
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
		this.tokens.push({name: 'end', value: null});
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
			{name: 'end', values: [null]},
		];
		this.scan();
	}

	scan() {
		console.log('originalText', this.originalText);
		let counter = 0;
		for (const char of this.originalText) {
			const token = this.convertToToken(char);
			this.tokens.push(token);
			this.syntaxTree.tokensListener.read({token: token, counter: counter});
			counter = counter + 1;
		}
		// Add an end token to the stream end
		const token = this.convertToToken(null);
		this.tokens.push(token);
		this.syntaxTree.tokensListener.read({token: token, counter: counter});
		console.log('this.syntaxTree', this.syntaxTree);
	}

}
