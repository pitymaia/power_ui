class PowerDialogBase extends PowerWidget {
	constructor({$powerUi, noEsc}) {
		super({$powerUi: $powerUi});

		if (noEsc) {
			return;
		}
		const self = this;
		this._closeWindow = function() {
			self._cancel();
		}

		$powerUi._events['Escape'].subscribe(this._closeWindow);
	}
	// Allow async calls to implement onCancel
	_cancel(...args) {
		if (this.onCancel) {
			this.onCancel(this._resolve, this._reject, ...args);
			const self = this;
			this._promise.then(function () {
				self.closeCurrentRoute();
			}).catch(function (error) {
				self.closeCurrentRoute();
			});
		} else {
			this.closeCurrentRoute();
		}
	}
	// Allow async calls to implement onCommit
	_commit(...args) {
		if (this.onCommit) {
			this.onCommit(this._resolve, this._reject,...args);
			const self = this;
			this._promise.then(function () {
				self.closeCurrentRoute();
			}).catch(function (error) {
				self.closeCurrentRoute();
			});
		} else {
			this.closeCurrentRoute();
		}
	}

	closeCurrentRoute(callback) {
		// Only close if is opened, if not just remove the event
		const view = document.getElementById(this._viewId);
		this.$powerUi._events['Escape'].unsubscribe(this._closeWindow);
		if (view) {
			super.closeCurrentRoute(callback);
		} else {
			// If not opened, call the next in the queue
			this.$powerUi._events['Escape'].broadcast();
		}
	}

	_onViewLoad(view) {
		const container = view.getElementsByClassName('pw-container')[0];
		const body = view.getElementsByClassName('pw-body')[0];
		if (container) {
			container.scrollTop = this._containerScrollTop || 0;
			container.scrollLeft = this._containerScrollLeft || 0;
		}
		if (body) {
			body.scrollTop = this._bodyScrollTop || 0;
			body.scrollLeft = this._bodyScrollLeft || 0;
		}
	}

	$buttons() {
		if (this.commitBt || this.cancelBt) {
			const cancelBt = '<button class="pw-btn-default" data-pow-event onclick="_cancel()">Cancel</button>';
			let buttons = '';
			if (this.commitBt) {
				const defaultLabel = this.noBt ? 'Yes' : 'Ok';
				const commitIco = `<span class="pw-icon ${(this.commitBt.icon ? this.commitBt.icon : 'icon-ok-black')}"></span>`;
				const commitBt = `<button
								class="${(this.commitBt.css ? this.commitBt.css : 'pw-btn-default')}"
								data-pow-event onclick="_commit(true)">
								${(this.commitBt.icon !== false ? commitIco : '')}
								<span class="pw-label">
									${(this.commitBt.label ? this.commitBt.label : defaultLabel)}
								</span>
								</button>`;
				buttons = buttons + commitBt;
			}
			if (this.noBt) {
				const noIco = `<span class="pw-icon ${(this.noBt.icon ? this.noBt.icon : 'icon-cancel-black')}"></span>`;
				const noBt = `<button
								class="${(this.noBt.css ? this.noBt.css : 'pw-btn-default')}"
								data-pow-event onclick="_commit(false)">
								${(this.noBt.icon !== false ? noIco : '')}
								<span class="pw-label">
									${(this.noBt.label ? this.noBt.label : 'No')}
								</span>
								</button>`;
				buttons = buttons + noBt;
			}
			if (this.cancelBt) {
				const defaultIco = this.noBt ? 'icon-cancel-simple' : 'icon-cancel-black';
				const cancelIco = `<span class="pw-icon ${(this.cancelBt.icon ? this.cancelBt.icon : defaultIco)}"></span>`;
				const cancelBt = `<button
								class="${(this.cancelBt.css ? this.cancelBt.css : 'pw-btn-default')}"
								data-pow-event onclick="_cancel()">
								${(this.cancelBt.icon !== false ? cancelIco : '')}
								<span class="pw-label">
									${(this.cancelBt.label ? this.cancelBt.label : 'Cancel')}
								</span>
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
					<div data-pow-event onclick="_cancel()" class="pw-bt-close pw-icon icon-cancel-black"></div>
				</div>
				<div class="pw-body">
					<div class="pw-container" data-pw-content>
					</div>
					<div class="pw-container">
						${this.$buttons()}
					</div>
				</div>`;
	}
}

export { PowerDialogBase };
