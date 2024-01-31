import { deduplicateId } from "../../src/util.js";

/*
	TODO:
	- Nesting (data-clone of an element that contains data-clone)
	- Clone inside
	- Clone text content
	- Wait for stuff to happen (events, hooks etc) before cloning or even fetching the cloned element
	- Compose rather than override certain attributes (class, style, etc)
	- Remove attributes
	- Resolve duplicate ids
 */

for (let target of document.querySelectorAll("[data-clone]")) {
	let selector = target.dataset.clone;

	let source = querySelectorRelative(selector, target);

	if (!source) {
		console.warn(`[data-clone] target not found: ${selector}, specified by `, target);
		continue;
	}

	let clone = source.cloneNode(true);

	let attributes = source.getAttributeNames();
	for (let attribute of attributes) {
		if (!target.hasAttribute(attribute)) {
			target.setAttribute(attribute, source.getAttribute(attribute));
		}
	}

	target.append(...clone.childNodes);

	if (target.id) {
		deduplicateId(clone);
	}
}

function querySelectorRelative(selector, element) {
	let parent = element;

	while (parent = parent.parentNode) {
		let found = parent.querySelector(selector);

		if (found) {
			return found;
		}
	}

	return null; // not found
}