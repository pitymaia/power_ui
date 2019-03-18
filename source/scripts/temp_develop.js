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
		console.log('pwcPity is alive!', this.$_pwAttrName);
	}
}
// Inject the attr on PowerUi
_PowerUiBase.injectPwc({name: 'data-pwc-pity', callback: function(element) {return new PwcPity(element);}});
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
let app = new PowerUi();

if (app.powerDOM.allPowerObjsById['pouco_label']) {
	app.powerDOM.allPowerObjsById['pouco_label'].powerAction.subscribe({event: 'toggle', fn: function (ctx) {
		console.log('toggle subscribe 1');
	}});
	app.powerDOM.allPowerObjsById['pouco_label'].powerAction.subscribe({event: 'click', fn: function (ctx) {
		console.log('click', ctx);
	}});

	if (app.powerDOM.allPowerObjsById['mais-top44']) {
		setTimeout(function () {
			app.powerDOM.allPowerObjsById['mais-top44'].powerAction.broadcast('click');
			setTimeout(function () {
				app.powerDOM.allPowerObjsById['novo_menos-top2m44'].powerAction.broadcast('mouseenter');
			}, 300);
		}, 500);
	}
}
function clickum() {
	console.log('um');
}
function clickdois() {
	console.log('dois');
}
function mouseoverum() {
	console.log('mouse over 1');
}
function mouseoverdois() {
	console.log('mouse over 2');
}
function mouseoutum() {
	console.log('mouseout 1');
}
function mouseoutdois() {
	console.log('mouseout 2');
}
function clicktres() {
	console.log('três');
	app.powerDOM.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'click', fn: clickum });
	app.powerDOM.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'click', fn: clickdois });
	app.powerDOM.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'click', fn: clicktres });
	app.powerDOM.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseover', fn: mouseoverum});
	app.powerDOM.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseover', fn: mouseoverdois});
	app.powerDOM.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseout', fn: mouseoutum});
	app.powerDOM.allPowerObjsById['even-more'].powerAction.unsubscribe({event: 'mouseout', fn: mouseoutdois});
}
app.powerDOM.allPowerObjsById['even-more'].powerAction.subscribe({event: 'click', fn: clickum });
app.powerDOM.allPowerObjsById['even-more'].powerAction.subscribe({event: 'click', fn: clickdois});
app.powerDOM.allPowerObjsById['even-more'].powerAction.subscribe({event: 'click', fn: clicktres});
app.powerDOM.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseover', fn: mouseoverum});
app.powerDOM.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseover', fn: mouseoverdois});
app.powerDOM.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseout', fn: mouseoutum});
app.powerDOM.allPowerObjsById['even-more'].powerAction.subscribe({event: 'mouseout', fn: mouseoutdois});
window.console.log('power', app);
window.console.log('panel-0-action', app.powerDOM.allPowerObjsById['panel-0-action']);
var teste = function(e) {
	console.log('chamou', this);
	this.unsubscribe({event: 'mouseover', fn: teste});
}
app.powerDOM.allPowerObjsById['panel-0-action'].powerAction.subscribe({event: 'mouseover', fn: teste});
