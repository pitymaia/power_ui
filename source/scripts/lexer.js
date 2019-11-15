class SyntaxTree {
	constructor({counter}) {
		this.currentNode = -1;
		this.nodes = [];
		this.tokensListener = new TokensListener({counter: counter, syntaxTree: this});
		this.validAfter = {
			variable: this.variableValidation,
			dictionary: this.dictyonaryValidation,
			string: this.stringValidation,
			parentheses: this.parenthesesValidation,
			dot: this.dotValidation,
			integer: this.numberValidation,
			float: this.numberValidation,
			operation: this.operationValidation,
			equal: this.equalityValidation,
			'NOT-equal': this.equalityValidation,
			'greater-than': this.equalityValidation,
			'minor-than': this.equalityValidation,
			function: this.objectValidation,
			anonymousFunc: this.objectValidation,
			dictionary: this.objectValidation,
			dictNode: this.objectValidation,
			comma: this.commaValidation,
			AND: this.orAndNotShortHandValidation,
			OR: this.orAndNotShortHandValidation,
			NOT: this.orAndNotShortHandValidation,
			'NOT-NOT': this.orAndNotShortHandValidation,
			'short-hand': this.orAndNotShortHandValidation,
		}
	}

	// Return true if the next node is valid after a given syntax
	isNextValidAfterCurrent({currentNode, nextNode}) {
		return this.validAfter[currentNode.syntax]({currentNode: currentNode, nextNode: nextNode});
	}

	orAndNotShortHandValidation({nextNode}) {
		if (['string', 'variable', 'integer',
			'float', 'dictionary', 'parentheses',
			'NOT', 'NOT-NOT', 'function'].includes(nextNode.syntax)) {
			return true;
		} else if (nextNode.syntax === 'operation' && (nextNode.label === '+' || nextNode.label === '-')) {
			return true;
		} else {
			return false;
		}
	}

	commaValidation({nextNode}) {
		if (['string', 'variable', 'integer',
			'float', 'dictionary', 'parentheses',
			'NOT', 'NOT-NOT', 'comma', 'function', 'end'].includes(nextNode.syntax)) {
			return true;
		} else if (nextNode.syntax === 'operation' && (nextNode.label === '+' || nextNode.label === '-')) {
			return true;
		} else {
			return false;
		}
	}

	// Functions and dictionaries
	objectValidation({nextNode}) {
		if (['operation', 'anonymousFunc', 'short-hand',
			'NOT-equal', 'equal', 'minor-than', 'minor-than',
			'dot', 'AND', 'OR', 'dictNode', 'end'].includes(nextNode.syntax)) {
			return true;
		} else {
			return false;
		}
	}

	equalityValidation({nextNode, currentNode}) {
		if (['variable', 'parentheses', 'function',
			'float', 'integer', 'dictionary',
			'NOT', 'NOT-NOT'].includes(nextNode.syntax)) {
			return true;
		} else if (nextNode.syntax === 'string' && currentNode.label === '+') {
			return true;
		} else if (nextNode.syntax === 'operation' && (nextNode.label === '+' || nextNode.label === '-')) {
			return true;
		} else {
			return false;
		}
	}

	operationValidation({nextNode, currentNode}) {
		if (['NOT', 'NOT-NOT', 'float',
			'integer', 'variable', 'dictionary',
			'parentheses', 'function'].includes(nextNode.syntax)) {
			return true;
		} else if (nextNode.syntax === 'string' && currentNode.label === '+') {
			return true;
		} else if (nextNode.syntax === 'operation' && (nextNode.label === '+' || nextNode.label === '-')) {
			return true;
		} else {
			return false;
		}
	}

	variableValidation({nextNode}) {
		if (['dot', 'operation', 'NOT-equal',
			'equal', 'minor-than', 'minor-than',
			'AND', 'OR' , 'short-hand', 'end'].includes(nextNode.syntax)) {
			return true;
		} else {
			return false;
		}
	}

	numberValidation({nextNode}) {
		if (['operation', 'NOT-equal', 'equal',
			'minor-than', 'minor-than', 'AND',
			'OR' , 'short-hand', 'end'].includes(nextNode.syntax)) {
			return true;
		} else {
			return false;
		}
	}

	stringValidation({nextNode}) {
		if (['NOT', 'NOT-NOT', 'string', 'variable',
			'dictionary', 'function', 'parentheses',
			'integer', 'float', 'especial', 'anonymousFunc',
			'dot', 'comma', 'dictNode'].includes(nextNode.syntax)) {
			return false;
		} else {
			return true;
		}
	}

	parenthesesValidation({nextNode}) {
		if (['anonymousFunc', 'dot', 'operation', 'short-hand', 'end'].includes(nextNode.syntax)) {
			return true;
		} else {
			return false;
		}
	}

	dotValidation({nextNode}) {
		if (['function', 'variable', 'dictionary'].includes(nextNode.syntax)) {
			return true;
		} else {
			return false;
		}
	}

	checkAndPrioritizeSyntax(nodes) {
		nodes = nodes || this.nodes;
		nodes = this.filterNodes(nodes);
		let expression = '';
		let index = 0;
		const nodesLastIndex = nodes.length - 1;
		while (index <= nodesLastIndex) {
			const currentNode = this.getCurrentNode({index: index, nodes});
			console.log('isValid?', this.isNextValidAfterCurrent({currentNode: currentNode, nextNode: this.getNextNode({index: index, nodes}) || {syntax: 'end'}}), 'current node', currentNode);
			expression = expression + (this.getCurrentNode({index: index, nodes}) ? this.getCurrentNode({index: index, nodes}).label : '');

			// recursively check the parameters
			if (currentNode.parameters.length) {
				this.checkAndPrioritizeSyntax(currentNode.parameters);
			}

			index = index + 1;
		}
		console.log('Expression', expression);
	}

	getCurrentNode({index, nodes}) {
		return nodes[index];
	}

	// Return the previous node from node list
	getPreviousNode({index, nodes}) {
		return nodes[index - 1] || {syntax: 'end'};
	}

	// Return the next node from node list
	getNextNode({index, nodes}) {
		return nodes[index + 1] || {syntax: 'end'};
	}

	filterNodes(nodes) {
		const filteredNodes = [];
		let counter = nodes.length -1;
		while (nodes[counter]) {
			if (nodes[counter].syntax !== 'empty') {
				filteredNodes.unshift(nodes[counter]);
			}
			counter = counter - 1;
		}
		return filteredNodes;
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
            {name: 'parentheses', obj: ParentesesPattern}
            // {name: 'object', obj: ObjectPattern}, // this is a secundary detector
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
