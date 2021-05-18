$$("details.notes").forEach(details => {
	let div = document.createElement("div");
	div.append(...details.childNodes);
	details.append(div);
	details.classList.add("docs-icons");

	let summary = $("summary", details);

	if (!summary) {
		summary = $.create("summary", {textContent: "Notes"});
	}

	details.prepend(summary);
});
