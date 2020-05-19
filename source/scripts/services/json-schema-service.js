class JSONSchemaService extends PowerServices {
	constructor({$powerUi, $ctrl}) {
		super({$powerUi, $ctrl});
	}

	validateType(type, json) {
		if (typeof json === type) {
			return true;
		} else if (type === 'array' && json.length !== undefined) {
				return true;
		} else if (type.length !== undefined && json.length !== undefined) {
			console.log('TYPE ARRAY', type);
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
			// If is some reference to another schema get it
			// TODO: This is not working...
			if (schema.properties[key].$ref) {
				// console.log('schema.properties[key].$ref', this.$ref(schema.properties[key].$ref), json[key], key, json);
				if (json[key] && this.validate(this.$ref(schema.properties[key].$ref), json[key]) === false) {
					return false;
				}
			}
			// Validate image icons
			if (key === 'icon' && json[key] === 'img' && json['icon-src'] === undefined) {
				window.console.log('Failed JSON: "icon-src" is required! Some item with "icon" attribute is set to "img" but is missing the "icon-src" attribute');
				window.console.log('Failed JSON ID is:', json.id, ' and key is: ', key);
				return false;
			}
			// Validade array type property
			else if (schema.properties[key].type === 'array' && schema.properties[key].items) {
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
			if (json[key] !== undefined && !schema.properties[key].$ref) {
				if (this.validateType(schema.properties[key].type, json[key]) === false) {
					window.console.log('Failed JSON key is:', key);
					return false;
				}
			}
		}

		return true;
	}

	accordion(accordion) {
		if (this.validate(this.accordionDef(), accordion) === false) {
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

	menu(menu) {
		if (this.validate(this.menuDef(), menu) === false) {
			window.console.log('Failed JSON menu:', menu);
			return 'Failed JSON menu!';
		}
		// Menus extends dropmenu
		const tmpEl = document.createElement('div');

		// Set dropmenu position
		if (!menu.position) {
			if (!menu.orientation || menu.orientation === 'horizontal') {
				if (menu.mirrored === true) {
					if (menu.kind === undefined || menu.kind === 'fixed-top') {
						menu.position = 'bottom-left';
					} else if (menu.kind === 'fixed-bottom') {
						menu.position = 'top-left';
					}
				} else {
					if (menu.kind === undefined || menu.kind === 'fixed-top') {
						menu.position = 'bottom-right';
					} else if (menu.kind === 'fixed-bottom') {
						menu.position = 'top-right';
					}
				}
			} else if (menu.orientation === 'vertical') {
				if (menu.mirrored === true || (menu.mirrored === undefined && (menu.kind === 'fixed-right' || menu.kind === 'float-right'))) {
					menu.position = 'left-bottom';
				} else {
					menu.position = 'right-bottom';
				}
			}
		}
		tmpEl.innerHTML =  this.dropmenu(menu, menu.mirrored, true);

		const menuEl = tmpEl.children[0];

		// Set menu css styles
		if (menu.kind === 'fixed-top') {
			menuEl.classList.add('pw-menu-fixed');
			menuEl.classList.add('pw-top');
		} else if (menu.kind === 'fixed-bottom') {
			menuEl.classList.add('pw-menu-fixed');
			menuEl.classList.add('pw-bottom');
		} else if (menu.kind === 'fixed-left') {
			menuEl.classList.add('pw-menu-fixed');
			menuEl.classList.add('pw-left');
		} else if (menu.kind === 'fixed-right') {
			menuEl.classList.add('pw-menu-fixed');
			menuEl.classList.add('pw-right');
		} else if (menu.kind === 'float-left') {
			menuEl.classList.add('pw-menu-float');
			menuEl.classList.add('pw-left');
		} else if (menu.kind === 'float-right') {
			menuEl.classList.add('pw-menu-float');
			menuEl.classList.add('pw-right');
		}

		// Brand
		if (menu.brand) {
			// Add horizontal style
			menuEl.classList.add('pw-horizontal');

			// Add hamburger menu toggle
			const brandHolderEl = document.createElement('div');
			brandHolderEl.innerHTML = `<div class="power-brand">${menu.brand}</div>`;
			const brandEl = brandHolderEl.children[0];
			menuEl.insertBefore(brandEl, menuEl.childNodes[0]);
		}

		if (!menu.orientation || menu.orientation === 'horizontal') {
			// Add horizontal style
			menuEl.classList.add('pw-horizontal');

			// Add hamburger menu toggle
			const hamburgerHolderEl = document.createElement('div');
			hamburgerHolderEl.innerHTML = `<a id="${menu.id}-action" class="power-toggle" data-power-target="${menu.id}">
				<i class="pw-icon icon-hamburguer"></i>
			</a>`;
			const hamburgerEl = hamburgerHolderEl.children[0];
			menuEl.appendChild(hamburgerEl);
		} else if (menu.orientation === 'vertical') {
			menuEl.classList.add('pw-vertical');
		}

		if (menu.classList) {
			this.appendClassList({element: menuEl, json: menu});
		}

		return tmpEl.innerHTML;
	}

	dropmenu(dropmenu, mirrored, isMenu) {
		if (this.validate(this.dropmenuDef(), dropmenu) === false) {
			window.console.log('Failed JSON dropmenu:', dropmenu);
			return 'Failed JSON dropmenu!';
		}

		const tmpEl = document.createElement('div');

		tmpEl.innerHTML = `<nav class="${isMenu ? 'power-menu' : 'power-dropmenu'}${mirrored === true ? ' pw-mirrored' : ''}" id="${dropmenu.id}"></nav>`;

		// Set menu position
		if (dropmenu.position) {
				const menu = tmpEl.children[0];
				menu.dataset.powerPosition = dropmenu.position;
		}

		for (const item of dropmenu.items) {
			const itemHolderEl = document.createElement('div');

			if (item.item) {
				itemHolderEl.innerHTML = this.item({
					item: item.item,
					avoidValidation: false,
					mirrored: item.mirrored === undefined ? mirrored : item.mirrored,
					dropmenuId: item.dropmenu ? item.dropmenu.id : false
				});
			} else if (item.button && item.dropmenu) {
				if (mirrored !== undefined && item.button.mirrored === undefined) {
					item.button.mirrored = mirrored;
				}
				itemHolderEl.innerHTML = this.dropMenuButton(item);
			} else if (item.button && !item.dropmenu) {
				if (mirrored !== undefined && item.button.mirrored === undefined) {
					itemHolderEl.innerHTML = this.button(item.button, false, mirrored);
				} else {
					itemHolderEl.innerHTML = this.button(item.button);
				}
				// Buttons inside menu needs the 'power-item' class
				itemHolderEl.children[0].classList.add('power-item');
			}

			const anchorEl = itemHolderEl.children[0];

			if (item.item && !item.button) {
				if (item.status) {
					this.appendStatus({element: anchorEl, json: item.status, mirrored: mirrored});
				}
			}

			tmpEl.children[0].appendChild(anchorEl);

			// Buttons already have the menu created by dropMenuButton inside itemHolderEl
			if (item.button && item.dropmenu) {
				tmpEl.children[0].appendChild(itemHolderEl.children[0]);
			} else if (item.dropmenu && !item.button) {
				// Add submenu if have one and is not a button
				const submenuHolderEl = document.createElement('div');
				submenuHolderEl.innerHTML = this.dropmenu(item.dropmenu, mirrored);
				tmpEl.children[0].appendChild(submenuHolderEl.children[0]);
			}
		}

		return tmpEl.innerHTML;
	}

	_getEventTmpl(item) {
		// Add events if have
		let eventsTmpl = '';
		if (item.events) {
			for (const event of item.events) {
				eventsTmpl = `${eventsTmpl} ${event.event}="${event.fn}" `;
			}
		}

		return eventsTmpl;
	}

	item({item, avoidValidation, mirrored, dropmenuId}) {
		if (!avoidValidation && this.validate(this.itemDef(), item) === false) {
			window.console.log('Failed JSON item:', item);
			return 'Failed JSON item!';
		}

		const tmpEl = document.createElement('div');
		// Add events if have
		let eventsTmpl = this._getEventTmpl(item);

		tmpEl.innerHTML = `<a class="${dropmenuId ? 'power-action' : 'power-item'}" id="${item.id}" ${item.events ? 'data-pow-event' + eventsTmpl : ''} ${dropmenuId ? 'data-power-target="' + dropmenuId + '"' : ''}><span class="pw-label">${item.label}</span></a>`;

		const itemEl = tmpEl.children[0];

		if (item.icon) {
			this.appendIcon({element: itemEl, json: item, mirrored: mirrored});
		}

		if (item.classList) {
			this.appendClassList({element: itemEl, json: item});
		}

		return tmpEl.innerHTML;
	}

	dropMenuButton(dropMenuButton) {
		if (this.validate(this.dropmenuButtonDef(), dropMenuButton) === false) {
			window.console.log('Failed JSON dropMenuButton:', dropMenuButton);
			return 'Failed JSON button!';
		}

		const tmpEl = document.createElement('div');
		// Create button
		tmpEl.innerHTML = this.button(dropMenuButton.button, true, dropMenuButton.button.mirrored);

		const buttonEl = tmpEl.children[0];
		buttonEl.dataset.powerTarget = dropMenuButton.dropmenu.id;
		buttonEl.classList.add('power-action');

		if (dropMenuButton.status) {
			this.appendStatus({element: buttonEl, json: dropMenuButton.status, mirrored: dropMenuButton.button.mirrored});
		}

		// Create dropmenu
		tmpEl.innerHTML = tmpEl.innerHTML + this.dropmenu(dropMenuButton.dropmenu, dropMenuButton.button.mirrored);

		return tmpEl.innerHTML;
	}

	button(button, avoidValidation, mirrored) {
		if (!avoidValidation && this.validate(this.itemDef(), button) === false) {
			window.console.log('Failed JSON button:', button);
			return 'Failed JSON button!';
		}

		const tmpEl = document.createElement('div');
		// Add events if have
		let eventsTmpl = this._getEventTmpl(button);

		tmpEl.innerHTML = `<button class="pw-btn-${button.kind || 'default'}" type="${button.type || 'button'}" id="${button.id}" ${button.events ? 'data-pow-event' + eventsTmpl : ''}><span class="pw-label">${button.label}</span></button>`;

		const buttonEl = tmpEl.children[0];

		if (button.icon) {
			this.appendIcon({element: buttonEl, json: button, mirrored: mirrored});
		}

		if (button.classList) {
			this.appendClassList({element: buttonEl, json: button});
		}

		return tmpEl.innerHTML;
	}

	tree(tree) {
		if (this.validate(this.treeDef(), tree) === false) {
			window.console.log('Failed JSON tree:', tree);
			return 'Failed JSON tree!';
		}
		let template = `<nav ${tree.id ? 'id="' + tree.id + '"' : ''} class="power-tree-view">`;
		for (const item of tree.content) {
			if (item.kind === 'file') {
				if (tree.events) {
					template = `${template}
					<a class="power-item" data-pow-event `;

					for (const event of tree.events) {
						template = `${template}
						${event.name}="${event.fn}({path: '${item.path}', event: event, element: event.target})" `;
					}
					template = `${template}
					><span class="pw-icon ${item.icon || 'document-blank'}"></span> ${item.fullName}</a>`;
				} else {
					template = `${template}
					<a class="power-item"><span class="pw-icon ${item.icon || 'document-blank'}"></span> ${item.fullName}</a>`;
				}
			} else if (item.kind === 'folder') {
				const id = `list-${this.$powerUi._Unique.next()}`;
				template = `${template}
				<a class="power-list" data-power-target="${id}">
					<span class="power-status pw-icon" data-power-active="${item.active || 'folder-open'}" data-power-inactive="${item.inactive || 'folder-close'}"></span> ${item.fullName}
				</a>
				${this.tree({content: item.content, id: id, events: tree.events})}`;
			}
		}
		template = `${template}
		</nav>`;

		return template;
	}

	_simpleFromGroups({controls, template}) {
		for (const control of controls) {
			const id = control.id || 'input_' + this.$powerUi._Unique.next();
			const label = control.label ? `<label for="${id}">${control.label}</label>` : null;

			let customCss = '';
			if (control.classList) {
				for (const css of control.classList) {
					customCss = `${customCss} ${css}`;
				}
			}

			template = `${template}
				<div class="pw-col">`;

			if (control.button) {

				template = `${template}
					${this.button(control.button)}`;

			} else if (control.type === 'image') {

				// Add events if have
				let eventsTmpl = this._getEventTmpl(control);
				template = `${template}
				<input id="${id}" class="pw-field ${customCss}" src="${control.src}" type="${control.type}" ${control.name ? 'name="' + control.name + '"' : ''} ${control.value ? 'value="' + control.value + '"' : ''} ${control.events ? 'data-pow-event' + eventsTmpl : ''} />`;

			} else if (control.type === 'submit' || control.type === 'reset') {

				template = `${template}
				<input id="${id}" class="${customCss}" type="${control.type}" ${control.name ? 'name="' + control.name + '"' : ''} ${control.value ? 'value="' + control.value + '"' : ''} />`;

			} else if (control.type === 'select') {

				template = `${template}
				${label ? label : ''}
				<select id="${id}" class="pw-field ${customCss}" type="${control.type || 'text'}" ${control.bind ? 'data-pow-bind="' + control.bind + '"' : ''} name="${control.name || ''}" ${control.value ? 'value="' + control.value + '"' : ''} ${control.multiple === true ? 'multiple' : ''}>`;
					for (const item of control.list) {
						template = `${template}<option value="${item.value}"${item.disabled === true ? ' disabled' : ''}${item.selected === true ? ' selected' : ''}>${item.label}</option>`;
					}
				template = `${template}
				</select>`;

			} else if (control.type === 'radio' || control.type === 'checkbox') {

				template = `${template}
				<input class="pw-field ${customCss}" id="${id}" ${control.bind ? 'data-pow-bind="' + control.bind + '"' : ''} type="${control.type}" name="${control.name || ''}" ${control.value ? 'value="' + control.value + '"' : ''} /> ${label ? label : ''}`;

			} else if (control.type === 'textarea') {

				template = `${template}
				${label ? label : ''}
				<textarea class="pw-field ${customCss}" id="${id}" ${control.bind ? 'data-pow-bind="' + control.bind + '"' : ''} ${control.value ? 'rows="' + control.rows + '"' : ''} ${control.value ? 'cols="' + control.cols + '"' : ''} ${control.value ? 'value="' + control.value + '"' : ''}>
					${control.value || ''}
				</textarea>`;

			} else {

				template = `${template}
				${label ? label : ''}
				<input id="${id}" class="pw-field ${customCss}" type="${control.type || 'text'}" ${control.bind ? 'data-pow-bind="' + control.bind + '"' : ''} name="${control.name || ''}" ${control.value ? 'value="' + control.value + '"' : ''} />`;
			}

			template = `${template}
				</div>`;
		}

		return template;
	}
	_simpleFormContent({content, template}) {
		for (const item of content) {
			template = `${template}
			<div class="${item.layout ? 'pw-' + item.layout + '-form' : 'pw-vertical-form'} pw-row">`;
			if (item.controls) {
				template = this._simpleFromGroups({controls: item.controls, template: template});
			}
			// Recursively get another content layer
			if (item.content) {
				template = `${template}
				<div class="pw-col">`;
					template = `${this._simpleFormContent({content: item.content, template: template})}
				</div>`;
			}

			template = template + '</div>';
		}

		return template;
	}

	simpleForm(form) {
		if (this.validate(this.simpleFormDef(), form) === false) {
			window.console.log('Failed JSON form:', form);
			return 'Failed JSON form!';
		}

		const formType = form.type === 'form' ? 'form' : 'div';

		let template = `<${formType} id="${form.id || 'form_' + this.$powerUi._Unique.next()}" class="${form.theme || 'pw-simple-form'} ${form.layout ? 'pw-' + form.layout + '-form' : 'pw-vertical-form'}">`;

		template = this._simpleFormContent({template: template, content: form.content});

		template = `${template}
		</${formType}>`;

		return template;
	}

	appendClassList({element, json}) {
		for (const css of json.classList) {
			element.classList.add(css);
		}
	}

	// Icon is a css font or an img
	appendIcon({element, json, mirrored}) {
		const icon = document.createElement('span');
		icon.classList.add('pw-icon');
		if (json.icon === 'img' && json["icon-src"]) {
			const img = document.createElement('img')
			img.src = json["icon-src"];
			icon.appendChild(img);
		} else {
			icon.classList.add(json.icon);
		}
		if ((!json['icon-position'] && mirrored !== true) || json['icon-position'] === 'left') {
			element.insertBefore(icon, element.childNodes[0]);
		} else {
			element.appendChild(icon);
		}
	}

	appendStatus({element, json, mirrored}) {
		const status = document.createElement('span');
		status.classList.add('power-status');
		status.classList.add('pw-icon');
		if (mirrored === true) {
			status.dataset.powerInactive = json.inactive.replace('right', 'left');
		} else {
			status.dataset.powerInactive = json.inactive;
		}
		status.dataset.powerActive = json.active;
		if (json.position === 'left' || mirrored === true) {
			element.insertBefore(status, element.childNodes[0]);
		} else {
			element.appendChild(status);
		}
	}

	accordionDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/accordion",
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
									"icon": {"type": "string"},
									"icon-position": {"type": "string"},
									"status": {"$ref": "#/schema/draft-07/status"}
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

	simpleFormContentDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/simpleformcontent",
			"type": "object",
			"properties": {
				"layout": {"type": "string"},
				"content": {"$ref": "#/schema/draft-07/simpleformcontent"},
				"controls": {
					"type": "array",
					"properties": {
						"classList": {"type": "array"},
						"label": {"type": "string"},
						"type": {"type": "string"},
						"value": {"type": ["string", "boolean", "int", "float"]},
						"name": {"type": "string"},
						"bind": {"type": "string"},
						"id": {"type": "string"}
					}
				}
			},
		};
	}

	simpleFormDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/simpleform",
			"type": "object",
			"properties": {
				"classList": {"type": "array"},
				"type": {"type": "string"},
				"layout": {"type": "string"},
				"content": {"$ref": "#/schema/draft-07/simpleformcontent"},

			},
			"required": ["content"]
		};
	}

	dropmenuDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/dropmenu",
			"type": "object",
			"properties": {
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"items": {
					"type": "array",
					"properties": {
						"button": {"$ref": "#/schema/draft-07/item"},
						"item": {"$ref": "#/schema/draft-07/item"},
						"status": {"$ref": "#/schema/draft-07/status"},
						"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"}
					}
				}
			},
			"required": ["id"]
		};
	}

	menuDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/menu",
			"type": "object",
			"properties": {
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"mirrored": {"type": "boolean"},
				"position": {"type": "string"},
				"orientation": {"type": "string"},
				"kind": {"type": "string"},
				"items": {
					"type": "array",
					"properties": {
						"button": {"$ref": "#/schema/draft-07/item"},
						"item": {"$ref": "#/schema/draft-07/item"},
						"status": {"$ref": "#/schema/draft-07/status"},
						"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"}
					}
				}
			},
			"required": ["id"]
		};
	}

	// Item can be a power-button, power-action or power-item
	itemDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/item",
			"type": "object",
			"properties": {
				"classList": {"type": "array"},
				"label": {"type": "string"},
				"id": {"type": "string"},
				"icon": {"type": "string"},
				"icon-src": {"type": "string"},
				"icon-position": {"type": "string"},
				"kind": {"type": "string"},
				"mirrored": {"type": "boolean"},
				"events": {
					"type": "array",
					"properties": {
						"event": {"type": "string"},
						"fn": {"type": "string"},
					},
					"required": ["event", "fn"]
				}
			},
			"required": ["label"]
		};
	}

	treeDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/menu",
			"type": "object",
			"properties": {
				"classList": {"type": "array"},
				"id": {"type": "string"},
				"events": {
					"type": "array",
					"properties": {
						"name": {"type": "string"},
						"fn": {"type": "string"},
					},
					"required": ["name", "fn"]
				},
				"content": {
					"type": "array",
					"properties": {
						"name": {"type": "string"},
						"fullName": {"type": "string"},
						"extension": {"type": "string"},
						"path": {"type": "string"},
						"kind": {"type": "string"},
						"content": {"type": "array"}
					},
					"required": ["name", "fullName", "path", "kind"]
				}
			},
			"required": ["content"]
		}
	}

	dropmenuButtonDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "schema/draft-07/button-dropmenu",
			"type": "object",
			"properties": {
				"button": {"$ref": "#/schema/draft-07/item"},
				"status": {"$ref": "#/schema/draft-07/status"},
				"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"}
			},
			"required": ["button"]
		};
	}

	statusDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "schema/draft-07/status",
			"type": "object",
			"properties": {
				"active": {"type": "string"},
				"inactive": {"type": "string"},
				"position": {"type": "string"}
			},
			"required": ["active", "inactive"]
		};
	}

	$ref($ref) {
		const path = '#/schema/draft-07/';

		const references = {};
		references[`${path}item`] = this.itemDef;
		references[`${path}status`] = this.statusDef;
		references[`${path}dropmenu`] = this.dropmenuDef;
		references[`${path}simpleformcontent`] = this.simpleFormContentDef;

		return references[$ref]();
	}
}
