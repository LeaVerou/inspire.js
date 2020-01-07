/*
 * Autoload Prism and Prism plugins as needed
 */

Inspire.pluginsLoaded.prism.ready = (async () => {

const PRISM_ROOT = Inspire.u.getAttribute("data-prism-root") || "https://prismjs.com";

// Which languages are used?
var ids = $$("[class*='lang-'], [class*='language-']").map(e => {
	return e.className.match(/(?:^|\s)lang(?:uage)?-(\w+)(?=$|\s)/)[1];
});

// Drop duplicates
ids = new Set(ids);

// Which plugins to load?
let plugins = Inspire.u.getAttribute("data-prism-plugins");
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

// Load metadata
await $.include(`${PRISM_ROOT}/components.js`);
var meta = components;

var languages = meta.languages;

// Replace aliases with their canonical id
for (let [id, lang] of Object.entries(languages)) {
	lang.id = id;

	if (lang.alias) {
		var alias = toArray(lang.alias);

		alias.forEach(a => languages[a] = lang);

		for (let i of ids) {
			if (alias.indexOf(i) > -1) {
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

	var deps = toArray(languages[id].require);
	ok[id] = promise();

	await Promise.all(deps.map(loadLanguage));

	await $.include(`${PRISM_ROOT}/components/prism-${id}.js`);
	ok[id].resolve(id);
};

ids = [...ids];
await Promise.all(ids.map(loadLanguage));

// Load plugins
if (plugins.length) {
	// Drop plugins already loaded
	plugins = plugins.filter(id => {
		var CamelCase = id.replace(/(?:^|\-)(\w)/g, ($0, $1) => $1.toUpperCase());
		return !Prism.plugins[CamelCase];
	});

	await Promise.all(plugins.map(id => {
		if (!meta.plugins[id]) {
			return;
		}

		if (!meta.plugins[id].noCSS) {
			$.include(`${PRISM_ROOT}/plugins/${id}/prism-${id}.css`);
		}

		return $.include(`${PRISM_ROOT}/plugins/${id}/prism-${id}.js`)
	}));
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

// Exports
Object.assign(Inspire.pluginsLoaded.prism, { meta, languages: ids, plugins });

// Utilities
function toArray(arr) {
	return arr === undefined? [] : Array.isArray(arr)? arr : [arr];
}

function promise(constructor) {
	var res, rej;

	var promise = new Promise((resolve, reject) => {
		if (constructor) {
			constructor(resolve, reject);
		}

		res = resolve;
		rej = reject;
	});

	promise.resolve = a => {
		res(a);
		return promise;
	};

	promise.reject = a => {
		rej(a);
		return promise;
	};

	return promise;
};

})();
