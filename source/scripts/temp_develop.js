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
const t0 = performance.now();
let app = new PowerUi({
	routes: [
		{
			id: 'front-page',
			route: '/',
			template: 'front_page.html',
		},
		{
			id: 'power-only',
			route: 'power_only',
			template: 'power_only.html',
		},
		{
			id: 'power-only2',
			route: 'power_only/:id/:name/:title',
			template: 'power_only.html',
		},
		{
			id: 'power-only3',
			route: 'power_only/:id/:name',
			// template: 'power_only.html',
			template: '404.html',
			viewId: 'component-view',
		},
		{
			id: 'component1',
			route: 'component/:name/:title',
			template: 'somecomponent.html',
		},
		{
			id: 'otherwise',
			route: '404',
			template: '404.html',
		}
	],
});
const t1 = performance.now();
console.log("Loaded in " + (t1 - t0) + " milliseconds.");
console.log('app', app);
let myName = 'Eu sou o Pity o bom!';
let oldName = myName;
function pity() {
    return myName;
}
let currentIf = false;
function showIf() {
	currentIf = !currentIf;
	return currentIf;
}
const cats = [
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
const cands = [
	['bala', 'chiclete'],
	['brigadeiro', 'cajuzinho'],
	['bolo', 'torta'],
];

const flowers = {
	Rose: 'Pink',
	Orchidy: 'White',
	Violet: 'Blue',
}
const languages = {
	good: {name: 'Python', kind: 'Not typed'},
	hard: {name: 'Java', kind: 'Typed'},
	bad: {name: 'EcmaScript', kind: 'Not typed'},
	old: {name: 'COBOL', kind: 'Not typed'},
	cool: {name: 'C++', kind: 'typed'},
}
function getCandNumber(currentCand) {
	let count = 1;
	let position = 0;
	for (const group of cands) {
		let innerCount = 0;
		for (const cand of group) {
			if (cand === currentCand) {
				position = count;
				return position;
			}
			if (innerCount === 0) {
				count = count + 1;
				innerCount = innerCount + 1;
			}
		}
		count = count + 1;
	}
}
function changeModel(kind) {
	if (oldName === myName) {
		myName = 'My name is Bond, James Bond!';
	} else {
		const changeName = myName;
		myName = oldName;
		oldName = changeName;
	}
	if (myName == 'My name is Bond, James Bond!') {
		languages.garbage = {name: 'PHP', kind: 'Not typed'};
	} else {
		delete languages.garbage;
	}
	console.log(myName, pity(), 'currentIf', currentIf);
	if (cats.length === 12) {
		console.log('12 gatos', cats[10]);
		cats[10].name = 'Luke';
		cats[10].gender = 'male';
		cats.push({name: 'Floquinho', gender: 'male'});
		cats.push({name: '4 gatinhos', gender: 'unknow'});
		cands.push(['caramelo', 'pirulito']);
		cands.push(['pipoca', 'cocada']);
	} else {
		cats[10].name = 'Florzinha';
		cats[10].gender = 'female';
		cats.pop();
		cands.pop();
	}
	if (kind === 'pwReload') {
		app.pwReload();
	} else if (kind === 'hardRefresh') {
		app.hardRefresh(document);
	} else if (kind === 'softRefresh') {
		app.softRefresh(document);
	}
}
function powerOnly() {
	window.location.replace(app.router.config.rootRoute + 'power_only');
}
function gotoIndex() {
	window.location.replace(app.router.config.rootRoute);
}
function closeModal() {
	window.location.replace(window.location.hash.split('?')[0]);
}
function openModal() {
	let newHash = '?sr=component/andre/aqueda';
	if (!window.location.hash) {
		newHash = '#!/' + newHash;
	}
	window.location.replace(window.location.hash + newHash);
}

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
