// For compatibility. File that can be imported without type="module" and creates a global
console.warn('Inspire.js has switched to ESM. Please use type="module" in your <script> element and import the .mjs file of the same name.');

window.inspireLoaded = import("./inspire.mjs").then(module => window.Inspire = module.default);

// Prevent await Inspire.importsLoaded from breaking things
window.Inspire = {
	importsLoaded: inspireLoaded.then(_ => Inspire.importsLoaded),
	nextItem: (...args) => inspireLoaded.then(_ => Inspire.nextItem(...args))
};