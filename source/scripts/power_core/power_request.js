class Request {
	constructor({config, $powerUi}) {
		this.$powerUi = $powerUi;
		if (config.authCookie) {
			this.$powerUi.authCookie = config.authCookie;
		}
		if (config.authToken) {
			this.$powerUi.authToken = config.authToken;
		}
		if (config.headers) {
			this.$powerUi.headers = config.headers;
		}
		const self = this;
		return function (d) {
			d.withCredentials = d.withCredentials === undefined ? true : d.withCredentials;
			d.headers = d.headers || self.$powerUi.headers || {};
			if (self.$powerUi.authCookie) {
				d.headers.Authorization = `Bearer ${self.$powerUi.getCookie(self.$powerUi.authCookie)}` || null;
			}
			const promise = {
				then: function (onsucess) {
					this.onsucess = onsucess;
					return this;
				}, catch: function (onerror) {
					this.onerror = onerror;
					return this;
				}
			};
			self.ajaxRequest({
				method: d.method,
				url: d.url,
				data: d,
				onsucess: function (xhr) {
					if (promise.onsucess) {
						try {
							const response = JSON.parse(xhr.response);
							try {
								if (response.action && self.$powerUi.config.serverCommands && self.$powerUi.config.serverCommands[response.action]) {
									self.$powerUi.config.serverCommands[response.action].run({response: response, $powerUi: self.$powerUi, $root: self.$powerUi.getRouteCtrl('$root')});
								}
							} catch (error) {
								return promise.onerror(error, response, xhr);
							}
							return promise.onsucess(response, xhr);
						} catch (error) {
							return promise.onsucess(xhr.response, xhr);
						}
					}
					return promise;
				},
				onerror: function (xhr) {
					if (promise.onerror) {
						try {
							const _response = JSON.parse(xhr.response);
							try {
								if (_response.action && self.$powerUi.config.serverCommands && self.$powerUi.config.serverCommands[_response.action]) {
									self.$powerUi.config.serverCommands[_response.action].run({response: _response, $powerUi: self.$powerUi, $root: self.$powerUi.getRouteCtrl('$root')});
								}
								if (_response && _response.fields && _response.fields.length > 0) {
									for (const field of _response.fields) {
										self.$powerUi.onFormError({id: field.id, msg: field.msg});
									}
								}
							} catch (error) {
								return promise.onerror(error, _response, xhr);
							}
							return promise.onerror(_response, xhr);
						} catch (error) {
							return promise.onerror(xhr.response, xhr);
						}
					}
				},
			});
			return promise;
		};
	}

	encodedParams(object) {
		var encodedString = '';
		for (var prop in object) {
			if (object.hasOwnProperty(prop)) {
				if (encodedString.length > 0) {
					encodedString += '&';
				}
				encodedString += encodeURI(prop + '=' + object[prop]);
			}
		}
		return encodedString;
	}

	ajaxRequest({method, url, onsucess, onerror, async, data}) {
		if (async === undefined || async === null) {
			async = true;
		}
		const xhr = new XMLHttpRequest();
		xhr.open(method, url, async);
		xhr.onload = function() {
			if (xhr.status === 200 && onsucess) {
				onsucess(xhr);
			} else if (xhr.status !== 200 && onerror) {
				onerror(xhr);
			} else {
				window.console('Request failed.  Returned status of ' + xhr.status);
			}
		};
		xhr.withCredentials = data.withCredentials;
		xhr.setRequestHeader('Content-Type', 'application/json');
		// if (method && method.toUpperCase() === 'POST')
		// 	xhr.setRequestHeader('Content-Type', 'application/json');
		// else {
		// 	xhr.setRequestHeader('Content-Type', 'text/html');
		// }
		if (data.headers && data.headers['Content-Type']) {
			xhr.setRequestHeader('Content-Type', data.headers['Content-Type']);
		}
		if (data.headers && data.headers.Authorization) {
			xhr.setRequestHeader('Authorization', data.headers.Authorization);
		}
		if (data && data.body) {
			xhr.send(JSON.stringify(data.body));
		} else {
			xhr.send();
		}
		return xhr;
	}
}
