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
        for (const o of this.observers)  o.fn.apply(o.ctx, arguments);
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

class PowerMenus {
    constructor() {
        this.menus = [];

        const menus = document.getElementsByClassName('power-menu');
        for (const menu of menus) {
            const menuItems = menu.getElementsByClassName('power-menu-item');
            const menuId = menu.getAttribute('id');
            let menuToAdd = {element: menu, id: menuId, items: []};

            // Add all menuItems
            for (const menuItem of menuItems) {
                const menuItemId = menuItem.getAttribute('id') || null;
                menuToAdd.items.push({element: menuItem, id: menuItemId});
            }
            this.menus.push(menuToAdd);
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

window.console.log('power', app);

app.menus.menuItemElById('news').addEventListener('click', function() {
    window.console.log('Click news', app.menus);
});
app.menus.menuItemElById('news').addEventListener('mouseover', function() {
    window.console.log('Hover news');
});
app.menus.menuItemElById('esporte').addEventListener('click', function() {
    window.console.log('Click esporte', app);
});
