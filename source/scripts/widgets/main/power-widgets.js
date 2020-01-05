class PowerWidget extends PowerController {
    constructor({$powerUi}) {
        super({$powerUi: $powerUi});
        this.isWidget = true;
    }

    $buildTemplate({template, title}) {
        const tempElement = document.createElement('div');
        if (this.addBeforeTemplate) {
            template = this.addBeforeTemplate + template;
        }
        tempElement.innerHTML = this.template({$title: title || null});
        if (this.addAfterTemplate) {
            template = template + this.addAfterTemplate;
        }
        const content = tempElement.querySelectorAll('[data-pw-content]');
        content[0].innerHTML = template;
        template = tempElement.innerHTML;

        return template;
    }
}

export { PowerWidget };
