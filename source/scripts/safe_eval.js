window.teste = 'MARAVILHA';
window.teste2 = 'Segunda';
window.a = 'charA';
window.b = 3;

function two() {
	return 2;
}

function me() {
	return pitinho;
}

function pity_bom2() {
	return 'Meu nome é Pity';
}


var pitinho = 'Pity o bom';
const text = `3 + 3 = 6 + 3 - b teste \ 'caralho' teste2 pitinho teste2 'dfggdfg' two() + two() = 4 \`se isso\` 2 + 2 * 1 + 1 / 4 a + "funcion" 2 + 2 * (1 + 1) / 4 pity_bom2(), me()`;

class SafeEval {
	constructor() {
		this.plusSignWithSpaces = new RegExp(/\s*[\+]\s*/gm);
		this.intFloatRegex = new RegExp(/(\d+(\.\d+)?)/gm);
		this.betweenParenthesesRegex = new RegExp(/\([^]*?\)/g);
		this.functionRegex = new RegExp(/[a-zA-Z_$][a-zA-Z_$0-9 ]*(\([^]*?\))/gm);
		this.quotedStringRegex = new RegExp(/(["\'`])(?:\\.|[^\\])*?\1/gm);
		this.mathExpression = new RegExp(/[^A-Za-zÀ-ÖØ-öø-ÿ\n '"`=$&%#@_\-\\|?~,.;:!°\[\]!^+-/*(){}ª]( ){0,}([!^+-/*()]( ){0,}[0-9()]*( ){0,})*/gm);
		this.varRegex = new RegExp(/\w*[a-zA-Z_$]\w*/gm);

		// Hold the final values to replace
		this.dictNames = ['$pwVar_', '$pwNumber_', '$pwString_', '$pwFunc_'];
		for (const name of this.dictNames) {
			this[name] = {};
		}
	}

	replaceValueInDict(text) {
		let changedText = text;
		for (const dictName of this.dictNames) {
			for (const key of Object.keys(this[dictName] || {})) {
				changedText = changedText.replace(dictName + key, this[dictName][key]);
			}
		}
		return changedText;
	}

	evaluate(text) {
		// ATENTION the order each patter are apply is very important
		let newText = text;

		newText = this.evaluateFunction(newText);

		newText = this.replaceStrings(newText);

		newText = this.evalVariables(newText);
		newText = this.evaluateMath(newText);

		newText = this.replaceNumbers(newText);

		newText = this.concatenate(newText);

		newText = this.replaceValueInDict(newText);

		// Clean text from helper string
		newText = newText.replace(/\$pwSplit/gm, '');
		console.log('!!!!!!!!!!!! ANTES !!!!', text);
		console.log('!!!!!!!!!!11 FINAL !!!!', newText);
	}

	// Concatenate any remaining plus sign (+) by removing it with the surround spaces
	concatenate(text) {
		let changedText = text;
		const plusMatchs = changedText.match(this.plusSignWithSpaces)  || [];
		for (const plus of plusMatchs) {
			changedText = changedText.replace(plus, '');
		}

		return changedText;
	}

	replaceNumbers(text) {
		let changedText = text;
		const numberMatchs = changedText.match(this.intFloatRegex) || [];
		let counter = 0;
		for (const number of numberMatchs) {
			const sufix = this.convert(counter);
			changedText = changedText.replace(number, '$pwSplit$pwNumber_' + sufix + '$pwSplit');
			this.$pwNumber_[sufix] = number;
			counter = counter + 1;
		}
		return changedText;
	}

	replaceStrings(text) {
		let changedText = text;
		const stringMatchs = changedText.match(this.quotedStringRegex) || [];
		let counter = 0;
		for (const string of stringMatchs) {
			const sufix = this.convert(counter);
			changedText = changedText.replace(string, '$pwSplit$pwString_' + sufix + '$pwSplit');
			this.$pwString_[sufix] = string;
			counter = counter + 1;
		}
		return changedText;
	}

	evaluateFunction(text) {
		let changedText = text;
		const funcMatchs = changedText.match(this.functionRegex) || [];

		let counter = 0;
		for (const func of funcMatchs) {
			// Remove everything between parentheses to get the function name
			let funcValue = '';
			const funcMatch = func.match(this.betweenParenthesesRegex) || [];
			const funcName = func.replace(funcMatch, '');

			if (window[funcName] && window[funcName] instanceof Function) {
				funcValue = window[funcName]();
				if (isNaN(funcValue)) {
					const sufix = this.convert(counter);
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

	evaluateMath(text) {
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

	evalVariables(text) {
		const originalTextParts = text.split('$pwSplit').filter(i=> i && !i.includes('$pw') && i.replace(' ', ''));
		let changedText = text;
		// Remove any $pw, spaces and empty parts
		let changedTextParts = [...originalTextParts];
		let partIndex = 0;
		let counter = 0;
		for (const part of originalTextParts) {
			const varMatchs = part.match(this.varRegex) || [];
			if (varMatchs) {
				const splitedParts = part.split(' ');
				let changedSplitedParts = [...splitedParts];
				let splitedIndex = 0;
				for (const splited of splitedParts) {
					const finalMatch = splited.match(this.varRegex) || [];
					if (splited && finalMatch && finalMatch.length === 1 && finalMatch[0] === splited) {
						const varValue = window[splited];
						if (varValue !== undefined) {
							if (isNaN(varValue)) {
								const sufix = this.convert(counter);
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

		console.log('!!!!!!!!! changedText !!!!!!!!!!!', changedText);
		return changedText;
	}

	// Convert number to char
	convert(num) {
		return num
			.toString()    // convert number to string
			.split('')     // convert string to array of characters
			.map(Number)   // parse characters as numbers
			.map(n => (n || 10) + 64)   // convert to char code, correcting for J
			.map(c => String.fromCharCode(c))   // convert char codes to strings
			.join('');     // join values together
	}
}

const safeEval = new SafeEval();
safeEval.evaluate(text);
