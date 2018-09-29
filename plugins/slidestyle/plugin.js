Inspire.hooks.add("slidechange", slide => {
	$$(".slide:not(:target) style[data-slide]").forEach(style => style.disabled = true);
	$$("style[data-slide]", slide).forEach(style => style.disabled = false);
});
