class WidgetService {
	constructor({$powerUi, $ctrl}) {
		this.$powerUi = $powerUi;
		console.log('instanciate WidgetService', $ctrl);
	}
	open(options) {
		console.log('open', options, this.$powerUi);

		this.$powerUi.router.openRoute({
			routeId: 'simple-dialog',
			target: '_blank',
		});

		// openRoute({routeId, params, target})
	}
}
