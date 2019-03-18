class PowerMain extends _PowerBasicElementWithEvents {
    constructor(element) {
        super(element);
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-main', isMain: true});
