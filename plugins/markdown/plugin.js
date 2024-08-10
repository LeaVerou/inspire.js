import { $$ } from "../../src/util.js";

export const hasCSS = false;

let selectors = $$("[data-markdown-elements]").map(e => e.getAttribute("data-markdown-elements"));
let elements = $$(selectors.join(", "));

if (elements.length === 0) {
	// Basically return;
	await new Promise((res, rej) => {rej("No markdown elements")});
}

await import("https://cdn.jsdelivr.net/npm/markdown-it@12.0.6/dist/markdown-it.js");

let md = new markdownit("commonmark", {
	html: true,
	typographer: true,
	linkify: true,
	// breaks: true
}).enable([ "table" ]).disable("code");

const Inspire = (await import("../../src/../inspire.mjs")).default;
for (let e of elements) {
	let changed = render(e);

	if (changed) {
		Inspire.domchanged(e);
	}
}

function getCommonPrefix(strings) {
	return strings.reduce((prefix, str) => {
		let i = [...str].findIndex((c, i) => c !== prefix[i]);
		return i > -1 ? prefix.slice(0, i) : prefix;
	});
}

function getIndent(code) {
	let indents = code.match(/^[\t ]+/gm);
	return indents? getCommonPrefix(indents) : "";
}

function renderCode(code) {
	// Remove overall indentation
	let indent = getIndent(code);
	if (indent) {
		code = code.replace(new RegExp("^" + indent, "gm"), "");
	}

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
