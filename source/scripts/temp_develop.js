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

function changeMenu() {

}

function showMenuLabel() {

}

window.console.log('power', app);
