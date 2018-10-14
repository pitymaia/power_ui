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

// Create all the menu items
function powerMenuItems(menu) {
    let items = [];

    const itemsElements = menu.getElementsByClassName('power-menu-item');

    for (const menuItem of itemsElements) {
        let itemToAdd = {element: menuItem, children: []};
        // Check for elements like <span> or <a> inside menu to hold label and icon
        if (menuItem.children.length) {
            let childIndex = 0;
            for (const child of menuItem.children) {
                let childToAdd = {element: child, tagName: child.tagName};
                // Check for label inside child element
                // <li><span class="icon"></span><a>Some Label</a></li>
                if (child.innerText) {
                    childToAdd.label = child.innerText;
                    itemToAdd.labelChildIndex = childIndex;
                } else {
                    // If don't find label may have it outside element side-by-side with some icon
                    // <li><span class="icon"></span>Some Label</li>
                    if (menuItem.innerText) {
                        itemToAdd.label = menuItem.innerText;
                    } else {
                        childToAdd.label = null;
                    }
                }
                itemToAdd.children.push(childToAdd);
                childIndex++;
            }
        } else if (menuItem.innerText) {
            // Maybe the label is direct on <li>
            // <li>Some Label</li>
            itemToAdd.label = menuItem.innerText;
        }

        if (!itemToAdd.label) {
            itemToAdd.label = null;
        }
        itemToAdd.id = menuItem.getAttribute('id') || null;
        items.push(itemToAdd);
    }
    return items;
}

class PowerMenus {
    constructor() {
        this.menus = [];

        const menus = document.getElementsByClassName('power-menu');
        for (const menu of menus) {
            const menuId = menu.getAttribute('id');
            let menuToAdd = {element: menu, id: menuId, items: powerMenuItems(menu)};
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
