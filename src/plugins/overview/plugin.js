import Inspire from "../../../inspire.mjs";

export const hasCSS = true;

let exitOverview = () => {
	document.body.classList.remove("show-thumbnails", "show-all");
	document.querySelector("style#inspire-overview-filter")?.remove();
};
let enteredSelector;

Inspire.hooks.add({
	"keyup": function(env) {
		// Ctrl+H / Shift + H : Show section overview
		// Ctrl + Shift + H: Show overview of all slides
		// Alt can also be used instead of Ctrl
		// Esc: Escape

		if (!(env.evt.key === "Escape" || env.letter === "H")) {
			// Escape overview
			return;
		}

		var evt = env.evt;
		var headersOnly = !(evt.shiftKey && (evt.ctrlKey || evt.altKey));

		if (document.body.matches(".show-thumbnails") && env.evt.key === "Escape") {
			exitOverview();
		}
		else if (env.letter === "H" && (evt.ctrlKey || evt.altKey)) {
			let defaultSelector = enteredSelector || (headersOnly? ".slide:not(header):not(:target)" : "");
			let selector = prompt("Which slides to filter out? Enter a compound selector, or leave empty to show all slides.", defaultSelector);

			document.querySelector("style#inspire-overview-filter")?.remove();

			if (selector) {
				let style = document.createElement("style");
				style.id = "inspire-overview-filter";
				style.textContent = `.show-thumbnails ${selector} {
					display: none !important;
				}`;
				document.head.append(style);
			}

			document.body.addEventListener("click", evt => {
				// Go to slide
				var slide = evt.target.closest(".slide");

				if (slide) {
					Inspire.goto(slide.id);
				}

				exitOverview();
			}, {once: true});

			document.body.classList.add("show-thumbnails", "show-all");
		}
	}
});

