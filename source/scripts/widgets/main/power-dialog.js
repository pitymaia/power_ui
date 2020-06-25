class PowerDialog extends PowerDialogBase {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
	}

	template({$title}) {
		// This allow the user define a this.$title on controller constructor or compile, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-dialog pw-dialog-container pw-backdrop">
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

class PowerYesNo extends PowerDialog {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
		this.commitBt = true;
		this.noBt = true;
		this.cancelBt = true;
	}
}

function wrapFunctionInsideDialog({controller, kind, params}) {
	class _Alert extends PowerAlert {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi});
			this.ctrl = controller;
			if (params) {
				for (const key of Object.keys(params || {})) {
					this[key] = params[key];
				}
			}
		}
	}

	class _Confirm extends PowerConfirm {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi});
			this.ctrl = controller;
			if (params) {
				for (const key of Object.keys(params || {})) {
					this[key] = params[key];
				}
			}
		}
	}

	class _YesNo extends PowerYesNo {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi});
			this.ctrl = controller;
			if (params) {
				for (const key of Object.keys(params || {})) {
					this[key] = params[key];
				}
			}
		}
	}

	class _Modal extends PowerModal {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi});
			this.ctrl = controller;
			if (params) {
				for (const key of Object.keys(params || {})) {
					this[key] = params[key];
				}
			}
		}
	}
	class _Window extends PowerWindow {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi});
			this.ctrl = controller;
			if (params) {
				for (const key of Object.keys(params || {})) {
					this[key] = params[key];
				}
			}
		}
	}

	class _WindowIframe extends PowerWindowIframe {
		constructor({$powerUi}) {
			super({$powerUi: $powerUi});
			this.ctrl = controller;
			if (params) {
				for (const key of Object.keys(params || {})) {
					this[key] = params[key];
				}
			}
		}
	}

	if (kind === 'confirm') {
		return _Confirm;
	} else if (kind === 'yesno') {
		return _YesNo;
	} else if (kind === 'modal') {
		return _Modal;
	} else if (kind === 'window') {
		return _Window;
	} else if (kind === 'windowIframe') {
		return _WindowIframe;
	} else {
		return _Alert;
	}
}

export { PowerDialog, PowerAlert, PowerConfirm };
