class StringPattern {
	constructor(listener) {
		this.listener = listener;
		this.openQuote = null;
		this.escape = false;
		this.invalid = false;
	}

	// Condition to start check if is a string
	firstToken({token, counter}) {
		if (['quote'].includes(token.name)) {
			this.openQuote = token.value;
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'string');
			this.listener.checking = 'middleTokens';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
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
				this.listener.checking = 'endToken';
			}
			return true;
		} else {
			return false;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && ['blank', 'end', 'operator', 'equal', 'NOT-equal', 'greater-than', 'minor-than', 'greater-or-equal', 'minor-or-equal', 'NOT', 'NOT-NOT', 'AND', 'OR', 'short-hand', 'comma'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'string', token: token, counter: counter});
			return false;
		} else if (this.invalid === true && ['blank', 'end', 'operator', 'equal', 'NOT-equal', 'greater-than', 'minor-than', 'greater-or-equal', 'minor-or-equal', 'NOT', 'NOT-NOT', 'AND', 'OR', 'short-hand', 'comma'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			this.invalid = true;
			return true;
		}
	}
}

// It also detect objects (dictionary and function) and change for ObjectPattern when detects it
class VariablePattern {
	constructor(listener) {
		this.listener = listener;
	}

	// Condition to start check if is empty chars
	firstToken({token, counter}) {
		if (['letter', 'especial'].includes(token.name)) {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'variable');
			this.listener.checking = 'middleTokens';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (['letter', 'especial', 'number'].includes(token.name)) {
			return true;
		} else if (['blank', 'end', 'operator', 'equal', 'NOT-equal', 'greater-than', 'minor-than', 'greater-or-equal', 'minor-or-equal', 'NOT', 'NOT-NOT', 'AND', 'OR', 'short-hand', 'comma'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'variable', token: token, counter: counter});
			return false;
		// If is some function or dictionary
		} else if (token.value === '(' || token.value === '[' || token.name === 'dot') {
			this.listener.checking = 'firstToken';
			this.listener.firstNodeLabel = this.listener.currentLabel;
			this.listener.candidates = [{name: 'object', instance: new ObjectPattern(this.listener)}];
			return true;
		} else {
			// Invalid!
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition are only to INVALID syntaxe
	// wait for some blank or end token and register the current stream as invalid
	endToken({token, counter}) {
		if (['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			return true;
		}
	}
}

class NumberPattern {
	constructor(listener) {
		this.listener = listener;
		this.float = false;
	}

	// Condition to start check if is empty chars
	firstToken({token, counter}) {
		if (token.name === 'number') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'number');
			this.listener.checking = 'middleTokens';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (this.float === false && token.name === 'number') {
			return true;
		} else if (this.float === false && ['blank', 'end', 'operator', 'equal', 'NOT-equal', 'greater-than', 'minor-than', 'greater-or-equal', 'minor-or-equal', 'NOT-NOT', 'NOT', 'AND', 'OR', 'short-hand', 'comma'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'integer', token: token, counter: counter});
			return false;
		} else if (this.float === false && token.value === '.') {
			this.float = true;
			return true;
		} else if (this.float === true && token.name === 'number') {
			return true;
		} else if (this.float === true && ['blank', 'end', 'operator', 'equal', 'NOT-equal', 'greater-than', 'minor-than', 'greater-or-equal', 'minor-or-equal', 'NOT-NOT', 'NOT', 'AND', 'OR', 'short-hand', 'comma'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'float', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition are only to INVALID syntaxe
	// wait for some blank or end token and register the current stream as invalid
	endToken({token, counter}) {
		if (['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			return true;
		}
	}
}

class OperationPattern {
	constructor(listener) {
		this.listener = listener;
		this.openOperator = null;
		this.lastOperator = null;
		this.doubleOperators = false;
	}

	// Condition to start check if is empty chars
	firstToken({token, counter}) {
		if (token.name === 'operator') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'operator');
			this.openOperator = token.value;
			this.listener.checking = 'middleTokens';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (token.name === 'operator' && this.openOperator !== token.value && (token.value === '-' || token.value === '+')) {
			this.listener.checking = 'endToken';
			this.doubleOperators = true;
			this.lastOperator = token.value;
			return true;
		} else if (['blank', 'end', 'letter', 'especial', 'number'].includes(token.name) || token.value === '(') {
			this.listener.nextPattern({syntax: 'operator', token: token, counter: counter});
			return false;
		} else if (token.name === 'quote' && this.doubleOperators === false && this.openOperator === '+') {
			this.listener.nextPattern({syntax: 'operator', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition are only to INVALID syntaxe
	// wait for some blank or end token and register the current stream as invalid
	endToken({token, counter}) {
		if (this.doubleOperators === true && this.lastOperator !== token.value && ['blank', 'end', 'letter', 'especial', 'number', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'operator', token: token, counter: counter});
			return false;
		} else if (['blank', 'end'].includes(token.name) || (this.doubleOperators === true && this.lastOperator === token.value)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			return true;
		}
	}
}

class EqualPattern {
	constructor(listener) {
		this.listener = listener;
		this.one = null;
		this.two = null;
		this.three = null;
		this.invalid = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'equal') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'equal');
			this.listener.checking = 'middleTokens';
			this.one = token.value;
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		// Second operator
		if (this.two === null) {
			if (token.name === 'equal') {
				this.two = token.value;
				// The only valid value after a leading = is another = (2 == 2)
				return true;
			} else {
				// Invalid!
				this.invalid = true;
				// wait for some blank or end token and register the current stream as invalid
				this.listener.checking = 'endToken';
				return true;
			}
		} else {
			if (token.name === 'equal') {
				this.three = token.value;
				this.listener.checking = 'endToken';
				return true;
			// JS syntax allows ! (not operator) after an equality test without spaces: false==!true (evaluate as true)
			} else if (['blank', 'end', 'letter', 'especial', 'number', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
				this.listener.nextPattern({syntax: 'equal', token: token, counter: counter});
				return false;
			} else {
				// Invalid!
				this.invalid = true;
				// wait for some blank or end token and register the current stream as invalid
				this.listener.checking = 'endToken';
				return true;
			}
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'equal', token: token, counter: counter});
			return false;
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			return true;
		}
	}
}

class MinorThanPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'minor-than') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'minor-than');
			this.listener.checking = 'middleTokens';
			this.one = token.value;
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (token.name === 'equal') {
			this.listener.checking = 'endToken';
			return true;
		// JS syntax allows ! (not operator) after an equality test without spaces: false==!true (evaluate as true)
		} else if (['blank', 'end', 'letter', 'especial', 'number', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'minor-than', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'minor-or-equal', token: token, counter: counter});
			return false;
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			return true;
		}
	}
}

class GreaterThanPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'greater-than') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'greater-than');
			this.listener.checking = 'middleTokens';
			this.one = token.value;
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (token.name === 'equal') {
			this.listener.checking = 'endToken';
			return true;
		// JS syntax allows ! (not operator) after an equality test without spaces: false==!true (evaluate as true)
		} else if (['blank', 'end', 'letter', 'especial', 'number', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'greater-than', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'greater-or-equal', token: token, counter: counter});
			return false;
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			return true;
		}
	}
}

class NotPattern {
	constructor(listener) {
		this.listener = listener;
		this.one = null;
		this.two = null;
		this.three = null;
		this.invalid = false;
	}
	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'NOT') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'NOT');
			this.listener.checking = 'middleTokens';
			this.one = token.value;
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		// Second operator
		if (this.two === null) {
			if (token.name === 'equal' || token.name === 'NOT') {
				this.two = token.value;
				// The only valid value after a leading = is another = (2 == 2)
				return true;
			} else if (['blank', 'end', 'letter', 'especial', 'number', 'quote'].includes(token.name)) {
				this.listener.nextPattern({syntax: 'NOT', token: token, counter: counter});
				return false;
			} else {
				// Invalid!
				this.invalid = true;
				// wait for some blank or end token and register the current stream as invalid
				this.listener.checking = 'endToken';
				return true;
			}
		} else {
			this.three = token.value;
			if (this.two === '=' && token.name === 'equal') {
				this.listener.checking = 'endToken';
				return true;
			// JS syntax allows ! (not operator) after an equality test without spaces: false==!true (evaluate as true)
			} else if (this.two === '=' && ['blank', 'end', 'letter', 'especial', 'number', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
				this.listener.nextPattern({syntax: 'NOT-equal', token: token, counter: counter});
				return false;
			} else if (this.two === '!' && ['blank', 'end', 'letter', 'especial', 'number', 'quote'].includes(token.name)) {
				this.listener.checking = 'endToken';
				this.listener.nextPattern({syntax: 'NOT-NOT', token: token, counter: counter});
				return false;
			} else if (this.two === '!' && token.name === 'NOT') {
				this.listener.checking = 'endToken';
				return true;
			} else {
				// Invalid!
				this.invalid = true;
				// wait for some blank or end token and register the current stream as invalid
				this.listener.checking = 'endToken';
				return true;
			}
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && this.three === '=' && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'NOT-equal', token: token, counter: counter});
			return false;
		} else if (this.invalid === false && this.three === '!' && ['blank', 'end', 'letter', 'number', 'especial', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'NOT-NOT', token: token, counter: counter});
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			if (token.value !== '!') {
				this.invalid = true;
			}
			return true;
		}
	}
}

class AndPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'AND') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'AND');
			this.listener.checking = 'middleTokens';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (token.name === 'AND') {
			this.listener.checking = 'endToken';
			return true;
		} else {
			// Invalid!
			this.invalid = true;
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'AND', token: token, counter: counter});
			return false;
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			return true;
		}
	}
}

class OrPattern {
	constructor(listener) {
			this.listener = listener;
			this.invalid = false;
		}

		// Condition to start check first operator
		firstToken({token, counter}) {
			if (token.name === 'OR') {
				this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'OR');
				this.listener.checking = 'middleTokens';
				return true;
			} else {
				return false;
			}
		}

		// middle tokens condition
		middleTokens({token, counter}) {
			if (token.name === 'OR') {
				this.listener.checking = 'endToken';
				return true;
			} else {
				// Invalid!
				this.invalid = true;
				// wait for some blank or end token and register the current stream as invalid
				this.listener.checking = 'endToken';
				return true;
			}
		}

		// end condition
		endToken({token, counter}) {
			if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
				this.listener.nextPattern({syntax: 'OR', token: token, counter: counter});
				return false;
			} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
				this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
				return false;
			} else {
				// Invalid!
				this.invalid = true;
				return true;
			}
		}
}

class ShortHandPattern {
	constructor(listener) {
		this.listener = listener;
		this.currentParams = '';

		this.shortHand = {syntax: 'short-hand', condition: [], if: [], else: [], label: ''};
		this.counter = 0;
		this.openShortHand = 0;
		this.needCloseShortHand = 0;

		// Track any open parentheses or brackets
		this.parentheses = 0;
		this.brackets = 0;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'short-hand' && token.value === '?') {
			this.openShortHand = this.openShortHand  + 1;
			this.createConditionNode({token, counter});
			return true;
		} else {
			return false;
		}
	}

	// middle condition
	middleTokens({token, counter}) {
		// Collecting inner parameters, so allow any valid syntax
		if (['blank', 'escape', 'especial', 'quote', 'equal', 'minor-than', 'greater-than', 'NOT', 'NOT-NOT', 'AND', 'OR', 'comma', 'number', 'letter', 'operator', 'dot', 'separator'].includes(token.name)) {
			this.currentParams = this.currentParams + token.value;
			if (token.value === '(') {
				this.parentheses = this.parentheses + 1;
			} else if (token.value === '[') {
				this.brackets = this.brackets + 1;
			} else if (token.value === ')') {
				this.parentheses = this.parentheses - 1;
			} else if (token.value === ']') {
				this.brackets = this.brackets - 1;
			}
			return true;
		} else if (token.name === 'short-hand' && token.value === ':') {
			if (this.brackets === 0 && this.parentheses === 0) {
				this.needCloseShortHand = this.needCloseShortHand + 1;
				// Set the short-hand to close on 'end' syntax, but if found a '?' before it,
				// this is a inner short-hand on the 'condition' ou 'else' part of the main short-hand
				// This also can be a inner short-hand inside the 'if' part of the main short-hand
				if (this.openShortHand === this.needCloseShortHand) {
					this.needCloseShortHand = this.needCloseShortHand - 1;
					this.createIfNode({token: token, text: this.currentParams});
				}
			}
			this.currentParams = this.currentParams + token.value;
			return true;
		// It may some inner shot-hand inside 'condition' or 'else' part of main short hand
		} else if (token.name === 'short-hand' && token.value === '?') {
			if (this.brackets === 0 && this.parentheses === 0) {
				if (this.openShortHand === 1 && this.needCloseShortHand === 1) {
					let tempLabel = this.shortHand.label + this.currentParams;
					// replace the real nodes with a tempNode just with the correct label so the createConditionNode use it
					// to create a condition node with a full short-hand label
					this.listener.syntaxTree.nodes = [{syntax: 'temp', label: tempLabel}];
					// Reset all variables
					this.shortHand = {syntax: 'short-hand', condition: [], if: [], else: [], label: ''};
					this.openShortHand = this.openShortHand  - 1;
					this.needCloseShortHand = this.needCloseShortHand - 1;
					this.counter = 0;
					// This add a short-hand as 'condition' or 'else' of another short-hand
					this.currentParams = this.currentParams + token.value;
					this.createConditionNode({token, counter});
					return true;
				} else {
					this.openShortHand = this.openShortHand  + 1;
				}
			}
			this.currentParams = this.currentParams + token.value;
			return true;
		} else if (token.name === 'end') {
			this.createElseNode({token});
			return false;
		} else {
			// Invalid!
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		}
	}

	createConditionNode({token}) {
		// Remove the current nodes from suntaxTree and add it as the short-hand condition
		for (const node of this.listener.syntaxTree.nodes) {
			this.shortHand.label = `${this.shortHand.label}${node.label}`;
		}
		this.shortHand.condition = new PowerTemplateLexer({
			text: this.shortHand.label,
			counter: this.counter,
			isParameter: true,
		}).syntaxTree.tree;

		this.listener.syntaxTree.nodes = [];
		this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'short-hand');
		this.listener.checking = 'middleTokens';
		this.counter = this.shortHand.label.length + 1; // +1 represents the ?
		this.currentParams = '';
		this.fullLabel = this.shortHand.label + token.value;
	}

	createIfNode({token, text}) {
		this.shortHand.if = new PowerTemplateLexer({
			text: text,
			counter: this.counter,
			isParameter: true,
		}).syntaxTree.tree;

		this.shortHand.label = this.fullLabel + this.currentParams;
		this.counter = this.shortHand.label.length + 1;
		this.currentParams = '';
	}

	createElseNode({token}) {
		this.shortHand.else = new PowerTemplateLexer({
			text: this.currentParams,
			counter: this.counter,
			isParameter: true,
		}).syntaxTree.tree;

		this.shortHand.label = this.shortHand.label + this.currentParams;
		this.shortHand.start = 0;
		this.shortHand.end = this.shortHand.label.length;
		this.listener.syntaxTree.nodes.push(this.shortHand);
		this.openShortHand = this.openShortHand  - 1;
		this.needCloseShortHand = this.needCloseShortHand - 1;
	}
}

class CommaPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'comma') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'comma');
			this.listener.checking = 'endToken';
			return true;
		} else {
			return false;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && ['blank', 'end', 'especial', 'separator', 'operator', 'quote', 'equal', 'NOT', 'NOT-NOT', 'comma', 'number', 'letter'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'comma', token: token, counter: counter});
			return false;
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			return true;
		}
	}
}

// If is some dictNode
class DictPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		// can't start with dot
		if (token.name === 'dot' && this.listener.syntaxTree.nodes.length === 0) {
			// INVALID!
			this.listener.checking = 'endToken';
			this.listener.firstNodeLabel = this.listener.currentLabel;
			const instance = new ObjectPattern(this.listener);
			instance.invalid = true;
			this.listener.candidates = [{name: 'object', instance: instance}];
			return true;
		} else if (token.name === 'dot' || token.value === '[') {
			this.listener.checking = 'firstToken';
			this.listener.firstNodeLabel = this.listener.currentLabel;
			const instance = new ObjectPattern(this.listener);
			instance.anonymous = true;
			this.listener.candidates = [{name: 'object', instance: instance}];

			return true;
		} else {
			return false;
		}
	}
}

// Create a parentheses or anonymous function
class parenthesesPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
		this.nodes = [];
		this.currentOpenChar = null;
		this.currentParams = '';
		this.currentParamsCounter = null; //Allow pass the couter to the params
		this.innerOpenedParenteses = 0;
		this.anonymous = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		// The open char of the current node
		this.currentOpenChar = token.value;
		if (this.currentOpenChar === '(' && !this.listener.isAnonymousFunc) {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'parentheses');
			this.listener.checking = 'middleTokens';
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}
			return true;
		} else if (this.listener.isAnonymousFunc === true) {
			this.listener.checking = 'firstToken';
			this.listener.firstNodeLabel = this.listener.currentLabel;
			const instance = new ObjectPattern(this.listener);
			instance.anonymous = true;
			this.listener.candidates = [{name: 'object', instance: instance}];
			this.listener.isAnonymousFunc = false;
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (token.value === ')' && this.innerOpenedParenteses === 0) {
			this.listener.checking = 'endToken';
			return true;
		// This is a functions with parameters, so allow any valid char
		} else if (['blank', 'escape', 'especial', 'quote', 'equal', 'minor-than', 'greater-than', 'NOT', 'NOT-NOT', 'AND', 'OR', 'comma', 'short-hand', 'number', 'letter', 'operator', 'dot', 'separator'].includes(token.name)) {
			this.currentParams = this.currentParams + token.value;
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}

			if (token.value === '(') {
				this.innerOpenedParenteses = this.innerOpenedParenteses + 1;
			} else if (token.value === ')') {
				this.innerOpenedParenteses = this.innerOpenedParenteses - 1;
			}
			return true;
		} else if (this.innerOpenedParenteses >= 0 && token.name === 'end') {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false ) {
			if (['blank', 'end', 'dot', 'operator'].includes(token.name)) {
				const parameters = new PowerTemplateLexer({
					text: this.currentParams,
					counter: this.currentParamsCounter,
					isParameter: true,
				}).syntaxTree.tree;

				this.listener.nextPattern({syntax: this.anonymous ? 'anonymousFunc' : 'parentheses', token: token, counter: counter, parameters: parameters});
				return false;
			// Allow invoke a second function
			} else if (token.value === '(') {
				// MANUALLY CREATE THE CURRENT NODE
				const parameters = new PowerTemplateLexer({
					text: this.currentParams,
					counter: this.currentParamsCounter,
					isParameter: true,
				}).syntaxTree.tree;

				this.listener.syntaxTree.nodes.push({
					syntax: this.anonymous ? 'anonymousFunc' : 'parentheses',
					label: this.listener.currentLabel,
					tokens: this.listener.currentTokens,
					start: this.listener.start,
					end: counter,
					parameters: parameters || [],
				});
				this.listener.start = counter;
				this.listener.currentTokens = [];
				this.currentParams = [];
				this.listener.currentLabel = '';

				this.anonymous = true;
				this.listener.checking = 'middleTokens';
				return true;
			} else {
				// Invalid!
				this.invalid = true;
				return true;
			}
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			return true;
		}
	}
}

// TODO: Allow parentheses inside dict like in: dict[(2+2)]
// bracket notation dictionary (user['age'])
class ObjectPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
		this.nodes = [];
		this.currentOpenChar = null;
		this.currentParams = '';
		this.currentParamsCounter = null; //Allow pass the couter to the params
		this.innerOpenedObjects = 0;
		this.anonymous = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {

		// Invalidade any dict ending in: [ ( .
		if (token.value === null) {
			const lastToken = this.listener.currentTokens[this.listener.currentTokens.length -1];
			const second = token;
			if (lastToken.value === '(' || lastToken.value === '[' || lastToken.value === '.') {
				this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
				return false;
			}
		}
		// The open char of the current node
		this.currentOpenChar = this.listener.currentTokens[this.listener.currentTokens.length - 1].value;
		if (this.currentOpenChar === '(') {
			// Is a simple function without parameters
			if (token.value === ')') {
				this.listener.checking = 'endToken';
				return true;
			// Collect the function parameters and got to middleTokens
			} else if (['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'NOT-NOT', 'quote'].includes(token.name)) {
				this.listener.checking = 'middleTokens';
				this.currentParams = this.currentParams + token.value;
				if (this.currentParamsCounter === null) {
					this.currentParamsCounter = counter || null;
				}
				return true;
			} else if (this.currentOpenChar === '(' && token.value === '(') {
				this.innerOpenedObjects = this.innerOpenedObjects + 1;
				this.currentParams = this.currentParams + token.value;
				this.listener.checking = 'middleTokens';
				if (this.currentParamsCounter === null) {
					this.currentParamsCounter = counter || null;
				}
				return true;
			} else {
				// Invalid!
				this.invalid = true;
				// wait for some blank or end token and register the current stream as invalid
				this.listener.checking = 'endToken';
				return true;
			}
		// If is a bracket or dot dictionary
		} else if ((this.currentOpenChar === '[' || this.currentOpenChar === '.') && token.name !== 'separator') {
			// When a bracket dict is detect we already have the first node and the open bracket
			// Get the node label without the bracket and convert it to STRING to create the first node
			// If bracket or dot are detected from DictPattern it may come with a single bracket or dot as
			// currentLabel, in that case with don't want manually create a dict node now
			if (this.listener.currentLabel !== '.' && this.listener.currentLabel !== '[') {
				this.listener.firstNodeLabel = this.listener.currentLabel;
				this.currentParams = `"${this.listener.currentLabel.slice(0, this.listener.currentLabel.length - 1)}"`;
				// MANUALLY CREATE THE DICTIONAY NODE
				this.createDictionaryNode({token: token, counter: counter});
				// Variable name can't start with a number
				if (this.currentOpenChar === '.' && token.name === 'number') {
					// this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
					// return false;
					this.invalid = true;
				}
			} else {
				this.listener.checking = 'middleTokens';
			}

				// After create the first node set to collect the params inside the brackets to create the second node with it
				this.currentParams = this.currentParams + token.value;
				if (this.currentParamsCounter === null) {
					this.currentParamsCounter = counter || null;
				}
			return true;
		} else if (token.name === 'dot' || token.name === 'separator') {
			// Invalid!
			this.invalid = true;
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		// Function
		if (this.currentOpenChar === '(' && token.value === ')' && this.innerOpenedObjects === 0) {
			this.listener.checking = 'endToken';
			return true;
		// This is a functions with parameters, so allow any valid char
		} else if (this.currentOpenChar === '(' && ['blank', 'escape', 'especial', 'quote', 'equal', 'minor-than', 'greater-than', 'NOT', 'NOT-NOT', 'AND', 'OR', 'comma', 'short-hand', 'number', 'letter', 'operator', 'dot', 'separator'].includes(token.name)) {
			this.currentParams = this.currentParams + token.value;
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}

			if (token.value === '(') {
				this.innerOpenedObjects = this.innerOpenedObjects + 1;
			} else if (token.value === ')') {
				this.innerOpenedObjects = this.innerOpenedObjects - 1;
			}
			return true;
		} else if (this.currentOpenChar === '(' && this.innerOpenedObjects >= 0 && token.name === 'end') {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		// bracket dictNode
		} else if  (this.currentOpenChar === '[' && token.value === ']' && this.innerOpenedObjects === 0) {
			this.invalid = this.currentParams.length ? false : true; // dictNodes can't be empty []
			this.listener.checking = 'endToken';
			return true;
		// dot dictNode
		} else if (this.currentOpenChar === '.' && (['blank', 'end', 'operator', 'operator', 'dot'].includes(token.name) || (token.value === '(' || token.value === '['))) {
			// Variable name can't start with a number
			if ((this.listener.currentTokens.length >= 2 &&
				this.listener.currentTokens[0].name === 'dot' &&
				this.listener.currentTokens[1].name === 'number') || (
				this.listener.syntaxTree.nodes.length &&
				this.listener.syntaxTree.nodes[this.listener.syntaxTree.nodes.length-1] &&
				this.listener.syntaxTree.nodes[this.listener.syntaxTree.nodes.length-1].syntax === 'dictNode' &&
				this.listener.syntaxTree.nodes[this.listener.syntaxTree.nodes.length-1].tokens[
				this.listener.syntaxTree.nodes[this.listener.syntaxTree.nodes.length-1].tokens.length-1].value === '.' &&
				this.listener.currentTokens[0].name === 'number')) {
				// Invalid!
				this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
				return false;
			}
			const parameters = new PowerTemplateLexer({
				text: `"${this.currentParams}"`,
				counter: this.currentParamsCounter,
				isParameter: true,
			}).syntaxTree.tree;

			this.listener.currentLabel = this.anonymous ? this.listener.currentLabel : this.listener.firstNodeLabel;
			// Set parenthesesPattern to create an anonymous function after this dictionary
			if (token.value === '(') {
				this.listener.isAnonymousFunc = true;
			}
			this.listener.nextPattern({syntax: 'dictNode', token: token, counter: counter, parameters: parameters});
			return false;
		// This is a dictNode with parameters, so allow any valid char
		} else if (this.currentOpenChar === '[' && ['blank', 'escape', 'especial', 'quote', 'equal', 'NOT-equal', 'greater-than', 'minor-than', 'greater-or-equal', 'minor-or-equal', 'NOT', 'NOT-NOT', 'AND', 'OR', 'comma', 'short-hand', 'number', 'letter', 'operator', 'dot', 'separator'].includes(token.name)) {
			this.currentParams = this.currentParams + token.value;
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}

			if (token.value === '[') {
				this.innerOpenedObjects = this.innerOpenedObjects + 1;
			} else if (token.value === ']') {
				this.innerOpenedObjects = this.innerOpenedObjects - 1;
			}
			return true;
		// This is a DOT dictNode so collect it label/parameter
		} else if (this.currentOpenChar === '.' && ['especial', 'number', 'letter'].includes(token.name)) {
			this.currentParams = this.currentParams + token.value;
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}
			return true;
		} else if ((this.currentOpenChar === '[') && this.innerOpenedObjects >= 0 && token.name === 'end') {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			// wait for some blank or end token and register the current stream as invalid
			this.listener.checking = 'endToken';
			return true;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false ) {
			// If is a function or the last function nodes or last dictNode
			if (['blank', 'end', 'operator', 'comma', 'operator', 'dot'].includes(token.name)) {
				const parameters = new PowerTemplateLexer({
					text: this.currentParams,
					counter: this.currentParamsCounter,
					isParameter: true,
				}).syntaxTree.tree;

				if (this.currentOpenChar === '(') {
					this.listener.currentLabel = this.anonymous ? this.listener.currentLabel : this.listener.firstNodeLabel;
					this.listener.nextPattern({syntax: this.anonymous ? 'anonymousFunc' : 'function', token: token, counter: counter, parameters: parameters});
					return false;
				} else if (this.currentOpenChar === '[' || this.currentOpenChar === '.') {
					this.listener.currentLabel = this.anonymous ? this.listener.currentLabel : this.listener.firstNodeLabel;
					this.listener.nextPattern({syntax: 'dictNode', token: token, counter: counter, parameters: parameters});
					return false;
				} else {
					// Invalid!
					this.invalid = true;
					return true;
				}
			// If there is an anonymous function after another function
			} else if (this.currentOpenChar === '(' && (token.value === '(' || token.value === '[')) {
				this.listener.checking = 'middleTokens';
				// MANUALLY CREATE THE FUNCTION NODE
				this.createAnonymousFuncNode({token: token, counter: counter});
				this.currentOpenChar = token.value;
				return true;
			// If there is another dictNode or function after last dictNode
			} else if (this.currentOpenChar === '[' && (token.value === '[' || token.value === '(')) {
				// MANUALLY CREATE THE DICTIONAY NODE
				this.createDictionaryNode({token: token, counter: counter});
				this.currentOpenChar = token.value;
				return true;
			} else {
				// Invalid!
				this.invalid = true;
				return true;
			}
		} else if (this.invalid === true && ['blank', 'end'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		} else {
			// Invalid!
			this.invalid = true;
			return true;
		}
	}

	dictHaveInvalidParams(parameters) {
		// Dictionary can't have empty key
		if (parameters.length === 0) {
			invalid = true;
			return true;
		} else {
			return false;
		}
	}

	createDictionaryNode({token, counter}) {
		const parameters = new PowerTemplateLexer({
			text: this.currentParams,
			counter: this.currentParamsCounter,
			isParameter: true,
		}).syntaxTree.tree;

		if (this.dictHaveInvalidParams(parameters)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		}
		// this.listener.currentLabel = this.anonymous ? this.listener.currentLabel : this.listener.firstNodeLabel;
		this.listener.syntaxTree.nodes.push({
			syntax: 'dictNode',
			label: this.listener.firstNodeLabel ? this.listener.firstNodeLabel : this.listener.currentLabel,
			tokens: this.listener.currentTokens,
			start: this.listener.start,
			end: counter,
			parameters: parameters || [],
		});
		this.listener.start = counter;
		this.listener.currentTokens = [];
		this.currentParams = [];
		this.listener.currentLabel = '';
		this.listener.firstNodeLabel = '';

		this.anonymous = true;
		this.listener.checking = 'middleTokens';
	}

	createAnonymousFuncNode({token, counter}) {
		const parameters = new PowerTemplateLexer({
			text: this.currentParams,
			counter: this.currentParamsCounter,
			isParameter: true,
		}).syntaxTree.tree;

		this.listener.currentLabel = (this.anonymous === true) ? this.listener.currentLabel : this.listener.firstNodeLabel;
		this.listener.syntaxTree.nodes.push({
			syntax: (this.anonymous === true) ? 'anonymousFunc' : 'function',
			label: this.listener.currentLabel,
			tokens: this.listener.currentTokens,
			start: this.listener.start,
			end: counter,
			parameters: parameters || [],
		});
		this.listener.start = counter;
		this.listener.currentTokens = [];
		this.currentParams = [];
		this.listener.currentLabel = '';
		this.listener.firstNodeLabel = '';

		this.anonymous = true;
		this.listener.checking = 'middleTokens';
	}
}

class EmptyPattern {
	constructor(listener) {
		this.listener = listener;
	}

	// Condition to start check if is empty chars
	firstToken({token, counter}) {
		if (token.name === 'blank') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'empty');
			this.listener.checking = 'middleTokens';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (token.name === 'blank') {
			return true;
		} else {
			this.listener.nextPattern({syntax: 'empty', token: token, counter: counter});
			return false;
		}
	}
}
