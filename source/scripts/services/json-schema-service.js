class JSONSchemaService extends PowerServices {
	constructor({$powerUi, $ctrl}) {
		super({$powerUi, $ctrl});
	}

	validateType(type, json) {
		if (typeof json === type) {
			return true;
		} else if (type === 'array' && json.length !== undefined) {
				return true;
		} else {
			window.console.log(`JSON type expected to be "${type}" but is "${typeof json}"`, json);
			return false;
		}
	}

	validate(schema, json) {
		// Check current object type against schema type
		if (this.validateType(schema.type, json) === false) {
			return false;
		}
		// Validade required fields
		if (schema.required) {
			for (const property of schema.required) {
				if (!json[property] && (!json[0] || (json[0] && !json[0][property]))) {
					window.console.log(`JSON missing required property: "${property}"`, json);
					return false;
				}
			}
		}
		// Validate item properties and inner nodes
		for (const key of Object.keys(schema.properties || {})) {
			// Validate inner schema nodes
			// Validade array type property
			if (schema.properties[key].type === 'array' && schema.properties[key].items) {
				for (const item of json[key]) {
					if (this.validate(schema.properties[key].items, item) === false) {
						return false;
					}
				}
			// Validade other types property
			} else if (schema.properties[key].properties && json[key] !== undefined) {
				if (this.validate(schema.properties[key], json[key]) === false) {
					return false;
				}
			}

			// Validate current property type
			if (json[key] !== undefined) {
				if (this.validateType(schema.properties[key].type, json[key]) === false) {
					window.console.log('Failed JSON key is:', key);
					return false;
				}
			}
		}

		return true;
	}

	accordion(accordion) {
		if (this.validate(this.accordionDef, accordion) === false) {
			window.console.log('Failed JSON accordion:', accordion);
			return 'Failed JSON accordion!';
		}
		const tmpEl = document.createElement('div');
		tmpEl.innerHTML = `<div class="power-accordion" id="${accordion.id}" data-multiple-sections-open="${(accordion.config && accordion.config.multipleSectionsOpen ? accordion.config.multipleSectionsOpen : false)}">`;
		const accordionEl = tmpEl.children[0];
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

	dropMenuButton(dropMenuButton) {
		// if (this.validate(this.buttonDef, button) === false) {
		// 	window.console.log('Failed JSON button:', button);
		// 	return 'Failed JSON button!';
		// }

		const tmpEl = document.createElement('div');
		// Create button
		tmpEl.innerHTML = this.button(dropMenuButton, true);

		const buttonEl = tmpEl.children[0];
		buttonEl.dataset.powerTarget = dropMenuButton.dropmenu.id;
		buttonEl.classList.add('power-action');

		if (dropMenuButton.status) {
			const status = document.createElement('span');
			status.classList.add('power-status');
			status.classList.add('pw-icon');
			status.dataset.powerActive = dropMenuButton.status.active;
			status.dataset.powerInactive = dropMenuButton.status.inactive;
			if (dropMenuButton.status.position === 'left') {
				buttonEl.insertBefore(status, buttonEl.childNodes[0]);
			} else {
				buttonEl.appendChild(status);
			}
		}

		// Create dropmenu
		tmpEl.innerHTML = tmpEl.innerHTML + this.dropmenu(dropMenuButton.dropmenu);

		return tmpEl.innerHTML;
	}

	dropmenu(dropmenu) {
		// if (!avoidValidation && this.validate(this.dropmenuDef, dropmenu) === false) {
		// 	window.console.log('Failed JSON dropmenu:', button);
		// 	return 'Failed JSON dropmenu!';
		// }

		const tmpEl = document.createElement('div');
		// Add events if have
		let eventsTmpl = '';
		if (dropmenu.events) {
			for (const event of dropmenu.events) {
				eventsTmpl = `${eventsTmpl} ${event.event}="${event.fn}" `;
			}
		}
		tmpEl.innerHTML = `<nav class="power-dropmenu" id="${dropmenu.id}" ${dropmenu.events ? 'data-pow-event' + eventsTmpl : ''}></nav>`;

		for (const item of dropmenu.items) {
			const itemHolderEl = document.createElement('div');

			// Add item events if have
			let itemEventsTmpl = '';
			if (dropmenu.events) {
				for (const event of dropmenu.events) {
					itemEventsTmpl = `${itemEventsTmpl} ${event.event}="${event.fn}" `;
				}
			}

			itemHolderEl.innerHTML = `<a class="${item.dropmenu ? 'power-action' : 'power-item'}" id="${item.id}" ${item.events ? 'data-pow-event' + itemEventsTmpl : ''} ${item.dropmenu ? 'data-power-target="' + item.dropmenu.id + '"' : ''}><span class="pw-label">${item.label}</span></a>`;

			const anchorEl = itemHolderEl.children[0];
			// TODO: Move into a function?
			if (item.icon) {
				const icon = document.createElement('span');
				icon.classList.add('pw-icon');
				icon.classList.add(item.icon);
				if (!item['icon-position'] || item['icon-position'] === 'left') {
					anchorEl.insertBefore(icon, anchorEl.childNodes[0]);
				} else {
					anchorEl.appendChild(icon);
				}
			}
			// TODO: Move into a function?
			if (item.status) {
				const status = document.createElement('span');
				status.classList.add('power-status');
				status.classList.add('pw-icon');
				status.dataset.powerActive = item.status.active;
				status.dataset.powerInactive = item.status.inactive;
				if (item.status.position === 'left') {
					anchorEl.insertBefore(status, anchorEl.childNodes[0]);
				} else {
					anchorEl.appendChild(status);
				}
			}

			// TODO: Move into a function?
			if (item.classList) {
				for (const css of item.classList) {
					anchorEl.classList.add(css);
				}
			}

			tmpEl.children[0].appendChild(anchorEl);

			// Add submenu if have one
			if (item.dropmenu) {
				const submenuHolderEl = document.createElement('div');
				submenuHolderEl.innerHTML = this.dropmenu(item.dropmenu);
				tmpEl.children[0].appendChild(submenuHolderEl.children[0]);
			}
		}

		return tmpEl.innerHTML;
	}

	button(button, avoidValidation) {
		if (!avoidValidation && this.validate(this.buttonDef, button) === false) {
			window.console.log('Failed JSON button:', button);
			return 'Failed JSON button!';
		}

		const tmpEl = document.createElement('div');
		// Add events if have
		let eventsTmpl = '';
		if (button.events) {
			for (const event of button.events) {
				eventsTmpl = `${eventsTmpl} ${event.event}="${event.fn}" `;
			}
		}
		tmpEl.innerHTML = `<button class="pw-btn-${button.kind || 'default'}" id="${button.id}" ${button.events ? 'data-pow-event' + eventsTmpl : ''}><span class="pw-label">${button.label}</span></button>`;

		const buttonEl = tmpEl.children[0];

		if (button.icon) {
			const icon = document.createElement('span');
			icon.classList.add('pw-icon');
			icon.classList.add(button.icon);
			if (!button['icon-position'] || button['icon-position'] === 'left') {
				buttonEl.insertBefore(icon, buttonEl.childNodes[0]);
			} else {
				buttonEl.appendChild(icon);
			}
		}

		if (button.classList) {
			for (const css of button.classList) {
				buttonEl.classList.add(css);
			}
		}

		return tmpEl.innerHTML;
	}

	get accordionDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#draft-07/accordion",
			"type": "object",
			"properties": {
				"classList": {"type": "array"},
				"config": {
					"type": "object",
					"properties": {
						"multipleSectionsOpen": {"type": "boolean"}
					}
				},
				"panels": {
					"type": "array",
					"items": {
						"type": "object",
						"properties": {
							"header": {
								"type": "object",
								"properties": {
									"id": {"type": "string"},
									"title": {"type": "string"}
								},
								"required": ["title", "id"]
							},
							"section": {
								"type": "object",
								"properties": {
									"id": {"type": "string"},
									"content": {"type": "string"}
								},
								"required": ["content", "id"]
							}
						},
						"required": ["header", "section"]
					}
				}
			},
			"required": ["panels"]
		};
	}

	get buttonDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#draft-07/button",
			"type": "object",
			"properties": {
				"classList": {"type": "array"},
				"label": {"type": "string"},
				"id": {"type": "string"},
				"icon": {"type": "string"},
				"kind": {"type": "string"},
				"events": {
					"type": "array",
					"properties": {
						"event": {"type": "string"},
						"fn": {"type": "string"},
					},
					"required": ["event", "fn"]
				},
			},
			"required": ["label"]
		};
	}
}

