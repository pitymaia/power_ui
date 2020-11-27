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
		// console.log('type', type, 'json', json, typeof json, typeof json === type);
		if (typeof json === type) {
			return true;
		} else if (type === 'array' && json.length !== undefined) {
			return true;
		} else if (type === 'any') {
			return true;
		} else if (type.length !== undefined && json.length !== undefined) {
			window.console.log(`JSON type expected to be "${type}" but is "${typeof json}"`, json);
			return false;
		} else {
			window.console.log(`JSON type expected to be "${type}" but is "${typeof json}"`, json);
			return false;
		}
	}

	// If exist some if this properties the required is not really needed
	especialRequired(json, requiredKey) {
		const especial = {
			"html": true,
			"button": true,
			"item": true,
			"status": true,
			"icon": true,
			"menu": true,
			"dropmenu": true,
			"dropmenubutton": true,
			"simpleform": true,
			"tree": true,
			"accordion": true,
			"grid": true
		};
		for (const key of Object.keys(json)) {
			if (especial[key] && typeof json[key] === 'object' && requiredKey === key) {
				return true;
			}
		}
	}

	_validateEvents(events, obj, name) {
		for (const event of events) {
			if (this._validate(this.gridDef().properties.events, event) === false) {
				window.console.log(`Failed JSON ${name} event:`, event, events, obj);
				return `Failed JSON ${name} event!`;
			}
		}
		return true;
	}

	_validate(schema, json) {
		// Validate item properties
		for (const key of Object.keys(schema.properties || {})) {
			// Validade other types property
			if (schema.properties[key].type && json[key] !== undefined) {
				// Check current object type against schema type
				if (this.validateType(schema.properties[key].type, json[key]) === false) {
					return false;
				}
			}
		}
		// Validade other properties required fields
		if (schema.required) {
			for (const key of schema.required) {
					// if (schema.$id === '#/schema/draft-07/dropmenu' && !json.items) {
					// 	console.log('key', key, 'schema', schema, json);
					// }
				if (!this.especialRequired(json, key) && !json[key]) {
					window.console.log(`JSON missing required property: "${key}"`, json);
					return false;
				}
			}
		}

		return true;
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

	_getHtmlMoreBasicTmpl(item, required) {
		return `${this._getIdTmpl(item.id, required)} ${this._getClassTmpl(item.classList)} ${this._getAttrTmpl(item.attrs)} ${this._getEventTmpl(item.events)}`;
	}

	_getInputBasicTmpl(control, required) {
		return `${this._getHtmlBasicTmpl(control, required)} type="${control.type || 'text'}"${control.pattern ? ' pattern="' + control.pattern + '"' : ''}`;
	}

	_arrayOfSchemas(_array, func) {
		let template = '';
		for (const tag of _array) {
			template = `${template}
				${this[func](tag)}`;
		}

		return template;
	}

	otherJsonKind(item, keysPath) {
		if (item.button) {
			return this.button(item.button, null, keysPath);
		} else if (item.simpleForm) {
			return this.simpleForm(item.simpleForm, keysPath);
		} else if (item.tree) {
			return this.tree(item.tree, keysPath);
		} else if (item.dropMenuButton) {
			return this.dropMenuButton(item.dropMenuButton, keysPath);
		} else if (item.dropmenu) {
			return this.dropmenu(item.dropmenu, null, null, keysPath);
		} else if (item.menu) {
			return this.menu(item.menu, keysPath);
		} else if (item.accordion) {
			return this.accordion(item.accordion, keysPath);
		} else if (item.icon) {
			return this.icon(item.icon, keysPath);
		} else if (item.status) {
			return this.status(item.status, keysPath);
		} else if (item.html) {
			return this.html(item.html, keysPath);
		} else if (item.grid) {
			return this.grid(item.grid, keysPath);
		} else {
			return null;
		}
	}

	appendClassList({element, json}) {
		for (const css of json.classList) {
			element.classList.add(css);
		}
	}

	// Icon is a css font or an img
	appendIcon({element, json, mirrored, keysPath}) {
		const iconHolder = document.createElement('div');
		const iconJson = {};
		if (json.icon === 'img' && json['icon-src']) {
			iconJson.kind = 'img';
			iconJson.src = json['icon-src'];
		} else {
			iconJson.icon = json.icon;
		}

		iconHolder.innerHTML = this.icon(iconJson, keysPath);
		const icon = iconHolder.childNodes[0];

		if ((!json['icon-position'] && mirrored !== true) || json['icon-position'] === 'left') {
			element.insertBefore(icon, element.childNodes[0]);
		} else {
			element.appendChild(icon);
		}
	}

	appendStatus({element, json, mirrored, keysPath}) {
		const statusHolder = document.createElement('div');
		statusHolder.innerHTML = this.status(json, keysPath);
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

	accordion(_accordion, keysPath) {
		// Do not change the original JSON
		const accordion = this.cloneObject(_accordion);
		// This allow pass an array of accordions
		if (_accordion.length) {
			return this._arrayOfSchemas(_accordion, 'accordion');
		} else if (_accordion.$ref) {
			// Use the original JSON
			return this.accordion(this.getNewJSON(_accordion), keysPath);
		} else {
			if (_accordion.$id) {
				// Register original JSON
				this.registerJSONById(_accordion);
			}

			if (this._validate(this.accordionDef(), accordion) === false) {
				window.console.log('Failed JSON accordion:', accordion);
				throw 'Failed JSON accordion!';
			}
			if (this._validate(this.accordionDef().properties.config, accordion.config) === false) {
				window.console.log('Failed JSON accordion config:', accordion.config);
				throw 'Failed JSON accordion config!';
			}

			if (!accordion.classList) {
				accordion.classList = [];
			}
			accordion.classList.push('power-accordion');

			const editableJson = `${keysPath ? ' data-is-json="accordion"' : ''}`;

			let mainTmpl = `<div ${this._getHtmlBasicTmpl(accordion)} data-multiple-sections-open="${(accordion.config && accordion.config.multipleSectionsOpen ? accordion.config.multipleSectionsOpen : false)}"${editableJson}>`;

			let counter = 0;
			for (const panel of accordion.panels) {
				const currentKeysPath = keysPath ? `${keysPath},${counter}` : '';
				if (this._validate(this.accordionDef().properties.panels, panel) === false) {
					window.console.log('Failed JSON accordion panel:', panel);
					throw 'Failed JSON accordion panel!';
				}
				if (this._validate(this.accordionDef().properties.panels.properties.header, panel.header) === false) {
					window.console.log('Failed JSON accordion header:', panel.header);
					throw 'Failed JSON accordion header!';
				}
				if (this._validate(this.accordionDef().properties.panels.properties.section, panel.section) === false) {
					window.console.log('Failed JSON accordion section:', panel.section);
					throw 'Failed JSON accordion section!';
				}

				// Headers
				const icon = {};
				if (panel.header.icon) {
					if (panel.header.icon === 'img' && panel.header['icon-src']) {
						icon.kind = 'img';
						icon.src = panel.header['icon-src'];
					} else {
						icon.icon = panel.header.icon;
					}
				}

				const status = {};
				if (panel.header.status) {
					status.active = panel.header.status.active;
					status.inactive = panel.header.status.inactive;
				}

				const sectionId = panel.section.id || this.$powerUi._Unique.next();

				const panelJson = `${keysPath ? ' data-panel-index="' + counter + '"' : ''}`;
				const headerTmpl = `<div
				class="power-action" data-power-target="${sectionId}" ${this._getIdTmpl(panel.header.id, true)}>
					<div${panelJson}>
						${this.icon(icon, currentKeysPath)}
						<span class="pw-label"${currentKeysPath ? ' data-keys-path="' + currentKeysPath + '"' : ''}>${panel.header.label}</span>
					</div>
					${this.status(status, currentKeysPath)}
				</div>`;

				// Sections
				let sectionTmpl = `<div class="power-accordion-section"${panelJson}${currentKeysPath ? ' data-keys-path="' + currentKeysPath + '"' : ''} ${this._getIdTmpl(sectionId)}>
					${panel.section.text || ''}`;

					// If this is not an html json, but a button, dropmenu or other kind of json
					if (panel.section.children) {
						let _c = 0;
						for (const child of panel.section.children) {
							const _cKeysPath = currentKeysPath ? `${currentKeysPath},${_c}` : '';
							sectionTmpl = sectionTmpl + this.otherJsonKind(child, _cKeysPath);
							_c = _c + 1;
						}
					}
				sectionTmpl = sectionTmpl + '</div>';

				mainTmpl = mainTmpl + headerTmpl + sectionTmpl;
				counter = counter + 1;
			}

			return mainTmpl + '</div>';
		}
	}

	powertabs(_powertabs, keysPath) {
		// Do not change the original JSON
		const powertabs = this.cloneObject(_powertabs);
		// This allow pass an array of powertabs
		if (_powertabs.length) {
			return this._arrayOfSchemas(_powertabs, 'powertabs');
		} else if (_powertabs.$ref) {
			// Use the original JSON
			return this.powertabs(this.getNewJSON(_powertabs), keysPath);
		} else {
			if (_powertabs.$id) {
				// Register original JSON
				this.registerJSONById(_powertabs);
			}

			if (this._validate(this.powertabsDef(), powertabs) === false) {
				window.console.log('Failed JSON powertabs:', powertabs);
				throw 'Failed JSON powertabs!';
			}

			if (!powertabs.classList) {
				powertabs.classList = [];
			}
			powertabs.classList.push('power-tabs');
			const editableJson = `${keysPath ? ' data-is-json="powertabs"' : ''}`;

			let mainTmpl = `<div ${this._getHtmlBasicTmpl(powertabs)}${editableJson}>`;

			let counter = 0;
			for (const tab of powertabs.tabs) {
				const currentKeysPath = keysPath ? `${keysPath},${counter}` : '';
				if (this._validate(this.powertabsDef().properties.tabs, tab) === false) {
					window.console.log('Failed JSON tab:', tab);
					throw 'Failed JSON tab!';
				}
				if (this._validate(this.powertabsDef().properties.tabs.properties.header, tab.header) === false) {
					window.console.log('Failed JSON tab header:', tab.header);
					throw 'Failed JSON tab header!';
				}
				if (this._validate(this.powertabsDef().properties.tabs.properties.section, tab.section) === false) {
					window.console.log('Failed JSON tab section:', tab.section);
					throw 'Failed JSON tab section!';
				}

				// Headers
				const icon = {};
				if (tab.header.icon) {
					if (tab.header.icon === 'img' && tab.header['icon-src']) {
						icon.kind = 'img';
						icon.src = tab.header['icon-src'];
					} else {
						icon.icon = tab.header.icon;
					}
				}

				const status = {};
				if (tab.header.status) {
					status.active = tab.header.status.active;
					status.inactive = tab.header.status.inactive;
				}

				const sectionId = tab.section.id || this.$powerUi._Unique.next();

				const tabJson = `${keysPath ? ' data-tab-index="' + counter + '"' : ''}`;
				const headerTmpl = `<div
				class="power-action" data-power-target="${sectionId}" ${this._getIdTmpl(tab.header.id, true)}>
					<div${tabJson}>
						${this.icon(icon, currentKeysPath)}
						<span class="pw-label"${currentKeysPath ? ' data-keys-path="' + currentKeysPath + '"' : ''}>${tab.header.label}</span>
					</div>
					${this.status(status)}
				</div>`;

				// Sections
				let sectionTmpl = `<div class="power-tab-section"${tabJson}${currentKeysPath ? ' data-keys-path="' + currentKeysPath + '"' : ''} ${this._getIdTmpl(sectionId)}>
					${tab.section.text || ''}`;

					// If this is not an html json, but a button, dropmenu or other kind of json
					if (tab.section.children) {
						let _c = 0;
						for (const child of tab.section.children) {
							const _cKeysPath = currentKeysPath ? `${currentKeysPath},${_c}` : '';
							sectionTmpl = sectionTmpl + this.otherJsonKind(child, _cKeysPath);
							_c = _c + 0;
						}
					}
				sectionTmpl = sectionTmpl + '</div>';

				mainTmpl = mainTmpl + headerTmpl + sectionTmpl;
				counter = counter + 0;
			}

			return mainTmpl + '</div>';
		}
	}

	_setBarDropmenuPosition(bar) {
		if (!bar.dropMenuPosition) {
			if (!bar.orientation || bar.orientation === 'horizontal') {
				if (bar.mirrored === true) {
					if (bar.position === undefined || bar.position === 'fixed-top') {
						bar.dropMenuPosition = 'bottom-left';
					} else if (bar.position === 'fixed-bottom') {
						bar.dropMenuPosition = 'top-left';
					}
				} else {
					if (bar.position === undefined || bar.position === 'fixed-top') {
						bar.dropMenuPosition = 'bottom-right';
					} else if (bar.position === 'fixed-bottom') {
						bar.dropMenuPosition = 'top-right';
					}
				}
			} else if (bar.orientation === 'vertical') {
				if (bar.mirrored === true || (bar.mirrored === undefined && (bar.position === 'fixed-right' || bar.position === 'float-right'))) {
					bar.dropMenuPosition = 'left-bottom';
				} else {
					bar.dropMenuPosition = 'right-bottom';
				}
			}
		}
	}

	_setBarCssStyles(bar, element) {
		if (!bar.position) {
			return;
		}
		if (bar.mirrored) {
			element.classList.add('pw-mirrored');
		}
		if (bar.position.includes('fixed')) {
			const fixedWindow = bar.position.includes('window');
			element.classList.add(fixedWindow ? 'pw-bar-window-fixed' : 'pw-bar-fixed');
		}

		if (bar.position === 'fixed-top' || bar.position === 'fixed-window-top') {
			element.classList.add('pw-top');
			if (!bar.orientation || bar.orientation === 'horizontal') {
				element.classList.add('pw-horizontal');
			}
		} else if (bar.position === 'fixed-bottom' || bar.position === 'fixed-window-bottom') {
			element.classList.add('pw-bottom');
			if (!bar.orientation || bar.orientation === 'horizontal') {
				element.classList.add('pw-horizontal');
			}
		} else if (bar.position === 'fixed-left' || bar.position === 'fixed-window-left') {
			element.classList.add('pw-left');
			if (!bar.orientation || bar.orientation === 'vertical') {
				element.classList.add('pw-vertical');
			}
		} else if (bar.position === 'fixed-right' || bar.position === 'fixed-window-right') {
			element.classList.add('pw-right');
			if (!bar.orientation || bar.orientation === 'vertical') {
				element.classList.add('pw-vertical');
			}
		} else if (bar.position === 'float-left') {
			element.classList.add('pw-bar-float');
			element.classList.add('pw-left');
		} else if (bar.position === 'float-right') {
			element.classList.add('pw-bar-float');
			element.classList.add('pw-right');
		}
		// Window can ignore bar
		if (bar.ignore) {
			element.classList.add('pw-ignore');
		}
		// Set priority
		if (bar.priority) {
			element.dataset.pwPriority = bar.priority;
		}
		// Set orientation
		if (!bar.orientation) {
			if (element.classList.contains('pw-vertical')) {
				bar.orientation = 'vertical';
			} else {
				bar.orientation = 'horizontal';
			}
		}
	}

	_setBarOrientation(bar, element) {
		if (bar.orientation === 'horizontal') {
			element.classList.add('pw-horizontal');
		} else if (bar.orientation === 'vertical') {
			element.classList.add('pw-vertical');
		}
	}

	menu(_menu, keysPath) {
		// Do not change the original JSON
		const menu = this.cloneObject(_menu);
		// This allow pass an array of menus
		if (_menu.length) {
			return this._arrayOfSchemas(_menu, 'menu');
		} else if (_menu.$ref) {
			// Use the original JSON
			return this.menu(this.getNewJSON(_menu), keysPath);
		} else {
			if (_menu.$id) {
				// Register original JSON
				this.registerJSONById(_menu);
			}

			if (this._validate(this.menuDef(), menu) === false) {
				window.console.log('Failed JSON menu:', menu);
				throw 'Failed JSON dropmenu!';
			}
			if (menu.events) {
				const result = this._validateEvents(menu.events, menu, 'menu');
				if ( result !== true) {
					throw result;
				}
			}

			if (!menu.orientation) {
				if (!menu.position || menu.position.includes('top') || menu.position.includes('bottom')) {
					menu.orientation = 'horizontal';
				} else {
					menu.orientation = 'vertical';
				}
			}

			if (!menu.classList) {
				menu.classList = [];
			}

			menu.classList.push('power-menu pw-bar');

			// Bar get its template from dropmenu
			const tmpEl = document.createElement('div');

			// Set dropmenu position
			this._setBarDropmenuPosition(menu);

			tmpEl.innerHTML =  this._buildbarEl(menu, menu.mirrored, menu.flip, (keysPath ? keysPath : ''));

			const menuEl = tmpEl.children[0];
			// Set menu css styles
			this._setBarCssStyles(menu, menuEl);
			this._setBarOrientation(menu, menuEl);

			// Brand
			if (menu.brand) {
				if (menu.brand.events) {
					const result = this._validateEvents(menu.brand.events, menu.brand, 'brand');
					if ( result !== true) {
						throw result;
					}
				}
				// Add menu brand
				const brandHolderEl = document.createElement('div');
				if (!menu.brand.classList) {
					menu.brand.classList = [];
				}
				if (!menu.brand.classList.includes('power-brand')) {
					menu.brand.classList.push('power-brand');
				}
				let kind = '';
				if (menu.brand.text) {
					kind = 'text';
					menu.brand.content = menu.brand.text;
				} else {
					kind = 'html';
					menu.brand.content = menu.brand.html;
				}
				brandHolderEl.innerHTML = `<div ${this._getHtmlBasicTmpl(menu.brand)}${keysPath ? ' data-kind="' + kind + '"' : ''}>${menu.brand.content}</div>`;
				const brandEl = brandHolderEl.children[0];
				menuEl.insertBefore(brandEl, menuEl.childNodes[0]);
			}

			// Add hamburger menu toggle
			if (menu.colapse !== false) {
				menuEl.classList.add('pw-colapse');
				const hamburgerHolderEl = document.createElement('div');
				hamburgerHolderEl.innerHTML = `<a id="${menu.id}-action" class="power-toggle" data-power-target="${menu.id}">
					<i class="pw-icon icon-hamburguer"></i>
				</a>`;
				const hamburgerEl = hamburgerHolderEl.children[0];
				menuEl.appendChild(hamburgerEl);
			}

			return tmpEl.innerHTML;
		}
	}

	toolbar(_toolbar, keysPath) {
		// Do not change the original JSON
		const toolbar = this.cloneObject(_toolbar);
		// This allow pass an array of menus
		if (_toolbar.length) {
			return this._arrayOfSchemas(_toolbar, 'toolbar');
		} else if (_toolbar.$ref) {
			// Use the original JSON
			return this.toolbar(this.getNewJSON(_toolbar), keysPath);
		} else {
			if (_toolbar.$id) {
				// Register original JSON
				this.registerJSONById(_toolbar);
			}

			if (this._validate(this.toolbarDef(), toolbar) === false) {
				window.console.log('Failed JSON toolbar:', toolbar);
				throw 'Failed JSON toolbar!';
			}
			if (toolbar.events) {
				const result = this._validateEvents(toolbar.events, toolbar, 'toolbar');
				if ( result !== true) {
					throw result;
				}
			}

			if (!toolbar.orientation) {
				if (!toolbar.position || toolbar.position.includes('top') || toolbar.position.includes('bottom')) {
					toolbar.orientation = 'horizontal';
				} else {
					toolbar.orientation = 'vertical';
				}
			}


			if (!toolbar.classList) {
				toolbar.classList = [];
			}

			toolbar.classList.push('power-toolbar pw-bar pw-icons-bar');

			// Bar get its template from dropmenu
			const tmpEl = document.createElement('div');

			// Set dropmenu position
			this._setBarDropmenuPosition(toolbar);

			tmpEl.innerHTML =  this._buildbarEl(toolbar, toolbar.mirrored, toolbar.flip, (keysPath ? keysPath : ''));

			const toolbarEl = tmpEl.children[0];
			// Set toolbar css styles
			this._setBarCssStyles(toolbar, toolbarEl);

			this._setBarOrientation(toolbar, toolbarEl);

			// Add toolbar toggle
			if (toolbar.colapse !== false) {
				const dotsHolderEl = document.createElement('div');
				dotsHolderEl.innerHTML = `<a id="${toolbar.id}-action" class="power-toggle" data-power-target="${toolbar.id}">
					<i class="pw-icon icon-option-${toolbar.orientation}"></i>
				</a>`;
				const dotsEl = dotsHolderEl.children[0];
				toolbarEl.appendChild(dotsEl);
			}

			return tmpEl.innerHTML;
		}
	}

	splitbar(_splitbar, keysPath) {
		// Do not change the original JSON
		const splitbar = this.cloneObject(_splitbar);
		// This allow pass an array of menus
		if (_splitbar.length) {
			return this._arrayOfSchemas(_splitbar, 'splitbar');
		} else if (_splitbar.$ref) {
			// Use the original JSON
			return this.splitbar(this.getNewJSON(_splitbar), keysPath);
		} else {
			if (_splitbar.$id) {
				// Register original JSON
				this.registerJSONById(_splitbar);
			}

			if (this._validate(this.splitbarDef(), splitbar) === false) {
				window.console.log('Failed JSON splitbar:', splitbar);
				throw 'Failed JSON splitbar!';
			}
			if (splitbar.events) {
				const result = this._validateEvents(splitbar.events, splitbar, 'splitbar');
				if ( result !== true) {
					throw result;
				}
			}

			if (!splitbar.orientation) {
				if (!splitbar.position || splitbar.position.includes('top') || splitbar.position.includes('bottom')) {
					splitbar.orientation = 'horizontal';
				} else {
					splitbar.orientation = 'vertical';
				}
			}

			if (!splitbar.classList) {
				splitbar.classList = [];
			}

			splitbar.classList.push('power-split-bar pw-bar');
			if (splitbar.resize !== false) {
				splitbar.classList.push('pw-split');
			}

			// The nav bar
			const tmpEl = document.createElement('div');
			tmpEl.innerHTML = `<nav ${this._getHtmlBasicTmpl(splitbar)}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''} ${splitbar.border ? 'data-pw-border="' + splitbar.border + '" ' : ''}><div class="pw-bar-content">${splitbar.content}</div></nav>`;

			const splitbarEl = tmpEl.children[0];
			// Set splitbar css styles
			this._setBarCssStyles(splitbar, splitbarEl);

			this._setBarOrientation(splitbar, splitbarEl);

			// Add hamburger menu toggle
			if (splitbar.colapse !== false) {
				splitbarEl.classList.add('pw-colapse');
				const hamburgerHolderEl = document.createElement('div');
				hamburgerHolderEl.innerHTML = `<a id="${splitbar.id}-action" class="power-toggle" data-power-target="${splitbar.id}">
					<i class="pw-icon icon-hamburguer"></i>
				</a>`;
				const hamburgerEl = hamburgerHolderEl.children[0];
				splitbarEl.appendChild(hamburgerEl);
			}

			return tmpEl.innerHTML;
		}
	}

	_buildbarEl(bar, mirrored, flip, keysPath='') {
		const tmpEl = document.createElement('div');
		tmpEl.innerHTML = `<nav ${this._getHtmlBasicTmpl(bar)}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''} ${mirrored === true ? ' pw-mirrored' : ''} data-pw-position="${bar.dropMenuPosition}"></nav>`;
		let counter = 0;
		for (const item of bar.items) {
			const itemHolderEl = document.createElement('div');
			const currentKeysPath = keysPath ? `${keysPath},${counter}` : '';
			if (flip && item.status && item.status.active) {
				if (item.status.active.includes('down')) {
					item.status.active = item.status.active.replace('down', 'up');
				} else if (item.status.active.includes('up')) {
					item.status.active = item.status.active.replace('up', 'down');
				}
			}
			if (item.item) {

				itemHolderEl.innerHTML = this.item({
					item: item.item,
					mirrored: item.mirrored === undefined ? mirrored : item.mirrored,
					dropmenuId: item.dropmenu ? item.dropmenu.id : false,
					keysPath: currentKeysPath,
				});
			} else if (item.button && item.dropmenu) {
				if (mirrored !== undefined && item.button.mirrored === undefined) {
					item.button.mirrored = mirrored;
				}
				itemHolderEl.innerHTML = this.dropMenuButton(item, currentKeysPath);
			} else if (item.button && !item.dropmenu) {
				if (mirrored !== undefined && item.button.mirrored === undefined) {
					itemHolderEl.innerHTML = this.button(item.button, mirrored, currentKeysPath);
				} else {
					itemHolderEl.innerHTML = this.button(item.button, null, currentKeysPath);
				}
				// Buttons inside menu needs the 'power-item' class
				itemHolderEl.children[0].classList.add('power-item');
			}

			const anchorEl = itemHolderEl.children[0];

			if (item.item && !item.button) {
				if (item.status) {
					this.appendStatus({element: anchorEl, json: item.status, mirrored: mirrored, keysPath: currentKeysPath});
				}
			}

			tmpEl.children[0].appendChild(anchorEl);

			// Buttons already have the menu created by dropMenuButton inside itemHolderEl
			if (item.button && item.dropmenu) {
				tmpEl.children[0].appendChild(itemHolderEl.children[0]);
			} else if (item.dropmenu && !item.button) {
				// Add submenu if have one and is not a button
				const submenuHolderEl = document.createElement('div');
				submenuHolderEl.innerHTML = this.dropmenu(item.dropmenu, mirrored, flip, currentKeysPath);
				tmpEl.children[0].appendChild(submenuHolderEl.children[0]);
			}
			counter = counter + 1;
		}

		return tmpEl.innerHTML;
	}

	dropmenu(_dropmenu, mirrored, flip, keysPath) {
		// Do not change the original JSON
		const dropmenu = this.cloneObject(_dropmenu);
		const dropmenuPosition = dropmenu.position;
		// This allow pass an array of dropmenus
		if (_dropmenu.length) {
			return this._arrayOfSchemas(_dropmenu, 'dropmenu');
		} else if (_dropmenu.$ref) {
			// Use the original JSON
			return this.dropmenu(this.getNewJSON(_dropmenu), mirrored, flip, keysPath);
		} else {
			if (_dropmenu.$id) {
				// Register original JSON
				this.registerJSONById(_dropmenu);
			}

			if (this._validate(this.dropmenuDef(), dropmenu) === false) {
				window.console.log('Failed JSON dropmenu:', dropmenu);
				throw 'Failed JSON dropmenu!';
			}
			if (dropmenu.events) {
				const result = this._validateEvents(dropmenu.events, dropmenu, 'dropmenu');
				if ( result !== true) {
					throw result;
				}
			}

			const tmpEl = document.createElement('div');

			if (!dropmenu.classList) {
				dropmenu.classList = [];
			}

			dropmenu.classList.push('power-dropmenu');

			tmpEl.innerHTML = `<nav ${this._getHtmlBasicTmpl(dropmenu)}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''} ${mirrored === true ? ' pw-mirrored' : ''}></nav>`;

			// Set dropmenu position
			if (dropmenuPosition) {
					const dropmenuEl = tmpEl.children[0];
					dropmenuEl.dataset.pwPosition = dropmenuPosition;
			}

			let counter = 0;

			for (const item of dropmenu.items) {
				const itemHolderEl = document.createElement('div');
				const currentKeysPath = keysPath ? `${keysPath},${counter}` : '';
				if (flip && item.status && item.status.active) {
					if (item.status.active.includes('down')) {
						item.status.active = item.status.active.replace('down', 'up');
					} else if (item.status.active.includes('up')) {
						item.status.active = item.status.active.replace('up', 'down');
					}
				}
				if (item.item) {
					itemHolderEl.innerHTML = this.item({
						item: item.item,
						mirrored: item.mirrored === undefined ? mirrored : item.mirrored,
						dropmenuId: item.dropmenu ? item.dropmenu.id : false,
						keysPath: currentKeysPath
					});
				} else if (item.button && item.dropmenu) {
					if (mirrored !== undefined && item.button.mirrored === undefined) {
						item.button.mirrored = mirrored;
					}
					itemHolderEl.innerHTML = this.dropMenuButton(item, currentKeysPath);
				} else if (item.button && !item.dropmenu) {
					if (mirrored !== undefined && item.button.mirrored === undefined) {
						itemHolderEl.innerHTML = this.button(item.button, mirrored, currentKeysPath);
					} else {
						itemHolderEl.innerHTML = this.button(item.button, null, currentKeysPath);
					}
					// Buttons inside menu needs the 'power-item' class
					itemHolderEl.children[0].classList.add('power-item');
				}

				const anchorEl = itemHolderEl.children[0];

				if (item.item && !item.button) {
					if (item.status) {
						this.appendStatus({element: anchorEl, json: item.status, mirrored: mirrored, keysPath: currentKeysPath});
					}
				}

				tmpEl.children[0].appendChild(anchorEl);

				// Buttons already have the menu created by dropMenuButton inside itemHolderEl
				if (item.button && item.dropmenu) {
					tmpEl.children[0].appendChild(itemHolderEl.children[0]);
				} else if (item.dropmenu && !item.button) {
					// Add submenu if have one and is not a button
					const submenuHolderEl = document.createElement('div');
					submenuHolderEl.innerHTML = this.dropmenu(item.dropmenu, mirrored, flip, currentKeysPath);
					tmpEl.children[0].appendChild(submenuHolderEl.children[0]);
				}
				counter = counter + 1;
			}

			return tmpEl.innerHTML;
		}
	}

	item({item, mirrored, dropmenuId, keysPath}) {
		// Do not change the original JSON
		const newItem = this.cloneObject(item);
		// This allow pass an array of items
		if (item.length) {
			return this._arrayOfSchemas(item, 'item');
		} else if (item.$ref) {
			// Use the original JSON
			return this.item(this.getNewJSON(item), mirrored, dropmenuId, keysPath);
		} else {
			if (item.$id) {
				// Register original JSON
				this.registerJSONById(item);
			}

			if (this._validate(this.itemDef(), newItem) === false) {
				window.console.log('Failed JSON item:', newItem);
				return 'Failed JSON item!';
			}
			if (newItem.events) {
				const result = this._validateEvents(newItem.events, newItem, 'item');
				if ( result !== true) {
					throw result;
				}
			}

			const tmpEl = document.createElement('div');

			if (!newItem.classList) {
				newItem.classList = [];
			}

			newItem.classList.push(dropmenuId ? 'power-action' : 'power-item');

			const label = `<span class="pw-label"${keysPath ? ' data-keys-path="' + keysPath + '"' : ''}>${newItem.label}</span>`;

			tmpEl.innerHTML = `<a ${this._getHtmlBasicTmpl(newItem)} ${dropmenuId ? 'data-power-target="' + dropmenuId + '"' : ''}>${newItem.label ? label : ''}</a>`;

			const itemEl = tmpEl.children[0];

			if (newItem.icon) {
				this.appendIcon({element: itemEl, json: newItem, mirrored: mirrored, keysPath: keysPath});
			}

			return tmpEl.innerHTML;
		}
	}

	dropMenuButton(_dropMenuButton, keysPath) {
		// Do not change the original JSON
		const dropMenuButton = this.cloneObject(_dropMenuButton);
		// This allow pass an array of dropMenuButtons
		if (_dropMenuButton.length) {
			return this._arrayOfSchemas(_dropMenuButton, 'dropMenuButton');
		} else if (_dropMenuButton.$ref) {
			// Use the original JSON
			return this.dropMenuButton(this.getNewJSON(_dropMenuButton), keysPath);
		} else {
			if (this._validate(this.dropmenubuttonDef(), dropMenuButton) === false) {
				window.console.log('Failed JSON dropMenuButton:', dropMenuButton);
				throw 'Failed JSON dropMenuButton!';
			}

			if (_dropMenuButton.$id) {
				// Register original JSON
				this.registerJSONById(_dropMenuButton);
			}

			const tmpEl = document.createElement('div');
			// Create button
			tmpEl.innerHTML = this.button(dropMenuButton.button, dropMenuButton.button.mirrored, keysPath);

			const buttonEl = tmpEl.children[0];
			buttonEl.dataset.powerTarget = dropMenuButton.dropmenu.id;
			buttonEl.classList.add('power-action');

			if (dropMenuButton.status) {
				this.appendStatus({element: buttonEl, json: dropMenuButton.status, mirrored: dropMenuButton.button.mirrored, flip: dropMenuButton.button.flip, keysPath: keysPath});
			}

			// Create dropmenu
			tmpEl.innerHTML = tmpEl.innerHTML + this.dropmenu(dropMenuButton.dropmenu, dropMenuButton.button.mirrored, dropMenuButton.button.flip, keysPath);

			return tmpEl.innerHTML;
		}
	}

	button(_button, mirrored, keysPath) {
		// Do not change the original JSON
		const button = this.cloneObject(_button);
		// This allow pass an array of buttons
		if (_button.length) {
			return this._arrayOfSchemas(_button, 'button');
		} else if (_button.$ref) {
			// Use the original JSON
			return this.button(this.getNewJSON(_button), mirrored, keysPath);
		} else {
			if (_button.$id) {
				// Register original JSON
				this.registerJSONById(_button);
			}

			if (this._validate(this.itemDef(), button) === false) {
				window.console.log('Failed JSON button:', button);
				throw 'Failed JSON button!';
			}
			if (button.events) {
				const result = this._validateEvents(button.events, button, 'button');
				if ( result !== true) {
					throw result;
				}
			}

			const tmpEl = document.createElement('div');

			if (!button.classList) {
				button.classList = [];
			}

			if (!button.type) {
				button.type = 'button';
			}

			button.classList.push(button.kind ? `pw-btn-${button.kind}` : 'pw-btn-default');

			tmpEl.innerHTML = `<button ${this._getInputBasicTmpl(button)}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''}><span class="pw-label">${button.label}</span></button>`;

			const buttonEl = tmpEl.children[0];

			if (button.icon) {
				this.appendIcon({element: buttonEl, json: button, mirrored: mirrored, keysPath: keysPath});
			}

			if (button.classList) {
				this.appendClassList({element: buttonEl, json: button});
			}

			return tmpEl.innerHTML;
		}
	}

	tree(_tree, keysPath) {
		// Do not change the original JSON
		const tree = this.cloneObject(_tree);
		// This allow pass an array of trees
		if (_tree.length) {
			return this._arrayOfSchemas(_tree, 'tree');
		} else if (_tree.$ref) {
			// Use the original JSON
			return this.tree(this.getNewJSON(_tree), keysPath);
		} else {
			if (_tree.$id) {
				// Register original JSON
				this.registerJSONById(_tree);
			}

			if (this._validate(this.treeDef(), tree) === false) {
				window.console.log('Failed JSON tree:', tree);
				throw 'Failed JSON tree!';
			}
			if (tree.events) {
				const result = this._validateEvents(tree.events, tree, 'tree');
				if ( result !== true) {
					throw result;
				}
			}

			if (!tree.classList) {
				tree.classList = [];
			}

			tree.classList.push('power-tree-view');

			let template = `<nav ${this._getHtmlMoreBasicTmpl(tree)} ${tree.onClickFile ? 'data-on-click-file="' + tree.onClickFile + '"' : ''}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''}>`;

			let counter = 0;
			for (const item of tree.nodes) {
				const currentKeysPath = keysPath ? `${keysPath},${counter}` : '';
				if (this._validate(this.treeNodeDef(), item) === false) {
					window.console.log('Failed JSON tree node:', item);
					throw 'Failed JSON tree node!';
				}
				if (item.events) {
					const result = this._validateEvents(item.events, item, 'tree node');
					if ( result !== true) {
						throw result;
					}
				}
				if (!item.classList) {
					item.classList = [];
				}

				if (item.kind === 'file') {
					item.classList.push('power-item');

					template = `${template}
					<a ${this._getHtmlMoreBasicTmpl(item)} ${item.path ? ' data-file-path="' + encodeURI(item.path) + '"' : ''}${currentKeysPath ? ' data-keys-path="' + currentKeysPath + '"' : ''} `;
					template = `${template}>
						<span class="pw-icon ${item.icon || 'icon-document-blank'}"></span> <span>${item.fullName}</span></a>`;
				} else if (item.kind === 'folder') {
					const id = `list-${this.$powerUi._Unique.next()}`;
					item.classList.push('power-list');
					template = `${template}
					<a ${this._getHtmlMoreBasicTmpl(item)} data-power-target="${id}"${currentKeysPath ? ' data-keys-path="' + currentKeysPath + '"' : ''}>
						<span class="power-status pw-icon" data-power-active="${item.active || 'icon-folder-open'}" data-power-inactive="${item.inactive || 'icon-folder-close'}"></span> <span>${item.fullName}</span>
					</a>
					${this.tree({nodes: item.nodes, id: id}, currentKeysPath)}`;
				}
				counter = counter + 1;
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

			if (this._validate(this.gridDef(), grid) === false) {
				window.console.log('Failed JSON grid:', grid);
				throw 'Failed JSON grid!';
			}
			if (grid.events) {
				const result = this._validateEvents(grid.events, grid, 'grid');
				if ( result !== true) {
					throw result;
				}
			}

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
				if (this._validate(this.gridDef().properties.fields, field) === false) {
					window.console.log('Failed JSON grid field:', field, grid);
					throw 'Failed JSON grid field!';
				}
				if (field.events) {
					const result = this._validateEvents(field.events, field, 'field');
					if ( result !== true) {
						throw result;
					}
				}

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
			if (this._validate(this.simpleformcontrolsDef(), control) === false) {
				window.console.log('Failed JSON control:', control);
				throw 'Failed JSON control!';
			}
			if (control.events) {
				const result = this._validateEvents(control.events, control, 'control');
				if ( result !== true) {
					throw result;
				}
			}
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
				<div class="pw-field-container">
					<input ${this._getInputBasicTmpl(control)} />
					<div class="pw-control-helper"></div>
				</div>`;

			} else if (control.type === 'select') {

				template = `${template}
				<div class="pw-field-container">
					${label ? label : ''}
					<select ${this._getInputBasicTmpl(control)} ${control.multiple === true ? 'multiple' : ''}>`;
						for (const item of control.list) {
							template = `${template}<option value="${item.value}"${item.disabled === true ? ' disabled' : ''}${item.selected === true ? ' selected' : ''}>${item.label}</option>`;
						}
					template = `${template}
					</select>
					<div class="pw-control-helper"></div>
				</div>`;

			} else if (control.type === 'radio' || control.type === 'checkbox') {

				template = `${template}
				<div class="pw-field-container">
					<input ${this._getInputBasicTmpl(control)} /> ${label ? label : ''}
				</div>`;

			} else if (control.type === 'textarea') {

				template = `${template}
				<div class="pw-field-container">
					${label ? label : ''}
					<textarea ${this._getInputBasicTmpl(control)} ${control.rows ? 'rows="' + control.rows + '"' : ''} ${control.cols ? 'cols="' + control.cols + '"' : ''}>
						${control.value || ''}
					</textarea>
					<div class="pw-control-helper"></div>
				</div>`;

			} else {

				template = `${template}
				<div class="pw-field-container">
					${label ? label : ''}
					<input ${this._getInputBasicTmpl(control)} />
					<div class="pw-control-helper"></div>
				</div>`;
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
			return this.simpleForm(this.getNewJSON(_form));
		} else {
			if (_form.$id) {
				// Register original JSON
				this.registerJSONById(_form);
			}

			if (this._validate(this.simpleformDef(), form) === false) {
				window.console.log('Failed JSON form:', form);
				throw 'Failed JSON form!';
			}
			if (form.events) {
				const result = this._validateEvents(form.events, form, 'form');
				if ( result !== true) {
					throw result;
				}
			}

			const classList = [
				'pw-vertical-form',
				`${form.theme || 'pw-simple-form'}`,
				'pw-grid scroll-12',
				'gap-4',
			];

			if (form.inline !== false) {
				classList.push('inline-grid');
			}
			if (form.classList && form.classList.length) {
				for (const css of form.classList) {
					classList.push(css);
				}
			}
			const classTmpl = this._getClassTmpl(classList);

			const formType = form.type === 'form' ? 'form' : 'div';

			let template = `<${formType} ${this._getIdTmpl(form.id, 'form')} ${classTmpl}>`;

			template = this.simpleFormControls({controls: form.controls, template: template});

			template = `${template}
			</${formType}>`;

			return template;
		}
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

			if (this._validate(this.htmlDef(), html) === false) {
				window.console.log('Failed JSON html:', html);
				return 'Failed JSON html!';
			}
			if (html.events) {
				const result = this._validateEvents(html.events, html, 'html');
				if ( result !== true) {
					throw result;
				}
			}

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

	icon(_json, keysPath) {
		// Return empty string if not have an icon
		if (_json.icon === undefined && _json.kind === undefined) {
			return '';
		}
		// Do not change the original JSON
		const json = this.cloneObject(_json);
		// This allow pass an array of json
		if (_json.length) {
			return this._arrayOfSchemas(_json, 'icon');
		} else if (_json.$ref) {
			// Use the original JSON
			return this.icon(this.getNewJSON(_json), keysPath);
		} else {
			if (_json.$id) {
				// Register original JSON
				this.registerJSONById(_json);
			}

			if (this._validate(this.iconDef(), _json) === false) {
				window.console.log('Failed JSON icon:', _json);
				return 'Failed JSON icon!';
			}

			let template = '';
			if (!json.classList) {
				json.classList = [];
			}
			json.classList.push('pw-icon');

			if (json.kind === 'img' && json.src) {
				const src = json.src;
				delete json.src;
				template = `<span ${this._getHtmlBasicTmpl(json)}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''}><img src=${src} /></span>`;
			} else {
				json.classList.push(json.icon);
				template = `<span ${this._getHtmlBasicTmpl(json)}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''}></span>`;
			}

			return template;
		}
	}

	status(_json, keysPath) {
		// Return if do not have status
		if (!_json.inactive && !_json.active) {
			return '';
		}

		// Do not change the original JSON
		const json = this.cloneObject(_json);
		// This allow pass an array of json
		if (_json.length) {
			return this._arrayOfSchemas(_json, 'status');
		} else if (_json.$ref) {
			// Use the original JSON
			return this.status(this.getNewJSON(_json), keysPath);
		} else {
			if (_json.$id) {
				// Register original JSON
				this.registerJSONById(_json);
			}

			if (this._validate(this.statusDef(), _json) === false) {
				window.console.log('Failed JSON status:', _json);
				return 'Failed JSON status!';
			}

			if (!json.classList) {
				json.classList = [];
			}
			json.classList.push('pw-icon');
			json.classList.push('power-status');
			return `<span ${this._getHtmlBasicTmpl(json)}${keysPath ? ' data-keys-path="' + keysPath + '"' : ''} data-power-inactive="${json.inactive}" data-power-active="${json.active}"></span>`;
		}
	}

	accordionDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/accordion",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"config": {
					"type": "object",
					"properties": {
						"multipleSectionsOpen": {"type": "boolean"}
					}
				},
				"panels": {
					"type": "array",
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
								"text": {"type": "string"},
								"children": {
									"type": "array",
									"properties": {
										"html": {"$ref": "#/schema/draft-07/html"},
										"button": {"$ref": "#/schema/draft-07/item"},
										"item": {"$ref": "#/schema/draft-07/item"},
										"status": {"$ref": "#/schema/draft-07/status"},
										"icon": {"$ref": "#/schema/draft-07/icon"},
										"menu": {"$ref": "#/schema/draft-07/menu"},
										"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"},
										"dropmenubutton": {"$ref": "#/schema/draft-07/dropmenubutton"},
										"simpleform": {"$ref": "#/schema/draft-07/simpleform"},
										"tree": {"$ref": "#/schema/draft-07/tree"},
										"accordion": {"$ref": "#/schema/draft-07/accordion"},
										"grid": {"$ref": "#/schema/draft-07/grid"}
									}
								}
							},
							"required": ["id"]
						}
					},
					"required": ["header", "section"]
				}
			},
			"required": ["panels"]
		};
	}

	powertabsDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/powertabs",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"tabs": {
					"type": "array",
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
								"text": {"type": "string"},
								"children": {
									"type": "array",
									"properties": {
										"html": {"$ref": "#/schema/draft-07/html"},
										"button": {"$ref": "#/schema/draft-07/item"},
										"item": {"$ref": "#/schema/draft-07/item"},
										"status": {"$ref": "#/schema/draft-07/status"},
										"icon": {"$ref": "#/schema/draft-07/icon"},
										"menu": {"$ref": "#/schema/draft-07/menu"},
										"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"},
										"dropmenubutton": {"$ref": "#/schema/draft-07/dropmenubutton"},
										"simpleform": {"$ref": "#/schema/draft-07/simpleform"},
										"tree": {"$ref": "#/schema/draft-07/tree"},
										"accordion": {"$ref": "#/schema/draft-07/accordion"},
										"grid": {"$ref": "#/schema/draft-07/grid"}
									}
								}
							},
							"required": ["id"]
						}
					},
					"required": ["header", "section"]
				}
			},
			"required": ["tabs"]
		};
	}

	simpleformcontrolsDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/simpleformcontrols",
			"type": "array",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
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
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"classList": {"type": "array"},
				"type": {"type": "string"},
				"inline" : {"type": "boolean"},
				"padding": {"type": "boolean"},
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
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
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
			"required": ["id", "items"]
		};
	}

	menuDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/menu",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"mirrored": {"type": "boolean"},
				"dropMenuPosition": {"type": "string"},
				"orientation": {"type": "string"},
				"position": {"type": "string"},
				"priority": {"type": "number"},
				"ignore": {"type": "boolean"},
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

	toolbarDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/toolbar",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"mirrored": {"type": "boolean"},
				"dropMenuPosition": {"type": "string"},
				"orientation": {"type": "string"},
				"position": {"type": "string"},
				"priority": {"type": "number"},
				"ignore": {"type": "boolean"},
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

	splitbarDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/splitbar",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"orientation": {"type": "string"},
				"position": {"type": "string"},
				"priority": {"type": "number"},
				"border": {"type": "number"},
				"ignore": {"type": "boolean"},
				"resize": {"type": "boolean"},
				"content": {"type": "string"},
			},
			"required": ["id", "content"]
		};
	}

	// Item can be a power-button, power-action or power-item
	itemDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/item",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
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
			// "required": []
		};
	}

	treeNodeDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/treenode",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"classList": {"type": "array"},
				"id": {"type": "string"},
				"name": {"type": "string"},
				"fullName": {"type": "string"},
				"extension": {"type": "string"},
				"path": {"type": "string"},
				"kind": {"type": "string"},
				"events": {
					"type": "array",
					"properties": {
						"event": {"type": "string"},
						"fn": {"type": "string"},
					},
					"required": ["event", "fn"]
				},
				"nodes": {"$ref": "tree"}
			},
			"required": ["name", "fullName", "path", "kind"]
		};
	}

	treeDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/tree",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"id": {"type": "string"},
				"classList": {"type": "array"},
				"events": {
					"type": "array",
					"properties": {
						"event": {"type": "string"},
						"fn": {"type": "string"},
					},
					"required": ["event", "fn"]
				},
				"nodes": {"$ref": "treenode"}
			},
			"required": ["nodes"]
		};
	}

	dropmenubuttonDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/dropmenubutton",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
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
			"$id": "#/schema/draft-07/status",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"active": {"type": "string"},
				"inactive": {"type": "string"},
				"position": {"type": "string"},
				"classList": {"type": "array"}
			},
			"required": ["active", "inactive"]
		};
	}

	iconDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/icon",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"icon": {"type": "string"},
				"kind": {"type": "string"},
				"src": {"type": "string"},
				"classList": {"type": "array"}
			},
		};
	}

	htmlDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/html",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"classList": {"type": "array"},
				"id": {"type": "string"},
				"tagName": {"type": "string"},
				"multiple": {"type": "boolean"},
				"src": {"type": "string"},
				"width": {"type": "string"},
				"height": {"type": "string"},
				"type": {"type": "string"},
				"bind": {"type": "string"},
				"title": {"type": "string"},
				"for": {"type": "string"},
				"attrs": {"type": "array"},
				"cols": {"type": "string"},
				"rows": {"type": "string"},
				"value": {"type": "any"},
				"name": {"type": "string"},
				"required": {"type": "boolean"},
				"disabled": {"type": "boolean"},
				"pattern": {"type": "string"},
				"events": {
					"type": "array",
					"properties": {
						"event": {"type": "string"},
						"fn": {"type": "string"},
					},
					"required": ["event", "fn"]
				},
				"children": {
					"type": "array",
					"properties": {
						"$id": {"type": "string"},
						"$ref": {"type": "string"},
						"classList": {"type": "array"},
						"id": {"type": "string"},
						"tagName": {"type": "string"},
						"multiple": {"type": "boolean"},
						"src": {"type": "string"},
						"width": {"type": "string"},
						"height": {"type": "string"},
						"type": {"type": "string"},
						"bind": {"type": "string"},
						"title": {"type": "string"},
						"for": {"type": "string"},
						"attrs": {"type": "array"},
						"cols": {"type": "string"},
						"rows": {"type": "string"},
						"value": {"type": "any"},
						"name": {"type": "string"},
						"required": {"type": "boolean"},
						"disabled": {"type": "boolean"},
						"pattern": {"type": "string"},
						"events": {
							"type": "array",
							"properties": {
								"event": {"type": "string"},
								"fn": {"type": "string"},
							},
							"required": ["event", "fn"]
						},
						"html": {"$ref": "#/schema/draft-07/html"},
						"button": {"$ref": "#/schema/draft-07/item"},
						"item": {"$ref": "#/schema/draft-07/item"},
						"status": {"$ref": "#/schema/draft-07/status"},
						"icon": {"$ref": "#/schema/draft-07/icon"},
						"menu": {"$ref": "#/schema/draft-07/menu"},
						"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"},
						"dropmenubutton": {"$ref": "#/schema/draft-07/dropmenubutton"},
						"simpleform": {"$ref": "#/schema/draft-07/simpleform"},
						"tree": {"$ref": "#/schema/draft-07/tree"},
						"accordion": {"$ref": "#/schema/draft-07/accordion"},
						"grid": {"$ref": "#/schema/draft-07/grid"}
					}
				}
			},
			// "required": ["tagName"]
		};
	}

	gridDef() {
		return {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"$id": "#/schema/draft-07/grid",
			"type": "object",
			"properties": {
				"$id": {"type": "string"},
				"$ref": {"type": "string"},
				"classList": {"type": "array"},
				"id": {"type": "string"},
				"kind": {"type": "string"},
				"border": {"type": "boolean"},
				"gap": {"type": "number"},
				"sizes": {"type": "array"},
				"fields": {
					"type": "array",
					"properties": {
						"classList": {"type": "array"},
						"text": {"type": "string"},
						"size": {"type": "string"},
						"events": {
							"type": "array",
							"properties": {
								"event": {"type": "string"},
								"fn": {"type": "string"},
							},
							"required": ["event", "fn"]
						},
						"children": {
							"type": "array",
							"properties": {
								"html": {"$ref": "#/schema/draft-07/html"},
								"button": {"$ref": "#/schema/draft-07/item"},
								"item": {"$ref": "#/schema/draft-07/item"},
								"status": {"$ref": "#/schema/draft-07/status"},
								"icon": {"$ref": "#/schema/draft-07/icon"},
								"menu": {"$ref": "#/schema/draft-07/menu"},
								"dropmenu": {"$ref": "#/schema/draft-07/dropmenu"},
								"dropmenubutton": {"$ref": "#/schema/draft-07/dropmenubutton"},
								"simpleform": {"$ref": "#/schema/draft-07/simpleform"},
								"tree": {"$ref": "#/schema/draft-07/tree"},
								"accordion": {"$ref": "#/schema/draft-07/accordion"},
								"grid": {"$ref": "#/schema/draft-07/grid"}
							}
						}
					}
				},
				"events": {
					"type": "array",
					"properties": {
						"event": {"type": "string"},
						"fn": {"type": "string"},
					},
					"required": ["event", "fn"]
				}
			},
			"required": ["fields"]
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
