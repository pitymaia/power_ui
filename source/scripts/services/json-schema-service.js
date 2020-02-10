class JSONSchemaService extends PowerServices {
	constructor({$powerUi, $ctrl}) {
		super({$powerUi, $ctrl});
		this.accordionDef = {
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
		// Check current object type agains schema type
		if (this.validateType(schema.type, json) === false) {
			return false;
		}
		// Validade required fields
		if (schema.required) {
			for (const property of schema.required) {
				if (!json[property]) {
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
}

