class PowerDialog extends PowerDialogBase {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
	}

	template({$title}) {
		// This allow the user define a this.$title on controller constructor or compile, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-dialog pw-dialog-container">
					${super.template({$title})}
				</div>`;
	}
}
