(async function() {

const PLUGIN_SRC = document.currentScript? document.currentScript.src : "";

$$(".demo.slide").forEach(slide => {
	// This is before editors have been created
	slide.classList.add("dont-resize");
});

$$("style.demo").forEach(style => style.dataset.slide = "");

/*
	Requirements:
	- HTML, CSS, or both
	- Applied immediately or upon Cmd + Enter
	- In an iframe, or in the slide itself (.isolated)
	- Ability to provide hidden custom CSS for the example
	- CSS fixup (selector scoping, selector adding, custom fixup?)
	- HTML fixup
 */

var _ = self.Demo = class Demo {
	constructor(slide) {
		this.slide = slide;
		this.isolated = this.slide.classList.contains("isolated");
		this.editors = {};

		this.editorContainer = $.create({
			className: "editor-container",
			inside: this.slide
		});

		$$("textarea", this.slide).forEach(textarea => {
			textarea.value = Prism.plugins.NormalizeWhitespace.normalize(textarea.value);
			var editor = new Prism.Live(textarea);
			var id = Inspire.plugins.prism.meta.languages[editor.lang].id;
			this.editors[id] = editor;
			this.editorContainer.append(editor.wrapper);
			editor.realtime = !textarea.classList.contains("no-realtime");

			if (editor.realtime) {
				textarea.addEventListener("input", evt => this.output(id));
			}
			else {
				textarea.addEventListener("keyup", evt => {
					if (evt.key == "Enter" && evt.ctrlKey) {
						this.output(id);
					}
				});
			}
		});

		var notes = $("details.notes", this.slide);

		if (notes) {
			var div = document.createElement("div");
			div.append(...$$(notes.childNodes));
			notes.append(div);

			var summary = $("summary", notes);

			if (!summary) {
				var slide = notes.closest(".slide");
				summary = $.create("summary", {textContent: slide.title || "Notes"});
			}

			notes.prepend(summary);
		}

		this.controls = $.create({
			className: "demo-controls",
			contents: notes,
			after: this.editorContainer
		});

		if (!this.isolated) {
			this.element = $.create({inside: this.slide, className: "demo-target"});

			if (!this.editors.markup) {
				this.element.append(...$$(".slide > :not(.editor-container):not(style):not(.demo-controls):not(.demo-target)", this.slide));
			}
		}

		if (this.editors.css) {
			if (!this.isolated) {
				this.style = $.create("style", {
					"data-slide": "",
					start: this.slide
				});
			}
		}

		if (this.isolated) {
			this.iframe = $.create("iframe", {
				name: "iframe-" + slide.id,
				className: "demo-target",
				inside: this.slide
			});

			this.extraCSS = $$("style.demo", this.slide).map(s => {
				s.remove();
				return s.textContent;
			}).join("\n");
			this.extraCSS = Prism.plugins.NormalizeWhitespace.normalize(this.extraCSS);

			this.ready = this.updateIframe();

			var title = (slide.title || slide.dataset.title || "") + " Demo";

			// Open in new Tab button
			var a = $.create("a", {
				className: "button new-tab",
				textContent: "Open in new Tab",
				inside: this.controls,
				target: "_blank",
				events: {
					"click mouseenter": evt => {
						a.href = Demo.createURL(this.getHTMLPage({inline: false}));
					}
				}
			});

			// Open in codepen button
			$.create("form", {
				action: "https://codepen.io/pen/define",
				method: "POST",
				target: "_blank",
				contents: [
					{
						tag: "input",
						type: "hidden",
						name: "data",
						value: JSON.stringify({
							title,
							html: this.html,
							css: [
								"/* Base styles, not related to demo */",
								Demo.baseCSS + this.extraCSS,
								"/* Our demo CSS */",
								this.css].join("\n"),
							editors: "1100",
							head: `<base href="${location.href}" />`
						})
					},
					{
						tag: "button",
						textContent: "Open in CodePen",
						className: "play"
					}
				],
				inside: this.controls
			});

			// Next slide button
			$.create("button", {
				className: "next",
				textContent: "Next ▸",
				inside: this.controls,
				events: {
					click: evt => Inspire.next()
				}
			});
		}
		else {
			this.ready = Promise.resolve();
		}

		this.slide.addEventListener("slidechange", evt => {
			for (let id in this.editors) {
				this.editors[id].textarea.dispatchEvent(new InputEvent("input"));
			}
		});

		this.ready.then(() => {
			for (let id in this.editors) {
				this.output(id);
			}
		});

		var editorKeys = Object.keys(this.editors);

		if (editorKeys.length > 1) {
			// More than 1 editors, need the ability to toggle
			editorKeys.forEach((id, i) => {
				var editor = this.editors[id];

				var label = $.create("label", {
					htmlFor: editor.textarea.id,
					inside: editor.wrapper,
					textContent: editor.lang,
					tabIndex: "0",
					onclick: evt => this.openEditor(id)
				});

				editor.textarea.addEventListener("focus", evt => this.openEditor(id));

				if (i == 0) {
					this.openEditor(id);
				}
			});
		}
	}

	fixCode(id, code) {
		if (_.fixers[id] && _.fixers[id].length) {
			for (let fixer of _.fixers[id]) {
				var newCode = fixer(code);

				if (newCode !== undefined) {
					code = newCode;
				}
			}
		}

		return code;
	}

	output(id) {
		var editor = this.editors[id];
		var code = editor.textarea.value;

		code = this.fixCode(id, code);

		if (id === "markup") {
			if (this.isolated) {
				if (this.iframe.contentDocument.body) {
					this.iframe.contentDocument.body.innerHTML = code;
				}
			}
			else {
				this.element.innerHTML = code;
			}
		}
		else if (id === "css") {
			if (this.isolated && !this.style) {
				this.style = $("style#live", this.iframe.contentDocument);
			}

			this.style.textContent = code;

			if (!this.isolated) {
				// Scope rules to increase specificity
				if (!this.style.sheet) {
					// Stupid Chrome bug
					this.style.textContent = this.style.textContent + "/**/";
				}

				if (this.style.sheet) {
					let scope = this.editors.css.textarea.getAttribute("data-scope") || `#${this.slide.id} .demo-target `;

					for (let rule of this.style.sheet.cssRules) {
						_.scopeRule(rule, this.slide, scope);
					}
				}
				else {
					console.log("FAIL on", this.slide.id, this.style.outerHTML, this.style.media);
				}
			}
		}
	}

	updateIframe() {
		this.iframe.srcdoc = this.getHTMLPage();

		return new Promise(resolve => {
			this.iframe.onload = resolve;
		}).then(evt => {
			this.style = $("style#live", this.iframe.contentDocument);
			return evt;
		});
	}

	get html() {
		return this.editors.markup? this.editors.markup.value : this.element.innerHTML;
	}

	get css() {
		return $.value(this.editors.css, "value");
	}

	get js() {
		return $.value(this.editors.js, "value");
	}

	get title() {
		return (this.slide.title || this.slide.dataset.title || "") + " Demo";
	}

	getHTMLPage({title, inline} = {}) {
		return Demo.getHTMLPage({
			html: this.html,
			css: this.css,
			extraCSS: this.extraCSS,
			js: this.js,
			title: title || this.title,
			inline
		});
	}

	openEditor(id) {
		for (let i in this.editors) {
			this.editors[i].wrapper.classList.toggle("collapsed", i !== id);
		}
	}

	static createEditor(slide, label, o = {}) {
		var lang = o.lang || label;

		var textarea = $.create("textarea", {
			id: `${slide.id}-${label}-editor`,
			className: `language-${lang} editor`,
			"data-lang": lang,
			inside: o.container || slide,
			value: o.fromSource(),
			events: {
				input: o.toSource
			}
		});

		return new Prism.Live(textarea);
	}

	static createURL(html) {
		html = html.replace(/&#x200b;/g, "");
		var blob = new Blob([html], {type : "text/html"});

		return URL.createObjectURL(blob);
	}

	static scopeRule(rule, slide, scope) {
		let selector = rule.selectorText;

		if (rule.cssRules) {
			// If this rule contains rules, scope those too
			// Mainly useful for @supports and @media
			for (let innerRule of rule.cssRules) {
				_.scopeRule(innerRule, slide, scope);
			}
		}

		if (selector && rule instanceof CSSStyleRule) {
			let shouldScope = !(
				selector.includes("#")  // don't do anything if the selector already contains an id
				|| selector == ":root"
			);

			if (selector == "article" || selector == ".slide") {
				rule.selectorText = `#${slide.id}`;
			}
			else if (shouldScope && selector.indexOf(scope) !== 0) {
				rule.selectorText = selector.split(",").map(s => `${scope} ${s}`).join(", ");
			}
		}
	}

	static getHTMLPage({html="", css="", extraCSS="", js="", title="Demo", inline = true} = {}) {
		if (css !== "undefined") {
			css = `<style id=live>
${css}
</style>`;
		}

		return `<!DOCTYPE html>
<html lang="en">
<head>
<base href="${location.href}" />
<meta charset="UTF-8">
<title>${title}</title>
<style>
/* Base styles, not related to demo */
${Demo.baseCSS}
${extraCSS}
</style>
${css}
</head>
<body>
${html}
${js || inline? `
<script>
${js}

${inline? `document.addEventListener("click", evt => {
	if (evt.target.matches('a[href^="#"]:not([target])')) {
		evt.preventDefault();
	}
})` : ""}

</script>` : ""}

</body>
</html>`;
	}

	static init(slide) {
		if (slide.matches(".demo") && !slide.demo) {
			slide.demo = new Demo(slide);
		}
	}

	static initAll() {
		$$(".demo.slide").forEach(slide => {
			if (!slide.demo) {
				slide.demo = new Demo(slide);
			}
		});
	}
};

Demo.fixers = {
	html: [],
	css: [
		code => {
			if (!/\{[\S\s]+\}/.test(code.replace(/'[\S\s]+'/g, ""))) {
				return `.slide {
	${code}
}`;
			}
		}
	]
};

Demo.baseCSS = `body {
	font: 200% Helvetica Neue, Segoe UI, sans-serif;
}

input, select, textarea, button {
	font: inherit;
}
`;

await Inspire.loadPlugin("prism");
await Inspire.plugins.prism.ready;

if (!Prism.Live) {
	// Filter loaded languages to only languages used in demo slides
	var languages = [];

	for (let [id, lang] of Object.entries(Inspire.plugins.prism.meta.languages)) {
		if (id === lang.id && $(`.demo.slide .language-${id}, .language-${id} .demo.slide, .demo.slide.language-${id}`)) {
			languages.push(id);
		}
	}

	await $.load(`https://live.prismjs.com/src/prism-live.js?load=${languages.join(",")}`);
	await Prism.Live.ready;

	// Move Prism Live CSS before ours
	var ourCSS = $("link[href$='livedemo/plugin.css']");
	var liveCSS = $("link[href$='prism-live.css']");
	if (ourCSS && liveCSS) {
		liveCSS.after(ourCSS);
	}
}

document.addEventListener("slidechange", evt => {
	Demo.init(evt.target);
});

if (Inspire.currentSlide) {
	$.ready().then(() => {
		Demo.init(Inspire.currentSlide);
	});
}

})();
