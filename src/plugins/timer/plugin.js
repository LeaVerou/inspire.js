import Inspire from "../../../inspire.mjs";

Inspire.hooks.add("init-start", me => {
	// Create timer, if needed
	this.duration = document.body.getAttribute("data-duration");

	if (this.duration > 0) {
		var timer = Bliss.create({
			id: "timer",
			style: {
				transitionDuration: this.duration * 60 + "s"
			},
			inside: document.body
		});

		addEventListener("load", evt => {
			timer.className = "end";

			setTimeout(() => timer.classList.add("overtime"), this.duration * 60000);
		});
	}
});
