import Inspire from "../../inspire.mjs";

Inspire.hooks.add("init-start", me => {
	// Create timer, if needed
	this.duration = document.body.getAttribute("data-duration");

	if (this.duration > 0) {
		docuent.body.insertAdjacentHTML("beforeend", `<div id="timer" style="transition-duration: ${ this.duration * 60 }s;"></div>`);

		addEventListener("load", evt => {
			timer.className = "end";

			setTimeout(() => timer.classList.add("overtime"), this.duration * 60000);
		});
	}
});
