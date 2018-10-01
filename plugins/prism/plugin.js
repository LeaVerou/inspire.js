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

if (ids.size) {
	// Prism is used in the current slide deck!

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

	// Load metadata
	await $.include(`${PRISM_ROOT}/components.js`);
	var languages = components.languages;

	// Replace aliases with their canonical id
	for (let [id, lang] of Object.entries(languages)) {
		if (lang.alias) {
			var alias = toArray(lang.alias);

			for (let i of ids) {
				if (alias.indexOf(i) > -1) {
					ids.delete(i);
					ids.add(id);
				}
			}
		}
	}

	// Load languages recursively, respecting dependencies
	var ok = {};
	var loadLanguage = async id => {
		if (ok[id]) {
			// Language already loading
			return ok[id];
		}

		var deps = toArray(languages[id].require);
		ok[id] = promise();

		await Promise.all(deps.map(i => {
			return loadLanguage(i);
		}));

		await $.include(`${PRISM_ROOT}/components/prism-${id}.js`);
		ok[id].resolve(id);
	};

	ids = [...ids];
	await Promise.all(ids.map(loadLanguage));
}

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
