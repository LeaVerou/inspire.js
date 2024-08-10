import Inspire from "../../inspire.mjs";
import { $$ } from "../../src/util.js";

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
			// We are in the presenter window
			$$("details.notes", Inspire.currentSlide).forEach(d => d.open = true);

			if (Inspire.currentSlide.matches("[data-start-time] [data-time]")) {
				// This slide has a time hint, show if we're running behind

				// Scheduled start time
				let startTime = Inspire.currentSlide.closest("[data-start-time]")?.getAttribute("data-start-time");
				let startTimeParsed = startTime.split(":").map(n => +n);

				// Ideal offset from start time
				let time = Inspire.currentSlide.dataset.time;
				let timeParsed = time.split(":").map(n => +n);

				// Current local time
				let currentTime = new Date().toLocaleString("en", {timeStyle: "short", hour12: false});
				let currentTimeParsed = currentTime.split(":").map(n => +n);

				// Actual offset from start time, in minutes
				let actualTime = (currentTimeParsed[0] - startTimeParsed[0]) * 60 + (currentTimeParsed[1] - startTimeParsed[1]);

				let offset = actualTime - (timeParsed[0] * 60 + timeParsed[1]);
				let offsetHours = Math.floor(Math.abs(offset / 60)).toString().padStart(2, "0");
				let offsetMinutes = (Math.abs(offset) % 60).toString().padStart(2, "0");

				Inspire.currentSlide.dataset.offset = `${offsetHours}:${offsetMinutes}`;

				if (offset !== 0) {
					Inspire.currentSlide.dataset.running = offset > 0? "behind" : "ahead";
				}
			}
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
