import Inspire from "../../inspire.mjs";
import * as prism from "../prism/plugin.js";
import { timeout, create, $, $$ } from "../../src/util.js";
import LiveDemo from "./live-demo.js";

export const hasCSS = true;

// const PLUGIN_SRC = import.meta.url;

$$(".demo.slide").forEach(slide => {
	// This is before editors have been created
	slide.classList.add("dont-resize", "no-slide-number");
});

$$("style.demo").forEach(style => style.dataset.slide = "");

LiveDemo.fixers.css.push(code => {
	if (!/\{[\S\s]+\}/.test(code.replace(/'[\S\s]+'/g, ""))) {
		return `.slide {
	${code}
}`;
	}
});

LiveDemo.baseCSS = `body {
	font: 200% system-ui, Helvetica Neue, Segoe UI, sans-serif;
}

input, select, textarea, button {
	font: inherit;
}

input[type="number"] {
	width: 4em;
}
`;

LiveDemo.hooks.add("after-init", function() {
	if (this.isolated) {
		// Next & previous slide buttons
		create({
			html: `<button class="prev" title="Previous slide">◂</button>`,
			start: this.controls,
			events: {
				click: Inspire.previous
			}
		});

		create({
			html: `<button class="next" title="Next slide">Next ▸</button>`,
			in: this.controls,
			events: {
				click: Inspire.next
			}
		});
	}

	if (this.script && this.minimal) {
		let pauses = JSON.parse(this.script.textContent).filter(step => step.type === "pause").length;

		// Trigger play automatically when you hit next
		for (let i = 0; i < pauses + 1; i++) {
			this.controls.insertAdjacentHTML("beforeend", `<inspire-action target="button.replay" once>▸</inspire-action>`);
		}

		if (this.container === Inspire.currentSlide) {
			Inspire.updateItems();
		}
	}
});

LiveDemo.hooks.add("scoperule", function(env) {
	let selector = env.rule.selectorText;

	if (selector == "article" || selector == ".slide") {
		env.rule.selectorText = `#${env.container.id}`;
		env.returnValue = undefined;
	}
})

if (!Prism.Live) {
	// Filter loaded languages to only languages used in demos
	var languages = [];

	for (let [id, lang] of Object.entries(prism.meta.languages)) {
		if (id === lang.id && $(`.demo.slide .language-${id}, .language-${id} .demo.slide, .demo.slide.language-${id}`)) {
			languages.push(id);
		}
	}

	console.info("Prism Live not loaded. Loading from live.prismjs.com, with language(s) " + languages.join(", "));
	let loaded = await import(`https://live.prismjs.com/src/prism-live.js?load=${languages.join(",")}`);
	for (let delay=100; delay < 1000; delay += 100) {
		if (Prism.Live) {
			break;
		}
		await timeout(delay);
	}
	await Prism.Live.ready;

	// Move Prism Live CSS before ours
	var ourCSS = $("link[href$='livedemo/plugin.css']");
	var liveCSS = $("link[href$='prism-live.css']");
	if (ourCSS && liveCSS) {
		liveCSS.after(ourCSS);
	}
}

var baseCSSTemplate = $(".live-demo-base-css");
if (baseCSSTemplate) {
	// textContent doesn't work on <template>
	LiveDemo.baseCSS = baseCSSTemplate.textContent || baseCSSTemplate.innerHTML;
}

document.addEventListener("slidechange", evt => {
	let slide = evt.target;
	if (slide.classList.contains("demo")){
		let demo = LiveDemo.init(evt.target);

		for (let id in demo.editors) {
			demo.editors[id].textarea.dispatchEvent(new InputEvent("input"));
		}
	}
});

Inspire.slideshowCreated.then(() => {
	if (Inspire.currentSlide?.classList.contains("demo")){
		LiveDemo.init(Inspire.currentSlide);
	}

	// var io = new IntersectionObserver(entries => {
	// 	entries.forEach(entry => LiveDemo.init(entry.target));
	// });

	// $$(".demo.slide").forEach(demo => {
	// 	io.observe(demo);
	// });
});

export {LiveDemo};