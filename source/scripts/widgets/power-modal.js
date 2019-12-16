class PowerModal extends PowerWidget {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
		this.$powerUi.numberOfopenModals = this.$powerUi.numberOfopenModals + 1;
		if (document.body && document.body.classList) {
			document.body.classList.add('modal-open');
		}
	}

	closeCurrentRoute() {
		this.$powerUi.numberOfopenModals = this.$powerUi.numberOfopenModals - 1;
		if (document.body && document.body.classList && this.$powerUi.numberOfopenModals <=0) {
			document.body.classList.remove('modal-open');
		}
		super.closeCurrentRoute();
	}

	template({$title}) {
		// This allow the user define a this.$title on controller constructor, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-modal-backdrop">
					<div class="pw-title-bar">
						<span class="pw-title-bar-label">${this.$title}</span>
						<div data-pow-event onclick="closeCurrentRoute()" class="pw-bt-close fa fa-times"></div>
					</div>
					<div class="pw-modal" data-pw-content>
					</div>
				</div>`;
	}
}
