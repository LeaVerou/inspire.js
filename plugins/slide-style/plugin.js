Inspire.hooks.add("slidechange", env => {
	Bliss.$(".slide:not(:target) style[data-slide]").forEach(style => style.disabled = true);
	Bliss.$("style[data-slide]", env.slide).forEach(style => style.disabled = false);
});
