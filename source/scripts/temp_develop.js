"use strict";

import { PowerUi, PowerController, PowerModal, PowerRoot, PowerConfirm, PowerWindow, PowerWindowIframe, PowerTemplate } from './power_ui.js';
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
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
		this.myName = 'My name is Pity the best!';
		this.oldName = this.myName;
	}
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
		console.log('PowerOnlyPage ctrl', this);
	}

	jsonViews() {
		this.openRoute({
			routeId: 'json-views',
			target: '_blank',
		});
	}

	changeModel(kind) {
		for (const viewId of Object.keys(this.$powerUi.controllers)) {
			if (this.$powerUi.controllers[viewId].instance && this.$powerUi.controllers[viewId].instance.name) {
				if (this.$powerUi.controllers[viewId].instance.name === 'Pity') {
					this.$powerUi.controllers[viewId].instance.name = 'André';
				} else {
					this.$powerUi.controllers[viewId].instance.name = 'Pity';
				}
			}
		}
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
			this.cats.push({name: '4 gatinhos', gender: 'female'});
		} else {
			this.cats[10].name = 'Florzinha';
			this.cats[10].gender = 'female';
			this.cats.pop();
		}
		if (kind === 'pwReload') {
			this.$root.changeCats();
			this.reload();
		} else if (kind === 'hardRefresh') {
			this.$powerUi.hardRefresh(document);
		} else if (kind === 'softRefresh') {
			this.$root.changeCats();
			this.refresh();
		}
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
		this.openRoute({
			routeId: 'simple-dialog',
			target: '_blank',
		});

		// this.$service('widget').windowIframe({
		// 	title: 'Template dialog',
		// 	url: 'http://localhost:3002',
		// 	controller: function() {
		// 		console.log('CONTROLLER IFRAME');
		// 	}
		// });

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
		// 	// params: {commitBt: {label: 'Save', icon: 'check'},  cancelBt: true},
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

	init() {
		this.commitBt = {
			label: 'Yes',
			// icon: 'save-front',
		};
		this.noBt = {
			// icon: 'save-back'
		};
		this.cancelBt = {
			label: 'Cancel',
			// icon: 'save-back',
		};
	}

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

class RootScope extends PowerRoot {
	template() {
		let newTmpl = `<div class="power-view" id="main-view"></div>
			<div class="power-view" id="secundary-view"></div>
			<div>{{ 2+2 }}</div>`;

		const menu1 = {
			"classList": ["custom-menu"],
			"id": 'my-menu-12',
			"brand": "<img src='http://localhost:3000/vendors/imgs/Brazil-Flag-icon.png' width='44px' />",
			"mirrored": false,
			"position": "top-right",
			// "orientation": "vertical",
			// "kind": "float-right",
			"items": [
				{
					"item": {
						"id": "my-books-12",
						"label": "Books",
						"icon": "power-logo"
					},
					"status": {
						"active": "caret-down",
						"inactive": "caret-right",
					},
					"dropmenu": {
						"id": "my-books-menu-12",
						"position": "top-right",
						"items": [
							{
								"item": {
									"id": "the-fall-12",
									"label": "The Fall",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "brave-12",
									"label": "Brave new world",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Aldous Huxley', 'title': 'Brave new world'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "animal-farm-12",
									"label": "Animal Farm",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Animal Farm', 'title': 'George Orwell'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "books-plus-12",
									"label": "More Books",
									"icon": "power-logo"
								},
								"status": {
									"active": "caret-down",
									"inactive": "caret-right",
								},
								"dropmenu": {
									"id": "my-books-menu-22",
									"position": "top-right",
									"items": [
										{
											"item": {
												"id": "a1984-12",
												"label": "1984",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'George Orwell', 'title': '1984'})"
													}
												]
											}
										},
										{
											"item": {
												"id": "never-12",
												"label": "Neverending Story",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'Michael Ende', 'title': 'Neverending Story'})"
													}
												]
											}
										},
										{
											"item": {
												"id": "stranger-12",
												"label": "The Stranger",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'Albert Camus', 'title': 'The Stranger'})"
													}
												]
											}
										}
									]
								}
							}
						]
					}
				},
				{
					"item": {
						"id": "games-12",
						"label": "Games",
						"icon": "power-logo"
					},
					"status": {
						"active": "caret-down",
						"inactive": "caret-right",
					},
					"dropmenu": {
						"id": "the-books-menu-12",
						"position": "top-right",
						"items": [
							{
								"item": {
									"id": "mario-12",
									"label": "New Super Mario",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Nintendo', 'title': 'New Super Mario'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "starcraft-12",
									"label": "StarCraft",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Blizzard', 'title': 'StarCraft'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "zelda-12",
									"label": "Zelda",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Nintendo', 'title': 'Zelda'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "more-games-12",
									"label": "More Games",
									"icon": "power-logo"
								},
								"status": {
									"active": "caret-down",
									"inactive": "caret-right",
								},
								"dropmenu": {
									"id": "my-games-menu-22",
									"position": "top-right",
									"items": [
										{
											"item": {
												"id": "doom-12",
												"label": "Doom",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'Hell on Earth', 'title': 'Doom'})"
													}
												]
											}
										},
										{
											"item": {
												"id": "quake-12",
												"label": "Quake",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': '3Dfx', 'title': 'Quake'})"
													}
												]
											}
										},
										{
											"item": {
												"id": "simcity-12",
												"label": "Sim City 2000",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'Best game ever', 'title': 'Sim City 2000'})"
													}
												]
											}
										}
									]
								}
							}
						]
					}
				},
				{
					"button": {
						"id": "books-plus-1b2",
						"label": "More Books",
						"icon": "power-logo",
						"kind": "warning",
					},
					"status": {
						"active": "caret-down",
						"inactive": "caret-right",
					},
					"dropmenu": {
						"id": "my-books-menu-2b2",
						"position": "top-right",
						"items": [
							{
								"item": {
									"id": "a1984-b12",
									"label": "1984",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'George Orwell', 'title': '1984'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "never-1b2",
									"label": "Neverending Story",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Michael Ende', 'title': 'Neverending Story'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "stranger-1b2",
									"label": "The Stranger",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Albert Camus', 'title': 'The Stranger'})"
										}
									]
								}
							}
						]
					}
				},
				{
					"button": {
						"id": "learn-1b2",
						"label": "Learn More",
						"icon": "power-logo",
						"kind": "highlight",
						"events": [
							{
								"event": "onclick",
								"fn": "changeAndRefresh()"
							}
						]
					}
				}
			]
		};

		newTmpl = newTmpl + this.$service('JSONSchema').menu(menu1);

		newTmpl = newTmpl + `<h1>Cats list</h1>
			<div data-pow-for="cat of cats">
				<div data-pow-css-hover="pw-blue" data-pow-if="cat.gender === 'female'" id="cat_b{{$pwIndex}}_ft">{{$pwIndex + 1}} - Minha linda <span data-pow-eval="cat.name"></span> <span data-pow-if="cat.name === 'Princesa'">(Favorita!)</span>
				</div>
				<div data-pow-css-hover="pw-orange" data-pow-if="cat.gender === 'male'" id="cat_b{{$pwIndex}}_mt">{{$pwIndex + 1}} - Meu lindo {{ cat.name }} <span data-pow-if="cat.name === 'Riquinho'">(Favorito!)</span>
				</div>
				<div data-pow-css-hover="pw-yellow" data-pow-if="cat.gender === 'unknow'" id="cat_b{{$pwIndex}}_ut">{{$pwIndex + 1}} - São lindos meus {{ cat.name }}
				</div>
			</div>
			<p>{{ name }}</p>`;
		return newTmpl;
	}
	ctrl() {
		console.log('$rootScope crtl is loaded');
		this.cats = [
			{name: 'Penny', gender: 'female'},
			{name: 'Riquinho', gender: 'male'},
		];
		this.name = 'Pity o bom!';
	}

	onViewLoad(view) {

	}

	changeCats() {
		if (this.cats[0].name !== 'Penny') {
			this.cats = [
				{name: 'Penny', gender: 'female'},
				{name: 'Riquinho', gender: 'male'},
			];
		} else {
			this.cats = [
				{name: 'Pincesa', gender: 'female'},
				{name: 'Penny', gender: 'female'},
				{name: 'Riquinho', gender: 'male'},
				{name: 'Tico', gender: 'male'},
			];
		}
		window.console.log('changed cats', this.cats);
	}

	changeAndRefresh() {
		this.changeCats();
		this.refresh(this._viewId);
	}
}

class JSONViewsTemplateComponent extends PowerTemplate {
	template(resolve, reject) {
		const menu1 = {
			"classList": ["custom-menu"],
			"id": 'my-menu-1',
			"brand": "<img src='http://localhost:3000/vendors/imgs/Brazil-Flag-icon.png' width='44px' />",
			"mirrored": false,
			// "position": "bottom-left",
			// "orientation": "vertical",
			// "kind": "float-right",
			"items": [
				{
					"item": {
						"id": "my-books-1",
						"label": "Books",
						"icon": "power-logo"
					},
					"status": {
						"active": "caret-down",
						"inactive": "caret-right",
					},
					"dropmenu": {
						"id": "my-books-menu-1",
						"items": [
							{
								"item": {
									"id": "the-fall-1",
									"label": "The Fall",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "brave-1",
									"label": "Brave new world",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Aldous Huxley', 'title': 'Brave new world'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "animal-farm-1",
									"label": "Animal Farm",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Animal Farm', 'title': 'George Orwell'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "books-plus-1",
									"label": "More Books",
									"icon": "power-logo"
								},
								"status": {
									"active": "caret-down",
									"inactive": "caret-right",
								},
								"dropmenu": {
									"id": "my-books-menu-2",
									"items": [
										{
											"item": {
												"id": "a1984-1",
												"label": "1984",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'George Orwell', 'title': '1984'})"
													}
												]
											}
										},
										{
											"item": {
												"id": "never-1",
												"label": "Neverending Story",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'Michael Ende', 'title': 'Neverending Story'})"
													}
												]
											}
										},
										{
											"item": {
												"id": "stranger-1",
												"label": "The Stranger",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'Albert Camus', 'title': 'The Stranger'})"
													}
												]
											}
										}
									]
								}
							}
						]
					}
				},
				{
					"item": {
						"id": "games-1",
						"label": "Games",
						"icon": "power-logo"
					},
					"status": {
						"active": "caret-down",
						"inactive": "caret-right",
					},
					"dropmenu": {
						"id": "the-books-menu-1",
						"items": [
							{
								"item": {
									"id": "mario-1",
									"label": "New Super Mario",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Nintendo', 'title': 'New Super Mario'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "starcraft-1",
									"label": "StarCraft",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Blizzard', 'title': 'StarCraft'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "zelda-1",
									"label": "Zelda",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Nintendo', 'title': 'Zelda'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "more-games-1",
									"label": "More Games",
									"icon": "power-logo"
								},
								"status": {
									"active": "caret-down",
									"inactive": "caret-right",
								},
								"dropmenu": {
									"id": "my-games-menu-2",
									"items": [
										{
											"item": {
												"id": "doom-1",
												"label": "Doom",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'Hell on Earth', 'title': 'Doom'})"
													}
												]
											}
										},
										{
											"item": {
												"id": "quake-1",
												"label": "Quake",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': '3Dfx', 'title': 'Quake'})"
													}
												]
											}
										},
										{
											"item": {
												"id": "simcity-1",
												"label": "Sim City 2000",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'Best game ever', 'title': 'Sim City 2000'})"
													}
												]
											}
										}
									]
								}
							}
						]
					}
				},
				{
					"button": {
						"id": "books-plus-1b",
						"label": "More Books",
						"icon": "power-logo",
						"kind": "warning",
					},
					"status": {
						"active": "caret-down",
						"inactive": "caret-right",
					},
					"dropmenu": {
						"id": "my-books-menu-2b",
						"items": [
							{
								"item": {
									"id": "a1984-b1",
									"label": "1984",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'George Orwell', 'title': '1984'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "never-1b",
									"label": "Neverending Story",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Michael Ende', 'title': 'Neverending Story'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "stranger-1b",
									"label": "The Stranger",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Albert Camus', 'title': 'The Stranger'})"
										}
									]
								}
							}
						]
					}
				},
				{
					"button": {
						"id": "learn-1b",
						"label": "Learn More",
						"icon": "power-logo",
						"kind": "highlight",
						"events": [
							{
								"event": "onclick",
								"fn": "openModal({'name': 'Albert Camus', 'title': 'The Stranger'})"
							}
						]
					}
				}
			]
		};

		let htmlTemplate = '<p data-pow-eval="name + \' o bom!\'"></p>{{name}} {{2 + 2}}' + this.$service('JSONSchema').menu(menu1);

		const form1 = {
			"layout": "vertical",
			// "type": "form",
			"content": [
				{
					"layout": "horizontal",
					"controls": [
						{
							"label": "User Name:",
							"type": "text",
							"value": "Pity o bom",
							"name": "user_name",
							"bind": "form.user_name",
						},
						{
							"label": "User Password:",
							"type": "password",
							"value": "test123",
							"name": "password",
							"bind": "form.password",
						},
					]
				},
				{
					"layout": "horizontal",
					"controls": [
						{
							// "classList": ["switch"],
							"label": "Maths",
							"type": "radio",
							"value": "maths",
							"name": "sciences",
							"bind": "form.sciences",
						},
						{
							"label": "Physics",
							"type": "radio",
							"value": "physics",
							"name": "sciences",
							"bind": "form.sciences",
						},
					]
				},
				{
					"layout": "horizontal",
					"controls": [
						{
							"classList": ["switch"],
							"label": "Cat",
							"type": "radio",
							"value": "cat",
							"name": "animals",
							"bind": "form.animals",
							"id": "cat2",
						},
						{
							"classList": ["switch"],
							"label": "Dog",
							"type": "radio",
							"value": "dog",
							"name": "animals",
							"bind": "form.animals",
							"id": "dog2",
						}
					]
				},
				{
					"layout": "horizontal",
					"controls": [
						{
							"classList": ["switch"],
							"label": "Apple",
							"type": "radio",
							"value": "apple",
							"name": "fruits",
							"bind": "form.fruit",
							"id": "apple2",
						},
						{
							"classList": ["switch"],
							"label": "Orange",
							"type": "radio",
							"value": "orange",
							"name": "fruits",
							"bind": "form.fruit",
							"id": "orange1",
						}
					]
				},
				{
					"layout": "horizontal",
					"controls": [
						{
							"label": "Birthday:",
							"type": "date",
							"name": "date",
							"bind": "form.date",
							"id": "date2",
						},
						{
							"label": "Select your favorite color:",
							"type": "color",
							"name": "color",
							"bind": "form.color",
							"id": "color2"
						}
					]
				},
				{
					"layout": "horizontal",
					"controls": [
						{
							"label": "Enter an e-mail:",
							"type": "email",
							"value": "pity@ig.com.br",
							"name": "email",
							"bind": "form.email",
							"id": "email2"
						},
						{
							"label": "Enter a number:",
							"type": "number",
							"value": "33",
							"name": "number",
							"bind": "form.number"
						},
					]
				},
				{
					"layout": "horizontal",
					"controls": [
						{
							"label": "Sound range:",
							"type": "range",
							"value": "10",
							"name": "range",
							"bind": "form.range",
							"id": "range2"
						},
						{
							"label": "Enter your phone number:",
							"type": "phone",
							"value": "55895833",
							"name": "phone",
							"bind": "form.phone"
						},
					]
				},
				{
					"layout": "horizontal",
					"controls": [
						{
							"label": "Enter an URL:",
							"type": "url",
							"value": "",
							"name": "url",
							"bind": "form.url",
							"id": "url2"
						},
						{
							"label": "Choose a File:",
							"type": "file",
							"value": "",
							"name": "file",
							"bind": "form.file"
						},
					]
				},
				{
					"layout": "horizontal",
					"content": [
						{
							"layout": "vertical",
							"controls": [
								{
									"label": "I have a bike",
									"type": "checkbox",
									"name": "bike",
									"bind": "form.vehicle1",
									"id": "bike"
								},
								{
									"label": "I have a car",
									"type": "checkbox",
									"name": "car",
									"bind": "form.vehicle2",
									"id": "car"
								},
								{
									"label": "I have a boat",
									"type": "checkbox",
									"name": "boat",
									"bind": "form.vehicle3",
									"id": "boat"
								}
							]
						},
						{
							"layout": "vertical",
							"controls": [
								{
									"classList": ["switch"],
									"label": "I have a Wii",
									"type": "checkbox",
									"name": "wii",
									"bind": "form.wii",
									"id": "wii"
								},
								{
									"classList": ["switch"],
									"label": "I have a Wii U",
									"type": "checkbox",
									"name": "wiiu",
									"bind": "form.wiiu",
									"id": "wiiu"
								},
								{
									"classList": ["switch"],
									"label": "I have a 3Ds",
									"type": "checkbox",
									"name": "n3ds",
									"bind": "form.n3ds",
									"id": "n3ds"
								}
							]
						}
					]
				},
				{
					"layout": "horizontal",
					"controls": [
						{
							"label": "Choose one:",
							"type": "select",
							"name": "cars_list",
							"bind": "form.cars",
							"id": "cars-list",
							"list": [
								{"label": "Select a car", "value": "", "disabled": true},
								{"label": "Escort", "value": "escort", "disabled": false, "selected": true},
								{"label": "Volvo", "value": "volvo", "disabled": false},
								{"label": "Saab", "value": "saab", "disabled": false},
								{"label": "Opel", "value": "opel", "disabled": false},
								{"label": "Fusca", "value": "fusca", "disabled": false},
								{"label": "Mercedes", "value": "mercedes", "disabled": false},
								{"label": "audi", "value": "audi", "disabled": false},
							]
						},
						{
							"label": "Choose many:",
							"type": "select",
							"multiple": true,
							"name": "cars_list2",
							"bind": "form.cars2",
							"id": "cars-list2",
							"list": [
								{"label": "Select a car", "value": "", "disabled": true},
								{"label": "Escort", "value": "escort", "disabled": false, "selected": true},
								{"label": "Volvo", "value": "volvo", "disabled": false, "selected": true},
								{"label": "Saab", "value": "saab", "disabled": false, "selected": true},
								{"label": "Opel", "value": "opel", "disabled": false},
								{"label": "Fusca", "value": "fusca", "disabled": false},
								{"label": "Mercedes", "value": "mercedes", "disabled": false},
								{"label": "audi", "value": "audi", "disabled": false},
							]
						}
					]
				},
				{
					"layout": "vertical",
					"controls": [
						{
							"label": "Mission:",
							"type": "textarea",
							"value": "Pity o bom",
							"name": "mission",
							"rows": 4,
							"cols": 50,
							"bind": "form.textarea",
						},
					]
				},
				{
					"layout": "horizontal",
					"controls": [
						{
							"type": "image",
							"src": "vendors/imgs/rv_bt.png",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
								}
							]
						},
						{
							"classList": ["pw-btn-primary"],
							"type": "submit",
						},
						{
							"classList": ["pw-btn-highlight"],
							"type": "reset",
						},
						{
							"button": {
								"id": "bt-form1",
								"label": "Learn More",
								"icon": "power-logo",
								"kind": "highlight",
								"events": [
									{
										"event": "onclick",
										"fn": "openModal({'name': 'Albert Camus', 'title': 'The Stranger'})"
									}
								]
							}
						},
						{
							"button": {
								"id": 'bt2-form1',
								"label": "Warning",
								"icon": "save-front",
								"kind": "warning",
								"events": [
									{
										"event": "onclick",
										"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
									}
								]
							}
						}
					]
				}
			]
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').simpleForm(form1);

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

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').accordion(accordion);

		const button = {
			"classList": ['my-custom-button'],
			"id": 'my-bt',
			"label": "Default",
			"icon": "img",
			"icon-src": "vendors/imgs/rv_bt.png",
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
			"type": "button",
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

		htmlTemplate = htmlTemplate + '<br />';

		const button9 = {
			"button": {
				"id": 'my-bt9',
				"label": "DropMenu",
				"icon": "save-front",
				"icon-position": "left",
				"kind": "warning",
				"events": [
					{
						"event": "onclick",
						"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
					}
				]
			},
			"status": {
				"active": "caret-down",
				"inactive": "caret-right",
				"position": "right"
			},
			"dropmenu": {
				"id": "my-drop-menu",
				"position": "bottom-right",
				"items": [
					{
						"item": {
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
						}
					},
					{
						"item": {
							"id": "my-item2",
							"label": "Animal Farm",
							"icon": "power-logo",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'George Orwell', 'title': 'Animal Farm'})"
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item3",
							"label": "The Fall",
							"icon": "power-logo",
							"icon-position": "left"
						},
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
									"item": {
										"id": "subitem1",
										"label": "Zelda",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Zelda', 'title': 'Twilight Princess'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem2",
										"label": "Mario",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Mario', 'title': 'New Super Mario Bros'})"
											}
										]
									}
								},
								{
									"item": {
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
								}
							]
						}
					}
				]
			}
		};


		htmlTemplate = htmlTemplate + this.$service('JSONSchema').dropMenuButton(button9);

		const button10 = {
			"button": {
				"id": 'my-bt10',
				"label": "DropMenu",
				"icon": "save-front",
				"icon-position": "left",
				"kind": "primary",
				"events": [
					{
						"event": "onclick",
						"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
					}
				]
			},
			"status": {
				"active": "caret-down",
				"inactive": "caret-right",
				"position": "right"
			},
			"dropmenu": {
				"id": "my-drop-menu-2",
				"position": "right-bottom",
				"items": [
					{
						"item": {
							"id": "my-item1-2",
							"label": "Brave new world",
							"icon": "power-logo",
							"icon-position": "left",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'Aldous Huxley', 'title': 'Brave new world'})"
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item2-2",
							"label": "Animal Farm",
							"icon": "power-logo",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'George Orwell', 'title': 'Animal Farm'})"
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item3-2",
							"label": "The Fall",
							"icon": "power-logo",
							"icon-position": "left"
						},
						"status": {
							"active": "caret-down",
							"inactive": "caret-right",
							"position": "right"
						},
						"dropmenu": {
							"id": "my-drop-menu2-2",
							"icon": "save-front",
							"items": [
								{
									"item": {
										"id": "subitem1-2",
										"label": "Zelda",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Zelda', 'title': 'Twilight Princess'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem2-2",
										"label": "Mario",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Mario', 'title': 'New Super Mario Bros'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem3-2",
										"label": "StarCraft",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'StarCraft', 'title': 'StarCraft Brood War'})"
											}
										]
									}
								}
							]
						}
					}
				]
			}
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').dropMenuButton(button10);

		const button11 = {
			"button": {
				"id": 'my-bt11',
				"label": "DropMenu",
				"icon": "save-front",
				"icon-position": "left",
				"kind": "basic",
				"events": [
					{
						"event": "onclick",
						"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
					}
				]
			},
			"status": {
				"active": "caret-down",
				"inactive": "caret-right",
				"position": "right"
			},
			"dropmenu": {
				"id": "my-drop-menu-3",
				"position": "bottom-left",
				"items": [
					{
						"item": {
							"id": "my-item1-3",
							"label": "Brave new world",
							"icon": "power-logo",
							"icon-position": "left",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'Aldous Huxley', 'title': 'Brave new world'})"
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item2-3",
							"label": "Animal Farm",
							"icon": "power-logo",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'George Orwell', 'title': 'Animal Farm'})"
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item3-3",
							"label": "The Fall",
							"icon": "power-logo",
							"icon-position": "left"
						},
						"status": {
							"active": "caret-down",
							"inactive": "caret-right",
							"position": "right"
						},
						"dropmenu": {
							"id": "my-drop-menu2-3",
							"icon": "save-front",
							"items": [
								{
									"item": {
										"id": "subitem1-3",
										"label": "Zelda",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Zelda', 'title': 'Twilight Princess'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem2-3",
										"label": "Mario",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Mario', 'title': 'New Super Mario Bros'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem3-3",
										"label": "StarCraft",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'StarCraft', 'title': 'StarCraft Brood War'})"
											}
										]
									}
								}
							]
						}
					}
				]
			}
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').dropMenuButton(button11);

		const button12 = {
			"button": {
				"id": 'my-bt12',
				"label": "DropMenu",
				"icon": "save-front",
				"icon-position": "left",
				"kind": "danger",
				"events": [
					{
						"event": "onclick",
						"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
					}
				]
			},
			"status": {
				"active": "caret-down",
				"inactive": "caret-right",
				"position": "right"
			},
			"dropmenu": {
				"id": "my-drop-menu-4",
				"position": "left-bottom",
				"items": [
					{
						"item": {
							"id": "my-item1-4",
							"label": "Brave new world",
							"icon": "power-logo",
							"icon-position": "left",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'Aldous Huxley', 'title': 'Brave new world'})"
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item2-4",
							"label": "Animal Farm",
							"icon": "power-logo",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'George Orwell', 'title': 'Animal Farm'})"
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item3-4",
							"label": "The Fall",
							"icon": "power-logo",
							"icon-position": "left"
						},
						"status": {
							"active": "caret-down",
							"inactive": "caret-right",
							"position": "right"
						},
						"dropmenu": {
							"id": "my-drop-menu2-4",
							"icon": "save-front",
							"items": [
								{
									"item": {
										"id": "subitem1-4",
										"label": "Zelda",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Zelda', 'title': 'Twilight Princess'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem2-4",
										"label": "Mario",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Mario', 'title': 'New Super Mario Bros'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem3-4",
										"label": "StarCraft",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'StarCraft', 'title': 'StarCraft Brood War'})"
											}
										]
									}
								}
							]
						}
					}
				]
			}
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').dropMenuButton(button12);

		htmlTemplate = htmlTemplate + '<br />';

		const button13 = {
			"button": {
				"id": 'my-bt13',
				"label": "DropMenu",
				"icon": "save-front",
				"icon-position": "left",
				"kind": "default",
				"events": [
					{
						"event": "onclick",
						"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
					}
				]
			},
			"status": {
				"active": "caret-down",
				"inactive": "caret-right",
				"position": "right"
			},
			"dropmenu": {
				"id": "my-drop-menu-13",
				"position": "top-right",
				"items": [
					{
						"item": {
							"id": "my-item3-13",
							"label": "The Fall",
							"icon": "power-logo",
							"icon-position": "left"
						},
						"status": {
							"active": "caret-down",
							"inactive": "caret-right",
							"position": "right"
						},
						"dropmenu": {
							"id": "my-drop-menu2-13",
							"icon": "save-front",
							"items": [
								{
									"item": {
										"id": "subitem1-13",
										"label": "Zelda",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Zelda', 'title': 'Twilight Princess'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem2-13",
										"label": "Mario",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Mario', 'title': 'New Super Mario Bros'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem3-13",
										"label": "StarCraft",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'StarCraft', 'title': 'StarCraft Brood War'})"
											}
										]
									}
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item1-13",
							"label": "Brave new world",
							"icon": "power-logo",
							"icon-position": "left",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'Aldous Huxley', 'title': 'Brave new world'})"
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item2-13",
							"label": "Animal Farm",
							"icon": "power-logo",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'George Orwell', 'title': 'Animal Farm'})"
								}
							]
						}
					}
				]
			}
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').dropMenuButton(button13);

		const button14 = {
			"button": {
				"id": 'my-bt14',
				"label": "DropMenu",
				"icon": "save-front",
				"icon-position": "left",
				"kind": "secundary",
				"events": [
					{
						"event": "onclick",
						"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
					}
				]
			},
			"status": {
				"active": "caret-down",
				"inactive": "caret-right",
				"position": "right"
			},
			"dropmenu": {
				"id": "my-drop-menu-2-14",
				"position": "right-top",
				"items": [
					{
						"item": {
							"id": "my-item3-14",
							"label": "The Fall",
							"icon": "power-logo",
							"icon-position": "left"
						},
						"status": {
							"active": "caret-down",
							"inactive": "caret-right",
							"position": "right"
						},
						"dropmenu": {
							"id": "my-drop-menu2-14",
							"icon": "save-front",
							"items": [
								{
									"item": {
										"id": "subitem1-14",
										"label": "Zelda",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Zelda', 'title': 'Twilight Princess'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem2-14",
										"label": "Mario",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Mario', 'title': 'New Super Mario Bros'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem3-14",
										"label": "StarCraft",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'StarCraft', 'title': 'StarCraft Brood War'})"
											}
										]
									}
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item1-14",
							"label": "Brave new world",
							"icon": "power-logo",
							"icon-position": "left",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'Aldous Huxley', 'title': 'Brave new world'})"
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item2-14",
							"label": "Animal Farm",
							"icon": "power-logo",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'George Orwell', 'title': 'Animal Farm'})"
								}
							]
						}
					}
				]
			}
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').dropMenuButton(button14);

		const button15 = {
			"button": {
				"id": 'my-bt15',
				"label": "DropMenu",
				"icon": "save-front",
				"icon-position": "left",
				"kind": "success",
				"events": [
					{
						"event": "onclick",
						"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
					}
				]
			},
			"status": {
				"active": "caret-down",
				"inactive": "caret-right",
				"position": "right"
			},
			"dropmenu": {
				"id": "my-drop-menu-15",
				"position": "top-left",
				"items": [
					{
						"item": {
							"id": "my-item1-15",
							"label": "Brave new world",
							"icon": "power-logo",
							"icon-position": "left",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'Aldous Huxley', 'title': 'Brave new world'})"
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item3-15",
							"label": "The Fall",
							"icon": "power-logo",
							"icon-position": "left"
						},
						"status": {
							"active": "caret-down",
							"inactive": "caret-right",
							"position": "right"
						},
						"dropmenu": {
							"id": "my-drop-menu2-15",
							"icon": "save-front",
							"items": [
								{
									"item": {
										"id": "subitem1-15",
										"label": "Zelda",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Zelda', 'title': 'Twilight Princess'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem2-15",
										"label": "Mario",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Mario', 'title': 'New Super Mario Bros'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem3-15",
										"label": "StarCraft",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'StarCraft', 'title': 'StarCraft Brood War'})"
											}
										]
									}
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item2-15",
							"label": "Animal Farm",
							"icon": "power-logo",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'George Orwell', 'title': 'Animal Farm'})"
								}
							]
						}
					}
				]
			}
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').dropMenuButton(button15);

		const button16 = {
			"button": {
				"id": 'my-bt116',
				"label": "DropMenu",
				"icon": "save-front",
				"icon-position": "left",
				"kind": "highlight",
				"events": [
					{
						"event": "onclick",
						"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
					}
				]
			},
			"status": {
				"active": "caret-down",
				"inactive": "caret-right",
				"position": "right"
			},
			"dropmenu": {
				"id": "my-drop-menu-16",
				"position": "left-top",
				"items": [
					{
						"item": {
							"id": "my-item3-16",
							"label": "The Fall",
							"icon": "power-logo",
							"icon-position": "left"
						},
						"status": {
							"active": "caret-down",
							"inactive": "caret-right",
							"position": "right"
						},
						"dropmenu": {
							"id": "my-drop-menu2-16",
							"items": [
								{
									"item": {
										"id": "subitem1-16",
										"label": "Zelda",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Zelda', 'title': 'Twilight Princess'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem2-16",
										"label": "Mario",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Mario', 'title': 'New Super Mario Bros'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem3-16",
										"label": "StarCraft",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'StarCraft', 'title': 'StarCraft Brood War'})"
											}
										]
									}
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item1-16",
							"label": "Brave new world",
							"icon": "power-logo",
							"icon-position": "left",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'Aldous Huxley', 'title': 'Brave new world'})"
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item2-16",
							"label": "Animal Farm",
							"icon": "power-logo",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'George Orwell', 'title': 'Animal Farm'})"
								}
							]
						}
					}
				]
			}
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').dropMenuButton(button16);

		htmlTemplate = htmlTemplate + '<br />';

		const button17 = {
			"button": {
				"id": 'my-bt117',
				"label": "DropMenu",
				"icon": "save-front",
				"kind": "danger",
				"mirrored": true,
				"events": [
					{
						"event": "onclick",
						"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
					}
				]
			},
			"status": {
				"active": "caret-down",
				"inactive": "caret-right",
			},
			"dropmenu": {
				"id": "my-drop-menu-17",
				"position": "bottom-left",
				"items": [
					{
						"item": {
							"id": "my-item1-17",
							"label": "Brave new world",
							"icon": "power-logo",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'Aldous Huxley', 'title': 'Brave new world'})"
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item3-17",
							"label": "The Fall",
							"icon": "power-logo"
						},
						"status": {
							"active": "caret-down",
							"inactive": "caret-right",
						},
						"dropmenu": {
							"id": "my-drop-menu2-17",
							"icon": "save-front",
							"items": [
								{
									"item": {
										"id": "subitem1-17",
										"label": "Zelda",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Zelda', 'title': 'Twilight Princess'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem2-17",
										"label": "Mario",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Mario', 'title': 'New Super Mario Bros'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem3-17",
										"label": "StarCraft",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'StarCraft', 'title': 'StarCraft Brood War'})"
											}
										]
									}
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item2-17",
							"label": "Animal Farm",
							"icon": "power-logo",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'George Orwell', 'title': 'Animal Farm'})"
								}
							]
						}
					}
				]
			}
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').dropMenuButton(button17);

		const button18 = {
			"button": {
				"id": 'my-bt118',
				"label": "DropMenu",
				"icon": "save-front",
				"kind": "primary",
				"mirrored": true,
				"events": [
					{
						"event": "onclick",
						"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
					}
				]
			},
			"status": {
				"active": "caret-down",
				"inactive": "caret-right",
			},
			"dropmenu": {
				"id": "my-drop-menu-18",
				"position": "top-left",
				"items": [
					{
						"item": {
							"id": "my-item3-18",
							"label": "The Fall",
							"icon": "power-logo"
						},
						"status": {
							"active": "caret-down",
							"inactive": "caret-right",
						},
						"dropmenu": {
							"id": "my-drop-menu2-18",
							"items": [
								{
									"item": {
										"id": "subitem1-18",
										"label": "Zelda",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Zelda', 'title': 'Twilight Princess'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem2-18",
										"label": "Mario",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'Mario', 'title': 'New Super Mario Bros'})"
											}
										]
									}
								},
								{
									"item": {
										"id": "subitem3-18",
										"label": "StarCraft",
										"icon": "power-logo",
										"events": [
											{
												"event": "onclick",
												"fn": "openModal({'name': 'StarCraft', 'title': 'StarCraft Brood War'})"
											}
										]
									}
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item1-18",
							"label": "Brave new world",
							"icon": "power-logo",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'Aldous Huxley', 'title': 'Brave new world'})"
								}
							]
						}
					},
					{
						"item": {
							"id": "my-item2-18",
							"label": "Animal Farm",
							"icon": "power-logo",
							"events": [
								{
									"event": "onclick",
									"fn": "openModal({'name': 'George Orwell', 'title': 'Animal Farm'})"
								}
							]
						}
					}
				]
			}
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').dropMenuButton(button18);

		htmlTemplate = htmlTemplate + '<p></p>';

		const menu2 = {
			"classList": ["custom-menu"],
			"id": 'my-menu-2',
			"brand": "PowerUi",
			"mirrored": false,
			"position": "top-right",
			// "orientation": "vertical",
			// "kind": "float-right",
			"items": [
				{
					"item": {
						"id": "my-books-1-2",
						"label": "Books",
						"icon": "power-logo"
					},
					"status": {
						"active": "caret-down",
						"inactive": "caret-right",
					},
					"dropmenu": {
						"id": "the-books-menu-2-2",
						"items": [
							{
								"item": {
									"id": "the-fall-2",
									"label": "The Fall",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Albert Camus', 'title': 'The Fall'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "brave-2",
									"label": "Brave new world",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Aldous Huxley', 'title': 'Brave new world'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "animal-farm-2",
									"label": "Animal Farm",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Animal Farm', 'title': 'George Orwell'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "books-plus-2",
									"label": "More Books",
									"icon": "power-logo"
								},
								"status": {
									"active": "caret-down",
									"inactive": "caret-right",
								},
								"dropmenu": {
									"id": "my-books-menu-2-2",
									"items": [
										{
											"item": {
												"id": "a1984-1-2",
												"label": "1984",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'George Orwell', 'title': '1984'})"
													}
												]
											}
										},
										{
											"item": {
												"id": "never-1-2",
												"label": "Neverending Story",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'Michael Ende', 'title': 'Neverending Story'})"
													}
												]
											}
										},
										{
											"item": {
												"id": "stranger-1-2",
												"label": "The Stranger",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'Albert Camus', 'title': 'The Stranger'})"
													}
												]
											}
										}
									]
								}
							}
						]
					}
				},
				{
					"item": {
						"id": "games-1-2",
						"label": "Games",
						"icon": "power-logo"
					},
					"status": {
						"active": "caret-down",
						"inactive": "caret-right",
					},
					"dropmenu": {
						"id": "the-books-menu-1-2",
						"items": [
							{
								"item": {
									"id": "mario-1-2",
									"label": "New Super Mario",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Nintendo', 'title': 'New Super Mario'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "starcraft-1-2",
									"label": "StarCraft",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Blizzard', 'title': 'StarCraft'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "zelda-1-2",
									"label": "Zelda",
									"icon": "power-logo",
									"events": [
										{
											"event": "onclick",
											"fn": "openModal({'name': 'Nintendo', 'title': 'Zelda'})"
										}
									]
								}
							},
							{
								"item": {
									"id": "more-games-1-2",
									"label": "More Games",
									"icon": "power-logo"
								},
								"status": {
									"active": "caret-down",
									"inactive": "caret-right",
								},
								"dropmenu": {
									"id": "my-games-menu-2-2",
									"items": [
										{
											"item": {
												"id": "doom-1-2",
												"label": "Doom",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'Hell on Earth', 'title': 'Doom'})"
													}
												]
											}
										},
										{
											"item": {
												"id": "quake-1-2",
												"label": "Quake",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': '3Dfx', 'title': 'Quake'})"
													}
												]
											}
										},
										{
											"item": {
												"id": "simcity-1-2",
												"label": "Sim City 2000",
												"icon": "power-logo",
												"events": [
													{
														"event": "onclick",
														"fn": "openModal({'name': 'Best game ever', 'title': 'Sim City 2000'})"
													}
												]
											}
										}
									]
								}
							}
						]
					}
				}
			]
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').menu(menu2);

		const tree = {
			"classList": ["custom-tree"],
			"id": 'my-tree',
			"events": [
				{
					"name": "onclick",
					"fn": "clickTree"
				}
			],
			"content": [
				{
					"name": "test",
					"fullName": "test",
					"extension": "",
					"path": "/home/andre/test",
					"kind": "folder",
					"content": [
						{
							"name": "media",
							"fullName": "media",
							"extension": "",
							"path": "/home/andre/test/media",
							"kind": "folder",
							"content": [
								{
									"name": "brand",
									"fullName": "brand.png",
									"icon": "save-front",
									"extension": ".png",
									"path": "/home/andre/test/media/brand.png",
									"kind": "file"
								},
							]
						},
					]
				},
				{
					"name": "frontpage",
					"fullName": "frontpage.js",
					"extension": ".js",
					"path": "/home/andre/frontpage.js",
					"kind": "file",
				},
				{
					"name": "scripts",
					"fullName": "scripts",
					"extension": "",
					"path": "/home/andre/scripts",
					"kind": "folder",
					"content": [
						{
							"name": "index",
							"fullName": "index.js",
							"extension": ".js",
							"path": "/home/andre/scripts/index.js",
							"kind": "file",
						},
						{
							"name": "zendex",
							"fullName": "zendex.html",
							"extension": ".html",
							"path": "/home/andre/scripts/zendex.html",
							"kind": "file",
						},
					]
				},
				{
					"name": "default-template",
					"fullName": "default-template.html",
					"extension": ".html",
					"path": "/home/andre/default-template.html",
					"kind": "file",
				},
			]
		};

		htmlTemplate = htmlTemplate + this.$service('JSONSchema').tree(tree);

		resolve(htmlTemplate);
	}
}

class JSONViews extends PowerWindow {
	ctrl() {
		window.console.log('JSONViews CTRL', this.$tscope);
		this.name = 'Pity';
		this.form = {
			user_name: 'NadaSei',
			password: 'pity123',
			sciences: 'maths',
			animals: 'cat',
			fruit: 'orange',
			date: '1979-11-19',
			color: '#caff00',
			email: 'pitymaia@gmail.com',
			number: 40,
			range: 99,
			phone: '11-55895833',
			url: 'http://libertyweb.net',
			vehicle1: true,
			vehicle2: true,
			vehicle3: false,
			wii: true,
			wiiu: true,
			n3ds: true,
			file: '',
			cars: 'escort',
			cars2: ['fusca', 'escort'],
			hidden: 'Hidden form field info',
			textarea: 'This is my new textarea text and I love it!!!',
		};
	}


	openModal() {
		console.log('form', this.form);
		// this.$powerUi.addSpinner('main-view');
		// const self = this;
		// setTimeout(function () {
		// 	self.$powerUi.removeSpinner('main-view');
		// },2000);
	}

	clickTree({path, event, element}) {
		console.log('path', path, 'event', event, 'element', element);
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

		};
		this.languages = {
			good: {name: 'Python', kind: 'Not typed'},
			hard: {name: 'Java', kind: 'Typed'},
			bad: {name: 'EcmaScript', kind: 'Not typed'},
			old: {name: 'COBOL', kind: 'Not typed'},
			cool: {name: 'C++', kind: 'typed'},
		};

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
	$root: {
		component: RootScope,
		params: {lock: false},
	},
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
