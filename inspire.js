// For compatibility. File that can be imported without type="module" and creates a global
console.warn('Inspire.js has switched to ESM. Please use type="module" in your <script> element and import the .mjs file of the same name.');

let url = new URL("./inspire.mjs", document.currentScript ? document.currentScript.src : "https://inspire.js.org/");

window.inspireLoaded = import(url).then(module => window.Inspire = module.default);

// Prevent await Inspire.importsLoaded from breaking things
window.Inspire = {
	importsLoaded: inspireLoaded.then(_ => Inspire.importsLoaded),
	nextItem: (...args) => inspireLoaded.then(_ => Inspire.nextItem(...args))
};