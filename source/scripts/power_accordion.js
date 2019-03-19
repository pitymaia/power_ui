class PowerAccordion extends PowerTarget {
    constructor(element) {
        super(element);
        element.getAttribute('data-multiple-sections-open') === 'true' ? this.multipleSectionsOpen = true : this.multipleSectionsOpen = false;
        this.powerSection = {};
        this.powerAction = {};
    }
    init() {
        // Add all sections and actions to Power Accordion
        const powerSections = this.element.getElementsByClassName('power-section');
        for (const section of powerSections) {
            this.powerSection[section.id] = this.$powerUi.powerTree.powerCss.powerSection[section.id];
            // Add accordion to section
            this.powerSection[section.id].powerAccordion = this;
        }
        const powerActions = this.element.getElementsByClassName('power-action');
        for (const action of powerActions) {
            this.powerAction[action.id] = this.$powerUi.powerTree.powerCss.powerAction[action.id];
            // Add accordion to action
            this.powerAction[action.id].powerAccordion = this;
        }
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-accordion'});


class PowerSection extends PowerTarget {
    constructor(element) {
        super(element);
    }

    action() {
        // If not allow multipleSectionsOpen, close the other sections
        if (!this.powerAccordion.multipleSectionsOpen) {
            for (const action in this.powerAccordion.powerAction) {
                // Only closes if is not this section and if is active
                const targetAction = this.powerAccordion.powerAction[action];
                if (targetAction.targetObj.id !== this.id && targetAction._$pwActive) {
                    // This prevent the targetAction.toggle call this action again, so this flag avoid a loop to occurs
                    targetAction.toggle({avoidCallAction: true});
                }
            }
        }
    }
}
// Inject the power css on PowerUi
PowerUi.injectPowerCss({name: 'power-section'});
