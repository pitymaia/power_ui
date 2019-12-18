class PowerDialogBase extends PowerWidget {
    constructor({$powerUi}) {
        super({$powerUi: $powerUi});

        const self = this;
        this._closeWindow = function() {
            self._cancel();
        }
        $powerUi._events['Escape'].subscribe(this._closeWindow);
    }
    // Allow async calls to implement onBeforeCancel
    _cancel() {
        if (this.onBeforeCancel) {
            new Promise(this.onBeforeCancel.bind(this)).then(
                this.closeCurrentRoute.bind(this)
            ).catch(()=> (this.onCancelError) ? this.onCancelError() : null);
        } else {
            this.closeCurrentRoute();
        }
    }
    // Allow async calls to implement onBeforeConfirm
    _confirm() {
        if (this.onBeforeConfirm) {
            new Promise(this.onBeforeConfirm.bind(this)).then(
                this.closeCurrentRoute.bind(this)
            ).catch(()=> (this.onConfirmError) ? this.onConfirmError() : null);
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

    template({$title}) {
        if (document.body && document.body.classList) {
            document.body.classList.add('modal-open');
        }
        // This allow the user define a this.$title on controller constructor, otherwise use the route title
        this.$title = this.$title || $title;
        return `<div class="pw-title-bar">
                    <span class="pw-title-bar-label">${this.$title}</span>
                    <div data-pow-event onclick="_cancel()" class="pw-bt-close fa fa-times"></div>
                </div>
                <div class="pw-window" data-pw-content>
                </div>`;
    }
}
