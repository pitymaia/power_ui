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

	dropMenuButton(button) {
		// if (this.validate(this.buttonDef, button) === false) {
		// 	window.console.log('Failed JSON button:', button);
		// 	return 'Failed JSON button!';
		// }

		const tmpEl = document.createElement('div');

		tmpEl.innerHTML = this.button(button);

		const buttonEl = tmpEl.children[0];
		// TODO: power-target needs use dropmenu id
		buttonEl.dataset.powerTarget = "my-drop-menu";
		buttonEl.classList.add("power-action");

		const caret = document.createElement('span');
		caret.classList.add("power-status");
		caret.classList.add("pw-icon");
		caret.dataset.powerActive = "caret-down";
		caret.dataset.powerInactive = "caret-right";
		buttonEl.appendChild(caret);
		console.log('buttonEl', buttonEl.children);

		//<span class="power-status pw-icon" data-power-active="caret-down" data-power-inactive="caret-right"></span>

		// tmpEl.innerHTML = tmpEl.innerHTML + `<button class="power-action" data-power-target="my-drop-menu">Show <span class="power-status pw-icon" data-power-active="caret-down" data-power-inactive="caret-right"></span></button>
		tmpEl.innerHTML = tmpEl.innerHTML + `<nav id="my-drop-menu"
					class="power-dropmenu"
					data-power-position="bottom"
					data-pow-main-css-hover="pw-orange"
					data-pow-css-hover="pw-green"
				>
				<a class="power-item" data-pow-event onclick="openModal({name: 'Ditabranda', title: '1964'})">Ditadura a brasileira</a>
				<a class="power-item"data-pow-event onclick="openModal({name: 'Mundo Novo', title: 'Amor Livre'})">Admiravel Mundo</a>
				<a class="power-item" data-pow-event onclick="openModal({name: 'Granja do Solé', title: 'Revolução dos bichos'})">Revolução dos Bichos</a>
				<a class="power-item">Other Blog</a>
				<a class="power-item">News</a>
			</nav>`;

		return tmpEl.innerHTML;
	}

	button(button) {
		if (this.validate(this.buttonDef, button) === false) {
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
		tmpEl.innerHTML = `<button class="pw-btn-${button.kind || 'default'}" id="${button.id}" ${button.events ? 'data-pow-event' + eventsTmpl : ''}>${button.icon ? '<span class="pw-icon ' + button.icon + '"></span>' : ''}<span>${button.label}</span></button>`;

		const buttonEl = tmpEl.children[0];
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

