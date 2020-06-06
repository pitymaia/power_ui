class JSONSchemaService extends PowerServices {
	constructor({$powerUi, $ctrl}) {
		super({$powerUi, $ctrl});
	}

	// Recursively Clone JSON nodes
	cloneObject(obj) {
		if (typeof obj === 'object' && obj.length !== undefined) {
			const newObj = [];
			for (const item of obj) {
				if (typeof item === 'object') {
					newObj.push(this.cloneObject(item));
				} else {
					newObj.push(item);
				}
			}
			return newObj;
		} else {
			const newObj = {};
			// loop over the keys of the object first node
			for (const key of Object.keys(obj)) {
				// If this key is an array
				if (typeof obj[key] === 'object' && obj[key].length !== undefined) {
					newObj[key] = [];
					for (const item of obj[key]) {
						if (typeof item === 'object') {
							newObj[key].push(this.cloneObject(item));
						} else {
							newObj[key].push(item);
						}
					}
				// If this key is an object
				} else if (typeof obj[key] === 'object') {
					newObj[key] = {};
					const _item = obj[key];
					for (const k of Object.keys(_item)) {
						if (typeof _item[k] === 'object') {
							newObj[key][k] = this.cloneObject(_item[k]);
						} else {
							newObj[key][k] = _item[k];
						}
					}
				// If this key is any other typeof
				} else {
					newObj[key] = obj[key];
				}
			}
			return newObj;
		}
	}

	// Recursively overwrite any property on originalJSON node that is declared on newJSON object
	overwriteJSON(originalJson, newJson) {
		// loop over the keys of the object first node
		for (const key of Object.keys(newJson)) {
			// If do not exists in originalJson just add it
			if (!originalJson[key]) {
				originalJson[key] = newJson[key];
			// If this key is an array
			} else if (typeof newJson[key] === 'object' && newJson[key].length !== undefined) {
				let index = 0;
				for (const item of newJson[key]) {
					// If do not exists in originalJson just add it
					if (originalJson[key][index] === undefined) {
							originalJson[key].push(item);
					} else if (typeof item === 'object') {
						originalJson[key][index] = this.overwriteJSON(originalJson[key][index], item);
					} else {
						originalJson[key][index] = item;
					}
					index = index + 1;
				}
			// If this key is an object
			} else if (typeof newJson[key] === 'object') {
				const _item = newJson[key];
				for (const k of Object.keys(_item)) {
					if (typeof _item[k] === 'object' && originalJson[key][k] !== undefined) {
						originalJson[key][k] = this.overwriteJSON(originalJson[key][k], _item[k]);
					// If do not exists in originalJson just add it
					} else {
						originalJson[key][k] = _item[k];
					}
				}
			// If this key is any other typeof
			} else {
				originalJson[key] = newJson[key];
			}
		}
		return originalJson;
	}

	registerJSONById(json) {
		if (!this.$powerUi.JSONById[json.$id]) {
			this.$powerUi.JSONById[json.$id] = json;
		}
	}

	getNewJSON(json) {
		const clonedJson = this.cloneObject(this.$powerUi.JSONById[json.$ref]);
		delete clonedJson.$id;
		const newJson = this.overwriteJSON(clonedJson, json);
		delete newJson.$ref;
		return newJson;
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

	accordion(_accordion) {
		// Do not change the original JSON
		const accordion = this.cloneObject(_accordion);
		// This allow pass an array of accordions
		if (_accordion.length) {
			return this._arrayOfSchemas(_accordion, 'accordion');
		} else if (_accordion.$ref) {
			// Use the original JSON
			return this.accordion(this.getNewJSON(_accordion));
		} else {
			if (_accordion.$id) {
				// Register original JSON
				this.registerJSONById(_accordion);
			}

			// if (this.validate(this.accordionDef(), accordion) === false) {
			// 	window.console.log('Failed JSON accordion:', accordion);
			// 	return 'Failed JSON accordion!';
			// }

			if (!accordion.classList) {
				accordion.classList = [];
			}
			accordion.classList.push('power-accordion');
			let mainTmpl = `<div ${this._getHtmlBasicTmpl(accordion)} data-multiple-sections-open="${(accordion.config && accordion.config.multipleSectionsOpen ? accordion.config.multipleSectionsOpen : false)}">`;

			for (const panel of accordion.panels) {
				// Headers
				const icon = {};
				if (panel.header.icon === 'img' && panel.header['icon-src']) {
					icon.kind = 'img';
					icon.src = panel.header['icon-src'];
				} else {
					icon.icon = panel.header.icon;
				}

				const status = {};
				status.active = panel.header.status.active;
				status.inactive = panel.header.status.inactive;

				const sectionId = panel.section.id || this.$powerUi._Unique.next();

				const headerTmpl = `
				<div class="power-action" data-power-target="${sectionId}" ${this._getIdTmpl(panel.header.id, true)}>
					<div>
						${this.icon(icon)}
						<span class="pw-label">${panel.header.label}</span>
					</div>
					${this.status(status)}
				</div>`;

				// Sections
				const sectionTmpl = `<div class="power-accordion-section" ${this._getIdTmpl(sectionId)}>
					${panel.section.content}
				</div>`;

				mainTmpl = mainTmpl + headerTmpl + sectionTmpl;
			}

			return mainTmpl + '</div>';
		}
	}

	menu(_menu) {
		// Do not change the original JSON
		const menu = this.cloneObject(_menu);
		// This allow pass an array of menus
		if (_menu.length) {
			return this._arrayOfSchemas(_menu, 'menu');
		} else if (_menu.$ref) {
			// Use the original JSON
			return this.menu(this.getNewJSON(_menu));
		} else {
			if (_menu.$id) {
				// Register original JSON
				this.registerJSONById(_menu);
			}

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
	}

	dropmenu(_dropmenu, mirrored, isMenu) {
		// Do not change the original JSON
		const dropmenu = this.cloneObject(_dropmenu);
		// This allow pass an array of dropmenus
		if (_dropmenu.length) {
			return this._arrayOfSchemas(_dropmenu, 'dropmenu');
		} else if (_dropmenu.$ref) {
			// Use the original JSON
			return this.dropmenu(this.getNewJSON(_dropmenu));
		} else {
			if (_dropmenu.$id) {
				// Register original JSON
				this.registerJSONById(_dropmenu);
			}

			// if (this.validate(this.dropmenuDef(), dropmenu) === false) {
			// 	window.console.log('Failed JSON dropmenu:', dropmenu);
			// 	return 'Failed JSON dropmenu!';
			// }

			const tmpEl = document.createElement('div');

			if (!dropmenu.classList) {
				dropmenu.classList = [];
			}

			dropmenu.classList.push(isMenu ? 'power-menu' : 'power-dropmenu');

			tmpEl.innerHTML = `<nav ${this._getHtmlBasicTmpl(dropmenu)} ${mirrored === true ? ' pw-mirrored' : ''}></nav>`;

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
	}

	// Build pow-event attributes
	_getEventTmpl(events) {
		// Add events if have
		if (events) {
			let eventsTmpl = '';
			for (const event of events) {
				eventsTmpl = `${eventsTmpl} ${event.event}="${event.fn}" `;
			}
			eventsTmpl = `data-pow-event ${eventsTmpl}`;
			return eventsTmpl;
		} else {
			return '';
		}
	}

	_getIdTmpl(id, required) {
		if (id) {
			return `id="${id}"`;
		} else if (required) {
			return `id="${required}_${this.$powerUi._Unique.next()}"`;
		} else {
			return '';
		}
	}

	_getAttrTmpl(attrs) {
		let attributes = '';
		if (attrs) {
			for (const attr of attrs) {
				if (attr.value !== undefined) {
					attributes = `${attributes} ${attr.name}="${attr.value}"`;
				} else {
					attributes = `${attributes} ${attr.name}`;
				}
			}
		}
		return attributes;
	}

	_getClassTmpl(classList) {
		let customCss = '';
		if (classList) {
			for (const css of classList) {
				customCss = customCss ? `${customCss} ${css}` : css;
			}
			return `class="${customCss}"`;
		}
		return customCss;
	}

	_getHtmlBasicTmpl(item, required) {
		return `${this._getIdTmpl(item.id, required)} ${this._getClassTmpl(item.classList)} ${this._getAttrTmpl(item.attrs)} ${this._getEventTmpl(item.events)}${item.title ? ' title="' + item.title + '"' : ''}${item.for ? ' for="' + item.for + '"' : ''}${item.src ? ' src="' + item.src + '"' : ''}${item.cols ? ' cols="' + item.cols + '"' : ''}${item.rows ? ' rows="' + item.rows + '"' : ''}${item.width ? ' width="' + item.width + '"' : ''}${item.height ? ' height="' + item.height + '"' : ''}${item.disabled === true ? ' disabled' : ''}${item.selected === true ? ' selected' : ''}${item.bind ? ' data-pow-bind="' + item.bind + '"' : ''}${item.value ? ' value="' + item.value + '"' : ''}${item.name ? ' name="' + item.name + '"' : ''}${item.required ? ' required' : ''}`;
	}

	_getInputBasicTmpl(control, required) {
		return `${this._getHtmlBasicTmpl(control, required)} type="${control.type || 'text'}"${control.pattern ? ' pattern="' + control.pattern + '"' : ''}`;
	}

	item({item, avoidValidation, mirrored, dropmenuId}) {
		// Do not change the original JSON
		const newItem = this.cloneObject(item);
		// This allow pass an array of items
		if (item.length) {
			return this._arrayOfSchemas(item, 'item');
		} else if (item.$ref) {
			// Use the original JSON
			return this.item(this.getNewJSON(item));
		} else {
			if (item.$id) {
				// Register original JSON
				this.registerJSONById(item);
			}

			if (!avoidValidation && this.validate(this.itemDef(), newItem) === false) {
				window.console.log('Failed JSON item:', newItem);
				return 'Failed JSON item!';
			}

			const tmpEl = document.createElement('div');

			if (!newItem.classList) {
				newItem.classList = [];
			}

			newItem.classList.push(dropmenuId ? 'power-action' : 'power-item');

			tmpEl.innerHTML = `<a ${this._getHtmlBasicTmpl(newItem)} ${dropmenuId ? 'data-power-target="' + dropmenuId + '"' : ''}><span class="pw-label">${newItem.label}</span></a>`;

			const itemEl = tmpEl.children[0];

			if (newItem.icon) {
				this.appendIcon({element: itemEl, json: newItem, mirrored: mirrored});
			}

			return tmpEl.innerHTML;
		}
	}

	dropMenuButton(_dropMenuButton) {
		// Do not change the original JSON
		const dropMenuButton = this.cloneObject(_dropMenuButton);
		// This allow pass an array of dropMenuButtons
		if (_dropMenuButton.length) {
			return this._arrayOfSchemas(_dropMenuButton, 'dropMenuButton');
		} else if (_dropMenuButton.$ref) {
			// Use the original JSON
			return this.dropMenuButton(this.getNewJSON(_dropMenuButton));
		} else {
			if (_dropMenuButton.$id) {
				// Register original JSON
				this.registerJSONById(_dropMenuButton);
			}

			if (this.validate(this.dropmenubuttonDef(), dropMenuButton) === false) {
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
	}

	button(_button, avoidValidation, mirrored) {
		// Do not change the original JSON
		const button = this.cloneObject(_button);
		// This allow pass an array of buttons
		if (_button.length) {
			return this._arrayOfSchemas(_button, 'button');
		} else if (_button.$ref) {
			// Use the original JSON
			return this.button(this.getNewJSON(_button));
		} else {
			if (_button.$id) {
				// Register original JSON
				this.registerJSONById(_button);
			}

			if (!avoidValidation && this.validate(this.itemDef(), button) === false) {
				window.console.log('Failed JSON button:', button);
				return 'Failed JSON button!';
			}

			const tmpEl = document.createElement('div');

			if (!button.classList) {
				button.classList = [];
			}

			if (!button.type) {
				button.type = 'button';
			}

			button.classList.push(button.kind ? `pw-btn-${button.kind}` : 'pw-btn-default');

			tmpEl.innerHTML = `<button ${this._getInputBasicTmpl(button)}><span class="pw-label">${button.label}</span></button>`;

			const buttonEl = tmpEl.children[0];

			if (button.icon) {
				this.appendIcon({element: buttonEl, json: button, mirrored: mirrored});
			}

			if (button.classList) {
				this.appendClassList({element: buttonEl, json: button});
			}

			return tmpEl.innerHTML;
		}
	}

	tree(_tree) {
		// Do not change the original JSON
		const tree = this.cloneObject(_tree);
		// This allow pass an array of trees
		if (_tree.length) {
			return this._arrayOfSchemas(_tree, 'tree');
		} else if (_tree.$ref) {
			// Use the original JSON
			return this.tree(this.getNewJSON(_tree));
		} else {
			if (_tree.$id) {
				// Register original JSON
				this.registerJSONById(_tree);
			}

			if (this.validate(this.treeDef(), tree) === false) {
				window.console.log('Failed JSON tree:', tree);
				return 'Failed JSON tree!';
			}
			if (!tree.classList) {
				tree.classList = [];
			}

			tree.classList.push('power-tree-view');

			let template = `<nav ${this._getHtmlBasicTmpl(tree)}>`;
			for (const item of tree.content) {
				if (item.kind === 'file') {
					if (tree.events) {
						template = `${template}
						<a class="power-item" data-pow-event `;

						for (const event of tree.events) {
							template = `${template}
							${event.event}="${event.fn}({path: '${item.path}', event: event, element: event.target})" `;
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
	}

	grid(_grid) {
		// Do not change the original JSON
		const grid = this.cloneObject(_grid);
		// This allow pass an array of grids
		if (_grid.length) {
			return this._arrayOfSchemas(_grid, 'grid');
		} else if (_grid.$ref) {
			// Use the original JSON
			return this.grid(this.getNewJSON(_grid));
		} else {
			if (_grid.$id) {
				// Register original JSON
				this.registerJSONById(_grid);
			}
			// if (this.validate(this.gridDef(), grid) === false) {
			// 	window.console.log('Failed JSON grid:', grid);
			// 	return 'Failed JSON grid!';
			// }
			if (!grid.classList) {
				grid.classList = [];
			}

			grid.classList.push('pw-grid');
			grid.classList.push(grid.kind || 'scroll-12');

			if (grid.border === true) {
				grid.classList.push('border');
			}
			if (grid.inline === true) {
				grid.classList.push('inline-grid');
			}
			if (grid.gap) {
				grid.classList.push(`gap-${grid.gap}`);
			} else {
				grid.classList.push('no-gap');
			}

			let template = `<div ${this._getHtmlBasicTmpl(grid)}>`;

			// If user do not difine a sizes list uses a default size
			if (!grid.sizes) {
				grid.sizes = ['s-1 m-1 l-1 xl-1'];
			}

			let currentSizeCount = 0;

			for (const field of grid.fields) {
				if (!field.classList) {
					field.classList = [];
				}

				field.classList.push('pw-col');
				field.classList.push(field.size || grid.sizes[currentSizeCount]);

				template = `${template}
					<div ${this._getIdTmpl(field.id)} ${this._getClassTmpl(field.classList)}>${field.text || ''}`;

				if (field.children) {
					for (const child of field.children) {
						template = `${template}
							${this.otherJsonKind(child)}`;
					}
				}

				template = template + '</div>';

				// Only change to the next size pattern if there is no custom size for this field
				if (!field.size) {
					currentSizeCount = currentSizeCount + 1;
				}
				// Reset the counter if bigger than list os sizes length
				if (currentSizeCount >= grid.sizes.length) {
					currentSizeCount = 0;
				}
			}

			template = `${template}
			</div>`;

			return template;
		}
	}

	simpleFormControls({controls, template, inline}) {
		for (const control of controls) {
			if (!control.id) {
				control.id = 'input_' + this.$powerUi._Unique.next();
			}
			const label = control.label ? `<label for="${control.id}">${control.label}</label>` : null;

			let customCss = '';
			if (control.classList) {
				for (const css of control.classList) {
					customCss = `${customCss} ${css}`;
				}
			}

			if (!control.classList) {
				control.classList = [];
			}
			control.classList.push('pw-field');

			const size = control.size ? control.size : 's-12 m-12 l-12 xl-12';

			template = `${template}
				<div class="${control.controls ? 'pw-inner-grid' : ''} pw-col ${size}">`;

			// Allow a inner grid with controls
			if (control.controls) {

				template = `${template}
				<div class="pw-grid scroll-12 gap-1 ${((control.inline === true) || (inline === true)) ? 'inline-grid' : ''}">
					${this.simpleFormControls({controls: control.controls, template: ''})}
				</div>`;

			// Allow adding any other html or json object
			} else if (control.children) {
				for (const child of control.children) {
					template = template + this.otherJsonKind(child);
				}

			} else if (control.button) {

				template = `${template}
					${this.button(control.button)}`;

			} else if (control.type === 'submit' || control.type === 'reset') {

				control.classList.pop();
				template = `${template}
				<input ${this._getInputBasicTmpl(control)} />`;

			} else if (control.type === 'select') {

				template = `${template}
				${label ? label : ''}
				<select ${this._getInputBasicTmpl(control)} ${control.multiple === true ? 'multiple' : ''}>`;
					for (const item of control.list) {
						template = `${template}<option value="${item.value}"${item.disabled === true ? ' disabled' : ''}${item.selected === true ? ' selected' : ''}>${item.label}</option>`;
					}
				template = `${template}
				</select>`;

			} else if (control.type === 'radio' || control.type === 'checkbox') {

				template = `${template}
				<input ${this._getInputBasicTmpl(control)} /> ${label ? label : ''}`;

			} else if (control.type === 'textarea') {

				template = `${template}
				${label ? label : ''}
				<textarea ${this._getInputBasicTmpl(control)} ${control.rows ? 'rows="' + control.rows + '"' : ''} ${control.cols ? 'cols="' + control.cols + '"' : ''}>
					${control.value || ''}
				</textarea>`;

			} else {

				template = `${template}
				${label ? label : ''}
				<input ${this._getInputBasicTmpl(control)} />`;
			}

			template = `${template}
				</div>`;
		}

		return template;
	}

	simpleForm(_form) {
		// Do not change the original JSON
		const form = this.cloneObject(_form);
		// This allow pass an array of forms
		if (_form.length) {
			return this._arrayOfSchemas(_form, 'form');
		} else if (_form.$ref) {
			// Use the original JSON
			return this.form(this.getNewJSON(_form));
		} else {
			if (_form.$id) {
				// Register original JSON
				this.registerJSONById(_form);
			}

			if (this.validate(this.simpleformDef(), form) === false) {
				window.console.log('Failed JSON form:', form);
				return 'Failed JSON form!';
			}

			const formType = form.type === 'form' ? 'form' : 'div';

			let template = `<${formType} ${this._getIdTmpl(form.id, 'form')} class="pw-vertical-form ${form.theme || 'pw-simple-form'} pw-grid scroll-12 gap-4${(form.inline === false) ? '' : ' inline-grid'}${(form.padding === true) ? '' : ' pw-no-padding'}">`;

			template = this.simpleFormControls({controls: form.controls, template: template});

			template = `${template}
			</${formType}>`;

			return template;
		}
	}

	_arrayOfSchemas(_array, func) {
		let template = '';
		for (const tag of _array) {
			template = `${template}
				${this[func](tag)}`;
		}

		return template;
	}

	html(_html) {
		// Do not change the original JSON
		const html = this.cloneObject(_html);
		// This allow pass an array of tags
		if (_html.length) {
			return this._arrayOfSchemas(_html, 'html');
		} else if (_html.$ref) {
			// Use the original JSON
			return this.html(this.getNewJSON(_html));
		} else {
			if (_html.$id) {
				// Register original JSON
				this.registerJSONById(_html);
			}

			// if (this.validate(this.htmlDef(), html) === false) {
			// 	window.console.log('Failed JSON html:', html);
			// 	return 'Failed JSON html!';
			// }

			// If this is not an html json, but a button, dropmenu or other kind of json
			if (html.tagName === undefined) {
				return this.otherJsonKind(html);
			}

			const tag = html.tagName.toLowerCase();
			// Void tags without input tag
			const voidTags = ["area", "base", "br", "col", "embed", "hr", "img", "link", "meta", "param", "source", "track", "wbr"];

			if (voidTags.includes(tag)) {
				return `<${tag} ${this._getHtmlBasicTmpl(html)} />`;
			} else if (tag === 'input') {
				return `<${tag} ${this._getInputBasicTmpl(html)} />`;
			} else {
				let template = `<${tag} ${this._getHtmlBasicTmpl(html)} ${html.multiple === true ? 'multiple' : ''}>
					${html.text || ''}`;

				if (html.children) {
					for (const child of html.children) {
						template = `${template}
							${this.html(child)}`;
					}
				}

				template = `${template}
				</${tag}>`;

				return template;
			}
		}
	}

	otherJsonKind(item) {
		if (item.button) {
			return this.button(item.button);
		} else if (item.simpleForm) {
			return this.simpleForm(item.simpleForm);
		} else if (item.tree) {
			return this.tree(item.tree);
		} else if (item.dropMenuButton) {
			return this.dropMenuButton(item.dropMenuButton);
		} else if (item.dropmenu) {
			return this.dropmenu(item.dropmenu);
		} else if (item.menu) {
			return this.menu(item.menu);
		} else if (item.accordion) {
			return this.accordion(item.accordion);
		} else if (item.icon) {
			return this.icon(item.icon);
		} else if (item.status) {
			return this.status(item.status);
		} else if (item.html) {
			return this.html(item.html);
		} else {
			return null;
		}
	}

	appendClassList({element, json}) {
		for (const css of json.classList) {
			element.classList.add(css);
		}
	}

	icon(_json) {
		// Do not change the original JSON
		const json = this.cloneObject(_json);
		// This allow pass an array of json
		if (_json.length) {
			return this._arrayOfSchemas(_json, 'icon');
		} else if (_json.$ref) {
			// Use the original JSON
			return this.icon(this.getNewJSON(_json));
		} else {
			if (_json.$id) {
				// Register original JSON
				this.registerJSONById(_json);
			}

			let template = '';
			if (!json.classList) {
				json.classList = [];
			}
			json.classList.push('pw-icon');

			if (json.kind === 'img' && json.src) {
				const src = json.src;
				delete json.src;
				template = `<span ${this._getHtmlBasicTmpl(json)}><img src=${src} /></span>`;
			} else {
				json.classList.push(json.icon);
				template = `<span ${this._getHtmlBasicTmpl(json)}></span>`;
			}

			return template;
		}
	}

	status(_json) {
		// Do not change the original JSON
		const json = this.cloneObject(_json);
		// This allow pass an array of json
		if (_json.length) {
			return this._arrayOfSchemas(_json, 'status');
		} else if (_json.$ref) {
			// Use the original JSON
			return this.status(this.getNewJSON(_json));
		} else {
			if (_json.$id) {
				// Register original JSON
				this.registerJSONById(_json);
			}

			if (!json.classList) {
				json.classList = [];
			}
			json.classList.push('pw-icon');
			json.classList.push('power-status');
			return `<span ${this._getHtmlBasicTmpl(json)} data-power-inactive="${json.inactive}" data-power-active="${json.active}"></span>`;
		}
	}

	// Icon is a css font or an img
	appendIcon({element, json, mirrored}) {
		const iconHolder = document.createElement('div');
		const iconJson = {};
		if (json.icon === 'img' && json['icon-src']) {
			iconJson.kind = 'img';
			iconJson.src = json['icon-src'];
		} else {
			iconJson.icon = json.icon;
		}

		iconHolder.innerHTML = this.icon(iconJson);
		const icon = iconHolder.childNodes[0];

		if ((!json['icon-position'] && mirrored !== true) || json['icon-position'] === 'left') {
			element.insertBefore(icon, element.childNodes[0]);
		} else {
			element.appendChild(icon);
		}
	}

	appendStatus({element, json, mirrored}) {
		const statusHolder = document.createElement('div');
		statusHolder.innerHTML = this.status(json);
		const status = statusHolder.childNodes[0];

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

	simpleformcontrolsDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/simpleformcontrols",
			"type": "array",
			"properties": {
				"classList": {"type": "array"},
				"label": {"type": "string"},
				"type": {"type": "string"},
				"value": {"type": "any"},
				"name": {"type": "string"},
				"bind": {"type": "string"},
				"id": {"type": "string"},
				"controls": {"$ref": "#/schema/draft-07/simpleformcontrols"},
				"button": {"$ref": "#/schema/draft-07/item"},
				"item": {"$ref": "#/schema/draft-07/item"},
				"status": {"$ref": "#/schema/draft-07/status"},
				"icon": {"$ref": "#/schema/draft-07/icon"},
				"menu": {"$ref": "#/schema/draft-07/menu"},
				"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"},
				"dropmenubutton": {"$ref": "#/schema/draft-07/dropmenubutton"},
				"simpleform": {"$ref": "#/schema/draft-07/simpleform"},
				"tree": {"$ref": "#/schema/draft-07/tree"},
				"html": {"$ref": "#/schema/draft-07/html"},
				"accordion": {"$ref": "#/schema/draft-07/accordion"},
				"grid": {"$ref": "#/schema/draft-07/grid"}
			}
		};
	}

	simpleformDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/simpleform",
			"type": "object",
			"properties": {
				"classList": {"type": "array"},
				"type": {"type": "string"},
				"inline" : {"type": "boolean"},
				"controls": {"$ref": "#/schema/draft-07/simpleformcontrols"}
			},
			"required": ["controls"]
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
						"event": {"type": "string"},
						"fn": {"type": "string"},
					},
					"required": ["event", "fn"]
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
		};
	}

	dropmenubuttonDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "schema/draft-07/dropmenubutton",
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
		references[`${path}icon`] = this.iconDef;
		references[`${path}menu`] = this.menuDef;
		references[`${path}dropmenu`] = this.dropmenuDef;
		references[`${path}dropmenubutton`] = this.dropmenubuttonDef;
		references[`${path}simpleform`] = this.simpleformDef;
		references[`${path}simpleformcontrols`] = this.simpleformcontrolsDef;
		references[`${path}tree`] = this.treeDef;
		references[`${path}html`] = this.htmlDef;
		references[`${path}accordion`] = this.accordionDef;
		references[`${path}grid`] = this.gridDef;

		return references[$ref]();
	}
}
