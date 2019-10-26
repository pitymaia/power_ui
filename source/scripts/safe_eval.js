var teste = 'MARAVILHA';
var teste2 = 'Segunda';
var a = 'charA';
// ATENTION the order each patter are apply is very important
const functionRegex = new RegExp(/[a-zA-Z_$][a-zA-Z_$0-9 ]*(\([^]*?\))/gm);
const quotedStringRegex = new RegExp(/(["\'`])(?:\\.|[^\\])*?\1/gm);
const mathExpression = new RegExp(/[^A-Za-zÀ-ÖØ-öø-ÿ\n '"`=$&%#@_\-\\|?~,.;:!°\[\]!^+-/*(){}ª]( ){0,}([!^+-/*()]( ){0,}[0-9()]*( ){0,})*/gm);
const varRegex = new RegExp(/\w*[a-zA-Z_$]\w*/gm);

const pitinho = 'Pity o bom'
const text = `3 + 3 = 6 teste \ ^~/°;:.,!@# teste2 $%\/&*(({}[]ª_-+=| $& \`se isso\` a + "funcion" 2 + 2 * (1 + 1) / 4 pity() pity2('pity', 'o bom')`;

let newText = text;
const funcMatchs = newText.match(functionRegex);
console.log('funcMatchs', funcMatchs);
let counter = 0;
for (const func of funcMatchs) {
    newText = newText.replace(func, '$pwSplit$pwFunc_' + convert(counter) + '$pwSplit');
    counter = counter + 1;
}

console.log('newText', newText);

const stringMatchs = newText.match(quotedStringRegex);
newText = newText;
counter = 0;
for (const string of stringMatchs) {
    newText = newText.replace(string, '$pwSplit$pwString_' + convert(counter) + '$pwSplit');
    counter = counter + 1;
}

console.log('!!!!! BEFORE VAR!!!!', newText);

const varMatchs = text.match(varRegex);
let newTextWithoutVars = newText;
counter = 0;
for (const variable of varMatchs) {
    newTextWithoutVars = newTextWithoutVars.replace(variable, 'removed');
    counter = counter + 1;
}

console.log('newText VAR!!!!', newText);

const mathMatchs = newTextWithoutVars.match(mathExpression);
counter = 0;
for (const expression of mathMatchs) {
    newText = newText.replace(expression, '$pwSplit$pwExpression_' + convert(counter) + '$pwSplit');
    counter = counter + 1;
}

newText = fixSpaces(newText, mathMatchs);

console.log('mathMatchs', mathMatchs);
console.log('!!!!!!!!!!11 FINAL !!!!', newText);

const textParts = newText.split('$pwSplit');

identifyVariables(textParts);

function fixSpaces(newText, mathMatchs) {
    let counter = 0;
    for (let expression of mathMatchs) {
        if (expression[expression.length-1] === ' ') {
            // Remove the space from the expression
            mathMatchs[counter] = expression.slice(0, -1);
            // Put the space back on the text
            newText = newText.replace('$pwExpression_' + convert(counter) + '$pwSplit', '$pwExpression_' + convert(counter) + '$pwSplit ');
        }
        counter = counter + 1;
    }
    return newText;
}


function identifyVariables(textParts) {
    // Remove any $pw, spaces and empty parts
    const newParts = textParts.filter(i=> i && !i.includes('$pw') && i.replace(' ', ''));
    for (const part of newParts) {
        const varMatchs = part.match(varRegex);
        if (varMatchs) {
            const splitedParts = part.split(' ');
            for (const splited of splitedParts) {
                const finalMatch = splited.match(varRegex);
                if (splited && finalMatch && finalMatch.length === 1 && finalMatch[0] === splited) {
                    console.log('splited', splited, finalMatch, window[splited]);
                    if (window[splited]) {
                        console.log('VARIABLE ' + splited + ' = ', window[splited]);
                    }
                }
            }
        }
        console.log('part', part, varMatchs);
    }

    console.log('newParts', newParts);
}

function convert(num) {
    return num
        .toString()    // convert number to string
        .split('')     // convert string to array of characters
        .map(Number)   // parse characters as numbers
        .map(n => (n || 10) + 64)   // convert to char code, correcting for J
        .map(c => String.fromCharCode(c))   // convert char codes to strings
        .join('');     // join values together
}

