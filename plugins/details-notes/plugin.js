$$("details.notes").forEach(details => {
	let div = document.createElement("div");
	div.append(...details.childNodes);
	details.append(div);
	details.classList.add("docs-icons");

	if (!/\b(top|bottom)-(right|left)\b/.test(details.className)) {
		details.classList.add("top-right");
	}

	let summary = $("summary", details);

	if (!summary) {
		summary = $.create("summary", {textContent: "Notes"});
	}

	details.prepend(summary);
});