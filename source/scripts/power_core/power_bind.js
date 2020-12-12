class PowerTextBind {
    constructor(_name, items) {
        this._name = _name;
        this._$allKeys = [];
        for (const item of items) {
            this.addProperty(item.key, item.value);
        }
    }

    addProperty(key, value='') {
        const self = this;
        this._$allKeys.push(key);
        this[`_${key}`] = value;
        Object.defineProperties(this, {
            [key]: {
                 "get": function() {
                    self.get(key);
                 },
                 "set": function(value) {
                    self.set(key, value);
                 }
            }
        });
    }

    clearProperties() {
        for (const key of this._$allKeys) {
            this[key] = '';
        }
    }

    set(key, value) {
        this[`_${key}`] = value;
        this.setNodes(key, value);
    }

    get(key) {
        return this[`_${key}`];
    }

    setNodes(key, value) {
        const list = document.querySelectorAll(`[data-pow-text-bind='${this._name}.${key}']`);
        if (list.length) {
            for (const node of list) {
                node.innerText = value;
            }
        }
    }
}

class PowerStyleBind {
    constructor(_name, items) {
        this._name = _name;
        this._$allKeys = [];
        for (const item of items) {
            this.addProperty(item.key, item.value);
        }
    }

    addProperty(key, values=[{property: 'display', value: 'none'}]) {
        const self = this;
        this._$allKeys.push(key);
        this[`_${key}`] = values;
        Object.defineProperties(this, {
            [key]: {
                 "get": function() {
                    self.get(key);
                 },
                 "set": function(_values) {
                    self.set(key, _values);
                 }
            }
        });
    }

    clearProperties() {
        for (const key of this._$allKeys) {
            this[key] = [{property: 'display', value: 'none'}];
        }
    }

    set(key, values) {
        let _values = [];
        if (!Array.isArray(values) && values.property !== undefined && (values.value !== undefined || values.remove)) {
            _values.push(values);
        } else if (Array.isArray(values) && values[0] && values[0].property !== undefined && (values[0].value !== undefined || values[0].remove)) {
            _values = values;
        } else {
            throw `PowerStyleBind error: Values should contain a dict or array with pairs of "property" and "value" ${values}`;
        }
        this[`_${key}`] = _values;
        this.setNodes(key, _values);
    }

    get(key) {
        return this[`_${key}`];
    }

    setNodes(key, values) {
        const list = document.querySelectorAll(`[data-pow-style-bind='${this._name}.${key}']`);
        if (list.length) {
            for (const node of list) {
                const applyProperties = node.dataset.styleProperties;
                for (const item of values) {
                    if (!applyProperties || applyProperties.includes(item.property)) {
                        if (item.remove) {
                            node.style[item.property] = null;
                        } else {
                            node.style[item.property] = item.value;
                        }
                    }
                }
            }
        }
    }
}
