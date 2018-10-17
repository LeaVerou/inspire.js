// Links to documentation
$$(Inspire.pluginTest.docs).forEach(code => {
	var text = code.dataset.mdn? "" : code.textContent;
	var path;
	var svg = code.matches(".svg");

	if (code.matches(".element")) {
		path = svg? "SVG/Element" : "HTML/Element"
		code.textContent = "<" + text + ">";
	}
	else if (code.matches(".function, .property, .css")) {
		path = "CSS";
	}
	else if (code.matches(".attribute")) {
		if (svg) {
			path = "SVG/Attribute"
		}
		else {
			var category = code.dataset.category || "Global_attributes";
			path = `API/${category}`;
		}
	}
	else {
		var mdn = code.closest("[data-mdn]");
		path = mdn? mdn.dataset.mdn : "";
	}

	if (code.matches(".function")) {
		code.textContent += "()";
	}

	$.create("a", {
		href: `https://developer.mozilla.org/en-US/docs/Web/${path}/${text}`,
		around: code,
		target: "_blank"
	});
});
