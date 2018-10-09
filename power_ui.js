// Layout, design and user interface framework in ES6

'use strict';

const power = {
    ui: {
        menuItemsById: {},
        menus: [],
        menuById: function (id) {
            return power.ui.menus.find(menu => menu.id === id);
        },
        menuItemById: function (id) {
            for (const menu of power.ui.menus) {
                if (menu.itemsById[id]) {
                    return menu.itemsById[id];
                }
            }
        },
        menuElById: function (id) {
            return power.ui.menus.find(menu => menu.id === id).element;
        },
        menuElItemById: function (id) {
            for (const menu of power.ui.menus) {
                if (menu.itemsById[id]) {
                    return menu.itemsById[id].element;
                }
            }
        },
    },
    truth: {},
};

const menus = document.getElementsByClassName('power-menu');

for (const menu of menus) {
    const menuItems = menu.getElementsByClassName('power-menu-item');
    const menuId = menu.getAttribute('id');
    let menuToAdd = {element: menu, id: menuId, items: {elements: menuItems}, itemsById: {}};

    for (const menuItem of menuItems) {
        const menuItemId = menuItem.getAttribute('id');
        if (menuItemId) {
            menuToAdd.itemsById[menuItemId] = {id: menuItemId, element: menuItem};
        }
    }
    power.ui.menus.push(menuToAdd);
}

power.ui.menuElItemById('news').addEventListener('click', function() {
    window.console.log('Click news', power.ui.menus);
});
power.ui.menuElItemById('news').addEventListener('mouseover', function() {
    window.console.log('Hover news');
});
power.ui.menuElItemById('esporte').addEventListener('click', function() {
    window.console.log('Click esporte');
});
