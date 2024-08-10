import Inspire from "../../inspire.mjs";

export const hasCSS = false;

if (!window.Mavo) {
	document.head.insertAdjacentHTML("beforeend", `
		<link rel=stylesheet href="https://get.mavo.io/mavo.css" />
		<script src="https://get.mavo.io/mavo.js"></script>
	`);
	// Nothing more needs to be done, Mavo will automatically run after any imports
}
else if (Inspire.imports.length) {
	// Mavo already loaded, and there are imports
	if (Mavo.inited) {
		Mavo.init();
	}
	else {
		Mavo.dependencies.push(Inspire.importsLoaded);
	}
}

