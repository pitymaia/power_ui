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
			this.appendClassList({element: accordionEl, json: accordion});
		}

		for (const panel of accordion.panels) {
			// Headers
			const headerHolderEl = document.createElement('div');
			headerHolderEl.innerHTML = `<div class="power-action" data-power-target="${panel.section.id}" id="${panel.header.id}">
					<div><span class="pw-label">${panel.header.label}</span></div>
				</div>`;
			const headerEl = headerHolderEl.children[0];

			if (panel.header) {
				this.appendIcon({element: headerEl.children[0], json: panel.header});
			}

			if (panel.header.status) {
				this.appendStatus({element: headerEl, json: panel.header.status});
			}

			accordionEl.appendChild(headerHolderEl.children[0]);

			// Sections
			const sectionHolderEl = document.createElement('div');
			sectionHolderEl.innerHTML = `<div class="power-accordion-section" id="${panel.section.id}">
				${panel.section.content}
			</div>`;

			accordionEl.appendChild(sectionHolderEl.children[0]);
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
			this.appendStatus({element: buttonEl, json: dropMenuButton.status});
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
			if (item.events) {
				for (const event of item.events) {
					itemEventsTmpl = `${itemEventsTmpl} ${event.event}="${event.fn}" `;
				}
			}

			itemHolderEl.innerHTML = `<a class="${item.dropmenu ? 'power-action' : 'power-item'}" id="${item.id}" ${item.events ? 'data-pow-event' + itemEventsTmpl : ''} ${item.dropmenu ? 'data-power-target="' + item.dropmenu.id + '"' : ''}><span class="pw-label">${item.label}</span></a>`;

			const anchorEl = itemHolderEl.children[0];

			if (item.icon) {
				this.appendIcon({element: anchorEl, json: item});
			}

			if (item.status) {
				this.appendStatus({element: anchorEl, json: item.status});
			}

			if (item.classList) {
				this.appendClassList({element: anchorEl, json: item});
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
			this.appendIcon({element: buttonEl, json: button});
		}

		if (button.classList) {
			this.appendClassList({element: buttonEl, json: button});
		}

		return tmpEl.innerHTML;
	}

	appendClassList({element, json}) {
		for (const css of json.classList) {
			element.classList.add(css);
		}
	}

	appendIcon({element, json}) {
		const icon = document.createElement('span');
		icon.classList.add('pw-icon');
		icon.classList.add(json.icon);
		if (!json['icon-position'] || json['icon-position'] === 'left') {
			element.insertBefore(icon, element.childNodes[0]);
		} else {
			element.appendChild(icon);
		}
	}

	appendStatus({element, json}) {
		const status = document.createElement('span');
		status.classList.add('power-status');
		status.classList.add('pw-icon');
		status.dataset.powerActive = json.active;
		status.dataset.powerInactive = json.inactive;
		if (json.position === 'left') {
			element.insertBefore(status, element.childNodes[0]);
		} else {
			element.appendChild(status);
		}
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
									"label": {"type": "string"},
									"icon": {"type": "string"}
								},
								"required": ["label", "id"]
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

