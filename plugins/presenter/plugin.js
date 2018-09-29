Inspire.hooks.add({
	"init-end": me => {
		if (window.name === "projector" && window.opener && opener.inspire) {
			body.classList.add("projector");
			this.presenter = opener.inspire;
			this.presenter.projector = this;
		}
	},
	"keyup": env => {
		// Ctrl+P : Presenter view
		if (env.letter === "P") {
			// Open new window for attendee view
			this.projector = open(location, "projector");

			// Get the focus back
			window.focus();

			// Switch this one to presenter view
			body.classList.add("presenter", "show-next");
		}
	},
	"goto-slidechanged": env => {
		this.projector && this.projector.goto(env.which);
	},
	"gotoitem-end": env => {
		this.projector && this.projector.gotoItem(which);
	}
});
