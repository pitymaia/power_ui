class SyntaxTree {
	constructor({counter}) {
		this.currentPriority = 0;
		this.nodes = [];
		this.tree = [];
		this.tokensListener = new TokensListener({counter: counter, syntaxTree: this});
		this.validAfter = {
			variable: this.variableValidation,
			string: this.stringValidation,
			parentheses: this.parenthesesValidation,
			dot: this.dotValidation,
			integer: this.numberValidation,
			float: this.numberValidation,
			operator: this.operationValidation,
			equal: this.equalityValidation,
			'NOT-equal': this.equalityValidation,
			'greater-than': this.equalityValidation,
			'minor-than': this.equalityValidation,
			object: this.objectValidation,
			function: this.objectValidation,
			anonymousFunc: this.objectValidation,
			dictNode: this.objectValidation,
			comma: this.commaValidation,
			AND: this.orAndNotShortHandValidation,
			OR: this.orAndNotShortHandValidation,
			NOT: this.orAndNotShortHandValidation,
			'NOT-NOT': this.orAndNotShortHandValidation,
			'short-hand': this.orAndNotShortHandValidation,
		}
	}

	firstNodeValidation({node}) {
		if (['dot', 'anonymousFunc', 'object',
			'AND', 'OR', 'NOT-equal', 'short-hand',
			'equal', 'minor-than', 'minor-than'].includes(node.syntax)) {
			return false;
		} else if (node.syntax === 'operator' && (node.label !== '+' && node.label !== '-')) {
			return false;
		} else {
			return true;
		}
	}

	orAndNotShortHandValidation({nextNode}) {
		if (['string', 'variable', 'integer', 'object',
			'float', 'dictNode', 'parentheses',
			'NOT', 'NOT-NOT', 'function'].includes(nextNode.syntax)) {
			return true;
		} else if (nextNode.syntax === 'operator' && (nextNode.label === '+' || nextNode.label === '-')) {
			return true;
		} else {
			return false;
		}
	}

	commaValidation({nextNode}) {
		if (['string', 'variable', 'integer', 'object',
			'float', 'dictNode', 'parentheses',
			'NOT', 'NOT-NOT', 'comma', 'function', 'end'].includes(nextNode.syntax)) {
			return true;
		} else if (nextNode.syntax === 'operator' && (nextNode.label === '+' || nextNode.label === '-')) {
			return true;
		} else {
			return false;
		}
	}

	// Functions and dictionaries
	// TODO: ONLY ACCEPT COMMA IF IS PARAMETER CHECK
	objectValidation({nextNode}) {
		if (['operator', 'anonymousFunc', 'short-hand', 'comma',
			'NOT-equal', 'equal', 'minor-than', 'minor-than',
			'dot', 'AND', 'OR', 'dictNode', 'end'].includes(nextNode.syntax)) {
			return true;
		} else {
			return false;
		}
	}

	equalityValidation({nextNode, currentNode}) {
		if (['variable', 'parentheses', 'function',
			'float', 'integer', 'dictNode', 'object',
			'NOT', 'NOT-NOT', 'string'].includes(nextNode.syntax)) {
			return true;
		} else if (nextNode.syntax === 'string' && currentNode.label === '+') {
			return true;
		} else if (nextNode.syntax === 'operator' && (nextNode.label === '+' || nextNode.label === '-')) {
			return true;
		} else {
			return false;
		}
	}

	operationValidation({nextNode, currentNode}) {
		if (['NOT', 'NOT-NOT', 'float', 'object',
			'integer', 'variable', 'dictNode',
			'parentheses', 'function'].includes(nextNode.syntax)) {
			return true;
		} else if (nextNode.syntax === 'string' && currentNode.label === '+') {
			return true;
		} else if (nextNode.syntax === 'operator' && (nextNode.label === '+' || nextNode.label === '-')) {
			return true;
		} else {
			return false;
		}
	}

	// TODO: ONLY ACCEPT COMMA IF IS PARAMETER CHECK
	variableValidation({nextNode}) {
		if (['dot', 'operator', 'NOT-equal', 'comma',
			'equal', 'minor-than', 'minor-than',
			'AND', 'OR' , 'short-hand', 'end'].includes(nextNode.syntax)) {
			return true;
		} else {
			return false;
		}
	}

	// TODO: ONLY ACCEPT COMMA IF IS PARAMETER CHECK
	numberValidation({nextNode}) {
		if (['operator', 'NOT-equal', 'equal', 'comma',
			'minor-than', 'minor-than', 'AND',
			'OR' , 'short-hand', 'end'].includes(nextNode.syntax)) {
			return true;
		} else {
			return false;
		}
	}

	// TODO: ONLY ACCEPT COMMA IF IS PARAMETER CHECK
	stringValidation({nextNode}) {
		if (['NOT', 'NOT-NOT', 'string', 'variable',
			'dictNode', 'function', 'parentheses',
			'integer', 'float', 'especial', 'anonymousFunc',
			'dot', 'dictNode'].includes(nextNode.syntax)) {
			return false;
		} else {
			return true;
		}
	}

	// TODO: ONLY ACCEPT COMMA IF IS PARAMETER CHECK
	parenthesesValidation({nextNode}) {
		if (['anonymousFunc', 'dot', 'operator', 'short-hand', 'end', 'comma'].includes(nextNode.syntax)) {
			return true;
		} else {
			return false;
		}
	}

	dotValidation({nextNode}) {
		if (['function', 'variable', 'dictNode'].includes(nextNode.syntax)) {
			return true;
		} else {
			return false;
		}
	}

	// Return true if the next node is valid after a given syntax
	isNextValidAfterCurrent({currentNode, nextNode}) {
		return this.validAfter[currentNode.syntax] ? this.validAfter[currentNode.syntax]({currentNode: currentNode, nextNode: nextNode}) : false;
	}

	checkAndPrioritizeSyntax({nodes, expression, isParameter}) {
		const CURRENT_EXPRESSION_NODES = [];
		let PRIORITY_NODES = [];

		nodes = nodes || this.nodes;
		// object is a special kind that group real nodes and do not need be unified, it is the result of unifying
		if (isParameter !== 'object') {
			nodes = this.filterNodesAndUnifyObjects(nodes);
		}
		expression = expression || '';

		let index = 0;
		const nodesLastIndex = nodes.length - 1;
		let isValid = true;

		// Validade the first node
		isValid = this.firstNodeValidation({node: this.getCurrentNode({index: 0, nodes})});

		if (isValid === false) {
			throw `PowerUI template invalid syntax: "${nodes[0].label}" starting the expression.`;
		}

		while (index <= nodesLastIndex && isValid) {
			const currentNode = this.getCurrentNode({index: index, nodes});
			isValid = this.isNextValidAfterCurrent({
				currentNode: currentNode,
				nextNode: this.getNextNode({index: index, nodes}),
			});

			if (isValid === false) {
				throw `PowerUI template invalid syntax: "${currentNode.label}" nearby ${expression}.`;
			} else {
				expression = expression + currentNode.label;
			}

			// recursively check the parameters
			if (currentNode.parameters.length) {
				isValid = this.checkAndPrioritizeSyntax({
					nodes: currentNode.parameters,
					expressions: expression,
					isParameter: (currentNode.syntax === 'object' ? 'object' : true),
				});
			}

			PRIORITY_NODES = this.createExpressionGroups({
				currentNode: currentNode,
				previousNode: this.getPreviousNode({index: index, nodes}),
				nextNode: this.getNextNode({index: index, nodes}),
				CURRENT_EXPRESSION_NODES: CURRENT_EXPRESSION_NODES,
				PRIORITY_NODES: PRIORITY_NODES,
			});

			index = index + 1;
		}
		if (!isParameter) console.log('FILTERED', nodes, 'PRIORITY_NODES', PRIORITY_NODES, 'CURRENT_EXPRESSION_NODES', CURRENT_EXPRESSION_NODES);
		return isValid;
	}

	createExpressionGroups({currentNode, previousNode, nextNode, CURRENT_EXPRESSION_NODES, PRIORITY_NODES}) {
		// Convert
		if (['integer', 'float', 'string', 'parentheses', 'object'].includes(currentNode.syntax)) {
			if (nextNode.syntax === 'operator' && (nextNode.label !== '+' && nextNode.label !== '-') ||
				previousNode.syntax === 'operator' && (previousNode.label !== '+' && previousNode.label !== '-')) {
				PRIORITY_NODES.push(currentNode);
			} else {
				CURRENT_EXPRESSION_NODES.push(currentNode);
			}
			// console.log('currentNode', currentNode, 'previousNode', previousNode, 'nextNode', nextNode);
		} else if (currentNode.syntax === 'operator') {
			if (currentNode.label !== '+' && currentNode.label !== '-') {
				PRIORITY_NODES.push(currentNode);
			} else {
				if (PRIORITY_NODES.length) {
					CURRENT_EXPRESSION_NODES.push({priority: PRIORITY_NODES});
					PRIORITY_NODES = [];
				}
				CURRENT_EXPRESSION_NODES.push(currentNode);
			}
			// console.log('currentNode', currentNode, 'previousNode', previousNode, 'nextNode', nextNode);
		} else if (['OR', 'AND', 'short-hand'].includes(currentNode.syntax)) {

		} else {
			CURRENT_EXPRESSION_NODES.push(currentNode);
		}

		return PRIORITY_NODES;
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

	filterNodesAndUnifyObjects(nodes) {
		const filteredNodes = [];
		let object = this.newObject();
		let counter = nodes.length -1;
		let concatObject = false;
		while (nodes[counter]) {
			// Remove empty nodes
			if (nodes[counter].syntax !== 'empty') {
				if (['function', 'dictNode', 'anonymousFunc'].includes(nodes[counter].syntax)) {
					object.parameters.unshift(nodes[counter]);
					let label = nodes[counter].label;
					if (nodes[counter].syntax === 'function') {
						label = label + '()';
					}
					object.label = label + object.label;
					concatObject = true;
				} else {
					if (concatObject) {
						filteredNodes.unshift(object);
						concatObject = false;
						object = this.newObject();
					}
					filteredNodes.unshift(nodes[counter]);
				}
			} else {
				if (concatObject) {
					filteredNodes.unshift(object);
					concatObject = false;
					object = this.newObject();
				}
			}
			counter = counter - 1;
		}
		return filteredNodes;
	}

	newObject() {
		return {syntax: 'object', label: '', parameters: []};
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
			{name: 'operator', values: ['+', '-', '*', '/', '%']},
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
			{name: 'operator', obj: OperationPattern},
			{name: 'equal', obj: EqualPattern},
			{name: 'minor-than', obj: MinorThanPattern},
			{name: 'greater-than', obj: GreaterThanPattern},
			{name: 'NOT', obj: NotPattern},
			{name: 'AND', obj: AndPattern},
			{name: 'OR', obj: OrPattern},
			{name: 'comma', obj: CommaPattern},
			{name: 'dot', obj: DictPattern},
			{name: 'separator', obj: DictPattern},
			{name: 'short-hand', obj: ShortHandPattern},
			{name: 'parentheses', obj: parenthesesPattern}
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
