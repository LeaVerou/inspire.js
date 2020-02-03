Inspire.hooks.add({
	"init-end": me => {
		if (window.name === "projector" && window.opener && opener.Inspire) {
			document.body.classList.add("projector");
			Inspire.presenter = opener.Inspire;
			Inspire.presenter.projector = this;
		}
	},
	"keyup": env => {
		// Ctrl+P : Presenter view
		if (env.letter === "P") {
			// Open new window for attendee view
			Inspire.projector = open(location, "projector");

			// Get the focus back
			window.focus();

			// Switch this one to presenter view
			document.body.classList.add("presenter", "show-next");

			// Are there <details class="notes"> elements? Open them all
		}
	},
	"slidechange": env => {
		if (Inspire.projector) {
			var pInspire = Inspire.projector.Inspire;
			pInspire.goto(env.which);

			$$("details.notes", Inspire.currentSlide).forEach(d => d.open = true);
		}
	},
	"gotoitem-end": env => {
		if (Inspire.projector) {
			Inspire.projector.Inspire.gotoItem(env.which);
		}
	}
});
