import Inspire from "../../../inspire.mjs";

export const hasCSS = true;

$$("details.notes").forEach(details => {
	let div = document.createElement("div");
	div.append(...details.childNodes);
	details.append(div);
	details.classList.add("docs-icons"); // for docs plugin

	if (!/\b(top|bottom)-(right|left)\b/.test(details.className)) {
		details.classList.add("top-right");
	}

	let summary = $("summary", details);

	if (!summary) {
		summary = $.create("summary", {textContent: "Notes"});
	}

	details.prepend(summary);

	if (Inspire.projector) {
		// Speaker view, let's have the notes open by default
		details.open = true;
	}
});
