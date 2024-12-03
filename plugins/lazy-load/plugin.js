import Inspire from "../../inspire.mjs";
import { $$ } from "../../src/util.js";

export const hasCSS = false;

Inspire.hooks.add("slidechange", env => {
	$$("[data-src]", env.slide).forEach(element => {
		element.src = element.dataset.src;
	});
});
