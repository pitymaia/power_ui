// class PwcPity extends PowCssHover {
// 	constructor(element) {
// 		super(element);
// 		this.$_pwAttrName = 'data-pwc-pity';
// 		this.element = element;
// 		console.log('pwcPity is alive!', this.$_pwAttrName);
// 	}
// }
// Inject the attr on PowerUi
// _PowerUiBase.injectPwc({name: 'data-pwc-pity', callback: function(element) {return new PwcPity(element);}});
// TODO: testeExtendName is to find a way to modularize multiple extensions
// Make a way to this works as links of a chain
// const testeExtendName = function () {return PowerMenu;};
// class TesteMenu extends testeExtendName {
//  constructor(menu, info) {
//      super(menu);
//      this.testMenu = true;
//      this.descri = info.descri;
//  }
// }

// class TesteUi extends PowerUi {
//  constructor() {
//      super();
//      this.fake = {};
//  }
// }
// let app = new TesteUi();

const someViewTemplate = `<div class="fakemodalback">
	<div class="fakemodal">
		<h1>Cats list</h1>
		<div data-pow-for="cat of cats">
			<div data-pow-css-hover="pw-blue" data-pow-if="cat.gender === 'female'" id="cat_b{{$pwIndex}}_f">{{$pwIndex + 1}} - Minha linda <span data-pow-text="cat.name"></span> <span data-pow-if="cat.name === 'Princesa'">(Favorita!)</span>
			</div>
			<div data-pow-css-hover="pw-orange" data-pow-if="cat.gender === 'male'" id="cat_b{{$pwIndex}}_m">{{$pwIndex + 1}} - Meu lindo {{ cat.name }} <span data-pow-if="cat.name === 'Riquinho'">(Favorito!)</span>
			</div>
			<div data-pow-css-hover="pw-yellow" data-pow-if="cat.gender === 'unknow'" id="cat_b{{$pwIndex}}_u">{{$pwIndex + 1}} - São lindos meus {{ cat.name }}
			</div>
		</div>
		<hr>
		<h1>Ice cream list</h1>
		<div data-pow-for="icecream of [
			{
				flavor: 'Flakes',
				color: 'light-yellow'
			},
			{
				flavor: 'Chocolatte',
				color: 'Brown',
				isFavorite: true
			},
			{
				flavor: 'Lemon',
				color: 'Green',
				isFavorite: false
			}
		]">
			<div data-pow-css-hover="pw-blue" id="ice{{$pwIndex}}_f">{{$pwIndex + 1}} - My delicious icecream of {{icecream.flavor }} is {{ icecream.color }} <span data-pow-if="icecream.isFavorite === true">(My favorite!)</span>
			</div>
		</div>
		<br />
		<button onclick="app.closeModal()">Close</button>
	</div>
</div>`;
var teste = 'MARAVILHA!';

const t0 = performance.now();
let app = new PowerUi({
	routes: [
		{
			id: 'front-page',
			route: '/',
			templateUrl: 'front_page.html',
		},
		{
			id: 'power-only',
			route: 'power_only',
			templateUrl: 'power_only.html',
			staticTemplate: false,
		},
		{
			id: 'power-only2',
			route: 'power_only/:id/:name/:title',
			templateUrl: 'power_only.html',
		},
		{
			id: 'power-only3',
			route: 'power_only/:id/:name',
			// templateUrl: 'power_only.html',
			templateUrl: '404.html',
			viewId: 'component-view',
		},
		{
			id: 'component1',
			route: 'component/:name/:title',
			templateUrl: 'somecomponent.html',
		},
		{
			id: 'simple-template',
			route: 'simple',
			template: someViewTemplate,
		},
		{
			id: 'otherwise',
			route: '404',
			templateUrl: '404.html',
		}
	],
});
const t1 = performance.now();
console.log("Loaded in " + (t1 - t0) + " milliseconds.");
console.log('app', app);
let myName = 'Eu sou o Pity o bom!';
let oldName = myName;
app.pity = function() {
	return myName;
}
console.log(app.pity());
app.pity2 = function(name, phase) {
	return name + ' ' + phase;
}
app.currentIf = false;
app.showIf = function() {
	app.currentIf = !app.currentIf;
	return app.currentIf;
}

app.variable = 'obj';
app.obj = {obj: {obj: 'obj'}};
app.piii = {pity: {pity: 'pity'}};
app.teste = {pity: {obj: true}, lu: {obj: false}};

app.cats = [
	{name: 'Riquinho', gender: 'male'},
	{name: 'Tico', gender: 'male'},
	{name: 'Drew', gender: 'male'},
	{name: 'Kid', gender: 'male'},
	{name: 'Neo', gender: 'male'},
	{name: 'Pingo', gender: 'male'},
	{name: 'Princesa', gender: 'female'},
	{name: 'Lady', gender: 'female'},
	{name: 'Lindinha', gender: 'female'},
	{name: 'Docinho', gender: 'female'},
	{name: 'Florzinha', gender: 'female'},
	{name: 'Laylita', gender: 'female'},
];
app.cands = [
	['bala', 'chiclete'],
	['brigadeiro', 'cajuzinho'],
	['bolo', 'torta'],
];

app.flowers = {
	Rose: 'Pink',
	Orchidy: 'White',
	Violet: 'Blue',
	Daisy: 'Yellow',

}
app.languages = {
	good: {name: 'Python', kind: 'Not typed'},
	hard: {name: 'Java', kind: 'Typed'},
	bad: {name: 'EcmaScript', kind: 'Not typed'},
	old: {name: 'COBOL', kind: 'Not typed'},
	cool: {name: 'C++', kind: 'typed'},
}
app.getCandNumber = function(currentCand) {
	app.candCounter = 1;
	for (const group of app.cands) {
		for (const cand of group) {
			if (cand === currentCand) {
				return app.candCounter;
			}
			app.candCounter = app.candCounter + 1;
		}
	}
	return app.candCounter;
}
app.changeModel = function(kind) {
	if (oldName === myName) {
		myName = 'My name is Bond, James Bond!';
	} else {
		const changeName = myName;
		myName = oldName;
		oldName = changeName;
	}
	if (myName == 'My name is Bond, James Bond!') {
		app.languages.garbage = {name: 'PHP', kind: 'Not typed'};
	} else {
		delete app.languages.garbage;
	}
	app.showIf();
	if (app.cats.length === 12) {
		app.cats[10].name = 'Luke';
		app.cats[10].gender = 'male';
		app.cats.push({name: 'Floquinho', gender: 'male'});
		app.cats.push({name: '4 gatinhos', gender: 'unknow'});
		app.cands.push(['caramelo', 'pirulito']);
		app.cands.push(['pipoca', 'cocada']);
	} else {
		app.cats[10].name = 'Florzinha';
		app.cats[10].gender = 'female';
		app.cats.pop();
		app.cands.pop();
	}
	if (kind === 'pwReload') {
		app.pwReload();
	} else if (kind === 'hardRefresh') {
		app.hardRefresh(document);
	} else if (kind === 'softRefresh') {
		app.softRefresh(document);
	}
}
app.powerOnly = function() {
	window.location.replace(app.router.config.rootRoute + 'power_only');
}
app.gotoIndex = function() {
	window.location.replace(app.router.config.rootRoute);
}
app.closeModal = function() {
	const parts = window.location.hash.split('?');
	let counter = 0;
	let newHash = parts[0];
	for (const part of parts) {
		if (counter > 0 && counter < parts.length - 1) {
			newHash = newHash + '?' + part;
		}
		counter = counter + 1;
	}
	window.location.replace(newHash);
}
app.openModal = function() {
	let newHash = '?sr=component/andre/aqueda';
	if (!window.location.hash) {
		newHash = '#!/' + newHash;
	}
	window.location.replace(window.location.hash + newHash);
}

app.openSimpleTemplate = function() {
	let newHash = '?sr=simple';
	if (!window.location.hash) {
		newHash = '#!/' + newHash;
	}
	console.log('window.location.hash + newHash', window.location.hash + newHash);
	window.location.replace(window.location.hash + newHash);
}

app.catOfCats = function() {
	const catsNode = document.getElementById('catofcats');
	if (catsNode) {
		console.log('child', catsNode);
	}
	// app._events['ready'].unsubscribe(catOfCats);
}

app._events['ready'].subscribe(app.catOfCats);

app.num = function (num) {
	return num;
}

const num = app.num;

app.nSum = function (num1, num2) {
	return num1 + num2;
}

const nSum = app.nSum;
app.nov = {nSum: nSum};

const nov = {nSum: nSum};

app.nMult = function (num1, num2, num3) {
	return (num1 + num2) * num3;
}

const nMult = app.nMult;

function a () {
	return b;
}
const someDict = {aqui: 25, nossa: {cool: {final: 63}}};
function b () {
	return someDict;
}
window.c = {'2d': {e: function() {return function() {return 'eu';};}}};
// const parser = new PowerTemplateParser({text: 'a() === 1 || 1 * 2 === 0 ? "teste" : (50 + 5 + (100/3))'});
// const parser = new PowerTemplateParser({text: 'pity.teste().teste(pity.testador(2+2), pity[a])[dd[f]].teste'});
// const parser = new PowerTemplateParser({text: '2.5+2.5*5-2+3-3*2*8/2+3*(5+2*(1+1)+3)+a()+p.teste+p[3]()().p'});
// const princesa = '2.5+2.5*5-20+3-3*2*8/2+3*5+2*1+1+3-15*2+30';
// const princesa = '2.5*2.5 + 5 + 1 * 2 + 13.75 - 27';
// const princesa = 'fofa[(a ? b : c)]';
// const princesa = 'teste(princesa( { teste: beleza({key: value1, key2: value2}), number: 2+2, dict: pity[teste]["novo"].pity(2+2), "fim": end } ), 2+5, teste())';
// const princesa = 'princesa ? fofa : linda';
// const princesa = 'princesa ? fofa ? gatinha : amorosa : linda';
// const princesa = 'princesa ? fofa : linda ? amorosa : dengosa';
// const princesa = 'princesa ? fofa ? gatinha ? lindinha : fofinha : amorosa[a?b:c] : linda ? sdfsd : ss';

const pitanga = 'olha';
app.pitanga = pitanga;
const morango = 'pen';
const amora = 'inha';
app.pita = {teste: {pi10: 25, func: a}};
const pita = app.pita;
const pity = app.pity;
const testess = 'teste';
app.j = 2;
const j = 2;
app.h = 3;
const h = 3;
app.sdfs = false;
const sdfs = false;
app.falso = false;
const falso = false;
function getValue({value}) {
	return value;
}
function getValue2(value) {
	return value;
}
app.getValue = getValue;
app.getValue2 = getValue2;
app.pArray = [1,2,3,4,5];
const pArray = app.pArray;

// const princesa = '2.5*2.5 + (5 - 2) + (1 * (2 + 5) + 5.75)';
// const princesa = 'j + j - h * j + (j*j*j)*h + 2 + num(16) + nSum(2, 3) * nMult(5, 2 , 6)';
// const princesa = 'j + j - h * j + (j*j*j)*h + 2 + num(16) + nSum(2, 3) * nMult(5, 2 , 6) - nov.nSum(20, 10)';
// const princesa = 'getValue({value: 2+2+4+4-2 + (5+5)}) - j + j - h * j + -+-+-(j*j*j)*-+-+-h *+-2 + num(16) + nSum(2, 3) * nMult(5, 2 , 6) - +-+-+- +-+- +-+-nov.nSum(20, 10) + pita["teste"].pi10 + nov.nSum(20, 10) + pita["teste"].func()().aqui + pita["teste"].func()().nossa.cool["final"]+-+-+-+-+-309';
// const princesa = '+-j*-h+j-h+-2*+20+-35 - + 2 + -pita["teste"].pi10 +-+-+-+-+-+-+-nov.nSum(20, 10) + " pity o bom"';
// const princesa = '-pita["teste"].pi10 +-+-+-+-+-nov.nSum(20, 10)';
// const princesa = 'sdfs || falso || 2 < 1 || 2 === 1 || pitanga';
// const princesa = '2 > 2 && 2 === 2 || 2 === 2 && (j + h) === 6 - 2 || "pity"';
// const princesa = 'getValue({value: 2+2+4+4-2 + (5+5)})';
// const princesa = '[[1,2,3], [j,h,pity], ["pity", "andre", "bred"], [pita, pita.teste, {a: 1, b: 2}, {a: {cor: "verde", preço: 1.25}, b: {cor: "amarelo", preço: 2}, c: [1,2,3,4,5,6],}]]';
// const princesa = 'getValue2(pita["teste"]["pi10"])';
// const princesa = 'getValue2([{a: [1,2,3,4,5,6], b: [3,2,1]}, [], {}])';
app.final = [{flavor: 'Flakes', color: 'light-yellow'}, {flavor: 'Chocolatte', color: 'Brown', isFavorite: true}];
const final = app.final;
const princesa = 'final[0].isFavorite === true';

const value = app.safeEval({text: princesa});
console.log('## AQUI SAFEEVAL:', value, 'EVAL', eval(princesa), 'obj', app.safeEval({text: 'pita.teste.func.a'}));



// if (app.powerTree.allPowerObjsById['pouco_label']) {
// 	if (app.powerTree.allPowerObjsById['mais-top44']) {
// 		setTimeout(function () {
// 			app.powerTree.allPowerObjsById['mais-top44'].powerAction.broadcast('click');
// 			setTimeout(function () {
// 				app.powerTree.allPowerObjsById['novo_menos-top2m44'].powerAction.broadcast('mouseenter');
// 			}, 300);
// 		}, 500);
// 	}
// }
// function clickum() {
// 	console.log('um');
// }
// function clickdois() {
// 	console.log('dois');
// }
// function mouseoverum() {
// 	console.log('mouse over 1');
// }
// function mouseoverdois() {
// 	console.log('mouse over 2');
// }
// function mouseoutum() {
// 	console.log('mouseout 1');
// }
// function mouseoutdois() {
// 	console.log('mouseout 2');
// }
// function clicktres() {
// 	console.log('três');
// 	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'click', fn: clickum });
// 	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'click', fn: clickdois });
// 	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'click', fn: clicktres });
// 	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseover', fn: mouseoverum});
// 	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseover', fn: mouseoverdois});
// 	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseout', fn: mouseoutum});
// 	app.powerTree.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseout', fn: mouseoutdois});
// }
// app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'click', fn: clickum });
// app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'click', fn: clickdois});
// app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'click', fn: clicktres});
// app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseover', fn: mouseoverum});
// app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseover', fn: mouseoverdois});
// app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseout', fn: mouseoutum});
// app.powerTree.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseout', fn: mouseoutdois});
// window.console.log('power', app);
// window.console.log('panel-0-action', app.powerTree.allPowerObjsById['panel-0-action']);
// var teste = function(e) {
// 	console.log('chamou', this);
// 	this.unsubscribe({event: 'mouseover', fn: teste});
// }
// app.powerTree.allPowerObjsById['panel-0-action'].powerAction.subscribe({event: 'mouseover', fn: teste});
