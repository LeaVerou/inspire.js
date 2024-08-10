import Inspire from "../../inspire.mjs";
import { $$, create } from "../../src/util.js";

export const hasCSS = true;

Inspire.hooks.add({
	"slidechange": function(env) {
		var slide = env.slide;

		if (slide.matches(".slide[data-src]:empty, .slide[data-src]:has(> details.notes:only-child")) {
			// Uninitialized iframe slide

			let iframe = create.in(slide, `<iframe src="${ slide.dataset.src }" frameborder="0" allowfullscreen></iframe>`);

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

				slide.insertAdjacentHTML("beforeend", `<h1><a href="${ src }" target="_blank">${ title }</a></h1>`);
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
