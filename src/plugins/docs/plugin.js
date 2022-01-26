// Links to documentation
import Inspire from "../../../inspire.mjs";

export const hasCSS = true;

let processDocsLinks = (root = document) => {

	$$(Inspire.plugins.registry.docs, root).forEach(code => {
		let text = code.dataset.mdn && !/\/$/.test(code.dataset.mdn)? "" : code.textContent;
		let path;
		let cs = getComputedStyle(code);
		let svg = cs.getPropertyValue("--docs-markup").trim() === "svg";
		let type = cs.getPropertyValue("--docs-type").trim();

		if (!code.nextSibling && !code.previousSibling && code.parentNode.matches("a")) {
			// Already linked
			return;
		}

		if (type === "element") {
			path = svg? "SVG/Element" : "HTML/Element";
			code.textContent = "<" + text + ">";
		}
		else if (["function", "property", "css"].includes(type)) {
			path = "CSS";
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

		$.create("a", {
			className: "docs-link",
			href: `https://developer.mozilla.org/en-US/docs/Web/${path}/${text}`,
			around: code,
			target: "_blank"
		});
	});
};

Inspire.plugins.loaded.docs.loadedCSS.then(() => {
	processDocsLinks(document.body);
});

document.addEventListener("inspire-domchanged", evt => {
	processDocsLinks(evt.target);
});
