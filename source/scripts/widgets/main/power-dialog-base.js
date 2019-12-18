class PowerDialogBase extends PowerWidget {
    constructor({$powerUi}) {
        super({$powerUi: $powerUi});

        const self = this;
        this._closeWindow = function() {
            self.closeCurrentRoute();
        }
        $powerUi._events['Escape'].subscribe(this._closeWindow);
    }

    _cancel() {
        if (this.onBeforeCancel) {
            this.onBeforeCancel();
        } else {
            this.closeCurrentRoute();
        }
    }

    _confirm() {
        if (this.onBeforeConfirm) {
            this.onBeforeConfirm();
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
                    <div data-pow-event onclick="closeCurrentRoute()" class="pw-bt-close fa fa-times"></div>
                </div>
                <div class="pw-window" data-pw-content>
                </div>`;
    }
}
