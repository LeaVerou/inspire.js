import Inspire from "../../../inspire.mjs";

export const hasCSS = false;

if (!window.Mavo) {
	await Promise.all(["js", "css"].map(ext => $.load(`https://dev.mavo.io/dist/mavo.${ext}`)));
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

