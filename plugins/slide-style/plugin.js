Inspire.hooks.add("slidechange", env => {
	$$(".slide:not(:target) style[data-slide]").forEach(style => style.disabled = true);
	$$("style[data-slide]", env.slide).forEach(style => style.disabled = false);
});
