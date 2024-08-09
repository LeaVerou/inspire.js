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
	plugin.loading = pluginURL;
	plugin.loadedJS = import(pluginURL).then(module => plugin.module = module);
	plugin.loaded = plugin.loadedJS.then(module => {
		if (!noCSS && module.hasCSS) {
			let pluginCSS = new URL(`${path}/${id}/plugin.css`, import.meta.url);
			plugin.loading = pluginCSS;
			let link = util.create.in(document.head, `<link rel="stylesheet" href="${pluginCSS}">`);
			return new Promise((res, rej) => {
				link.onload = e => res(module);
				link.onerror = rej;
			});
		}

		return module;
	});
	// Resolves to the JS module, but only after CSS has also loaded
	plugin.loaded = util.defer(plugin.loaded);
	plugin.module = plugin.loaded;
	plugin.done = plugin.loaded.finally(_ => {
		plugin.loading = "";
	});

	return plugin;
}

export function loadAll (plugins = registry) {
	let ret = [];

	for (let id in plugins) {
		let def = plugins[id];
		let test = def.test || def;

		let doLoad = document.querySelector(test) || document.body.matches(`[data-load-plugins~="${id}"]`);
		let dontLoad = document.body.matches(`.no-${id}, .no-plugins`);

		if (doLoad && !dontLoad) {
			let plugin = load(id, def);
			// plugin.loaded.then(_ => ret.push(plugin));
			plugin.loaded.catch(e => console.error(`Plugin ${id} error:`, e));
			setTimeout(_ => plugin.loaded.reject("Timed out"), TIMEOUT);
			ret.push(plugin.loaded);
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