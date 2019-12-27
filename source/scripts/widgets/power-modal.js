class PowerModal extends PowerDialogBase {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
		this.isModal = true;
	}

	clickOutside(event) {
		if (event.target.classList.contains('pw-modal-backdrop')) {
			this._cancel();
		}
	}

	template({$title}) {
		if (document.body && document.body.classList) {
			document.body.classList.add('modal-open');
		}
		// This allow the user define a this.$title on controller constructor, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-modal pw-modal-backdrop${this.$powerUi.touchdevice ? ' pw-touchdevice': ''}" data-pow-event onclick="clickOutside(event)">
					${super.template({$title})}
				</div>`;
	}
}
