class PowerWidget extends PowerController {
    constructor({$powerUi}) {
        super({$powerUi: $powerUi});
        this.isWidget = true;
    }

    $buildTemplate({template}) {
        const tempElement = document.createElement('div');
        tempElement.innerHTML = this.template();
        const content = tempElement.querySelectorAll('[data-pw-content]');
        content[0].innerHTML = template;
        template = tempElement.innerHTML;

        return template;
    }
}
