/*
 * Autoload Prism and Prism plugins as needed
 */

import Inspire from "../../../inspire.mjs";
import * as util from "../../util.js";
import * as meta from "./meta.js";

let PRISM_ROOT = meta.PRISM_ROOT;

// Which languages are used?
var ids = $$("[class*='lang-'], [class*='language-']").map(e => {
	return e.className.match(/(?:^|\s)lang(?:uage)?-(\w+)(?=$|\s)/)[1];
});

// Drop duplicates
ids = new Set(ids);

// Which plugins to load?
let plugins = util.getAttribute("data-prism-plugins");
plugins = plugins? plugins.split(/\s*,\s*/) : [];

if (ids.size) {
	// Prism is used in the current slide deck!

	if (window.Prism) {
		var prismAlreadyLoaded = true;
		// Drop languages already loaded
		for (let id of ids) {
			if (Prism.languages[id]) {
				ids.delete(id);
			}
		}
	}
	else {
		await $.include(`${PRISM_ROOT}/components/prism-core.js`);
	}
}

// Support prism-ignore to opt out of highlighting
Prism.hooks.add("before-all-elements-highlight", function(env) {
	env.elements = env.elements.filter(e => !e.matches(".prism-ignore, .prism-ignore *"));
});

let languages = meta.components.languages;

// Replace aliases with their canonical id
for (let [id, lang] of Object.entries(languages)) {
	if (lang.alias) {
		for (let i of ids) {
			if (lang.alias.indexOf(i) > -1) {
				ids.delete(i);
				ids.add(id);
			}
		}
	}
}

// Load languages recursively, respecting dependencies
var ok = {none: Promise.resolve()};
var loadLanguage = async id => {
	if (ok[id]) {
		// Language already loading
		return ok[id];
	}

	if (!languages[id]) {
		// Not a registered language. It could be local (custom), don’t do anything
		let index = ids.indexOf(id);

		if (index > -1) {
			ids.splice(index, 1);
		}

		return;
	}

	var deps = util.toArray(languages[id].require);
	ok[id] = util.defer();

	await Promise.all(deps.map(loadLanguage));

	await $.include(`${PRISM_ROOT}/components/prism-${id}.js`);
	ok[id].resolve(id);
};

ids = [...ids];
await Promise.all(ids.map(loadLanguage));

// Load plugins
if (plugins.length) {
	await Promise.all(plugins.map(id => meta.loadPlugin(id)));
}

var message = !prismAlreadyLoaded? ["Prism Core"] : [];
ids.length && message.push(`Prism languages: ${ids.join(", ")}`);
plugins.length && message.push(`Prism plugins: ${plugins.join(", ")}`);

if (message.length) {
	console.log(`Loaded ${message.join(", ")}`);
}

// slidechange may have already fired for current slide
if (Inspire.slide !== undefined) {
	Prism.highlightAllUnder(Inspire.currentSlide);
}

Inspire.hooks.add("slidechange", env => {
	if (env.firstTime) {
		Prism.highlightAllUnder(env.slide);
	}

});

export { meta, ids as languages, plugins };