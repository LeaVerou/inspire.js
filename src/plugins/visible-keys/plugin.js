// Display certain keys pressed
Inspire.hooks.add("slidechange", env => {
	const visibleKeys = Inspire.plugins["visible-keys"];
	const symbols = visibleKeys.symbols = {
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

	if (visibleKeys.listener) {
		// Remove event listener for keys
		document.removeEventListener("keyup", visibleKeys.listener);
	}

	if (env.slide.matches("[data-visible-keys]")) {
		var keys = new Set(env.slide.dataset.visibleKeys.split(/\s+/));
		var delay = +env.slide.dataset.visibleKeysDelay || 600;

		document.addEventListener("keyup", visibleKeys.listener = function(evt) {
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
