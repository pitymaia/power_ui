class PowerTemplate extends PowerScope {
	constructor({$powerUi, viewId, routeId, $ctrl}) {
		super({$powerUi: $powerUi});
		this._viewId = viewId;
		this._routeId = routeId;
		this.$ctrl = $ctrl;
		this.$routeClassList = {};

		if (this.css) {
			const self = this;
			const css = new Promise(this.css.bind(this));
			css.then(function (response) {
				self.appendCss(response);
			}).catch(function (response) {
				window.console.log('Error loading css', response);
			});
		}

		return {template: this._template(), component: this};
	}

	_template() {
		return new Promise(this.template.bind(this));
	}

	_replaceHtmlForEdit(response, fileName, self, jsonSelector=false) {
		if (!this.$powerUi.devMode.isEditable || !this.$powerUi.devMode.child) {
			return response;
		}
		const result = self.$ctrl._$createEditableHtml(response, fileName, self._routeId, jsonSelector);
		return (result && result.body) ? result.body.innerHTML : response;
	}

	_import(filePath, selector) {
		const self = this;
		return new Promise(function (resolve, reject) {
			self.$powerUi.request({
					url: filePath,
					body: {},
					method: 'GET',
					status: 'Loading file',
			}).then(function (response) {
				if (self.$powerUi.devMode && self.$powerUi.devMode.child && self.$powerUi.devMode.isEditable) {
					let fileExt = false;
					let content = '';
					let template = '';
					const parts = filePath.split('/');
					const fileName = parts[parts.length - 1];

					if (filePath.slice(-4) === '.css') {
						fileExt = '.css';
						content = response;
					} else if (filePath.slice(-5) === '.json') {
						fileExt = '.json';
						if (selector) {
							content = self.$service('JSONSchema')[selector](response);
							template = self._replaceHtmlForEdit(content, fileName, self, selector);
						} else {
							content = response;
						}
					} else if (filePath.slice(-4) === '.htm') {
						fileExt = '.htm';
						content = self._replaceHtmlForEdit(response, fileName, self);
					} else if (filePath.slice(-5) === '.html') {
						fileExt = '.html';
						content = self._replaceHtmlForEdit(response, fileName, self);
					}

					self.$ctrl._$postToMain({
						command: 'loadFile',
						extension: fileExt || null,
						path: filePath,
						content: content,
						template: template,
						viewId: self._viewId,
						routeId: self._routeId,
						fileName: fileName,
					});

					resolve(template || content);
				} else {
					resolve(response);
				}
			}).catch(function (error) {
				window.console.log('Error importing file:', error);
				reject(error);
			});
		});
	}

	import(filePaths, concat) {
		if (typeof filePaths === 'string' || filePaths instanceof String) {
			return this._import(filePaths);
		} else if (filePaths.length) {
			const promises = [];
			for (const path of filePaths) {
				promises.push(this._import(path));
			}

			if (!concat) {
				return Promise.all(promises);
			} else {
				return new Promise(function (resolve, reject) {
					Promise.all(promises).then(function (response) {
						try {
							let result = '';
							for (const file of response) {
								if (concat === true) {
									result = result + file;
								} else {
									result = result + concat + file;
								}
							}
							resolve(result);
						} catch(error) {
							window.console.log('Error importing files:', error);
							reject(error);
						}
					});
				});
			}
		} else {
			throw "Error: import expects a string or array";
		}
	}

	async importJson(filePath, selector) {
		if (!filePath || !selector) {
			throw 'ERROR: MISSING! importJson needs a file path and a JSONSchema selector! ';
		}
		const content = await this._import(filePath, selector);
		return content;
	}

	request(options) {
		return this.$powerUi.request(options);
	}

	appendCss(css) {
		// Concatenate if is an array
		if (css.length) {
			let _new = '';
			for (const _css of css) {
				_new = _new + _css;
			}
			css = _new;
		}
		const head = document.getElementsByTagName('head')[0];
		let style = document.createElement('style');
		style.innerHTML = css;
		style.id = '_css' + this._viewId;
		head.appendChild(style);
	}
}

export { PowerTemplate };
