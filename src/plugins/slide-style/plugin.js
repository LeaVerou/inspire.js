import Inspire from "../../../inspire.mjs";

Inspire.hooks.add("slidechange", env => {
	$$(".slide:not(:target) style[data-slide]").forEach(style => style.disabled = true);
	$$("style[data-slide]", env.slide).forEach(style => {
		if (style.media === "not all") {
			// This is used to prevent the style applying before the plugin is loaded
			style.removeAttribute("media");
		}

		style.disabled = false;
	});
});
