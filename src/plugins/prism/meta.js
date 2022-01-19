
import * as util from "../../util.js";

export let PRISM_ROOT = util.getAttribute("data-prism-root");

if (!PRISM_ROOT) {
	// Find a good default
	try {
		await fetch("https://prismjs.com", { method: 'HEAD' });
		PRISM_ROOT = "https://prismjs.com";
	}
	catch (e) {
		// Main website is down, fetch from repo
		PRISM_ROOT = "https://cdn.jsdelivr.net/gh/prismjs/prism";
	}
}

export const components = await util.importCJS(`${PRISM_ROOT}/components.js`);
let languages = components.languages;
let plugins = components.plugins;

// Make it easier to find canonical id
for (let [id, lang] of Object.entries(components.languages)) {
	lang.id = id;

	if (lang.alias) {
		lang.alias = util.toArray(lang.alias);

		lang.alias.forEach(a => languages[a] = lang);
	}
}

export async function loadPlugin(id) {
	let CamelCase = id.replace(/(?:^|\-)(\w)/g, ($0, $1) => $1.toUpperCase());

	if (!Prism.plugins[CamelCase]) {
		// Not already loaded
		if (!plugins[id]) {
			// Unknown plugin
			return;
		}

		if (!plugins[id].noCSS) {
			$.include(`${PRISM_ROOT}/plugins/${id}/prism-${id}.css`);
		}

		await $.include(`${PRISM_ROOT}/plugins/${id}/prism-${id}.js`)
	}

	return Prism.plugins[CamelCase];
}

export {languages, plugins};