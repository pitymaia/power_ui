class PowerSplitMenu extends _PowerBarsBase {
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

	toggle() {
		// PowerAction implements an optional "click out" system to allow toggles to hide
		this.powerAction.ifClickOut();

		// Removed becouse power-toggle already implement a toggle event
		// Broadcast toggle custom event
		// this.powerAction.broadcast('toggle', true);
	}

	// The powerToggle call this action method
	action() {
		this.toggle();
	}
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-split-menu', isMain: true});
