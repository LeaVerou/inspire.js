import Inspire from "../../../inspire.mjs";

export const hasCSS = false;

let selectors = $$("[data-markdown-elements]").map(e => e.getAttribute("data-markdown-elements"));

let elements = $$(selectors.join(", "));

if (elements.length === 0) {
	await new Promise(r => {});
}

await import("https://cdn.jsdelivr.net/npm/markdown-it@12.0.6/dist/markdown-it.js");

let md = new markdownit("commonmark", {
	html: true,
	typographer: true,
	linkify: true,
	// breaks: true
}).enable([ "table" ]);

for (let e of elements) {
	let changed = render(e);

	if (changed) {
		Inspire.domchanged(e);
	}
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

	let previousHTML = e.innerHTML;

	if (e.children.length === 0) {
		let code = e.textContent;
		let html = renderCode(code);

		e.innerHTML = html;
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

	return e.innerHTML !== previousHTML;
}
