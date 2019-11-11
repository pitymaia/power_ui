class SyntaxTree {
	constructor({counter}) {
		this.nodes = [];
		this.tokensListener = new TokensListener({counter: counter, syntaxTree: this});
	}
}

class PowerLexer {
	constructor({text, tokensTable, counter}) {
		this.originalText = String(text);
		this.syntaxTree = new SyntaxTree({counter: counter});
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
	constructor({text, tokensTable, counter}) {
		super({text: text, tokensTable: tokensTable, counter: counter || 0});
		this.counter = counter || 0;
		this.tokensTable = tokensTable || [
			{name: 'blank', values: [' ', '\t', '\n']},
			{name: 'escape', values: ['\\']},
			{name: 'especial', values: ['_', '$']},
			{name: 'quote', values: ['"', '`', "'"]},
			{name: 'separator', values: ['(', ')', '[', ']']},
			{name: 'operation', values: ['+', '-', '*', '/', '%']},
			{name: 'equal', values: ['=']},
			{name: 'minor-than', values: ['<']},
			{name: 'greater-than', values: ['>']},
			{name: 'NOT', values: ['!']},
			{name: 'AND', values: ['&']},
			{name: 'OR', values: ['|']},
			{name: 'comma', values: ','},
			{name: 'dot', values: ['.']},
			{name: 'short-hand', values: ['?', ':']},
			{name: 'number', values: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']},
			{name: 'letter', values: [
				'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i',
				'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
				's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
				'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
				'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
				'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
			},
			{name: 'end', values: [null]},
		];
		this.scan();

		return this.syntaxTree.tokensListener.nodes;
	}

	scan() {
		let counter = this.counter;
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
		console.log('NODES', this.syntaxTree.nodes);
	}

}


class TokensListener {
    constructor({counter, syntaxTree}) {
        this.syntaxTree = syntaxTree;
        this.currentTokens = [];
        this.currentLabel = '';
        this.start = counter;
        this.patterns = [
            {name: 'empty', obj: EmptyPattern},
            {name: 'string', obj: StringPattern},
            {name: 'variable', obj: VariablePattern},
            {name: 'number', obj: NumberPattern},
            {name: 'operation', obj: OperationPattern},
            {name: 'equal', obj: EqualPattern},
            {name: 'minor-than', obj: MinorThanPattern},
            {name: 'greater-than', obj: GreaterThanPattern},
            {name: 'NOT', obj: NotPattern},
            {name: 'AND', obj: AndPattern},
            {name: 'OR', obj: OrPattern},
            {name: 'comma', obj: CommaPattern},
            {name: 'dot', obj: DotPattern},
            {name: 'short-hand', obj: ShortHandPattern},
            // {name: 'function', obj: FunctionPattern}, // this is a secundary detector
            // {name: 'dictionary, obj: DictionaryPattern'}, // this is a secundary detector
        ];
        this.candidates = [];
        this.checking = 'firstToken';

        this.resetCandidates();
    }

    read({token, counter}) {
        for (const candidate of this.candidates) {
            if (candidate.instance[this.checking]({token: token, counter: counter})) {
                this.currentTokens.push(token);
                this.currentLabel = this.currentLabel + (token.value || (token.value === null ? '' : token.value));
                break;
            }
        }
    }

    nextPattern({token, counter, syntax, parameters}) {
        this.syntaxTree.nodes.push({
            syntax: syntax,
            label: this.currentLabel,
            tokens: this.currentTokens,
            start: this.start,
            end: counter,
            parameters: parameters || [],
        });
        this.start = counter;
        this.currentTokens = [];
        this.currentLabel = '';
        this.checking = 'firstToken';
        this.resetCandidates();

        this.read({token, counter});
    }

    resetCandidates() {
        this.candidates = [];
        for (const candidate of this.patterns) {
            this.candidates.push({name: candidate.name, instance: new candidate.obj(this)});
        }
    }
}
