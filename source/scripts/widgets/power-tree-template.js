class PowerTreeTemplate {
	constructor({$powerUi, tree, boilerplate}) {
		this.boilerplate = boilerplate || false;
		this.$powerUi = $powerUi;
		this.tree = tree;
		this.template = this.buildTemplate(this.tree);
	}

	buildTemplate(tree, id) {
		let template = `<nav ${id ? 'id="' + id + '"' : ''} class="power-tree-view">`;
		for (const item of tree) {
			if (item.kind === 'file') {
				if (this.boilerplate) {
					template = `${template}
					<a class="power-item" data-pow-event onclick="_commit({path:'${item.path}'})"><span class="power-icon fa fa-file"></span> ${item.fullName}</a>`;
				} else {
					template = `${template}
					<a class="power-item"><span class="power-icon fa fa-file"></span> ${item.fullName}</a>`;
				}
			} else if (item.kind === 'folder') {
				const id = `list-${this.$powerUi._Unique.next()}`;
				template = `${template}
				<a class="power-list" data-power-target="${id}">
					<span class="power-status fa" data-power-active="fa-folder-open" data-power-inactive="fa-folder"></span> ${item.fullName}
				</a>
				${this.buildTemplate(item.content, id)}`;
			}
		}
		template = `${template}
		</nav>`;

		return template;
	}
}

// export { PowerTreeTemplate };
