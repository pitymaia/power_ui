class PowerModal extends PowerWidget {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
	}
	template() {
		return `<div class="pw-modal-backdrop">
					<div class="pw-title-bar">
						<div data-pow-event onclick="closeCurrentRoute()" class="pw-bt-close fa fa-times"></div>
					</div>
					<div class="pw-modal" data-pw-content>
					</div>
				</div>`;
	}
}
