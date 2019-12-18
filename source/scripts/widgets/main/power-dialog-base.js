class PowerDialogBase extends PowerWidget {
	constructor({$powerUi}) {
		super({$powerUi: $powerUi});

		const self = this;
		this._closeWindow = function() {
			self._cancel();
		}
		$powerUi._events['Escape'].subscribe(this._closeWindow);
	}
	// Allow async calls to implement onCancel
	_cancel() {
		if (this.onCancel) {
			new Promise(this.onCancel.bind(this)).then(
				this.closeCurrentRoute.bind(this)
			).catch(()=> (this.onCancelError) ? this.onCancelError() : null);
		} else {
			this.closeCurrentRoute();
		}
	}
	// Allow async calls to implement onCommit
	_commit() {
		if (this.onCommit) {
			new Promise(this.onCommit.bind(this)).then(
				this.closeCurrentRoute.bind(this)
			).catch(()=> (this.onCommitError) ? this.onCommitError() : null);
		} else {
			this.closeCurrentRoute();
		}
	}

	closeCurrentRoute() {
		// Only close if is opened, if not just remove the event
		const view = document.getElementById(this._viewId);
		this.$powerUi._events['Escape'].unsubscribe(this._closeWindow);
		if (view) {
			super.closeCurrentRoute();
		} else {
			// If not opened, call the next in the queue
			this.$powerUi._events['Escape'].broadcast();
		}
	}

	_onViewLoad(view) {
		const buttons = view.querySelectorAll('[data-pow-click]');
		for (const bt of buttons) {
			if (bt.getAttribute('data-pow-click').includes('_commit')) {
				bt.focus();
				return true;
			}
		}
	}

	$buttons() {
		if (this.commitBt || this.cancelBt) {
			const cancelBt = '<button class="pw-btn-default" data-pow-event onclick="_cancel()">Cancel</button>';
			let buttons = '';
			if (this.commitBt) {
				const commitIco = `<span class="pw-ico fa fa-${(this.commitBt.ico ? this.commitBt.ico : 'check-circle')}"></span>`;
				const commitBt = `<button
								class="${(this.commitBt.css ? this.commitBt.css : 'pw-btn-default')}"
								data-pow-event onclick="_commit()">
								${(this.commitBt.ico !== false ? commitIco : '')}
								${(this.commitBt.label ? this.commitBt.label : 'Ok')}
								</button>`;
				buttons = buttons + commitBt;
			}
			if (this.cancelBt) {
				const cancelIco = `<span class="pw-ico fa fa-${(this.cancelBt.ico ? this.cancelBt.ico : 'times-circle')}"></span>`;
				const cancelBt = `<button
								class="${(this.cancelBt.css ? this.cancelBt.css : 'pw-btn-default')}"
								data-pow-event onclick="_cancel()">
								${(this.cancelBt.ico !== false ? cancelIco : '')}
								${(this.cancelBt.label ? this.cancelBt.label : 'Cancel')}
								</button>`;
				buttons = buttons + cancelBt;
			}
			return buttons;
		} else {
			return '';
		}
	}

	template({$title}) {
		// This allow the user define a this.$title on controller constructor, otherwise use the route title
		this.$title = this.$title || $title;
		return `<div class="pw-title-bar">
					<span class="pw-title-bar-label">${this.$title}</span>
					<div data-pow-event onclick="_cancel()" class="pw-bt-close fa fa-times"></div>
				</div>
				<div class="pw-window">
					<div data-pw-content>
					</div>
					<div class="pw-container">
						${this.$buttons()}
					</div>
				</div>`;
	}
}
