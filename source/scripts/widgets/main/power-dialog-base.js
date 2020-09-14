class PowerDialogBase extends PowerWidget {
	constructor({$powerUi, noEsc, promise}) {
		super({$powerUi: $powerUi});
		const self = this;
		if (promise) {
			this._promise = new Promise(function (resolve, reject) {
				self._resolve = resolve;
				self._reject = reject;
			});
		}

		if (noEsc) {
			return;
		}

		this._closeWindow = function() {
			self._cancel();
		};

		$powerUi._events['Escape'].subscribe(this._closeWindow);
	}
	// Allow async calls to implement onCancel
	_cancel(...args) {
		if (this.onCancel && this._promise) {
			const commands = this.onCancel(this._resolve, this._reject, ...args) || [];
			const self = this;
			this._promise.then(function () {
				self.closeCurrentRoute({commands: commands});
			}).catch(function (error) {
				self.closeCurrentRoute();
			});
		} else if (this.onCancel) {
			const commands = this.onCancel(...args) || [];
			this.closeCurrentRoute({commands: commands});
		} else {
			this.closeCurrentRoute();
		}
	}
	// Allow async calls to implement onCommit
	_commit(...args) {
		if (this.onCommit && this._promise) {
			const commands = this.onCommit(this._resolve, this._reject,...args) || [];
			const self = this;
			this._promise.then(function () {
				self.closeCurrentRoute({commands: commands});
			}).catch(function (error) {
				self.closeCurrentRoute();
			});
		} else if (this.onCommit) {
			const commands = this.onCommit(...args) || [];
			this.closeCurrentRoute({commands: commands});
		} else {
			this.closeCurrentRoute();
		}
	}

	closeCurrentRoute({commands=[], callback=null}={}) {
		// Only close if is opened,
		const view = document.getElementById(this._viewId);
		if (view) {
			super.closeCurrentRoute({commands: commands, callback: callback});
		} else {
			// If not opened, call the next in the queue
			this.$powerUi._events['Escape'].broadcast();
		}
	}

	_onRemoveCtrl() {
		this.$powerUi.dialogs = this.$powerUi.dialogs.filter(d=> d.id !== this.dialogId);
		this.$powerUi._events['Escape'].unsubscribe(this._closeWindow);
	}

	_onViewLoad(view, hasCustomScroll, hasCustomLimits) {
		this.$powerUi.onBrowserWindowResize.subscribe(this.browserWindowResize.bind(this));
		this.isHiddenRoute = this.$powerUi.router.routes[this._routeId].isHidden || false;
		const route = this.$powerUi.router.getOpenedRoute({routeId: this._routeId, viewId: this._viewId});

		this._dialog = view.getElementsByClassName('pw-dialog-container')[0];
		this.bodyEl = view.getElementsByClassName('pw-body')[0];
		this.titleBarEl = view.getElementsByClassName('pw-title-bar')[0];

		if (route) {
			this.dialogId = `dialog_${route.route.replace('/', '-')}`;
			this.zIndex = 2000 + this.$powerUi.dialogs.length + 1;
			this._dialog.style.zIndex = this.zIndex;
			this.$powerUi.dialogs.push({id: this.dialogId, ctrl: this});
		}

		if (!hasCustomLimits) {
			this.setHeightLimits();
		}
		if (!hasCustomScroll) {
			this.restoreScrollPosition(view);
		}
	}


	setHeightLimits() {
		if (this.bodyEl.offsetHeight + this.titleBarEl.offsetHeight > window.innerHeight - 30) {
			this._setHieghtLimits();
		} else {
			this.bodyEl.style.height = null;
			// There is a chance when resizing that the value after removing the height is greater than allowed
			if (this.bodyEl.offsetHeight + this.titleBarEl.offsetHeight > window.innerHeight - 30) {
				this._setHieghtLimits();
			}
		}
	}

	_setHieghtLimits() {
		const newHeight = window.innerHeight - this.titleBarEl.offsetHeight - 30 + 'px';
		this.bodyEl.style.height = newHeight;
	}

	browserWindowResize() {
		this.setHeightLimits();
	}

	restoreScrollPosition(view) {
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
					<div data-pow-event onclick="_cancel()" class="pw-bt-dialog-title pw-icon icon-cancel-black"></div>
					${this.restoreBt ? '<div style="display:none;" data-pow-event onclick="restore(event)" class="pw-bt-dialog-title pw-icon icon-windows"></div>' : ''}
					${this.maximizeBt ? '<div data-pow-event onclick="maximize(event)" class="pw-bt-dialog-title pw-icon icon-maximize"></div>' : ''}
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
