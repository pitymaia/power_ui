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
		if (this.invalid === false && ['blank', 'end', 'operation', 'equal', 'greater-than', 'minor-than', 'NOT', 'AND', 'OR', 'short-hand', 'comma'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'string', token: token, counter: counter});
			return false;
		} else if (this.invalid === true && ['blank', 'end', 'operation', 'equal', 'greater-than', 'minor-than', 'NOT', 'AND', 'OR', 'short-hand', 'comma'].includes(token.name)) {
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
		} else if (['blank', 'end', 'operation', 'equal', 'greater-than', 'minor-than', 'NOT', 'AND', 'OR', 'short-hand', 'comma', 'dot'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'variable', token: token, counter: counter});
			return false;
		// If is some function or dictionary
		} else if (token.value === '(' || token.value === '[') {
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
		} else if (this.float === false && ['blank', 'end', 'operation', 'equal', 'greater-than', 'minor-than', 'NOT', 'AND', 'OR', 'short-hand', 'comma'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'integer', token: token, counter: counter});
			return false;
		} else if (this.float === false && token.value === '.') {
			this.float = true;
			return true;
		} else if (this.float === true && token.name === 'number') {
			return true;
		} else if (this.float === true && ['blank', 'end', 'operation', 'equal', 'greater-than', 'minor-than', 'NOT', 'AND', 'OR', 'short-hand', 'comma'].includes(token.name)) {
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
		this.doubleOperators = false;
	}

	// Condition to start check if is empty chars
	firstToken({token, counter}) {
		if (token.name === 'operation') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'operation');
			this.openOperator = token.value;
			this.listener.checking = 'middleTokens';
			return true;
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		if (token.name === 'operation' && this.openOperator !== token.value && (token.value === '-' || token.value === '+')) {
			this.listener.checking = 'endToken';
			this.doubleOperators = true;
			return true;
		} else if (['blank', 'end', 'letter', 'especial', 'number'].includes(token.name) || token.value === '(') {
			this.listener.nextPattern({syntax: 'operation', token: token, counter: counter});
			return false;
		} else if (token.name === 'quote' && this.doubleOperators === false && this.openOperator === '+') {
			this.listener.nextPattern({syntax: 'operation', token: token, counter: counter});
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
		if (this.doubleOperators === true && ['blank', 'end', 'letter', 'especial', 'number', 'quote'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'operation', token: token, counter: counter});
			return false;
		} else if (['blank', 'end'].includes(token.name)) {
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
			} else if (['blank', 'end', 'letter', 'especial', 'number', 'NOT', 'quote'].includes(token.name)) {
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
		if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'quote'].includes(token.name)) {
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
		} else if (['blank', 'end', 'letter', 'especial', 'number', 'NOT', 'quote'].includes(token.name)) {
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
		if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT' , 'quote'].includes(token.name)) {
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
		} else if (['blank', 'end', 'letter', 'especial', 'number', 'NOT', 'quote'].includes(token.name)) {
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
		if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'quote'].includes(token.name)) {
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
			} else if (this.two === '=' && ['blank', 'end', 'letter', 'especial', 'number', 'NOT', 'quote'].includes(token.name)) {
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
		if (this.invalid === false && this.three === '=' && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'quote'].includes(token.name)) {
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
		if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'quote'].includes(token.name)) {
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
			if (this.invalid === false && ['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'quote'].includes(token.name)) {
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
		}

		// Condition to start check first operator
		firstToken({token, counter}) {
			if (token.name === 'short-hand') {
				this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'short-hand');
				this.listener.checking = 'endToken';
				return true;
			} else {
				return false;
			}
		}

		// end condition
		endToken({token, counter}) {
			if (['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'quote'].includes(token.name)) {
				this.listener.nextPattern({syntax: 'short-hand', token: token, counter: counter});
				return false;
			} else {
				this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
				return false;
				// Invalid!
				this.invalid = true;
				return true;
			}
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
		if (this.invalid === false && ['blank', 'end', 'especial', 'separator', 'operation', 'quote', 'equal', 'NOT', 'comma', 'number', 'letter'].includes(token.name)) {
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

class DotPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		if (token.name === 'dot') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'dot');
			this.listener.checking = 'endToken';
			return true;
		} else {
			return false;
		}
	}

	// end condition
	endToken({token, counter}) {
		if (this.invalid === false && ['especial', 'quote', 'letter'].includes(token.name)) {
			this.listener.nextPattern({syntax: 'dot', token: token, counter: counter});
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

class ParentesesPattern {
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
		if (this.currentOpenChar === '(') {
			this.listener.candidates = this.listener.candidates.filter(c=> c.name === 'parentheses');
			this.listener.checking = 'middleTokens';
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}
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
		} else if (['blank', 'escape', 'especial', 'quote', 'equal', 'minor-than', 'greater-than', 'NOT', 'AND', 'OR', 'comma', 'short-hand', 'number', 'letter', 'operation', 'dot', 'separator'].includes(token.name)) {
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
				const parameters = new PowerTemplateLexer({text: this.currentParams, counter: this.currentParamsCounter}).syntaxTree.nodes;
				this.listener.nextPattern({syntax: this.anonymous ? 'anonymousFunc' : 'parentheses', token: token, counter: counter, parameters: parameters});
				return false;
			// Allow invoke a second function
			} else if (token.value === '(') {
				// MANUALLY CREATE THE CURRENT NODE
				const parameters = new PowerTemplateLexer({text: this.currentParams, counter: this.currentParamsCounter}).syntaxTree.nodes;
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
		// The open char of the current node
		this.currentOpenChar = this.listener.currentTokens[this.listener.currentTokens.length - 1].value;
		if (this.currentOpenChar === '[' || this.currentOpenChar === '(') {
			if (token.value === ']' || token.value === ')') {
				this.listener.checking = 'endToken';
				this.invalid = token.value === ']' // Dict can't be empty but function can be;
				return true;
			} else if (['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'quote'].includes(token.name)) {
				this.listener.checking = 'middleTokens';
				this.currentParams = this.currentParams + token.value;
				if (this.currentParamsCounter === null) {
					this.currentParamsCounter = counter || null;
				}
				return true;
			} else if ((this.currentOpenChar === '[' && token.value === '[') || (this.currentOpenChar === '(' && token.value === '(')) {
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
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		// Dictionary
		if (this.currentOpenChar === '[' && token.value === ']' && this.innerOpenedObjects === 0) {
			this.listener.checking = 'endToken';
			return true;
		// Function
		} else if (this.currentOpenChar === '(' && token.value === ')' && this.innerOpenedObjects === 0) {
			this.listener.checking = 'endToken';
			return true;
		// This is a functions with parameters, so allow any valid char
		} else if (['blank', 'escape', 'especial', 'quote', 'equal', 'minor-than', 'greater-than', 'NOT', 'AND', 'OR', 'comma', 'short-hand', 'number', 'letter', 'operation', 'dot', 'separator'].includes(token.name)) {
			this.currentParams = this.currentParams + token.value;
			if (this.currentParamsCounter === null) {
				this.currentParamsCounter = counter || null;
			}

			if ((this.currentOpenChar === '[' && token.value === '[') || (this.currentOpenChar === '(' && token.value === '(')) {
				this.innerOpenedObjects = this.innerOpenedObjects + 1;
			} else if ((this.currentOpenChar === '[' && token.value === ']') || (this.currentOpenChar === '(' && token.value === ')')) {
				this.innerOpenedObjects = this.innerOpenedObjects - 1;
			}
			return true;
		} else if (this.innerOpenedObjects >= 0 && token.name === 'end') {
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
			if (['blank', 'end', 'dot', 'operator', 'comma'].includes(token.name)) {
				const parameters = new PowerTemplateLexer({text: this.currentParams, counter: this.currentParamsCounter}).syntaxTree.nodes;
				if (this.currentOpenChar === '[' && this.dictHaveInvalidParams(parameters)) {
					this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
					return false;
				}
				if (this.currentOpenChar === '[') {
					this.listener.currentLabel = this.anonymous ? this.listener.currentLabel : this.listener.firstNodeLabel;
					this.listener.nextPattern({syntax: this.anonymous ? 'dictNode' : 'dictionary', token: token, counter: counter, parameters: parameters});
				} else {
					this.listener.currentLabel = this.anonymous ? 'anonymous' : this.listener.firstNodeLabel;
					this.listener.nextPattern({syntax: this.anonymous ? 'anonymousFunc' : 'function', token: token, counter: counter, parameters: parameters});
				}
				return false;
			// Allow invoke dictionary node
			} else if (this.currentOpenChar === '[' && (token.value === '[' || token.value === '(')) {
				// MANUALLY CREATE THE DICTIONAY NODE
				this.createDictionaryNode({token: token, counter: counter});
				this.currentOpenChar = token.value;
				return true;
			// Allow invoke function node
			} else if (this.currentOpenChar === '(' && (token.value === '[' || token.value === '(')) {
				// MANUALLY CREATE THE FUNCTION NODE
				this.createAnonymousFuncNode({token: token, counter: counter});
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
		let invalid = false;
		// Dictionary can't have empty key
		if (parameters.length === 0) {
			invalid = true;
			return invalid;
		} else {
			// Do some validation to see if have valid keys
			let hasSomeValidToken = false;
			for (const param of parameters) {
				if (param.syntax === 'invalid') {
					invalid = true;
					return invalid;
				} else {
					for (const token of param.tokens) {
						if (['number', 'letter', 'quote', 'especial'].includes(token.name)) {
							hasSomeValidToken = true;
						}
					}
				}
			}
			if (hasSomeValidToken === false) {
				invalid = true;
				return invalid;
			}
		}
		return invalid;
	}

	createDictionaryNode({token, counter}) {
		const parameters = new PowerTemplateLexer({text: this.currentParams, counter: this.currentParamsCounter}).syntaxTree.nodes;
		if (this.dictHaveInvalidParams(parameters)) {
			this.listener.nextPattern({syntax: 'invalid', token: token, counter: counter});
			return false;
		}
		this.listener.currentLabel = this.anonymous ? this.listener.currentLabel : this.listener.firstNodeLabel;
		this.listener.syntaxTree.nodes.push({
			syntax: this.anonymous ? 'dictNode' : 'dictionary',
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

	createAnonymousFuncNode({token, counter}) {
		const parameters = new PowerTemplateLexer({text: this.currentParams, counter: this.currentParamsCounter}).syntaxTree.nodes;
		this.listener.currentLabel = this.anonymous ? 'anonymous' : this.listener.firstNodeLabel;
		this.listener.syntaxTree.nodes.push({
			syntax: this.anonymous ? 'anonymousFunc' : 'function',
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
