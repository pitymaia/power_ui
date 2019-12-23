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

class PowerAlert extends PowerDialog {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
		this.commitBt = true;
	}
}

class PowerConfirm extends PowerDialog {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
		this.commitBt = true;
		this.cancelBt = true;
	}
}

function wrapFunctionInsideDialog({controller, kind}) {
	class _Alert extends PowerAlert {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi});
			this.ctrl = controller;
		}
	}

	class _Confirm extends PowerConfirm {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi});
			this.ctrl = controller;
		}
	}
	class _Modal extends PowerModal {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi});
			this.ctrl = controller;
		}
	}

	if (kind === 'confirm') {
		return _Confirm;
	} else if (kind === 'modal') {
		return _Modal;
	} else {
		return _Alert;
	}
}
