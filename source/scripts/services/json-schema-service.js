class JSONSchemaService extends PowerServices {

	accordion(accordion) {
		const tmpEl = document.createElement('div');
		tmpEl.innerHTML = `<div class="power-accordion" id="${accordion.id}" data-multiple-sections-open="${(accordion.config && accordion.config.multipleSectionsOpen ? accordion.config.multipleSectionsOpen : false)}">`;
		const accordionEl = tmpEl.children[0];
		console.log('accordionEl', accordionEl);
		if (accordion.classList) {
			for (const css of accordion.classList) {
				accordionEl.classList.add(css);
			}
		}

		for (const panel of accordion.panels) {
			accordionEl.innerHTML = accordionEl.innerHTML + `<div class="power-action" data-power-target="${panel.section.id}" id="${panel.header.id}">
					<span>${panel.header.title}</span>
					<span class="power-status pw-icon" data-power-active="${panel.header.activeIcon || 'chevron-down'}" data-power-inactive="${panel.header.inactiveIcon || 'chevron-right'}"></span>
				</div>
				<div class="power-accordion-section" id="${panel.section.id}">
					${panel.section.content}
				</div>`;
		}
		return tmpEl.innerHTML;
	}
}

