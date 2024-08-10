// Links to documentation
import Inspire from "../../inspire.mjs";
import create from "../../src/util/create.js";

export const hasCSS = true;

let processDocsLinks = (root = document) => {
	for (let code of document.querySelectorAll(Inspire.plugins.registry.docs)) {
		let text = code.dataset.mdn && !/\/$/.test(code.dataset.mdn)? "" : code.textContent;
		let id = text;
		let path;
		let cs = getComputedStyle(code);
		let svg = cs.getPropertyValue("--docs-markup").trim() === "svg";
		let type = cs.getPropertyValue("--docs-type").trim();

		if (code.matches("a > :only-child")) {
			// Already linked
			return;
		}

		if (type === "element") {
			path = svg? "SVG/Element" : "HTML/Element";
			code.textContent = "<" + text + ">";
		}
		else if (["function", "property", "css"].includes(type)) {
			path = "CSS";

			if (type === "css" && text.startsWith(":")) {
				id = id.replace(/\(\)$/, "");
			}
		}
		else if (type === "attribute") {
			if (svg) {
				path = "SVG/Attribute";
			}
			else {
				var category = code.dataset.category;
				path = category? `API/${category}` : "HTML/Global_attributes";
			}
		}
		else {
			var mdn = code.closest("[data-mdn]");
			path = mdn? mdn.dataset.mdn : "";
		}

		if (type === "function") {
			code.textContent += "()";
		}

		create.around(code, `<a class="docs-link" href="https://developer.mozilla.org/en-US/docs/Web/${path}/${id}" target="_blank"></a>`);
	}
};

Inspire.plugins.loaded.docs.loaded.then(() => {
	processDocsLinks(document.body);
});

document.addEventListener("inspire-domchanged", evt => {
	processDocsLinks(evt.target);
});
