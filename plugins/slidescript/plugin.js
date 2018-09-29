Inspire.hooks.add("slidechange", env => {
	// Slide-specific script, run only when on that slide
	$$("slide-script", env.slide).forEach(script => {
		$.create("script", {
			attributes: {
				src: script.getAttribute("src"),
				async: script.getAttribute("async")
			},
			after: script
		});

		script.remove();
	});
});
