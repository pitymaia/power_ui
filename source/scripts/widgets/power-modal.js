class PowerModal extends PowerDialogBase {
	constructor({$powerUi, classList, promise=false}) {
		super({$powerUi: $powerUi, promise: promise});
		this.isModal = true;

		if (classList) {
			this.classList = classList;
		}
	}

	clickOutside(event) {
		if (event.target.classList.contains('pw-backdrop')) {
			this._cancel();
		}
	}

	template({$title}) {
		if (document.body && document.body.classList) {
			document.body.classList.add('modal-open');
		}
		let classList = ' ';
		if (this.classList) {
			for (const css of this.classList) {
				classList = `${classList} ${css}`;
			}
		}
		// This allow the user define a this.$title on controller constructor, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-modal pw-dialog-container pw-backdrop${this.$powerUi.touchdevice ? ' pw-touchdevice': ''}${classList}" data-pow-event onclick="clickOutside(event)">
					${super.template({$title})}
				</div>`;
	}
}

export { PowerModal };
