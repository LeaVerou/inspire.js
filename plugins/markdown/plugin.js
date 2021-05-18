(async function() {
let selectors = $$("[data-markdown-selectors]").map(e => e.getAttribute("data-markdown-selectors"));

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
	render(e);
}

function fixupCode(code) {
	// Remove indented code blocks
	code = code.replace(/^\t+|^ {4,}/gm, "");

	return code;
}

function renderCode(code) {
	// Remove indented code blocks
	code = code.replace(/^\t+|^ {4,}/gm, "");
	return /\r?\n/.test(code.trim())? md.render(code) : md.renderInline(code);
}

function render(e) {
	if (e?.classList.contains("no-md")) {
		return;
	}

	if (e.children.length === 0) {
		let code = e.textContent;
		e.innerHTML = renderCode(code);
	}
	else {
		// Join adjacent text nodes
		e.normalize();

		for (let child of [...e.childNodes]) {
			if (child.nodeType === Node.TEXT_NODE) {
				let code = child.textContent;
				let html = renderCode(code)

				if (child.nextSibling) {
					child.nextSibling.insertAdjacentHTML("beforebegin", html);
				}
				else if (child.previousSibling) {
					child.previousSibling.insertAdjacentHTML("afterend", html);
				}
				else {
					continue;
				}

				child.remove();
			}
			else if(child.nodeType === Node.ELEMENT_NODE) {
				render(child);
			}
		}
	}
}

})();
