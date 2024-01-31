import registry from "./plugin-autoload.js";
import * as util from "./util.js"

export {registry};

export let loaded = {};

export const TIMEOUT = 4000;

export function load (id, def = {}) {
	if (loaded[id]) {
		return loaded[id];
	}

	let path = def.path || "../plugins";
	let pluginURL = new URL(`${path}/${id}/plugin.js`, import.meta.url);
	let noCSS = document.querySelector(`.no-css-${id}, .no-${id}-css, .${id}-no-css`);

	let plugin = loaded[id] = {};
	plugin.loaded = util.defer();
	plugin.loading = pluginURL;
	plugin.loadedJS = import(pluginURL).then(module => plugin.module = module);
	plugin.loadedCSS = plugin.loadedJS.then(module => {
		if (!noCSS && module.hasCSS) {
			let pluginCSS = new URL(`${path}/${id}/plugin.css`, import.meta.url);
			plugin.loading = pluginCSS;
			document.head.insertAdjacentHTML("beforeend", `<link rel="stylesheet" href="${pluginCSS}">`);
			let link = document.head.lastElementChild;
			return new Promise((res, rej) => {
				link.onload = res;
				link.onerror = rej;
			});
		}
	});
	plugin.loaded = Promise.race([
		plugin.loadedCSS,
		// util.timeout(TIMEOUT, {
		// 	reject: true,
		// 	value: `Timed out while loading ${plugin.loading} (timeout: ${TIMEOUT} ms)`
		// })
	]);
	plugin.done = plugin.loaded.finally(_ => {
		plugin.loading = "";
	});

	return loaded[id];
}

export function loadAll (plugins = registry) {
	let ret = [];

	for (let id in plugins) {
		let def = plugins[id];
		let test = def.test || def;

		if ((document.querySelector(test) || document.body.matches(`[data-load-plugins~="${id}"]`)) && !document.body.matches(`.no-${id}`)) {
			let plugin = load(id, def);
			// plugin.loaded.then(_ => ret.push(plugin));
			plugin.loaded.then(
				plugin => ret.push(plugin),

			).catch(e => console.error(`Plugin ${id} error:`, e))
			;
		}
	}

	return ret;
}

export function register (plugins) {
	for (let id in plugins) {
		registry[id] = plugins[id];
	}

	loadAll(plugins);
}