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

if (app.powerDOM.allPowerObjsById['pouco_label']) {
	app.powerDOM.allPowerObjsById['pouco_label'].powerAction.subscribe({event: 'toggle', fn: function (ctx) {
		console.log('toggle subscribe 1');
	}});
	app.powerDOM.allPowerObjsById['pouco_label'].powerAction.subscribe({event: 'click', fn: function (ctx) {
		console.log('click', ctx);
	}});

	// setTimeout(function () {
	// 	app.powerDOM.allPowerObjsById['pouco_label'].powerAction.broadcast('toggle');
	// 	setTimeout(function () {
	// 		app.powerDOM.allPowerObjsById['pouco_label'].powerAction.broadcast('toggle');
	// 		app.powerDOM.allPowerObjsById['novo_menos'].powerAction.broadcast('toggle');
	// 		setTimeout(function () {
	// 			app.powerDOM.allPowerObjsById['novo_menos'].powerAction.broadcast('toggle');
	// 		}, 2000);
	// 	}, 2000);
	// }, 500);
}
window.console.log('power', app, app.powerDOM.allPowerObjsById['pouco_label']);
