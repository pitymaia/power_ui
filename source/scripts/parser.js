class SyntaxTree {
	constructor({counter}) {
		this.currentPriority = 0;
		this.nodes = [];
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
			'minor-or-equal': this.equalityValidation,
			'greater-or-equal': this.equalityValidation,
			object: this.objectValidation,
			function: this.objectValidation,
			anonymousFunc: this.objectValidation,
			dictNode: this.objectValidation,
			comma: this.commaValidation,
			AND: this.orAndNotValidation,
			OR: this.orAndNotValidation,
			NOT: this.orAndNotValidation,
			'NOT-NOT': this.orAndNotValidation,
			'short-hand': this.shortHandValidation,
			'dictDefinition': ()=> true,
		}
		// console.log('this.node', this.nodes);
	}

	buildTreeLeaf(isParameter) {
		this.tree = this.checkAndPrioritizeSyntax({nodes: this.nodes, isParameter: isParameter});

		// if (!isParameter) {
		// 	console.log('TREE:', this.tree);
		// }
	}

	shortHandValidation({currentNode, isParameter}) {
		if (currentNode.condition[0] && currentNode.condition[0].expression_nodes && !currentNode.condition[0].expression_nodes.length) {
			return false;
		} else if (currentNode.if[0] && currentNode.if[0].expression_nodes && !currentNode.if[0].expression_nodes.length) {
			return false;
		} else if (currentNode.else[0] && currentNode.else[0].expression_nodes && !currentNode.else[0].expression_nodes.length) {
			return false;
		} else {
			return true;
		}
	}

	firstNodeValidation({node, isParameter}) {
		if (['dot', 'anonymousFunc',
			'AND', 'OR', 'NOT-equal',
			'minor-or-equal', 'greater-or-equal',
			'equal', 'minor-than', 'greater-than'].includes(node.syntax)) {
			return false;
		} else if (node.syntax === 'operator' && (node.label !== '+' && node.label !== '-')) {
			return false;
		} else {
			return true;
		}
	}

	orAndNotValidation({nextNode, isParameter}) {
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

	commaValidation({nextNode, isParameter}) {
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
	objectValidation({nextNode, isParameter}) {
		if (['operator', 'anonymousFunc', 'short-hand',
			'NOT-equal', 'equal', 'minor-than', 'greater-than',
			'minor-or-equal', 'greater-or-equal',
			'dot', 'AND', 'OR', 'dictNode', 'end'].includes(nextNode.syntax) || (nextNode.syntax === 'comma' && isParameter)) {
			return true;
		} else {
			return false;
		}
	}

	equalityValidation({nextNode, currentNode, isParameter}) {
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

	operationValidation({nextNode, currentNode, isParameter}) {
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

	variableValidation({nextNode, isParameter}) {
		if (['dot', 'operator', 'NOT-equal',
			'equal', 'minor-than', 'greater-than',
			'minor-or-equal', 'greater-or-equal',
			'AND', 'OR' , 'short-hand', 'end'].includes(nextNode.syntax) || (nextNode.syntax === 'comma' && isParameter)) {
			return true;
		} else {
			return false;
		}
	}

	numberValidation({nextNode, isParameter}) {
		if (['operator', 'NOT-equal', 'equal',
			'minor-than', 'greater-than', 'AND',
			'minor-or-equal', 'greater-or-equal',
			'OR' , 'short-hand', 'end'].includes(nextNode.syntax) || (nextNode.syntax === 'comma' && isParameter)) {
			return true;
		} else {
			return false;
		}
	}

	stringValidation({nextNode, isParameter}) {
		if (['NOT', 'NOT-NOT', 'string', 'variable',
			'dictNode', 'function', 'parentheses',
			'integer', 'float', 'especial', 'anonymousFunc',
			'dot', 'dictNode'].includes(nextNode.syntax)) {
			return false;
		} else if (nextNode.syntax === 'comma' && isParameter) {
			return true;
		} else {
			return true;
		}
	}

	parenthesesValidation({nextNode, isParameter}) {
		if (['anonymousFunc', 'dot', 'operator',
			'short-hand', 'NOT-equal', 'equal',
			'minor-or-equal', 'greater-or-equal',
			'minor-than', 'greater-than', 'AND',
			'OR' , 'short-hand', 'end'].includes(nextNode.syntax) || (nextNode.syntax === 'comma' && isParameter)) {
			return true;
		} else {
			return false;
		}
	}

	dotValidation({nextNode, isParameter}) {
		if (['function', 'variable', 'dictNode'].includes(nextNode.syntax)) {
			return true;
		} else {
			return false;
		}
	}

	// Return true if the next node is valid after a given syntax
	isNextValidAfterCurrent({currentNode, nextNode, isParameter}) {
		// console.log('currentNode, nextNode, isParameter', currentNode, nextNode, isParameter);
		// return true;
		return this.validAfter[currentNode.syntax] ? this.validAfter[currentNode.syntax]({
			currentNode: currentNode,
			nextNode: nextNode,
			isParameter: isParameter
		}) : false;
	}

	checkAndPrioritizeSyntax({nodes, isParameter}) {
		let current_expression_nodes = [];
		let priority_nodes = [];
		let expression_groups = [];
		let doubleOperator = false;

		nodes = this.filterNodesAndUnifyObjects(nodes);
		nodes.push({syntax: 'end'});

		if (!nodes.length) {
			return [];
		}

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
				isParameter: isParameter,
			});

			if (isValid === false && currentNode.syntax !== 'end') {
				throw `PowerUI template invalid syntax: "${currentNode.label}".`;
			}

			const result = this.createExpressionGroups({
				index: index,
				currentNode: currentNode,
				previousNode: this.getPreviousNode({index: index, nodes}),
				nextNode: this.getNextNode({index: index, nodes}),
				current_expression_nodes: current_expression_nodes,
				priority_nodes: priority_nodes,
				expression_groups: expression_groups,
				doubleOperator: doubleOperator,
			});

			priority_nodes = result.priority_nodes;
			current_expression_nodes = result.current_expression_nodes;
			expression_groups = result.expression_groups;
			doubleOperator = result.doubleOperator;

			index = index + 1;
		}

		expression_groups = this.prioritizeExpressionGroups({priority: 'equality', expression_groups: expression_groups});
		expression_groups = this.prioritizeExpressionGroups({priority: 'AND', expression_groups: expression_groups});

		// Remove the last node (end syntax)
		expression_groups.pop();

		return expression_groups;
	}

	createExpressionGroups({index, currentNode, previousNode, nextNode, current_expression_nodes, priority_nodes, expression_groups, doubleOperator}) {
		// Simple expressions
		if (currentNode.syntax === 'operator' && index === 0) {
			priority_nodes.push(currentNode);
			doubleOperator = true;
		} else if (currentNode.syntax === 'operator' && previousNode.syntax === 'operator') {
			priority_nodes.push(currentNode);
			doubleOperator = true;
		} else if (['integer', 'float', 'string', 'variable', 'parentheses', 'object', 'short-hand', 'dictDefinition'].includes(currentNode.syntax)) {
			if (nextNode.syntax === 'operator' && (nextNode.label !== '+' && nextNode.label !== '-') ||
				previousNode.syntax === 'operator' && (previousNode.label !== '+' && previousNode.label !== '-')) {
				priority_nodes.push(currentNode);
			} else if (doubleOperator) {
				priority_nodes.push(currentNode);
				doubleOperator = false;
			} else {
				current_expression_nodes.push(currentNode);
			}
		} else if (currentNode.syntax === 'operator') {
			if (currentNode.label !== '+' && currentNode.label !== '-') {
				priority_nodes.push(currentNode);
			} else {
				if (priority_nodes.length) {
					current_expression_nodes.push({priority: priority_nodes});
					priority_nodes = [];
				}
				current_expression_nodes.push(currentNode);
			}
		}
		// equality expression / logic OR/AND expressions
		if (['NOT-equal', 'equal', 'greater-than', 'minor-than', 'minor-or-equal', 'greater-or-equal', 'OR', 'AND', 'end'].includes(currentNode.syntax)) {
			const KIND = ['OR', 'AND'].includes(currentNode.syntax) ? currentNode.syntax : 'equality';
			if (priority_nodes.length) {
				current_expression_nodes.push({priority: priority_nodes});
				priority_nodes = [];
			}

			const expression = {kind: 'expression', expression_nodes: current_expression_nodes};
			expression_groups.push(expression);
			current_expression_nodes = [];
			currentNode.kind = currentNode.syntax === 'end' ? 'end' : KIND;
			expression_groups.push(currentNode);
		}

		return {
			priority_nodes: priority_nodes,
			current_expression_nodes: current_expression_nodes,
			expression_groups: expression_groups,
			doubleOperator: doubleOperator,
		};
	}

	prioritizeExpressionGroups({priority, expression_groups}) {
		let newGroups = [];
		let currentGroups = [];
		let foundPriority = false;

		for (const group of expression_groups) {
			if (group.syntax === 'end' && currentGroups.length) {
				if (newGroups.length) {
					newGroups.push({priority: currentGroups});
				} else {
					newGroups = currentGroups;
				}
				newGroups.push(group);
				currentGroups = [];
			} else if (group.kind === priority) {
				foundPriority = true;
				currentGroups.push(group);
			} else if (!group.priority && group.kind !== 'expression' && foundPriority && currentGroups.length) {
				newGroups.push({priority: currentGroups});
				newGroups.push(group);
				currentGroups = [];
				foundPriority = false;
			} else if (group.syntax === 'OR' || group.syntax === 'AND') {
				newGroups.push({priority: currentGroups});
				newGroups.push(group);
				currentGroups = [];
			} else {
				currentGroups.push(group);
			}
		}

		return newGroups;
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
		// If object is the last node it may be wating...
		if (concatObject) {
			filteredNodes.unshift(object);
			concatObject = false;
			object = this.newObject();
		}
		return filteredNodes;
	}

	newObject() {
		return {syntax: 'object', label: '', parameters: []};
	}
}

class PowerLexer {
	constructor({text, tokensTable, counter, isParameter}) {
		this.isParameter = isParameter;
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

class PowerTemplateParser extends PowerLexer{
	constructor({text, tokensTable, counter, isParameter}) {
		super({text: text, tokensTable: tokensTable, counter: counter || 0, isParameter: isParameter});
		this.counter = counter || 0;
		this.tokensTable = tokensTable || [
			{name: 'blank', values: [' ', '\t', '\n']},
			{name: 'escape', values: ['\\']},
			{name: 'especial', values: ['_', '$']},
			{name: 'quote', values: ['"', '`', "'"]},
			{name: 'braces', values: ['{', '}']},
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
		this.buildSyntaxTree();
	}

	buildSyntaxTree() {
		this.scan();
		this.syntaxTree.buildTreeLeaf(this.isParameter || false);
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

// Listen to tokens for syntax patterns
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
			{name: 'braces', obj: BracesPattern},
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

class ParserEval {
	constructor({text, nodes, scope, $powerUi}) {
		this.$powerUi = $powerUi;
		this.$scope = scope || {};
		this.nodes = nodes || new PowerTemplateParser({text: text}).syntaxTree.tree;
		this.currentValue = '';
		this.operator = '';
		this.doubleOperator = '';
		this.evalNodes();
		this.lastNode = '';
		this.currentNode = '';
		this.nextNode = '';
	}

	evalNodes() {
		let count = 0;
		// console.log('this.nodes', this.nodes);
		for (const node of this.nodes) {
			if (node.expression_nodes) {
				for (const item of node.expression_nodes) {
					this.currentNode = item;

					this.nextNode = node.expression_nodes[count + 1];
					this.eval(item);

					this.lastNode = item;
					count = count + 1;
				}
			} else {
				console.log('NO EXPRESSION_NODES!!', node, this.nodes);
			}
		}
	}

	eval(item) {
		// console.log('last', this.lastNode, 'current', this.currentNode, 'next', this.nextNode);
		let value = '';
		if (item.syntax === 'float') {
			value = parseFloat(item.label);
			if (this.currentValue === '') {
				this.currentValue = this.adjustForNegative(value);
			} else {
				this.currentValue = this.mathOrConcatValues(value);
			}
		} else if (item.syntax === 'integer') {
			value = parseInt(item.label);
			if (this.currentValue === '') {
				this.currentValue = this.adjustForNegative(value);
			} else {
				this.currentValue = this.mathOrConcatValues(value);
			}
		} else if (item.syntax === 'operator') {
			// Jesus... javascript allows multiple operators like in: 2 +-+-+-+- 4
			if (this.operator) {
				if (this.operator === '-' && item.label === '-') {
					this.operator = '+';
				} else if (this.operator === '-' && item.label === '+') {
					this.operator = '-';
				} else if (this.operator === '+' && item.label === '-') {
					this.operator = '-';
				} else if (this.operator === '+' && item.label === '+') {
					this.operator = '+';
				} else {
					if (this.doubleOperator === '-' && item.label === '-') {
						this.doubleOperator = '+';
					} else if (this.doubleOperator === '-' && item.label === '+') {
						this.doubleOperator = '-';
					} else if (this.doubleOperator === '+' && item.label === '-') {
						this.doubleOperator = '-';
					} else if (this.doubleOperator === '+' && item.label === '+') {
						this.doubleOperator = '+';
					} else {
						this.doubleOperator = item.label;
					}
				}
			} else {
				this.operator = item.label;
			}
		} else if (item.priority || item.syntax === 'parentheses') {
			const newNodes = item.priority ? [{expression_nodes: item.priority}] : item.parameters;
			value = this.recursiveEval(newNodes);
			this.currentValue = this.mathOrConcatValues(value);
		} else if (item.syntax === 'variable') {
			value = this.getOnScope(item.label);
			if (this.currentValue === '') {
				this.currentValue = this.adjustForNegative(value);
			} else {
				this.currentValue = this.mathOrConcatValues(value);
			}
		} else if (item.syntax === 'string') {
			value = this.removeQuotes(item.label);
			if (this.currentValue === '') {
				this.currentValue = this.adjustForNegative(value);
			} else {
				this.currentValue = this.mathOrConcatValues(value);
			}
		} else if (item.syntax === 'object') {
			value = this.evalObject(item);
			this.currentValue = this.mathOrConcatValues(value);
		} else {
			console.log('NOT NUMBER OR OPERATOR OR PRIORITY');
		}

		return value;
	}

	removeQuotes(string) {
		let newString = '';
		for (const char of string) {
			if (!['"', '`', "'"].includes(char)) {
				newString = newString + char;
			}
		}
		return newString;
	}

	evalObject(item) {
		let $currentScope = '';
		let objOnScope = '';
		let value = '';

		let count = 0;
		for (const obj of item.parameters) {
			let label = '';
			if (obj.syntax === 'function') {
				label = obj.label;
			} else if (obj.syntax === 'dictNode'){
				label = this.recursiveEval(obj.parameters);
			} else {
				if (obj.syntax !== 'anonymousFunc') {
					console.log('NOT FUNCTION or DICTNODE!', obj);
				}
			}

			if (count === 0) {
				$currentScope = this.getObjScope(label);
				count = 1;
			} else if ($currentScope === '') {
				return undefined;
				break;
			}

			// Build the dict object
			if (obj.syntax !== 'anonymousFunc') {
				if (objOnScope === '') {
					// first node of dict
					objOnScope = $currentScope[label];
				} else {
					// other nodes of dict
					objOnScope = objOnScope[label];
				}
			}

			if (obj.syntax === 'function' || obj.syntax === 'anonymousFunc') {
				const args = [];
				for (const param of obj.parameters[0].expression_nodes) {
					args.push(this.recursiveEval([{expression_nodes: [param]}]));
				}
				value = objOnScope.apply(null, args);
				// This allow calls multiple anonymous functions
				objOnScope = value;
			}
		}
		if (objOnScope !== '') {
			value = objOnScope;
			objOnScope = '';
		}
		return value;
	}

	recursiveEval(nodes) {
		return new ParserEval({nodes: nodes, scope: this.$scope, $powerUi: this.$powerUi}).currentValue;
	}

	adjustForNegative(value) {
		if (this.operator === '-') {
			value = -value;
		}
		this.operator = '';
		return value;
	}

	mathOrConcatValues(value) {
		if (isNaN(value) === false) {
			if (Number.isInteger(value)) {
				value = parseInt(value);
			} else if (isNaN(parseFloat(value)) === false) {
				value = parseFloat(value);
			}
		}

		if (this.doubleOperator === '-') {
			value = -value;
			this.doubleOperator = '';
		}

		if (this.operator === '+') {
			value = this.currentValue + value;
		} else if (this.operator === '-') {
			value = this.currentValue - value;
		} else if (this.operator === '/') {
			value = this.currentValue / value;
		} else if (this.operator === '*') {
			value = this.currentValue * value;
		}

		this.operator = '';
		return value;
	}

	// Return item on $scope or $powerUi ($rootScope)
	getOnScope(item) {
		if (this.$scope[item] !== undefined) {
			return this.$scope[item];
		} else if (this.$powerUi[item] !== undefined) {
			return this.$powerUi[item];
		} else {
			return undefined;
		}
	}

	// Get the scope where objec exists
	getObjScope(item) {
		if (this.$scope[item] !== undefined) {
			return this.$scope;
		} else if (this.$powerUi[item] !== undefined) {
			return this.$powerUi;
		} else {
			return undefined;
		}
	}
}
