import Inspire from "../../../inspire.mjs";

export const hasCSS = true;

Inspire.hooks.add({
	"slidechange": function(env) {
		var slide = env.slide;

		if (slide.matches(".slide[data-src]:empty")) {
			// Uninitialized iframe slide
			var iframe = $.create("iframe", {
				"data-src": slide.getAttribute("data-src"),
				inside: slide,
				loading: "lazy"
			});

			slide.removeAttribute("data-src");

			var src = iframe.src || iframe.getAttribute("data-src");

			slide.classList.add("iframe", "dont-resize");

			if (!slide.classList.contains("no-title")) {
				// Add visible title
				var title = iframe.title || slide.title || slide.getAttribute("data-title");

				if (!title) {
					// No title provided, prettify URL
					var url = new URL(src, location);
					url.hostname = url.hostname.replace(/^www\./, "");
					title = url.hostname + url.pathname.replace(/\/$/, "");
				}

				$.create("h1", {
					contents: {
						tag: "a",
						href: src,
						target: "_blank",
						textContent: title
					},
					inside: slide
				});
			}

			slide.classList.add("onscreen-nav");
		}

		for (let iframe of $$("iframe[data-src]", slide)) {
			if (!iframe.hasAttribute("src")) {
				iframe.setAttribute("src", iframe.dataset.src);
			}
		}
	}
});
