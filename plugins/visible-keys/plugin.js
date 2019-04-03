// Display certain keys pressed
Inspire.hooks.add("slidechange", env => {
	if (Inspire.plugins["visible-keys"].listener) {
		// Remove event listener for keys
		document.removeEventListener("keyup", Inspire.plugins["visible-keys"].listener);
	}

	if (env.slide.matches("[data-visible-keys]")) {
		var visibleKeys = new Set(env.slide.dataset.visibleKeys.split(/\s+/));
		var delay = +env.slide.dataset.visibleKeysDelay || 600;

		document.addEventListener("keyup", Inspire.plugins["visible-keys"].listener = function(evt) {
			if (visibleKeys.has(evt.key) && evt.target.nodeName != "TEXTAREA") {
				label = evt.key.replace("Tab", "⇥")
							 .replace("Enter", "⏎")
							 .replace("DownArrow", "↓");
				label = (evt.ctrlKey? "⌃" : "") + (evt.shiftKey? "⇧" : "") + (evt.metaKey? "⌘" : "") + (evt.altKey? "⌥" : "") + label;

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
