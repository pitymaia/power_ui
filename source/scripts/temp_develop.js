"use strict";

import { PowerUi, PowerController, PowerModal, PowerConfirm, PowerWindow, PowerWindowIframe, PowerTemplate } from './power_ui.js';
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
const someViewTemplate = `<h1>Cats list</h1>
			<div data-pow-for="cat of cats">
				<div data-pow-css-hover="pw-blue" data-pow-if="cat.gender === 'female'" id="cat_b{{$pwIndex}}_f">{{$pwIndex + 1}} - Minha linda <span data-pow-eval="cat.name"></span> <span data-pow-if="cat.name === 'Princesa'">(Favorita!)</span>
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
				<div class="some{{2+3}}" data-pow-css-hover="pw-blue" id="ice{{3*(3 + $pwIndex)}}_f">{{$pwIndex + 1}} - My delicious icecream of {{icecream.flavor }} is {{ icecream.color }} <span data-pow-if="icecream.isFavorite === true">(My favorite!)</span>
				</div>
			</div>
			<button class="pw-btn-default" data-pow-event onclick="refresh()">Refresh</button>`;
var teste = 'MARAVILHA!';

class FrontPage extends PowerController {

	ctrl() {
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

		this.pitanga = 'olha';
		this.morango = 'pen';
		this.amora = 'inha';
		this.pita = {teste: {pi10: 25, func: a}};
		this.testess = 'teste';
		this.j = 2;
		this.h = 3;
		this.sdfs = false;
		this.falso = false;
		this.pArray = [1,2,3,4,5];

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
		// this.final = [{flavor: 'Flakes', color: 'light-yellow'}, {flavor: 'Chocolatte', color: 'Brown', isFavorite: true}];
		// this.princesa = '2+2-1+(2*3)+10';

		// const value = this.safeEval(princesa);
	}

	getValue({value}) {
		return value;
	}

	getValue2(value) {
		return value;
	}

	onViewLoad(view) {

	}

	openModal(params) {
		this.openRoute({
			params: params,
			routeId: 'component1',
			target: '_blank',
		});
	}

	openSimpleModal() {
		this.openRoute({
			routeId: 'simple-template',
			target: '_blank',
		});
	}

	gotoPowerOnly() {
		this.openRoute({
			routeId: 'power-only',
		});
	}
}

class PowerOnlyPage extends PowerController {
	ctrl({lock, $powerUi}) {
		this.next = 0;
		this.cats = [
			{name: 'Sol', gender: 'female'},
			{name: 'Lion', gender: 'male'},
			{name: 'Duque', gender: 'male'},
			{name: 'Tiger', gender: 'male'},
			{name: 'Pingo', gender: 'male'},
			{name: 'Meg', gender: 'female'},
			{name: 'Princesa', gender: 'female'},
			{name: 'Lady', gender: 'female'},
			{name: 'Lindinha', gender: 'female'},
			{name: 'Docinho', gender: 'female'},
			{name: 'Florzinha', gender: 'female'},
			{name: 'Laylita', gender: 'female'},
		];
		console.log('changeModel', this.cats.length);
	}

	jsonViews() {
		this.openRoute({
			routeId: 'json-views',
			target: '_blank',
		});
	}

	changeModel(kind) {
		if (this.oldName === this.myName) {
			this.myName = 'My name is Bond, James Bond!';
		} else {
			this.changeName = this.myName;
			this.myName = this.oldName;
			this.oldName = this.changeName;
		}
		if (this.cats.length === 12) {
			this.cats[10].name = 'Luke';
			this.cats[10].gender = 'male';
			this.cats.push({name: 'Floquinho', gender: 'male'});
			this.cats.push({name: '4 gatinhos', gender: 'unknow'});
		} else {
			this.cats[10].name = 'Florzinha';
			this.cats[10].gender = 'female';
			this.cats.pop();
		}
		if (kind === 'pwReload') {
			this.$powerUi.pwReload();
		} else if (kind === 'hardRefresh') {
			this.$powerUi.hardRefresh(document);
		} else if (kind === 'softRefresh') {
			this.refresh();
		}
		console.log('changeModel', this.cats.length);
	}

	onViewLoad(view) {

	}

	openSimpleModal() {
		this.openRoute({
			routeId: 'simple-template',
			target: '_blank',
		});
	}

	openWindow() {
		const self = this;
		this.openRoute({
			routeId: 'some-window',
			target: '_blank',
			params: {id: self.cats[self.next].name},
		});
	}

	openSimpleDialog() {
		// this.openRoute({
		// 	routeId: 'simple-dialog',
		// 	target: '_blank',
		// });

		this.$service('widget').windowIframe({
			title: 'Template dialog',
			url: 'http://localhost:3002',
			controller: function() {
				console.log('CONTROLLER IFRAME');
			}
		});

		// this.$service('widget').yesno({
		// 	title: 'Template dialog',
		// 	templateComponent: SimpleTemplate,
		// 	controller: function() {
		// 		console.log(this.$tscope.pity);
		// 	}
		// });
		const self = this;

		// this.$service('widget').open({
		// 	kind: 'yesno',
		// 	title: 'YesNo dialog',
		// 	template: '<p>This is a Yes or No dialog</p>',
		// 	// params: {commitBt: {label: 'Save', ico: 'check'},  cancelBt: true},
		// 	// controller: function () {
		// 	// 	this.cats = [
		// 	// 		{name: 'Riquinho', gender: 'male'},
		// 	// 		{name: 'Princesa', gender: 'female'},
		// 	// 		{name: 'Pingo', gender: 'male'},
		// 	// 	]
		// 	// },
		// 	onCommit: function(resolve, reject, value) {
		// 		console.log('Thanks for commiting with me.', value);
		// 		resolve();
		// 	},
		// 	onCancel: function(resolve) {
		// 		console.log('This is sad...');
		// 		resolve();
		// 	}
		// });
	}

	test() {
		console.log('mouseover!');
	}

	gotoIndex() {
		this.openRoute({
			routeId: 'front-page'
		});
	}

	openModal(params) {
		this.openRoute({
			params: params,
			routeId: 'component1',
			target: '_blank',
		});
	}
}

class SimpleModal extends PowerModal {
	init() {
		this.commitBt = {
			label: 'Close',
		}

		const tree = [
			{
				name: "test",
				fullName: "test",
				extension: "",
				path: "/home/andre/test",
				kind: "folder",
				content: [
					{
						name: "media",
						fullName: "media",
						extension: "",
						path: "/home/andre/test/media",
						kind: "folder",
						content: [
							{
								name: "brand",
								fullName: "brand.png",
								extension: ".png",
								path: "/home/andre/test/media/brand.png",
								kind: "file",
							},
						]
					},
				]
			},
			{
				name: "frontpage",
				fullName: "frontpage.js",
				extension: ".js",
				path: "/home/andre/frontpage.js",
				kind: "file",
			},
			{
				name: "scripts",
				fullName: "scripts",
				extension: "",
				path: "/home/andre/scripts",
				kind: "folder",
				content: [
					{
						name: "index",
						fullName: "index.js",
						extension: ".js",
						path: "/home/andre/scripts/index.js",
						kind: "file",
					},
					{
						name: "zendex",
						fullName: "zendex.html",
						extension: ".html",
						path: "/home/andre/scripts/zendex.html",
						kind: "file",
					},
				]
			},
			{
				name: "default-template",
				fullName: "default-template.html",
				extension: ".html",
				path: "/home/andre/default-template.html",
				kind: "file",
			},
		];

		this.addAfterTemplate = '<div style="text-align:left;">' + this.$powerUi.treeTemplate(tree) + '</div>';
	}

	ctrl({lock, $powerUi}) {
		this.cats = [
			{name: 'Sol', gender: 'female'},
			{name: 'Lion', gender: 'male'},
			{name: 'Duque', gender: 'male'},
			{name: 'Tiger', gender: 'male'},
			{name: 'Pingo', gender: 'male'},
			{name: 'Meg', gender: 'female'},
			{name: 'Lindinha', gender: 'female'},
			{name: 'Laylita', gender: 'female'},
		];
	}

	onViewLoad(view) {
	}
}

class SimpleTemplate extends PowerTemplate {
	template(resolve, reject) {
		const self = this;
		this.$powerUi.request({
				url: '/some-window.html',
				method: 'GET',
				status: "Loading page",
		}).then(function (response, xhr) {
			let tmpEl = document.createElement("div");
			tmpEl.innerHTML = response;
			const treeGrid = tmpEl.getElementsByClassName('grid-flex')[0];
			tmpEl = document.createElement("div");
			tmpEl.innerHTML = '<h1>Pity o bom</h1>';
			tmpEl.appendChild(treeGrid);
			self.pity = "Pity o bom";
			resolve(tmpEl.innerHTML);
		}).catch(function (response, xhr) {
			console.log('SimpleTemplate', response, xhr);
			reject();
		});
	}
}

class SimpleDialog extends PowerWindow {

	// init() {
	// 	this.commitBt = {
	// 		label: 'Yes',
	// 		// ico: 'check',
	// 	};
	// 	this.noBt = {};
	// 	this.cancelBt = {
	// 		label: 'Cancel',
	// 		// ico: 'close',
	// 	};
	// }

	ctrl({lock, $powerUi}) {
		console.log('ctrl', this.$tscope.pity);
	}

	// onViewLoad(view) {
	// 	console.log('aqui', view);
	// }
	onCancel(resolve, reject, ...args) {
		console.log('Really cancel?', args);
		resolve();
		// this.$powerUi.request({
		// 		url: 'somecomponent.html',
		// 		method: 'GET',
		// 		status: "Loading page",
		// 		withCredentials: false,
		// }).then(function (response, xhr) {
		// 	console.log('success');
		// 	resolve();
		// }).catch(function (response, xhr) {
		// 	console.log('error', response, xhr);
		// 	reject();
		// });
	}

	onCommit(resolve, reject, ...args) {
		console.log('It is confirmed!', args);
		resolve();
	}

	onCancelError() {
		console.log('cancel fails');
	}

	onCommitError() {
		console.log('confirm fails');
	}
}

class MyWindow extends PowerWindowIframe {

	init() {
		// this.commitBt = true;
	}

	ctrl({$powerUi}) {
		this.$powerUi.controllers['main-view'].instance.next = this.$powerUi.controllers['main-view'].instance.next +1;
		window.console.log("this.$powerUi.controllers['main-view'].instance.next", this.$powerUi.controllers['main-view'].instance.next);
		window.console.log('Window is here!');
	}

	onCancel(resolve, reject) {
		window.console.log('Really cancel?');
		resolve();
	}

	onCommit(resolve, reject) {
		window.console.log('It is confirmed!');
		resolve();
	}
}

class JSONViewsTemplateComponent extends PowerTemplate {
	template(resolve, reject) {
		const accordion = {
			"classList": ['my-custom-accordion'],
			"id": 'my-custom-accordion',
			"config": {
				"multipleSectionsOpen": false,
			},
			"panels": [
				{
					"header": {
						"id": "female-action",
						"label": "My female cats",
						"icon": "icon-atom",
						"status": {"active": "chevron-down", "inactive": "chevron-right", "position": "right"}
					},
					"section": {
						"id": "female-section",
						"content": `<ul>
							<li>Princesa</li>
							<li>Lady</li>
							<li>Lindinha</li>
							<li>Florzinha</li>
							<li>Docinho</li>
							<li>Laylita</li>
							<li>Meg</li>
							<li>Lily</li>
							<li>Penny</li>
							<li>Morgana</li>
							<li>Sol</li>
						</ul>`
					}
				},
				{
					"header": {
						"id": "male-action",
						"label": "My male cats",
						"icon": "icon-user",
						"status": {"active": "chevron-down", "inactive": "chevron-right"}
					},
					"section": {
						"id": "male-section",
						"content": `<ul>
							<li>Riquinho</li>
							<li>Tico</li>
							<li>Pingo</li>
							<li>Drew</li>
							<li>Kid</li>
							<li>Neo</li>
						</ul>`
					}
				},
				{
					"header": {
						"id": "favorite-action",
						"icon": "save-front",
						"label": "My favorite cats",
						"status": {"active": "chevron-down", "inactive": "chevron-right"}
					},
					"section": {
						"id": "favorite-section",
						"content": `<ul>
							<li>Riquinho</li>
							<li>Princesa</li>
							<li>Pingo</li>
							<li>Drew</li>
							<li>Penny</li>
							<li>Sol</li>
						</ul>`
					}
				}
			],
		};

		let htmlTemplate = this.$service('JSONSchema').accordion(accordion);

		const button = {
			"classList": ['my-custom-button'],
			"id": 'my-bt',
			"label": "Default",
			"icon": "save-front",
			"kind": "default",
			"events": [
				{
					"event": "onclick",
					"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
				}
			]
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').button(button);

		const button2 = {
			"id": 'my-bt2',
			"label": "Highlight",
			"icon": "save-front",
			"kind": "highlight",
			"events": [
				{
					"event": "onclick",
					"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
				}
			]
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').button(button2);

		const button3 = {
			"id": 'my-bt3',
			"label": "Secundary",
			"icon": "save-front",
			"kind": "secundary",
			"events": [
				{
					"event": "onclick",
					"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
				}
			]
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').button(button3);

		const button4 = {
			"id": 'my-bt4',
			"label": "Primary",
			"icon": "save-front",
			"kind": "primary",
			"events": [
				{
					"event": "onclick",
					"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
				}
			]
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').button(button4);

		const button5 = {
			"id": 'my-bt5',
			"label": "Danger",
			"icon": "save-front",
			"kind": "danger",
			"events": [
				{
					"event": "onclick",
					"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
				}
			]
		};

		htmlTemplate = htmlTemplate + '<br />' + this.$service('JSONSchema').button(button5);

		const button6 = {
			"id": 'my-bt6',
			"label": "Warning",
			"icon": "save-front",
			"kind": "warning",
			"events": [
				{
					"event": "onclick",
					"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
				}
			]
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').button(button6);

		const button7 = {
			"id": 'my-bt7',
			"label": "Success",
			"icon": "save-front",
			"kind": "success",
			"events": [
				{
					"event": "onclick",
					"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
				}
			]
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').button(button7);

		const button8 = {
			"classList": ["ping", "pong"],
			"id": 'my-bt8',
			"label": "Basic",
			"icon": "save-front",
			"kind": "basic",
			"events": [
				{
					"event": "onclick",
					"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
				}
			]
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').button(button8);

		const button9 = {
			"id": 'my-bt9',
			"label": "DropMenu",
			"icon": "save-front",
			"icon-position": "left",
			"status": {
				"active": "caret-down",
				"inactive": "caret-right",
				"position": "right"
			},
			"kind": "warning",
			"events": [
				{
					"event": "onclick",
					"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
				}
			],
			"dropmenu": {
				"id": "my-drop-menu",
				"icon": "save-front",
				"items": [
					{
						"id": "my-item1",
						"label": "Brave new world",
						"icon": "power-logo",
						"icon-position": "left",
						"events": [
							{
								"event": "onclick",
								"fn": "openModal({'name': 'Aldous Huxley', 'title': 'Brave new world'})"
							}
						]
					},
					{
						"id": "my-item2",
						"label": "Animal Farm",
						"icon": "power-logo",
						"events": [
							{
								"event": "onclick",
								"fn": "openModal({'name': 'George Orwell', 'title': 'Animal Farm'})"
							}
						]
					},
					{
						"id": "my-item3",
						"label": "The Fall",
						"icon": "power-logo",
						"icon-position": "left",
						"status": {
							"active": "caret-down",
							"inactive": "caret-right",
							"position": "right"
						},
						"dropmenu": {
							"id": "my-drop-menu2",
							"icon": "save-front",
							"items": [
								{
									"id": "subitem1",
									"label": "Zelda",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Zelda', 'title': 'Twilight Princess'})"
										}
									]
								},
								{
									"id": "subitem2",
									"label": "Mario",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Mario', 'title': 'New Super Mario Bros'})"
										}
									]
								},
								{
									"id": "subitem3",
									"label": "StarCraft",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'StarCraft', 'title': 'StarCraft Brood War'})"
										}
									]
								}
							]
						}
					}
				]
			}
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').dropMenuButton(button9);

		resolve(htmlTemplate);
	}
}

class JSONViews extends PowerWindow {
	ctrl() {
		window.console.log('JSONViews CTRL', this.$tscope);
	}

	openModal() {
		console.log('open the modal please');
	}
}

class FakeModal extends PowerModal {
	constructor({$powerUi, lock, viewId, routeId}) {
		super({$powerUi});
		window.console.log('instanciate');
	}

	init() {
		const parts = this.$powerUi.router.locationHashWithHiddenRoutes().split('/');
		this.$title = 'My books: ' + decodeURI(parts[parts.length - 1]);
	}

	ctrl({lock, $powerUi, $shared}) {
		this.cats = [
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
		this.cands = [
			['bala', 'chiclete'],
			['brigadeiro', 'cajuzinho'],
			['bolo', 'torta'],
		];

		this.flowers = {
			Rose: 'Pink',
			Orchidy: 'White',
			Violet: 'Blue',
			Daisy: 'Yellow',

		}
		this.languages = {
			good: {name: 'Python', kind: 'Not typed'},
			hard: {name: 'Java', kind: 'Typed'},
			bad: {name: 'EcmaScript', kind: 'Not typed'},
			old: {name: 'COBOL', kind: 'Not typed'},
			cool: {name: 'C++', kind: 'typed'},
		}

		this.myName = 'Eu sou o Pity o bom!';
		this.oldName = this.myName;
		this.currentIf = false;
	}

	showIf() {
		const route = this.$powerUi.router.getOpenedRoute({routeId: this._routeId, viewId: this._viewId});
		if (this.currentIf) {
			this.currentIf = false;
			return route.params[0].value;
		} else {
			this.currentIf = true;
			return route.params[1].value;
		}
	}

	getCandNumber(currentCand) {
		this.candCounter = 1;
		for (const group of this.cands) {
			for (const cand of group) {
				if (cand === currentCand) {
					return this.candCounter;
				}
				this.candCounter = this.candCounter + 1;
			}
		}
		return this.candCounter;
	}

	changeModel(kind) {
		this.currentIf = !this.currentIf;
		if (this.oldName === this.myName) {
			this.myName = 'My name is Bond, James Bond!';
		} else {
			this.changeName = this.myName;
			this.myName = this.oldName;
			this.oldName = this.changeName;
		}
		if (this.myName == 'My name is Bond, James Bond!') {
			this.languages.garbage = {name: 'PHP', kind: 'Not typed'};
		} else {
			delete this.languages.garbage;
		}
		this.showIf();
		if (this.cats.length === 12) {
			this.cats[10].name = 'Luke';
			this.cats[10].gender = 'male';
			this.cats.push({name: 'Floquinho', gender: 'male'});
			this.cats.push({name: '4 gatinhos', gender: 'unknow'});
			this.cands.push(['caramelo', 'pirulito']);
			this.cands.push(['pipoca', 'cocada']);
		} else {
			this.cats[10].name = 'Florzinha';
			this.cats[10].gender = 'female';
			this.cats.pop();
			this.cands.pop();
		}
		if (kind === 'pwReload') {
			this.$powerUi.pwReload();
		} else if (kind === 'hardRefresh') {
			this.$powerUi.hardRefresh(document);
		} else if (kind === 'softRefresh') {
			this.refresh();
		}
		console.log('this.cats.length', this.cats.length);
	}

	onViewLoad(view) {

	}

	openSimpleModal() {
		this.openRoute({
			routeId: 'simple-template',
			target: '_blank',
		});
	}

	openModal(params) {
		this.openRoute({
			params: params,
			target: '_self',
		});
	}
}

const routes = [
		{
			id: 'front-page',
			title: 'PowerUi - Rich UI made easy',
			route: '/',
			templateUrl: 'front_page.html',
			ctrl: {
				component: FrontPage,
				params: {lock: true},
			},
		},
		{
			id: 'power-only',
			title: 'Power only page | PowerUi',
			route: 'power_only',
			templateUrl: 'power_only.html',
			avoidCacheTemplate: false,
			ctrl: {
				component: PowerOnlyPage,
				params: {lock: true},
			},
		},
		{
			id: 'json-views',
			title: 'Create from JSON | PowerUi',
			route: 'jsonviews',
			templateComponent: JSONViewsTemplateComponent,
			ctrl: {
				component: JSONViews,
			},
		},
		{
			id: 'power-only2',
			title: 'Power only page 2 | PowerUi',
			route: 'power_only/:id/:name/:title',
			templateUrl: 'power_only.html',
			ctrl: {
				component: PowerOnlyPage,
				params: {lock: true},
			},
		},
		{
			id: 'simple-dialog',
			route: 'dialog',
			title: 'Window dialog',
			templateComponent: SimpleTemplate,
			ctrl: {
				component: SimpleDialog,
				params: {pity: true},
			},
		},
		{
			id: 'some-window',
			route: 'window/:id',
			title: 'My Window',
			url: 'http://localhost:3002',
			ctrl: {
				component: MyWindow,
			},
		},
		{
			id: 'component1',
			title: 'Books | PowerUi',
			route: 'component/:name/:title',
			templateUrl: 'somecomponent.html',
			avoidCacheTemplate: false,
			hidden: false,
			ctrl: {
				component: FakeModal,
				params: {lock: false},
			},
		},
		{
			id: 'simple-template',
			title: 'The simple one | PowerUi',
			route: 'simple',
			template: someViewTemplate,
			hidden: false,
			ctrl: {
				component: SimpleModal,
				params: {lock: false},
			},
		},
		{
			id: 'otherwise',
			title: 'Not found | PowerUi',
			route: '404',
			templateUrl: '404.html',
		}
	];

const t0 = performance.now();
let app = new PowerUi({
	routes: routes,
	// services: services,
	// spinnerLabel: 'carregando',
	devMode: {iframe: 'http://localhost:3002', main: 'http://localhost:3000'},
});

console.log('app', app);
app.pity = function() {
	return myName;
}
app.pity2 = function(name, phase) {
	return name + ' ' + phase;
}

app.variable = 'obj';
app.obj = {obj: {obj: 'obj'}};
app.piii = {pity: {pity: 'pity'}};
app.teste = {pity: {obj: true}, lu: {obj: false}};

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
