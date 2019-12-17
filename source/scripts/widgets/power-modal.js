class PowerModal extends PowerWidget {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});
		this.isModal = true;

		const self = this;
		this._closeModal = function() {
			self.closeCurrentRoute();
		}
		$powerUi._events['Escape'].subscribe(this._closeModal);
	}

	closeCurrentRoute() {
		super.closeCurrentRoute();
		this.$powerUi._events['Escape'].unsubscribe(this._closeModal);
	}

	template({$title}) {
		if (document.body && document.body.classList) {
			document.body.classList.add('modal-open');
		}
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
