class PowerMenu extends PowerActionsBar {
	constructor(menu, $powerUi) {
		super(menu, $powerUi);
		this.isMenu = true;
	}

	onRemove() {
		super.onRemove();
	}

	init() {
		super.init();
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-menu', isMain: true});
