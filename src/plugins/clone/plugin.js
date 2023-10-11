/*
	TODO:
	- Nesting (data-clone of an element that contains data-clone)
	- Clone inside, clone contents inside (keep shell)
	- Wait for stuff to happen (events, hooks etc) before cloning or even fetching the cloned element
 */

for (let element of document.querySelectorAll("[data-clone]")) {
	let selector = element.dataset.clone;
	let attributes = element.getAttributeNames().filter(name => /^data-clone($|-)/.test(name));
	let target = querySelectorRelative(selector, element);

	if (!target) {
		console.warn(`[data-clone] target not found: ${selector}, specified by `, element);
		continue;
	}

	let clone = target.cloneNode(true);

	if (attributes.length) {
		for (let attribute of attributes) {
			clone.setAttribute(attribute, element.getAttribute(attribute));
		}
	}

	element.replaceWith(clone);
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