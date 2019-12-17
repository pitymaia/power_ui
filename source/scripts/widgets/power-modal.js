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

	clickOutside(event) {
		if (event.target.classList.contains('pw-modal-backdrop')) {
			this.closeCurrentRoute();
		}
	}

	closeCurrentRoute() {
		// Only close if is opened, if not just remove the event
		const view = document.getElementById(this._viewId);
		this.$powerUi._events['Escape'].unsubscribe(this._closeModal);
		if (view) {
			super.closeCurrentRoute();
		} else {
			// If not opened, call the next in the queue
			this.$powerUi._events['Escape'].broadcast();
		}
	}

	template({$title}) {
		if (document.body && document.body.classList) {
			document.body.classList.add('modal-open');
		}
		// This allow the user define a this.$title on controller constructor, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-modal-backdrop" data-pow-event onclick="clickOutside(event)">
					<div class="pw-title-bar">
						<span class="pw-title-bar-label">${this.$title}</span>
						<div data-pow-event onclick="closeCurrentRoute()" class="pw-bt-close fa fa-times"></div>
					</div>
					<div class="pw-modal" data-pw-content>
					</div>
				</div>`;
	}
}
