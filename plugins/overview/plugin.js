{

let exitOverview = () => document.body.classList.remove("show-thumbnails", "headers-only");

Inspire.hooks.add({
	"keyup": function(env) {
		// Ctrl+H / Shift + H : Show section overview
		// Ctrl + Shift + H: Show overview of all slides
		// Esc: Escape

		if (!(env.evt.key === "Escape" || env.letter === "H")) {
			// Escape overview
			return;
		}

		var evt = env.evt;
		var headersOnly = !(evt.shiftKey && evt.ctrlKey);

		if (document.body.matches(".show-thumbnails")) {
			if (env.evt.key === "Escape" || headersOnly === isHeadersOnly) {
				// Escape overview
				exitOverview();
			}
			else {
				document.body.classList.toggle("headers-only", headersOnly);
			}
		}
		else if (env.letter === "H" && evt.ctrlKey) {
			if (headersOnly) {
				document.body.classList.add("headers-only");
			}

			document.body.addEventListener("click", evt => {
				// Go to slide
				var slide = evt.target.closest(".slide");

				if (slide) {
					Inspire.goto(slide.id);
				}

				exitOverview();
			}, {once: true});

			document.body.classList.add("show-thumbnails");
		}
	}
});

}
