class PowerToolbar extends PowerActionsBar {
	constructor(menu, $powerUi) {
		super(menu, $powerUi);
		this.isToolbar = true;
	}

	onRemove() {
		super.onRemove();
	}

	init() {
		super.init();
	}
}

// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-toolbar', isMain: true});
