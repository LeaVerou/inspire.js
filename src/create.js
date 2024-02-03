function $ (el) {
	if (typeof el === "string") {
		return document.querySelector(el);
	}

	return el;
}

let positions = {
	before: { pos: "beforebegin", prop: "previousElementSibling" },
	after: { pos: "afterend", prop: "nextElementSibling" },
	in: { pos: "beforeend", prop: "lastElementChild" },
	start: { pos: "afterbegin", prop: "firstElementChild" },
	around: function around (element, html) {
		element = $(element);
		let newElement = create.before(element, html);
		newElement.append(element);
		return newElement;
	}
}

const CORE_SETTINGS = new Set([
	"element", "position", "contents", "html",
	...Object.keys(positions),
]);

export default function create (o) {
	let ret;
	let html = o.html;

	// Create element
	if (o.element) {
		// Separate position and element
		ret = create[o.position ?? "in"](o.element, html);
	}
	else {
		// [position]: element syntax
		for (let position in positions) {
			if (o[position]) {
				ret = create[position](o[position], html);
				break;
			}
		}
	}

	if (!ret) {
		// No position specified, create it and return it
		let dummy = document.createElement("div");
		dummy.innerHTML = html;
		ret = dummy.firstElementChild;
	}

	for (let property in o) {
		if (property === "contents") {
			ret.append(...o.contents);
		}
		else if (property === "events") {
			for (let events in o.events) {
				for (let event of events.split(/\s+/)) {
					ret.addEventListener(event, o.events[event]);
				}
			}
		}
		else if (property === "attributes") {
			for (let attribute in o.attributes) {
				ret.setAttribute(attribute, o.attributes[attribute]);
			}
		}
		else if (!CORE_SETTINGS.has(property)) {
			ret[property] = o[property];
		}
	}

	return ret;
}

for (let position in positions) {
	let fn = positions[position];

	if (typeof fn !== "function") {
		let { pos, prop } = fn;
		fn = function (element, html) {
			element = $(element);
			let target = element;

			if (element.nodeType === Node.TEXT_NODE) {
				if (pos === "afterbegin" || pos === "beforeend") {
					throw new Error("Text nodes cannot have children. Text node was:", element);
				}

				element = element.parentElement;
			}

			element.insertAdjacentHTML(pos, html);
			let newElement = element[prop];

			if (target !== element) {
				if (pos === "beforebegin") {
					target.before(newElement);
				}
				else if (pos === "afterend") {
					target.after(newElement);
				}
			}

			return newElement;
		};
	}

	create[position] = fn;
}