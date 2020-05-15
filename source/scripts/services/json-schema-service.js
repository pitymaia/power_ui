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
			// If is some reference to another schema get it
			if (schema.properties[key].$ref) {
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

	item({item, avoidValidation, mirrored, dropmenuId}) {
		if (!avoidValidation && this.validate(this.itemDef(), item) === false) {
			window.console.log('Failed JSON item:', item);
			return 'Failed JSON item!';
		}

		const tmpEl = document.createElement('div');
		// Add events if have
		let eventsTmpl = '';
		if (item.events) {
			for (const event of item.events) {
				eventsTmpl = `${eventsTmpl} ${event.event}="${event.fn}" `;
			}
		}
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
		let eventsTmpl = '';
		if (button.events) {
			for (const event of button.events) {
				eventsTmpl = `${eventsTmpl} ${event.event}="${event.fn}" `;
			}
		}
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

	form(form) {
		// if (this.validate(this.formDef(), form) === false) {
		// 	window.console.log('Failed JSON form:', form);
		// 	return 'Failed JSON form!';
		// }

		// "layout": "vertical",
		//   "items": [
		//     {
		//       "layout": "horizontal",
		//       "controls": [
		//         {
		//           "label": "Control",
		//           "scope": "#/properties/firstName"
		//         },
		//         {
		//           "type": "Control",
		//           "scope": "#/properties/lastName"
		//         }
		//       ]
		//     },
		const formType = form.type === 'form' ? 'form' : 'div';

		let template = `<${formType} id="${form.id || 'form_' + this.$powerUi._Unique.next()}" class="${form.theme || 'pw-simple-form'} ${form.layout ? 'pw-' + form.layout + '-form' : 'pw-vertical-form'}">`;

		for (const item of form.content) {
			console.log('item', item);
			template = `${template}
			<div class="${item.layout ? 'pw-' + item.layout + '-form' : 'pw-vertical-form'} pw-row">`;
				for (const control of item.controls) {
					console.log('control', control);
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

					if (control.type === 'button') {

					} else if (control.type === 'select') {

					} else if (control.type === 'textarea') {
						template = `${template}
						${label ? label : ''}
						<textarea class="pw-field ${customCss}" id="${id}" ${control.model ? 'data-pow-bind="' + control.model + '"' : ''} ${control.value ? 'rows="' + control.rows + '"' : ''} ${control.value ? 'cols="' + control.cols + '"' : ''} ${control.value ? 'value="' + control.value + '"' : ''}>
							${control.value || ''}
						</textarea>`;
					} else if (control.type === 'submit' || control.type === 'reset') {

					} else {
						console.log('label', label);
						template = `${template}
						${label ? label : ''}
						<input id="${id}" class="pw-field ${customCss}" type="${control.type || 'text'}" ${control.model ? 'data-pow-bind="' + control.model + '"' : ''} name="${control.name || ''}" ${control.value ? 'value="' + control.value + '"' : ''} />`;
					}

					template = `${template}
						</div>`;
				}
			template = template + '</div>';
		}

		template = `${template}
		</${formType}>`;

		const temp = `
		<form class="pw-simple-form pw-vertical-form">
			<div class="pw-horizontal pw-row">
				<div class="pw-col">
					<label for="user_name">User Name:</label>
					<input id="user_name" class="pw-field" type="text" data-pow-bind="form.user_name" name="user_name" />
				</div>
				<div class="pw-col">
					<label for="pwd">Password:</label>
					<input class="pw-field" type="password" data-pow-bind="form.password" id="pwd" name="pwd">
				</div>
			</div>
			<div class="pw-vertical-form pw-row">
				<div class="pw-row">
					<input class="pw-field" id="maths" data-pow-bind="form.sciences" type="radio" name="sciences" value="maths"> <label for="maths">Maths</label>
					<input class="pw-field" id="physics" data-pow-bind="form.sciences" type="radio" name="sciences" value="physics"> <label for="physics">Physics</label>
				</div>
				<div class="pw-row">
				<input class="pw-field" id="cat" data-pow-bind="form.animals" type="radio" name="animals" value="cat"> <label for="cat">Cat</label>
				<input class="pw-field" id="dog" data-pow-bind="form.animals" type="radio" name="animals" value="dog"> <label for="dog">Dog</label>
				</div>
				<div class="pw-row">
					<input class="pw-field switch" id="apple" data-pow-bind="form.fruit" type="radio" name="fruits" value="apple"> <label for="apple">Apple</label>
					<input class="pw-field switch" id="orange" data-pow-bind="form.fruit" type="radio" name="fruits" value="orange"> <label for="orange">Orange</label>
				</div>
			<div class="pw-horizontal pw-row">
				<div class="pw-col">
					<label for="date">Birthday:</label>
					<input id="date" class="pw-field" type="date" data-pow-bind="form.date" />
				</div>
				<div class="pw-col">
					<label for="color">Select your favorite color:</label>
					<input id="color" class="pw-field" type="color" data-pow-bind="form.color" />
				</div>
			</div>
			<div class="pw-horizontal pw-row">
				<div class="pw-col">
					<label for="phone">Enter an email:</label>
					<input class="pw-field" type="email" data-pow-bind="form['email']" />
				</div>
				<div class="pw-col">
					<label for="phone">Enter a number:</label>
					<input class="pw-field" type="number" data-pow-bind="form.number" />
				</div>
			</div>
			<div class="pw-horizontal pw-row">
				<div class="pw-col">
					<label for="sound">Sound range:</label>
					<input id="sound" class="pw-field" type="range" data-pow-bind="form.range" />
				</div>
				<div class="pw-col">
					<label for="phone">Enter your phone number:</label>
					<input class="pw-field" type="tel" data-pow-bind="form.phone" id="phone" name="phone" pattern="[0-9]{3}-[0-9]{2}-[0-9]{3}">
				</div>
			</div>
			<div class="pw-horizontal pw-row">
				<div class="pw-col">
					<label for="phone">Enter an URL:</label>
					<input class="pw-field" type="url" data-pow-bind="form.url" name="url" required>
				</div>
				<div class="pw-col">
					<label for="myfile">Select a file:</label>
					<input class="pw-field" type="file" data-pow-bind="form.file" id="myfile" name="myfile">
				</div>
			</div>
			<div class="pw-horizontal pw-row">
				<div class="pw-col">
					<input class="pw-field" type="checkbox" data-pow-bind="form.vehicle1" id="vehicle1" name="vehicle1" value="Bike">
					<label for="vehicle1"> I have a bike</label><br />
					<input class="pw-field" type="checkbox" data-pow-bind="form.vehicle2" id="vehicle2" name="vehicle2" value="Car">
					<label for="vehicle2"> I have a car</label><br />
					<input class="pw-field" type="checkbox" data-pow-bind="form.vehicle3" id="vehicle3" name="vehicle3" value="Boat">
					<label for="vehicle3"> I have a boat</label><br />
				</div>
				<div class="pw-col">
					<input class="pw-field switch" type="checkbox" data-pow-bind="form.wii" id="game1" name="game1" value="Nintendo Wii">
					<label for="game1"> I have a Wii</label><br />
					<input class="pw-field switch" type="checkbox" data-pow-bind="form.wiiu" id="game2" name="game2" value="Wii U">
					<label for="game2"> I have a Wii U</label><br>
					<input class="pw-field switch" type="checkbox" data-pow-bind="form.n3ds" id="game3" name="game3" value="Nintendo 3Ds">
					<label for="game3"> I have a 3Ds</label><br />
				</div>
			</div>
			<div class="pw-horizontal pw-row">
				<div class="pw-col">
					<label for="cars">Choose a car:</label>
					<select class="pw-field" data-pow-bind="form.cars" id="cars">
						<option value="" disabled>Select a car</option>
						<option value="volvo">Volvo</option>
						<option value="saab">Saab</option>
						<option value="mercedes">Mercedes</option>
						<option value="audi">Audi</option>
					</select>
				</div>
				<div class="pw-col">
					<label for="cars2">Choose many cars:</label>
					<select class="pw-field" data-pow-bind="form.cars2" id="cars2" multiple>
						<option value="volvo">Volvo</option>
						<option value="saab">Saab</option>
						<option value="opel">Opel</option>
						<option value="fusca">Fusca</option>
						<option value="audi">Audi</option>
						<option value="escort">Escort</option>
						<option value="mercedes">Mercedes</option>
					</select>
				</div>
			</div>
			<div class="pw-vertical">
				<div class="pw-row">
					<label>Hidden: </label>
					<input class="pw-field" type="hidden" data-pow-bind="form.hidden" id="custId" name="custId" value="3487">
				</div>
				<div class="pw-row">
					<label for="powerMission">PowerUI mission:</label>
					<textarea class="pw-field" id="powerMission" data-pow-bind="form.textarea" rows="4" cols="50">
						Easy Fullstack development. We offer web development technologies that makes your life easer.
					</textarea>
				</div>
			</div>
			<div class="pw-horizontal pw-row">
				<div class="pw-col">
					<input class="pw-field" type="image" src="vendors/imgs/rv_bt.png" data-pow-event onclick="openModal()">
				</div>
				<div class="pw-col">
					<input class="pw-btn-highlight" type="reset">
				</div>
				<div class="pw-col">
					<input class="pw-btn-primary" type="submit">
				</div>
			</div>
		</form>`;

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

		return references[$ref]();
	}
}
