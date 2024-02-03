function $ (el) {
	if (typeof el === "string") {
		return document.querySelector(el);
	}

	return el;
}

let positions = {
	before: { pos: "beforebegin", prop: "previousSibling" },
	after: { pos: "afterend", prop: "nextSibling" },
	in: { pos: "beforeend", prop: "lastChild" },
	start: { pos: "afterbegin", prop: "firstChild" },
	around: function around (element, html) {
		element = $(element);
		let newElement = create.before(element, html);
		newElement.append(element);
		return newElement;
	}
}

const POSITION_SETTINGS = new Set([
	"element", "position", "contents",
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

	for (let property in o) {
		if (property === "contents") {
			ret.append(...o.contents);
		}
		else if (property === "events") {
			for (let events in o.events) {
				for (let event in events.split(/\s+/)) {
					ret.addEventListener(event, o.events[event]);
				}
			}
		}
		else if (!POSITION_SETTINGS.has(property)) {
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
			element.insertAdjacentHTML(pos, html);
			return element[prop];
		};
	}

	create[position] = fn;
}