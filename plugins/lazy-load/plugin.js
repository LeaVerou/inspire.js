Inspire.hooks.add("slidechange", env => {
	$$("[data-src]", env.slide).forEach(element => {
		element.src = element.dataset.src;
	});
});
