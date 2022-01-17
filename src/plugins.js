import registry from "./plugin-autoload.js";
import * as util from "./util.js"

export {registry};

export let loaded = {};

export function load (id, def = {}) {
	if (!loaded[id]) {
		let path = def.path || "plugins";
		let pluginURL = new URL(`${path}/${id}/plugin.js`, import.meta.url);
		let loadCSS = !$(`.no-css-${id}, .no-${id}-css, .${id}-no-css`);
		let plugin = loaded[id] = {};

		plugin.loaded = import(pluginURL).then(module => {
			plugin.module = module;

			if (loadCSS && module.hasCSS) {
				return $.load("plugin.css", pluginURL);
			}
		}).catch(console.log);
	}

	return loaded[id].loaded;
}

export function loadAll () {
	let ret = [];

	for (let id in registry) {
		let def = registry[id];
		let test = def.test || def;

		if (($(test) || document.body.matches(`[data-load-plugins~="${id}"]`)) && !document.body.matches(`.no-${id}`)) {
			ret.push(load(id, def));
		}
	}

	return ret;
}