// Display certain keys pressed
import Inspire from "../../src/../inspire.mjs";
import transition from "../../src/../../bliss/src/dom/transition.js";
import { timeout } from "../../src/util.js";

export const symbols = {
	Tab: "⇥",
	Enter: "⏎",
	DownArrow: "↓",
	UpArrow: "↑",
	LeftArrow: "←",
	RightArrow: "→",
	Control: "⌃",
	Shift: "⇧",
	Alt: "⌥",
	Meta: "⌘",
};

let listener;

Inspire.hooks.add("slidechange", env => {
	if (listener) {
		// Remove event listener for keys
		document.removeEventListener("keyup", listener);
	}

	if (env.slide.matches("[data-visible-keys]")) {
		let keys = new Set(env.slide.dataset.visibleKeys.split(/\s+/));
		let delay = +env.slide.dataset.visibleKeysDelay || 600;

		document.addEventListener("keyup", listener = async evt => {
			if (keys.has(evt.key) && evt.target.nodeName != "TEXTAREA") {
				label = evt.key;

				for (let key in symbols) {
					label = label.replace(key, symbols[key]);
				}

				label = (evt.ctrlKey? symbols.Control : "")
				      + (evt.shiftKey? symbols.Shift : "")
				      + (evt.metaKey? symbols.Meta : "")
				      + (evt.altKey? symbols.Alt : "") + label;

				env.slide.insertAdjacentHTML("beforeend", `<kbd class="visible-key">${ label }</kbd>`);

				await timeout(delay);
				await transition(key, {opacity: 0});
				key.remove();
			}
		});
	}
});
