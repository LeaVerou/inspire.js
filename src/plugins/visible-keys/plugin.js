// Display certain keys pressed
import Inspire from "../../../inspire.mjs";

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
		var keys = new Set(env.slide.dataset.visibleKeys.split(/\s+/));
		var delay = +env.slide.dataset.visibleKeysDelay || 600;

		document.addEventListener("keyup", listener = function(evt) {
			if (keys.has(evt.key) && evt.target.nodeName != "TEXTAREA") {
				label = evt.key;

				for (let key in symbols) {
					label = label.replace(key, symbols[key]);
				}

				label = (evt.ctrlKey? symbols.Control : "")
				      + (evt.shiftKey? symbols.Shift : "")
				      + (evt.metaKey? symbols.Meta : "")
				      + (evt.altKey? symbols.Alt : "") + label;

				var key = $.create("kbd", {
					textContent: label,
					inside: env.slide,
					className: "visible-key"
				});

				setTimeout(() => {
					$.transition(key, {opacity: 0}).then($.remove);
				}, delay);
			}
		});
	}
});
