// Links to documentation
$$(Inspire.pluginTest.docs).forEach(code => {
	var text = code.dataset.mdn? "" : code.textContent;
	var path;

	switch (code.className) {
		case "function":
			code.textContent += "()"; // pass-through
		case "property":
		case "css":
			path = "CSS";
			break;
		case "element":
			path = "HTML/Element";
			code.textContent = "<" + text + ">";
			break;
		case "svg element":
			path = "SVG/Element";
			code.textContent = "<" + text + ">";
			break;
		case "attribute":
			var category = code.dataset.category || "Global_attributes";
			path = `API/${category}`;
			break;
		default:
			var mdn = code.closest("[data-mdn]");
			path = mdn? mdn.dataset.mdn : "";
	}

	$.create("a", {
		href: `https://developer.mozilla.org/en-US/docs/Web/${path}/${text}`,
		around: code,
		target: "_blank"
	});
});
