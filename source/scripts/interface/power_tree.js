class PowerTreeView extends PowerTarget {
    constructor(element) {
        super(element);
        if (element.dataset.onClickFile) {
            this.mainNode = true;
        }
    }

    init() {
        const view = this.$pwView;
        // The scope of the controller of the view of this element
        this.ctrlScope = (view && view.id && this.$powerUi.controllers[view.id]) ? this.$powerUi.controllers[view.id].instance : false;
        if (this.mainNode) {
            const items = this.element.getElementsByClassName('power-item');
            for (const item of items) {
                const obj = this.$powerUi.powerTree.allPowerObjsById[item.id];
                if (obj && obj.powerItem) {
                    const onScope = this.$powerUi.getObjectOnScope({text: this.element.dataset.onClickFile, $powerUi: this.$powerUi, scope: this.ctrlScope});

                    obj.powerItem.subscribe({fn: onScope, event: 'click', ctx: this.ctrlScope, path: decodeURI(obj.powerItem.element.dataset.filePath), element: item});
                }
            }
        }
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-tree-view'});
