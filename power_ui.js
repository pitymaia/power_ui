// Layout, design and user interface framework in ES6

'use strict';

class Event {
	constructor(name) {
		this.observers = [];
		if (name)  Event.index[name] = this;
	}
	subscribe(fn, ctx) { // *ctx* is what *this* will be inside *fn*.
		this.observers.push({fn, ctx});
	}
	unsubscribe(fn) {
		this.observers = this.observers.filter((x) => x !== fn);
	}
	broadcast() { // Accepts arguments.
		for (const o of this.observers) {
			o.fn.apply(o.ctx, arguments);
		}
	}
}
Event.index = {}; // storage for all named events

class PowerUi {
	constructor() {
		this.menus = new PowerMenus();
		this.ui = {};
		this.truth = {};
	}
}

// Create the menu item
class PowerMenuItem {
	constructor(item) {
		this.children = [];
		this.element = item;
		this.className = item.className || null;
		// Check for elements like <span> or <a> inside menu to hold innerText and icon
		if (item.children.length) {
			this.creatChildren(item);
			// Some element with children can have innerText side-by-side with some element like icon
			// <li><span class="icon"></span>Some innerText</li>
			if (item.innerText) {
				this._innerText = item.innerText;
			}
		} else if (item.innerText) {
			// Maybe the innerText is direct on <li>
			// <li>Some innerText</li>
			this._innerText = item.innerText;
		}

		if (!this._innerText) {
			this._innerText = null;
		}
		this.id = item.getAttribute('id') || null;
	}

	creatChildren(item) {
		console.log('children', item.children);
		this.children = [];
		let childIndex = 0;
		for (const child of item.children) {
			let childToAdd = {element: child, tagName: child.tagName, className: child.className || null};
			// Check for innerText inside child element
			// <li><span class="icon"></span><a>Some innerText</a></li>
			if (child.innerText) {
				childToAdd.innerText = child.innerText;
				this._innerTextChildIndex = childIndex;
			}
			this.children.push(childToAdd);
			childIndex++;
		}
	}

	get innerText() {
		return this._innerText;
	}
	// Alias for innerText
	get label() {
		return this._innerText;
	}

	changeInnerText(value) {
		const self = this;
		this.element.innerText = value;
		this._innerText = value;
		this.creatChildren(self.element);
	}

	set innerText(value) {
		this.changeInnerText(value);
	}
	// Alias for innerText
	set label(value) {
		this.changeInnerText(value);
	}
}

class PowerMenu {
	constructor(menu) {
		this.element = menu;
		this.id = menu.getAttribute('id');
		this.items = [];
		this.className = menu.className || null;

		const itemsElements = menu.getElementsByClassName('power-menu-item');
		for (const menuItem of itemsElements) {
			this.items.push(new PowerMenuItem(menuItem));
		}
	}
}

class PowerMenus {
	constructor() {
		this.menus = [];

		const menus = document.getElementsByClassName('power-menu');
		for (const menu of menus) {
			this.menus.push(new PowerMenu(menu));
		}
	}
	menuById(id) {
		return this.menus.find(menu => menu.id === id);
	}
	menuItemById(id) {
		for (const menu of this.menus) {
			const menuItem = menu.items.find(item => item.id === id); // jshint ignore:line
			if (menuItem) {
				return menuItem;
			}
		}
	}
	menuElById(id) {
		return this.menus.find(menu => menu.id === id).element;
	}
	menuItemElById(id) {
		for (const menu of this.menus) {
			const menuItem = menu.items.find(item => item.id === id); // jshint ignore:line
			if (menuItem) {
				return menuItem.element;
			}
		}
	}
}

let app = new PowerUi();

function changeMenu() {
	var item = app.menus.menuItemById('news');
	item.label = 'Novidades';
	window.console.log('click ' + item.label, app);
}

window.console.log('power', app);

app.menus.menuItemElById('news').addEventListener('click', function() {
	window.console.log('Click news', app);
});
app.menus.menuItemElById('news').addEventListener('mouseover', function() {
	window.console.log('Hover news');
});
app.menus.menuItemElById('esporte').addEventListener('click', function() {
	window.console.log('Click esporte', app);
});
app.menus.menuItemElById('outro').addEventListener('click', function() {
	window.console.log('Click outro', app.menus);
});
