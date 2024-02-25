import * as util from "./util.js";
const { $, $$, } = util;

export let loaded = util.defer();

let imports;

export async function load () {
	let parser = new DOMParser();

	imports = $$('link[rel="inspire-import"]').map(async link => {
		let response = await fetch(link.href);
		let text = await response.text();
		return {
			id: link.id,
			doc: parser.parseFromString(text, "text/html"),
			link
		};
	});

	let talkCSS = $('link[href$="talk.css"]');

	let ret = await Promise.all(imports.map(async imported => {
		let info = await imported;
		let link = info.link;
		let doc = info.doc;

		// Make sure local links in the import resolve correctly
		doc.head.insertAdjacentHTML("beforeend", `<base href="${link.href}">`);

		// Go through all linked resources and absolutize their URLs
		let attributes = ["src", "data-src", "href"];
		$$("[src], [data-src], [href]", doc).forEach(resource => {
			for (let attribute of attributes) {
				if (resource.hasAttribute(attribute)) {
					let url = new URL(resource.getAttribute(attribute), link.href);
					resource.setAttribute(attribute, url);
				}
			}
		});

		// Absolutize any URLs in style attributes
		for (let element of $$('[style*="url("]', doc)) {
			let style = element.getAttribute("style");
			let newStyle = style.replace(/url\(('|")?(.+?)\1\)/, ($0, quote, url) => {
				quote = quote || "'";
				return `url(${quote}${new URL(url, link.href)}${quote})`;
			});

			if (style !== newStyle) {
				element.setAttribute("style", newStyle);
			}
		}

		// Load stylesheets and talk.js from import
		for (let link of $$('link[href$="talk.css"]', doc)) {
			let copy = link.cloneNode();

			if (talkCSS) {
				talkCSS.before(copy);
			}
			else {
				document.head.prepend(copy);
			}
		}

		for (let script of $$('script[src$="talk.js"]', doc)) {
			if (script.type == "module"){
				import(script.src);
			}
			else {
				document.head.insertAdjacentHTML("beforeend", `<script src="${script.src}"></script>`);
			}
		}

		// Replace imported slides with their correct HTML
		let inserted = {};
		for (let slide of $$(`.slide[data-insert^="${link.id}#"]`)) {
			let insert = slide.dataset.insert;
			let id = insert.match(/#.*$/)[0];

			if (inserted[insert]) {
				// Already inserted, just link to it
				slide.dataset.insert = inserted[insert].id || id;
			}
			else {
				inserted[insert] = slide;
				let remoteSlide = doc.querySelector(id);

				if (remoteSlide) {
					remoteSlide.setAttribute("data-import-id", remoteSlide.id);

					if ($(id)) {
						// Imported slide's id exists in the document already, prepend with import name
						remoteSlide.id = link.id + "-" + remoteSlide.id;
					}

					slide.replaceWith(remoteSlide);
				}
				else {
					console.warn(`${id} not found in ${link.id} import, ignoring.`);
					slide.remove();
				}
			}
		}

		return doc;
	}));

	loaded.resolve();

	return ret;
}