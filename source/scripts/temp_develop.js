function powerOnly() {
	window.location.href = '/power_only.html';
}
function gotoIndex() {
	window.location.href = '/';
}
class PwcPity extends PowCssHover {
	constructor(element) {
		super(element);
		this.$_pwAttrName = 'data-pwc-pity';
		this.element = element;
		console.log('pwcPity is live!', this.$_pwAttrName);
	}
}
const inject = [{name: 'data-pwc-pity', obj: PwcPity}];
// TODO: testeExtendName is to find a way to modularize multiple exstensions
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
//      super(inject);
//      this.fake = {};
//  }
//  newPowerMenu(menu) {
//      const info = {descri: 'Descrição do menu'};
//      return new TesteMenu(menu, info);
//  }
// }
// let app = new TesteUi(inject);
let app = new PowerUi(inject);

// if (app.powerDOM.allPowerObjsById['pouco_label']) {
// 	app.powerDOM.allPowerObjsById['pouco_label'].powerAction.subscribe({event: 'toggle', fn: function (ctx) {
// 		console.log('toggle subscribe 1');
// 	}});
// 	app.powerDOM.allPowerObjsById['pouco_label'].powerAction.subscribe({event: 'click', fn: function (ctx) {
// 		console.log('click', ctx);
// 	}});

// 	if (app.powerDOM.allPowerObjsById['purecss-action']) {
// 		setTimeout(function () {
// 			app.powerDOM.allPowerObjsById['purecss-action'].powerAction.broadcast('click');
// 			setTimeout(function () {
// 					app.powerDOM.allPowerObjsById['top-menu-action'].powerAction.broadcast('click');
// 				setTimeout(function () {
// 					app.powerDOM.allPowerObjsById['powerui-action'].powerAction.broadcast('click');
// 					setTimeout(function () {
// 						app.powerDOM.allPowerObjsById['pouco_label'].powerAction.broadcast('click');
// 						setTimeout(function () {
// 							app.powerDOM.allPowerObjsById['novo_menos'].powerAction.broadcast('click');
// 							setTimeout(function () {
// 								app.powerDOM.allPowerObjsById['esse_more'].powerAction.broadcast('click');
// 								setTimeout(function () {
// 									app.powerDOM.allPowerObjsById['even-more'].powerAction.broadcast('click');
// 									setTimeout(function () {
// 										app.powerDOM.allPowerObjsById['powerui-action'].powerAction.broadcast('click');
// 									}, 2000);
// 								}, 1000);
// 							}, 1000);
// 						}, 1000);
// 					}, 500);
// 				}, 2000);
// 			}, 2000);
// 		}, 500);
// 	}
// }
window.console.log('power', app);
window.console.log('panel-0-action', app.powerDOM.allPowerObjsById['panel-0-action']);
var teste = function(e) {
	console.log('chamou', this);
	this.unsubscribe({event: 'mouseover', fn: teste});
}
app.powerDOM.allPowerObjsById['panel-0-action'].powerAction.subscribe({event: 'mouseover', fn: teste});
