Inspire.hooks.add({
	"init-end": me => {
		if (window.name === "projector" && window.opener && opener.inspire) {
			body.classList.add("projector");
			this.presenter = opener.inspire;
			this.presenter.projector = this;
		}
	},
	"keyup": env => {
		if (env.evt.key === "P") {
			// Open new window for attendee view
			this.projector = open(location, "projector");

			// Get the focus back
			window.focus();

			// Switch this one to presenter view
			body.classList.add("presenter");
		}
	}
});
