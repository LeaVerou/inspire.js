import Inspire from "../../../inspire.mjs";

export const hasCSS = true;

Inspire.hooks.add({
	"init-end": me => {
		if (window.name === "projector" && window.opener && opener.Inspire) {
			// Projector window was reloaded
			document.body.classList.add("projector");
			Inspire.presenter = opener;
			Inspire.presenter.Inspire.projector = window;
		}
	},
	"keyup": env => {
		// Ctrl+P : Open Presenter view
		if (env.letter === "P") {
			// Open new window for projector view
			Inspire.projector = open(location, "projector");

			// Get the focus back
			window.focus();

			// Switch this one to presenter view
			document.body.classList.add("presenter", "show-next");

			// Are there <details class="notes"> elements in the current slide? Open them
			$$("details.notes", Inspire.currentSlide).forEach(d => d.open = true);
		}
	},
	"slidechange": env => {
		let otherWindow = Inspire.projector || Inspire.presenter;

		if (Inspire.isActive && otherWindow) {
			// Sync slide navigation
			otherWindow.Inspire.goto(env.which);
		}

		if (Inspire.projector) {
			$$("details.notes", Inspire.currentSlide).forEach(d => d.open = true);
		}
	},
	"gotoitem-end": env => {
		let otherWindow = Inspire.projector || Inspire.presenter;

		if (Inspire.isActive && otherWindow) {
			// Sync slide item navigation
			otherWindow.Inspire.gotoItem(env.which);
		}
	}
});


// Track whether presenter or projector is the active window
addEventListener("focus", _ => {
	Inspire.isActive = true;

	// If this window is focused, no other can be
	if (Inspire.projector) {
		Inspire.projector.Inspire.isActive = false;
	}
	else if (Inspire.presenter) {
		Inspire.presenter.Inspire.isActive = false;
	}
});

addEventListener("blur", _ => {
	Inspire.isActive = false;

	// If this window is not focused,
	// we cannot make assumptions about which one is.
});
