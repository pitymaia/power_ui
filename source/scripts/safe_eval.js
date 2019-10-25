// const quotedStringRegex = /([\"'`])(?:\\.|[^\\])*?\1/gm;
const quotedStringRegex = new RegExp(/(["\'`])(?:\\.|[^\\])*?\1/gm);
// const mathExpression = new RegExp(/[^A-Za-zÀ-ÖØ-öø-ÿ\n '"`=][0-9()]*( ){0,}([+-/*()]( ){0,}[0-9()]*( ){0,})*/gm);
const mathExpression = new RegExp(/[^A-Za-zÀ-ÖØ-öø-ÿ\n '"`=]( ){0,}([!^+-/*()]( ){0,}[0-9()]*( ){0,})*/gm);
console.log('quotedStringRegex', quotedStringRegex);

const text = `3 + 3 = 6 teste \`se isso\` 5 "funcion" 2 + 2 * (1 + 1) / 4 ou se isso 'Funfa' e se isso "isso 'funfa' também"
isso "sdfsdf" veja se o pity() funfa
"sdfsdf" agora veremos 2 + 2 se 2+2=4-2 e também 3+3=6 são açáíse 2.5/5*2 por fim 2+2*(1+1)/4`;

const stringMatchs = text.match(quotedStringRegex);
let newText = text;
let counter = 0;
for (const string of stringMatchs) {
    newText = newText.replace(string, '$pwString_' + counter);
    counter = counter + 1;
}

const mathMatchs = text.match(mathExpression);
counter = 0;
for (const expression of mathMatchs) {
    newText = newText.replace(expression, '$pwExpression_' + counter);
    counter = counter + 1;
}

newText = fixSpaces(newText, mathMatchs);

console.log('text', text);
console.log('stringMatchs', stringMatchs);
console.log('mathMatchs', mathMatchs);
console.log('newText', newText);

function fixSpaces(newText, mathMatchs) {
    let counter = 0;
    for (let expression of mathMatchs) {
        if (expression[expression.length-1] === ' ') {
            // Remove the space from the expression
            mathMatchs[counter] = expression.slice(0, -1);
            // Put the space back on the text
            newText = newText.replace('$pwExpression_' + counter, '$pwExpression_' + counter + ' ');
            console.log('expression', `"${expression}"`);
        }
        counter = counter + 1;
    }
    return newText;
}
