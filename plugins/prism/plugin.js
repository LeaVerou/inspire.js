/*
 * Autoload Prism and Prism plugins as needed
 */

Inspire.plugins.prism.loaded = (async () => {

const PRISM_ROOT = Inspire.getAttribute("data-prism-root") || "https://prismjs.com";
var message = "Loaded ";

// Which languages are used?
var ids = $$("[class*='lang-'], [class*='language-']").map(e => {
	return e.className.match(/(?:^|\s)lang(?:uage)?-(\w+)(?=$|\s)/)[1];
});

// Drop duplicates
ids = new Set(ids);

if (window.Prism) {
	// Drop languages already loaded
	for (let id of ids) {
		if (Prism.languages[id]) {
			ids.delete(id);
		}
	}
}
else {
	await $.include(`${PRISM_ROOT}/components/prism-core.js`);
	message += "Prism Core";
}

ids = [...ids];

// Load languages
await Promise.all(ids.map(id => $.include(`${PRISM_ROOT}/components/prism-${id}.js`)));

// Load plugins
let plugins = Inspire.getAttribute("data-prism-plugins");
plugins = plugins? plugins.split(/\s*,\s*/) : [];

if (plugins.length) {
	// Drop plugins already loaded
	plugins = plugins.filter(id => {
		var CamelCase = id.replace(/(?:^|\-)(\w)/g, ($0, $1) => $1.toUpperCase());
		return !Prism.plugins[CamelCase];
	});

	await plugins.map(id => $.include(`${PRISM_ROOT}/plugins/${id}/prism-${id}.js`));
}

console.log(`${message}, Prism languages: ${ids.join(", ")}, Prism plugins: ${plugins.join(", ")}`);

Prism.highlightAllUnder(inspire.currentSlide); // slidechange has probably already fired for current slide

document.addEventListener("slidechange", evt => {
	Prism.highlightAllUnder(evt.target);
});

})();
