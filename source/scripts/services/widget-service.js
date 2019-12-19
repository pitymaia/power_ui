class WidgetService {
    constructor({$powerUi}) {
        this.$powerUi = $powerUi;
    }
    open(options) {
        console.log('open', options, this.$powerUi);
    }
}
