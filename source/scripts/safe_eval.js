var teste = 'MARAVILHA';
var teste2 = 'Segunda';
var a = 'charA';
var b = 3;

function two() {
    return 2;
}

function me() {
    return pitinho;
}

function pity_bom2() {
    return 'Meu nome é Pity';
}

// ATENTION the order each patter are apply is very important
const betweenParenthesesRegex = new RegExp(/\([^]*?\)/g);
const functionRegex = new RegExp(/[a-zA-Z_$][a-zA-Z_$0-9 ]*(\([^]*?\))/gm);
const quotedStringRegex = new RegExp(/(["\'`])(?:\\.|[^\\])*?\1/gm);
const mathExpression = new RegExp(/[^A-Za-zÀ-ÖØ-öø-ÿ\n '"`=$&%#@_\-\\|?~,.;:!°\[\]!^+-/*(){}ª]( ){0,}([!^+-/*()]( ){0,}[0-9()]*( ){0,})*/gm);
const varRegex = new RegExp(/\w*[a-zA-Z_$]\w*/gm);

var pitinho = 'Pity o bom';
const text = `3 + 3 = 6 + 3 - b teste \ 'caralho' teste2 pitinho teste2 'dfggdfg' two() + two() = 4 \`se isso\` 2 + 2 * 1 + 1 / 4 a + "funcion" 2 + 2 * (1 + 1) / 4 pity_bom2(), me()`;

let newText = text;

newText = evaluateFunction(newText);

const stringMatchs = newText.match(quotedStringRegex);
newText = newText;
let counter = 0;
for (const string of stringMatchs) {
    newText = newText.replace(string, '$pwSplit$pwString_' + convert(counter) + '$pwSplit');
    counter = counter + 1;
}
newText = evalVariables(newText);
newText = evaluateMath(newText);

console.log('!!!!!!!!!!11 FINAL !!!!', newText);
function evaluateFunction(text) {
    let changedText = text;
    const funcMatchs = changedText.match(functionRegex);

    for (const func of funcMatchs) {
        // Remove everything between parentheses to get the function name
        let funcValue = '';
        const funcMatch = func.match(betweenParenthesesRegex);
        const funcName = func.replace(funcMatch, '');

        if (window[funcName] && window[funcName] instanceof Function) {
            funcValue = window[funcName]();
            changedText = changedText.replace(func, funcValue);
            console.log('funcValue', func, funcName, funcValue);
        }
    }

    return changedText;
}

function evaluateMath(text) {
    const mathEval = new MathEval();
    const mathMatchs = text.match(mathExpression)
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

function evalVariables(text) {
    const originalTextParts = text.split('$pwSplit').filter(i=> i && !i.includes('$pw') && i.replace(' ', ''));
    let changedText = text;
    // Remove any $pw, spaces and empty parts
    let changedTextParts = [...originalTextParts];
    let partIndex = 0;
    for (const part of originalTextParts) {
        const varMatchs = part.match(varRegex);
        if (varMatchs) {
            const splitedParts = part.split(' ');
            let changedSplitedParts = [...splitedParts];
            let splitedIndex = 0;
            for (const splited of splitedParts) {
                const finalMatch = splited.match(varRegex);
                if (splited && finalMatch && finalMatch.length === 1 && finalMatch[0] === splited) {
                    if (window[splited]) {
                        changedSplitedParts[splitedIndex] = changedSplitedParts[splitedIndex].replace(splited, window[splited]);
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
function convert(num) {
    return num
        .toString()    // convert number to string
        .split('')     // convert string to array of characters
        .map(Number)   // parse characters as numbers
        .map(n => (n || 10) + 64)   // convert to char code, correcting for J
        .map(c => String.fromCharCode(c))   // convert char codes to strings
        .join('');     // join values together
}

