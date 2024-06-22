import * as prismMeta from "../prism/meta.js";
import { $, $$, create, Hooks, timeout as sleep } from "../../src/util.js";
/*
	Requirements:
	- HTML, CSS, or both
	- Applied immediately or upon Cmd + Enter
	- In an iframe, or in the slide itself (.isolated)
	- Ability to provide hidden custom CSS for the example
	- CSS fixup (selector scoping, selector adding, custom fixup?)
	- HTML fixup
 */

const PAUSE_THRESHOLD = 3000;

const replayerOptions = {
	delay: 140,
	pauses: action => action.delay < PAUSE_THRESHOLD? "delay" : "pause",
	// pauses: "pause",
};

// Postpone init if Prism is not loaded
let interval = 100;
while (!window.Prism) {
	await sleep(interval);
	interval *= 2;
}

if (!Prism.plugins.NormalizeWhitespace) {
	await prismMeta.loadPlugin("normalize-whitespace");
}

export default class LiveDemo {
	constructor(container, o = {}) {
		this.container = container;
		this.isolated = "isolated" in o? o.isolated : this.container.classList.contains("isolated");
		this.minimal = "minimal" in o? o.minimal : this.container.classList.contains("minimal");
		this.updateReload = "updateReload" in o? o.updateReload : this.container.classList.contains("update-reload");
		this.noBase = "base" in o? o.base === false : this.container.classList.contains("no-base");
		this.baseCSS = "baseCSS" in o? o.baseCSS === false : this.container.classList.contains("no-base-css")? "" : LiveDemo.baseCSS;

		this.container.classList.add("live-demo");

		this.editors = {};

		this.replayerOptions = Object.assign({}, replayerOptions);

		for (const attr of this.container.attributes) {
			if (attr.name.startsWith("data-replayer-")) {
				this.replayerOptions[attr.name.slice(14)] = attr.value;
			}
		}

		this.editorContainer = create.in(this.container, `<div class="editor-container"></div>`);

		let textareas = $$("textarea", this.container);

		this.container.dataset.editors = textareas.length;

		textareas.forEach(textarea => {
			textarea.value = Prism.plugins.NormalizeWhitespace.normalize(textarea.value);
			var editor = Prism.Live.create(textarea);
			var id = prismMeta.languages[editor.lang].id;

			if (id === "javascript" || id === "js") {
				// JS needs this
				this.updateReload = true;
			}

			this.editors[id] = editor;
			this.editorContainer.append(editor.wrapper);
			editor.realtime = !textarea.classList.contains("no-realtime");

			if (editor.realtime && id !== "javascript") {
				textarea.addEventListener("input", evt => this.output(id));
			}
			else {
				textarea.addEventListener("keydown", evt => {
					if (evt.key == "Enter" && (evt.ctrlKey || evt.metaKey)) {
						this.output(id);
						evt.preventDefault();
					}
				});
			}
		});

		this.controls = create({
			after: this.editorContainer,
			html: `<div class="demo-controls"></div>`,
		});

		if (!this.minimal) {
			let notes = $("details.notes", this.container);
			if (notes) {
				this.controls.append(notes);
			}
		}

		if (!this.isolated) {
			this.element = $(".demo-target", this.container) || create.in(this.container, `<div class="demo-target"></div>`);

			if (!this.editors.markup) {
				let exclude = [".editor-container", "style", ".demo-controls", ".demo-target", ".demo-exclude", ".notes"].map(s => `:not(${s})`)
				this.element.append(...$$(`:scope > ${exclude.join("")}`, this.container));
			}
		}

		if (this.editors.css) {
			if (!this.isolated) {
				this.style = create.start(this.container, `<style data-slide></style>`);
			}
		}

		if (this.isolated) {
			this.iframe = $("iframe.demo-target", this.container) || create.in(this.container, `<iframe class="demo-target"></iframe>`);

			this.iframe.name = this.iframe.name || "iframe-" + this.container.id;

			this.extraCSS = $$("style.demo", this.container).map(s => {
				s.remove();
				return s.textContent;
			}).join("\n");
			this.extraCSS = Prism.plugins.NormalizeWhitespace.normalize(this.extraCSS);

			this.ready = this.updateIframe();

			var title = (this.container.title || this.container.dataset.title || "") + " Demo";

			// Open in new Tab button
			let a = create({
				inside: this.controls,
				html: `<a class="button new-tab" target="_blank" href="">↗️ New Tab</a>`,
				events: {
					"click mouseenter": evt => {
						a.href = LiveDemo.createURL(this.getHTMLPage({inline: false, noBase: this.noBase}), self.safari);
					}
				}
			});

			// Open in codepen button
			create({
				inside: this.controls,
				html: `
					<form action="https://codepen.io/pen/define" method="POST" target="_blank">
						<input type="hidden" name="data">
						<button class="play">↗️ CodePen</button>
					</form>`,
				onsubmit: async evt => {
					// Since this can be async, we need more time
					// We will cancel this submit event, then submit via code when we're ready
					evt.preventDefault();

					let baseCSS = this.baseCSS + this.extraCSS;

					if (baseCSS) {
						baseCSS = [
							"/* Base styles, not related to example */",
							baseCSS,
							"/* Main CSS */",
						].join("\n");
					}

					let css = [baseCSS, this.css].join("\n");

					let js = this.js;

					// Inline @import
					if (!this.noBase) {
						let imports = [];

						css = css.replace(/@import\s+url\((['"]?)(.+)\1\);/g, (_, q, url) => {
							imports.push(url);
							return "";
						});

						if (imports.length > 0) {
							let importedCSS = await Promise.all(
								imports.map(async url => {
									url = new URL(url, location.href);

									let response = await fetch(url);
									let css = await response.text();

									return css;
								})
							);

							importedCSS = importedCSS.join("\n");

							css = importedCSS + css;
						}
					}

					evt.target.elements.data.value = JSON.stringify({
						title,
						html: this.html,
						css,
						js,
						editors: `${+!!this.html}${+!!css}${+!!js}0`,
						head: this.noBase? "" : `<base href="${location.href}" />`
					});

					evt.target.submit();
				}
			});

			if (!this.minimal) {
				let h1 = $(":scope > h1", this.container);
				if (h1) {
					this.controls.prepend(h1);
				}
			}

		}
		else {
			this.ready = Promise.resolve();

			this.ready.then(() => {
				for (let id in this.editors) {
					this.output(id);
				}
			});
		}

		this.script = $("script[type='application/json'].demo-script", this.container);

		if (this.script) {
			const PLAY_LABEL = "▶️ Play";
			const PAUSE_LABEL = "⏸️ Pause";

			let playButton = create({
				html: `<button class="replay">${PLAY_LABEL}</button>`,
				inside: this.controls,
				onclick: async evt => {
					let isPlay = playButton.textContent === PLAY_LABEL;
					playButton.textContent = isPlay? PAUSE_LABEL : PLAY_LABEL;

					if (this.replayer) {
						// Restore delay (that skip may have messed with)
						this.replayer.options.pauses = this.replayerOptions.pauses;
						this.replayer.options.delay = this.replayerOptions.delay;

						if (this.replayer.queue.length > 0) {
							if (this.replayer.paused) {
								Object.values(this.editors)[0].textarea.focus();

								await this.replayer.resume();
								playButton.textContent = PLAY_LABEL;
								document.activeElement.blur(); // blur editor
							}
							else {
								await this.replayer.pause();
								playButton.textContent = PLAY_LABEL;
								document.activeElement.blur(); // blur editor
							}
						}

						if (this.replayer.queue.length === 0) {
							playButton.disabled = skipButton.disabled = true; // Can't play twice, as the content has changed!
							playButton.title = "";
						}
						else {
							playButton.title = "Next action type: " + this.replayer.queue[0]?.type;
						}

						return;
					}

					try {
						let script = JSON.parse(this.script.textContent);
						Object.values(this.editors)[0].textarea.focus();
						await this.play(script);
						playButton.textContent = PLAY_LABEL;
						document.activeElement.blur(); // blur editor
					}
					catch (e) {
						console.error("Cannot play live demo script due to JSON parse error:", e);
					}
				}
			});

			this.editorContainer.addEventListener("keydown", evt => {
				if (evt.key === "Escape" && playButton.textContent === PAUSE_LABEL) {
					document.activeElement.blur(); // blur editor
					this.replayer.pause();
				}
			})

			let skipButton = create({
				html: `<button class="skip">⏭️</button>`,
				inside: this.controls,
				onclick: async evt => {
					if (this.replayer) {
						if (this.replayer.paused) {
							playButton.click();
						}

						this.replayer.options.delay = 0;
						this.replayer.options.pauses = action => action.delay < PAUSE_THRESHOLD || evt.metaKey || evt.ctrlKey? "ignore" : "pause";
					}
				}
			});
		}

		var editorKeys = Object.keys(this.editors);

		if (editorKeys.length > 1) {
			// More than 1 editors, need the ability to toggle
			editorKeys.forEach((id, i) => {
				var editor = this.editors[id];

				let label = create({
					html: `<label for="${editor.textarea.id}" tabindex="0">${editor.lang}</label>`,
					inside: editor.wrapper,
					onclick: evt => this.openEditor(id),
				});

				editor.textarea.addEventListener("focus", evt => this.openEditor(id));

				if (i == 0) {
					this.openEditor(id);
				}
			});
		}

		LiveDemo.hooks.run("after-init", this);
	}

	fixCode(id, code) {
		if (LiveDemo.fixers[id] && LiveDemo.fixers[id].length) {
			for (let fixer of LiveDemo.fixers[id]) {
				var newCode = fixer(code);

				if (newCode !== undefined) {
					code = newCode;
				}
			}
		}

		return code;
	}

	output(id) {
		let editor = this.editors[id];
		let code;

		if (id in this) {
			code = this[id];
		}
		else if (id === "markup"){
			code = this.html;
		}
		else if (id === "javascript") {
			code = this.js;
		}

		code = this.fixCode(id, code);

		if (this.updateReload) {
			this.updateIframe();
			return;
		}

		if (id === "markup") {
			if (this.isolated) {
				if (this.iframe.contentDocument.body) {
					this.iframe.contentDocument.body.innerHTML = code;
				}
			}
			else {
				this.element.innerHTML = code;

				// Make sure any scripts are executed
				// Not a good idea to execute scripts multiple times in the same document
				// let scripts = this.element.querySelectorAll("script");
				// for (let script of scripts) {
				// 	let clone = document.createElement("script");
				// 	clone.innerHTML = script.innerHTML;
				// 	script.getAttributeNames().forEach(attr => clone.setAttribute(attr, script.getAttribute(attr)));
				// 	script.replaceWith(clone);
				// }
			}
		}
		else if (id === "css") {
			if (this.isolated && !this.style) {
				this.style = $("style#live", this.iframe.contentDocument);
			}

			if (this.style) {
				this.style.textContent = code;
			}

			if (!this.isolated) {
				// Scope rules to increase specificity
				if (!this.style.sheet) {
					// Stupid Chrome bug
					this.style.textContent = this.style.textContent + "/**/";
				}

				if (this.style.sheet) {
					let scope = this.editors.css.textarea.getAttribute("data-scope") || `#${this.container.id} .demo-target `;

					for (let rule of this.style.sheet.cssRules) {
						LiveDemo.scopeRule(rule, this.container, scope);
					}
				}
				else {
					console.log("FAIL on", this.container.id, this.style.outerHTML, this.style.media);
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
		if (!this.editors.markup) {
			// No HTML editor
			return "";
		}

		var editor = this.editors.markup.source;

		if (editor) {
			let prepend = editor.dataset.prepend? editor.dataset.prepend + "\n" : "";
			let append = editor.dataset.append? "\n" + editor.dataset.append : "";
			return `${prepend}${editor.value}${append}`;
		}
		else {
			return this.element.innerHTML;
		}
	}

	get css() {
		return this.editors.css?.value;
	}

	get js() {
		return (this.editors.js || this.editors.javascript)?.value;
	}

	get title() {
		return (this.container.title || this.container.dataset.title || "") + " Demo";
	}

	getHTMLPage({title, inline} = {}) {
		return LiveDemo.getHTMLPage({
			html: this.html,
			css: this.css,
			extraCSS: this.extraCSS,
			baseCSS: this.baseCSS,
			js: this.js,
			title: title || this.title,
			inline,
			noBase: this.noBase,
			module: /^\s*import/m.test(this.js),
		});
	}

	openEditor(id) {
		for (let i in this.editors) {
			this.editors[i].wrapper.classList.toggle("collapsed", i !== id);
		}
	}

	async play (script) {
		if (!this.replayer) {
			let Replayer = await import("https://rety.verou.me/src/replayer.js").then(m => m.default);
			// let editors = Object.fromEntries(Object.entries(this.editors).map(([id, editor]) => [id, editor.textarea]));
			let editors = Object.values(this.editors).map(editor => editor.textarea);

			this.replayer = new Replayer(editors, this.replayerOptions);
		}

		return this.replayer.runAll(script);
	}

	static createEditor(container, label, o = {}) {
		var lang = o.lang || label;
		let textarea = create({
			html: `<textarea id="${container.id}-${label}-editor" class="language-${lang} editor" data-lang="${lang}">${o.fromSource()}</textarea>`,
			inside: o.container || container,
			value: o.fromSource(),
			events: {
				input: o.toSource
			}
		});

		return new Prism.Live(textarea);
	}

	static createURL(html, useDataURI, type = "text/html") {
		html = html.replace(/&#x200b;/g, "");

		if (useDataURI) {
			return `data:${type},${encodeURIComponent(html)}`;
		}
		else {
			return URL.createObjectURL(new Blob([html], {type}));
		}
	}

	static scopeRule(rule, container, scope) {
		let selector = rule.selectorText;

		if (rule.cssRules) {
			// If this rule contains rules, scope those too
			// Mainly useful for @supports and @media
			for (let innerRule of rule.cssRules) {
				LiveDemo.scopeRule(innerRule, container, scope);
			}
		}

		if (selector && rule instanceof CSSStyleRule) {
			let shouldScope = !(
				selector.includes("#")  // don't do anything if the selector already contains an id
				|| [":root", "body"].includes(selector) // don't scope these
			);

			let env = {context: this, rule, container, scope, shouldScope};
			LiveDemo.hooks.run("scoperule", env);

			if ("returnValue" in env) {
				return env.returnValue;
			}

			if (env.shouldScope && selector.indexOf(scope) !== 0) {
				rule.selectorText = selector.split(",").map(s => `${scope} ${s}`).join(", ");
			}
		}
	}

	static getHTMLPage ({html="", css="", baseCSS = LiveDemo.baseCSS, extraCSS="", js="", title="Demo", inline = true, noBase = false, module = false} = {}) {

		baseCSS = baseCSS + (baseCSS && extraCSS? "\n" : "") + extraCSS;

		// Hoist imports to top
		let imports = [];
		baseCSS.replace(/@import .+;/g, $0 => {
			imports.push($0);
			return "";
		});

		if (imports.length > 0) {
			baseCSS = [...imports, baseCSS].join("\n");
		}

		if (css !== "undefined") {
			css = `<style id=live>
${css}
</style>`;
		}

		return `<!DOCTYPE html>
<html lang="en">
<head>
${noBase? "" : `<base href="${location.href}" />`}
<meta charset="UTF-8">
<title>${title}</title>
<style>
/* Base styles, not related to demo */
${baseCSS}
</style>
${css}
${inline? `<script>
document.addEventListener("click", evt => {
	if (evt.target.matches('a[href^="#"]:not([target])')) {
		let prevented = evt.defaultPrevented;
		evt.preventDefault();

		if (!prevented) {
			let href = evt.target.getAttribute("href");
			let target = document.querySelector(href);
			// evt.preventDefault();
			target.scrollIntoView()
		}
	}
})
</script>` : ""}

</head>
<body>
${html}
${js? `
<script${module? ' type="module"' : ""}>
${js}
</script>` : ""}

</body>
</html>`;
	}

	static init (container) {
		if (!container.demo) {
			container.demo = new LiveDemo(container);
		}

		return container.demo;
	}
};

Object.assign(LiveDemo, {
	hooks: new Hooks(),

	fixers: {
		html: [],
		css: []
	},

	baseCSS: `body {
	font: 100%/1.5 system-ui, Helvetica Neue, Segoe UI, sans-serif;
}`
});


var baseCSSTemplate = $(".live-demo-base-css");
if (baseCSSTemplate) {
	// textContent doesn't work on <template>
	LiveDemo.baseCSS = baseCSSTemplate.textContent || baseCSSTemplate.innerHTML;
}

create.in(document.head, `<link rel="stylesheet" href="${new URL("./live-demo.css", import.meta.url)}">`);