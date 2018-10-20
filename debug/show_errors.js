'use strict';

function debug(string) {
	const path = window.location.href;
	let found = false;

	if (path.includes('/vconsole') || path.includes('/all')) {
		found = true;
		console.re.log(string);
	}
	if (path.includes('/alert') || path.includes('/all')) {
		found = true;
		alert(string);
	}
	if (path.includes('/console') || path.includes('/all') || found === false) {
		console.log(string);
	}
}
