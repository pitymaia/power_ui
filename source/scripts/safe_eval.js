class SafeEval {
	constructor({funcParamsMode, $powerUi}) {
		this.$powerUi = $powerUi;
		// Allow determine if is evaluating funcion parameters to deal with callback functions pass as parameters
		this.funcParamsMode = funcParamsMode ? true : false;
		// Regex
		// this.dictionaryRegex = new RegExp(/([^ ])+\.([^ ])+/gm);
		this.dictionaryRegex = new RegExp(/([^ ])+\.([^ ])+|([^ ])*\[([^\]]*)\]([^ ])*/gm);
		this.plusSignWithSpaces = new RegExp(/\s*[\+]\s*/gm);
		this.intFloatRegex = new RegExp(/(\d+(\.\d+)?)/gm);
		this.betweenParenthesesRegex = new RegExp(/\([^\)]*\((.*)\)[^\(]*\)|\((.*?)*\)/gm); // Only works with a single function each time
		// this.functionRegex = new RegExp(/[a-zA-Z_$][a-zA-Z_$0-9 ]*(\([^]*?\))/gm);
		this.functionRegex = new RegExp(/[a-zA-Z_$][a-zA-Z_$0-9 ]*\([^\)]*\((.*)\)[^\(]*\)|[a-zA-Z_$][a-zA-Z_$0-9 ]*(\([^]*?\))/gm);
		this.quotedStringRegex = new RegExp(/(["\'`])(?:\\.|[^\\])*?\1/gm);
		// this.mathExpression = new RegExp(/[^A-Za-zÀ-ÖØ-öø-ÿ\n '"`=$&%#@_\-\\|?~,.;:!°\[\]!^+-/*(){}ª]( ){0,}([!^+-/*()]( ){0,}[0-9()]*( ){0,})*/gm);
		this.mathExpression = new RegExp(/[^\D]( ){0,}([!^+-/*()]( ){0,}[0-9()]*( ){0,})*/gm);
		this.varRegex = new RegExp(/\w*[a-zA-Z_$]\w*/gm);

		// Hold the final values to replace
		this.dictNames = ['$pwVar_', '$pwNumber_', '$pwString_', '$pwFunc_'];
		this._createCleanDicts();
	}

	_createCleanDicts() {
		for (const name of this.dictNames) {
			this[name] = {};
		}
	}

	_replaceValueInDict(text) {
		let changedText = text;
		for (const dictName of this.dictNames) {
			for (const key of Object.keys(this[dictName] || {})) {
				changedText = changedText.replace(dictName + key, this[dictName][key]);
			}
		}
		return changedText;
	}

	// Find a giver var in controller, app or temp scope
	getVarInScope({name, scope}) {
		if (scope) {
			return scope[name];
		} else {
			return this.$powerUi[name];
		}
	}

	_evaluateDictionary(text) {
		let changedText = text;
		const quotes = ["'", "`", '"', '['];

		const dictMatch = text.match(this.dictionaryRegex) || [];

		for (const match of dictMatch) {
			let value = null;
			// dictionaryRegex may get quoted string, so only evaluate if not a quoted string
			if (!quotes.includes(match[0]) && !quotes.includes(match[match.length-1])) {
				const dictParts = this.getDictParts(match);
				let counter = 0;
				for (let part of dictParts) {
					if (counter === 0) {
						value = this.getVarInScope({name: part});
					} else {
						// TODO: Need deals with the case if the object key is a variable
						if(!quotes.includes(part[0])) {
							// Evaluate the function parameters
							const recursiveEval = new SafeEval({$powerUi: this.$powerUi});
							part = recursiveEval.evaluate(part);
						}
						value = this.getVarInScope({name: part.replace(/[\"\'\`]/gm, ''), scope: value});
					}
					counter = counter + 1;
				}
				// Add quotes to value so its not evaluate as variable anymore
				value = `"${value}"`;
				changedText = changedText.replace(match, value);
			}
		}

		return changedText;
	}

	// Get part of both kinds of dicts (house.room.asset) or (house["room"]["asset"])
	getDictParts(expression) {
		const parts = [];
		let part = '';
		let brackets = 0;
		let lastDivider = '';
		for (const char of expression) {
			if (char === '.' && brackets === 0) {
				lastDivider = '.';
				// If using dot notation add quotes to the part name if not the first one
				if (parts.length !== 0 && !part.includes('.') && !part.includes('[')) {
					part = `"${part}"`;
				}
				parts.push(part);
				part = '';
			} else if (char === ']' && brackets === 0) {
				part = part + char;
				parts.push(part);
				part = '';
			} else {
				if (char === ']' && brackets > 0) {
					lastDivider = ']';
					brackets = brackets - 1;
					if (brackets !== 0) {
						part = part + char;
					}
				} else if (char !== '.' && char !== '[' && char !== ']') {
					part = part + char;
				} else if (char === ']' && brackets === 0) {
					part = part + char;
				} else if (brackets > 0) {
					part = part + char;
				}
			}

			if (char === '[') {
				if (brackets === 0) {
					parts.push(part);
					part = '';
				}
				brackets = brackets + 1;
			}
		}
		// If using dot notation add quotes to the part name if not the first one
		if (lastDivider === '.' && parts.length !== 0 && !part.includes('.') && !part.includes('[')) {
			part = `"${part}"`;
		}

		parts.push(part);
		return parts;
	}

	evaluate(text) {
		// ATENTION the order each patter are apply is very important
		let newText = text;

		newText = this._evaluateFunction(newText);

		newText = this._evaluateDictionary(newText);

		newText = this._replaceStrings(newText);

		newText = this._evalVariables(newText);
		newText = this._evaluateMath(newText);

		newText = this._replaceNumbers(newText);

		newText = this._concatenate(newText);

		newText = this._replaceValueInDict(newText);

		// Clean text from helper string
		newText = newText.replace(/\$pwSplit/gm, '');
		// Clean the current dicts with values
		this._createCleanDicts();

		return newText;
	}

	// Concatenate any remaining plus sign (+) by removing it with the surround spaces
	_concatenate(text) {
		let changedText = text;
		const plusMatchs = changedText.match(this.plusSignWithSpaces)  || [];
		for (const plus of plusMatchs) {
			changedText = changedText.replace(plus, '');
		}

		return changedText;
	}

	_replaceNumbers(text) {
		let changedText = text;
		const numberMatchs = changedText.match(this.intFloatRegex) || [];
		let counter = 0;
		for (const number of numberMatchs) {
			const sufix = this._convert(counter);
			changedText = changedText.replace(number, '$pwSplit$pwNumber_' + sufix + '$pwSplit');
			this.$pwNumber_[sufix] = number;
			counter = counter + 1;
		}
		return changedText;
	}

	_replaceStrings(text) {
		let changedText = text;
		const stringMatchs = changedText.match(this.quotedStringRegex) || [];
		let counter = 0;
		for (const string of stringMatchs) {
			const sufix = this._convert(counter);
			changedText = changedText.replace(string, '$pwSplit$pwString_' + sufix + '$pwSplit');
			this.$pwString_[sufix] = string.substring(1, string.length-1);
			counter = counter + 1;
		}
		return changedText;
	}

	_evaluateFunction(text) {
		let changedText = text;
		const funcMatchs = changedText.match(this.functionRegex) || [];

		let counter = 0;
		for (const func of funcMatchs) {
			// Remove everything between parentheses to get the function name
			let funcValue = '';
			const funcMatch = func.match(this.betweenParenthesesRegex) || [];
			const funcName = func.replace(funcMatch, '');
			const funcObject = this.getVarInScope({name: funcName});
			if (funcObject && funcObject instanceof Function) {
				// If function have no params
				if (funcMatch[0] === '()') {
					// Just call the function
					funcValue = funcObject();
				} else {
					// Get the params without the first and last parentheses ()
					let params = funcMatch[0].substring(1, funcMatch[0].length-1);
					// Temporarily replace any string to remove spaces from params
					const stringMatchs = params.match(this.quotedStringRegex) || [];
					let counter = 0;
					for (const string of stringMatchs) {
						params = params.replace(string, '$pwTemp_' + counter);
						counter = counter + 1;
					}
					// Remove any spaces
					params = params.replace(/\s/g, '');
					// Add the strings back to params
					counter = 0;
					for (const string of stringMatchs) {
						params = params.replace('$pwTemp_' + counter, string);
						counter = counter + 1;
					}
					// Evaluate the function parameters
					const recursiveEval = new SafeEval({funcParamsMode: true, $powerUi: this.$powerUi});
					const argsList = recursiveEval.evaluate(params).split(',');
					funcValue = this._runFunctionWithArgs(funcObject, argsList);
				}
				if (isNaN(funcValue)) {
					const sufix = this._convert(counter);
					changedText = changedText.replace(func, '$pwSplit$pwFunc_' + sufix + '$pwSplit');
					this.$pwFunc_[sufix] = funcValue;
					counter = counter + 1;
				} else {
					changedText = changedText.replace(func, funcValue);
				}
			}
		}

		return changedText;
	}

	_runFunctionWithArgs(f) {
		// use splice to get all the arguments after 'f'
		const args = Array.prototype.splice.call(arguments, 1);
		const newArgs = [];
		for (const arg of args[0]) {
			// Pass callback function as arguments
			if (arg.includes('$pwFuncName_')) {
				const funcName = arg.replace('$pwFuncName_', '');
				const funcObject = this.getVarInScope({name: funcName});
				newArgs.push(funcObject);
			} else {
				newArgs.push(arg);
			}
		}
		return f.apply(null, newArgs);
	}

	_evaluateMath(text) {
		const mathEval = new MathEval();
		const mathMatchs = text.match(this.mathExpression) || [];
		let changedText = text;
		for (let expression of mathMatchs) {
			// the regex let pass some expressions like "2 + 2 - " and also with the final space
			// So wee fix it by removing any char intil the las number so the new expression is "2 + 2"
			let needFix = true;
			while (needFix) {
				if (expression[expression.length-1] !== ')' && !parseInt(expression[expression.length-1])) {
					// Remove the space from the expression
					expression = expression.slice(0, -1);
				} else {
					needFix = false;
				}
			}
			const value = mathEval.calculate(expression);
			changedText = changedText.replace(expression, value);
		}

		return changedText;
	}

	_evalVariables(text) {
		const originalTextParts = text.split('$pwSplit').filter(i=> i && !i.includes('$pw') && i.replace(' ', ''));
		let changedText = text;
		// Remove any $pw, spaces and empty parts
		let changedTextParts = [...originalTextParts];
		let partIndex = 0;
		let counter = 0;
		for (const part of originalTextParts) {
			const varMatchs = part.match(this.varRegex) || [];
			if (varMatchs) {
				const splitedParts = part.split(/[\s,]+/); // Split space or comma
				let changedSplitedParts = [...splitedParts];
				let splitedIndex = 0;
				for (const splited of splitedParts) {
					const finalMatch = splited.match(this.varRegex) || [];
					if (splited && finalMatch && finalMatch.length === 1 && finalMatch[0] === splited) {
						let varValue = '';
						const varObject = this.getVarInScope({name: splited});
						if (this.funcParamsMode && varObject && varObject instanceof Function) {
							varValue = `$pwFuncName_${splited}`;
						} else {
							varValue = varObject;
						}
						if (varValue !== undefined) {
							if (isNaN(varValue)) {
								const sufix = this._convert(counter);
								changedSplitedParts[splitedIndex] = changedSplitedParts[splitedIndex].replace(
									splited, '$pwSplit$pwVar_' + sufix + '$pwSplit');
								this.$pwVar_[sufix] = varValue;
								counter = counter + 1;
							} else {
								changedSplitedParts[splitedIndex] = changedSplitedParts[splitedIndex].replace(splited, varValue);
							}
						}
					}
					changedTextParts[partIndex] = changedTextParts[partIndex].replace(splitedParts[splitedIndex], changedSplitedParts[splitedIndex]);
					splitedIndex = splitedIndex + 1;
				}
			}
			changedText = changedText.replace(originalTextParts[partIndex], changedTextParts[partIndex]);
			partIndex = partIndex + 1;
		}
		return changedText;
	}

	// Convert number to char
	_convert(num) {
		return num
			.toString()    // convert number to string
			.split('')     // convert string to array of characters
			.map(Number)   // parse characters as numbers
			.map(n => (n || 10) + 64)   // convert to char code, correcting for J
			.map(c => String.fromCharCode(c))   // convert char codes to strings
			.join('');     // join values together
	}

	// remove functions, arrow functions, document.*() and window.*(), script and more
	sanitizeEntry(entry, noLimit) {
		if (!noLimit && entry.length > 250) {
			console.log('Sorry, for security reasons the expressions used in the template cannot contain more than 250 characters.', entry);
			return;
		}
		const REGEXLIST = [
			/function[^]*?\)/gm,
			/function /gm,
			/defineProperty/gm,
			/prototype/gm,
			/Object\./gm,
			/=>[^]*?/gm,
			/=>/gm,
			/localStorage/gm,
			/window[^]*?\)/gm,
			/window[^]*?\]/gm,
			/window /gm,
			/window\./gm,
			/this[^]*?\)/gm,
			/this[^]*?\]/gm,
			/this /gm,
			/this\./gm,
			/document[^]*?\)/gm,
			/document /gm,
			/document\./gm,
			/while[^]*?\)/gm,
			/while /gm,
			/cookie/gm,
			/write[^]*?\)/gm,
			/write /gm,
			/alert[^]*?\)/gm,
			/eval[^]*?\)/gm,
			/eval\(/gm,
			/eval /gm,
			/request[^]*?\)/gm,
			/request /gm,
			/ajaxRequest/gm,
			/loadTemplateUrl/gm,
			/XMLHttpRequest/gm,
			/setRequestHeader/gm,
			/new[^]*?\)/gm,
			/new /gm,
			/script/gm,
			/var [^]*?\=/gm,
			/var /gm,
			/let [^]*?\=/gm,
			/let /gm,
			/const [^]*?\=/gm,
			/const /gm,
		];

		let newEntry = entry;

		for (const regex of REGEXLIST) {
			const match = newEntry.match(new RegExp(regex));
			if (match && match.length) {
				console.log('The template interpolation removes some danger or not allowed entry: ', newEntry);
				newEntry = '';
			}
		}
		return newEntry;
	}
}
