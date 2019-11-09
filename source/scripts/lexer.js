class SyntaxTree {
	constructor() {
		this.tokensListener = new TokensListener();
	}
}

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

// It also detect objects (dictionary and function) and change for FunctionPattern when detect it
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
		// If is some function
		} else if (token.value === '(') {
			this.listener.checking = 'firstToken';
			this.listener.firstNodeLabel = this.listener.currentLabel;
			this.listener.candidates = [{name: 'function', instance: new FunctionPattern(this.listener)}];
			return true;
		// If is some dictionary
		} else if (token.value === '[') {
			this.listener.checking = 'firstToken';
			this.listener.firstNodeLabel = this.listener.currentLabel;
			this.listener.candidates = [{name: 'function', instance: new DictionaryPattern(this.listener)}];
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
			console.log('OperationPattern firstToken', token);
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
		console.log('OperationPattern middleTokens', token);
		if (token.name === 'operation' && this.openOperator !== token.value && (token.value === '-' || token.value === '+')) {
			this.listener.checking = 'endToken';
			this.doubleOperators = true;
			return true;
		} else if (['blank', 'end', 'letter', 'especial', 'number'].includes(token.name)) {
			console.log('endToken', token);
			this.listener.nextPattern({syntax: 'operation', token: token, counter: counter});
			return false;
		} else if (token.name === 'quote' && this.doubleOperators === false && this.openOperator === '+') {
			console.log('endToken', token);
			this.listener.nextPattern({syntax: 'operation', token: token, counter: counter});
			return false;
		} else {
			console.log('INVALID Token', token);
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
			console.log('firstToken', token);
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
				console.log('FINAL = : ', this.one, this.two, this.three, this.invalid);
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

// functions (getAge()) and chain functions (getUser().getAge()) dictionary with methods (user.getAge())
class FunctionPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
		this.nodes = [];
		this.currentOpenChar = null;
		this.currentParams = '';
		this.innerOpenedFunctions = 0;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		// The open char of the current node
		this.currentOpenChar = this.listener.currentTokens[this.listener.currentTokens.length - 1].value;
		console.log('FUNCTION', this.currentOpenChar, token.value);
		if (this.currentOpenChar === '(') {
			if (token.value === ')') {
				this.listener.checking = 'endToken';
				return true;
			} else if (['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'quote'].includes(token.name)) {
				this.listener.checking = 'middleTokens';
				this.currentParams = this.currentParams + token.value;
				return true;
			}
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		// FUNCTION
		if (this.currentOpenChar === '(') {
			if (token.value === ')' && this.innerOpenedFunctions === 0) {
				const parameters = new PowerTemplateLexer({text: this.currentParams});
				this.listener.currentLabel = this.listener.firstNodeLabel;
				this.listener.nextPattern({syntax: 'function', token: token, counter: counter, parameters: parameters});
				return false;
			// This is a functions with parameters, so allow any valid char
			} else if (['blank', 'escape', 'especial', 'quote', 'quote', 'equal', 'minor-than', 'greater-than', 'NOT', 'AND', 'OR', 'comma', 'short-hand', 'number', 'letter', 'operation', 'dot'].includes(token.name)) {
				this.currentParams = this.currentParams + token.value;
				return true;
			} else if (token.name === 'separator') {
				this.currentParams = this.currentParams + token.value;

				if (token.value === '(') {
					this.innerOpenedFunctions = this.innerOpenedFunctions + 1;
				} else if (token.value === ')') {
					this.innerOpenedFunctions = this.innerOpenedFunctions - 1;
				}

				return true;
			}
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
			if (this.currentOpenChar === '(' && ['blank', 'end', 'operator'].includes(token.name)) {
				const parameters = new PowerTemplateLexer({text: this.currentParams});
				this.listener.currentLabel = this.listener.firstNodeLabel;
				this.listener.nextPattern({syntax: 'function', token: token, counter: counter, parameters: parameters});
				return false;
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
class DictionaryPattern {
	constructor(listener) {
		this.listener = listener;
		this.invalid = false;
		this.nodes = [];
		this.currentOpenChar = null;
		this.currentParams = '';
		this.innerOpenedDicts = 0;
	}

	// Condition to start check first operator
	firstToken({token, counter}) {
		// The open char of the current node
		this.currentOpenChar = this.listener.currentTokens[this.listener.currentTokens.length - 1].value;
		console.log('DICTIONARY', this.currentOpenChar, token.value);
		if (this.currentOpenChar === '[') {
			if (token.value === ']') {
				this.listener.checking = 'endToken';
				return true;
			} else if (['blank', 'end', 'letter', 'number', 'especial', 'NOT', 'quote'].includes(token.name)) {
				this.listener.checking = 'middleTokens';
				this.currentParams = this.currentParams + token.value;
				return true;
			}
		} else {
			return false;
		}
	}

	// middle tokens condition
	middleTokens({token, counter}) {
		// FUNCTION
		if (this.currentOpenChar === '[') {
			if (token.value === ']' && this.innerOpenedDicts === 0) {
				const parameters = new PowerTemplateLexer({text: this.currentParams});
				this.listener.currentLabel = this.listener.firstNodeLabel;
				this.listener.nextPattern({syntax: 'dictionary', token: token, counter: counter, parameters: parameters});
				return false;
			// This is a dictionary with parameters, so allow any valid char
			} else if (['blank', 'escape', 'especial', 'quote', 'quote', 'equal', 'minor-than', 'greater-than', 'NOT', 'AND', 'OR', 'comma', 'short-hand', 'number', 'letter', 'operation', 'dot'].includes(token.name)) {
				this.currentParams = this.currentParams + token.value;
				return true;
			} else if (token.name === 'separator') {
				this.currentParams = this.currentParams + token.value;

				if (token.value === '[') {
					this.innerOpenedDicts = this.innerOpenedDicts + 1;
				} else if (token.value === ']') {
					this.innerOpenedDicts = this.innerOpenedDicts - 1;
				}

				return true;
			}
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
			if (this.currentOpenChar === '[' && ['blank', 'end', 'operator'].includes(token.name)) {
				const parameters = new PowerTemplateLexer({text: this.currentParams});
				this.listener.currentLabel = this.listener.firstNodeLabel;
				this.listener.nextPattern({syntax: 'dictionary', token: token, counter: counter, parameters: parameters});
				return false;
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

class TokensListener {
	constructor() {
		this.nodes = [];
		this.currentTokens = [];
		this.currentLabel = '';
		this.start = 0;
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
				return;
			}
		}
	}

	nextPattern({token, counter, syntax, parameters}) {
		this.nodes.push({
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
		console.log('NODES: ', this.syntaxTree.tokensListener.nodes);
	}

}
