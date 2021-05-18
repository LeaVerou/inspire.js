(async function() {
let selectors = $$("[data-markdown-selectors]").flatMap(e => e.getAttribute("data-markdown-selectors").split(/\s+/));

let elements = $$(selectors.join(", "));

if (elements.length === 0) {
	return;
}

await import("https://cdn.jsdelivr.net/npm/markdown-it@12.0.6/dist/markdown-it.js");

let md = new markdownit("commonmark", {
	html: true,
	typographer: true,
	linkify: true,
	// breaks: true
});

for (let e of elements) {
	highlight(e);
}

function highlight(e) {
	if (e.children.length === 0) {
		let code = e.textContent;
		// Remove indented code blocks
		code = code.replace(/^\t+|^ {4,}/gm, "");
		e.innerHTML = md.render(code);
	}
	else {
		for (let child of [...e.childNodes]) {
			if (child.nodeType === Node.TEXT_NODE) {
				let div = document.createElement("div");
				div.textContent = child.textContent;
				highlight(div);
				child.replaceWith(div);
			}
			else if(child.nodeType === Node.ELEMENT_NODE) {
				highlight(child);
			}
		}
	}
}

})();
