	/**
	 * Inspire.js
	 * https://inspirejs.org
	 * MIT Licensed
	 * Copyright (C) 2010-2018 Lea Verou, http://lea.verou.me
	 */

import * as plugins from "./src/plugins.js";
import * as util from "./src/util.js";

let _ = {
	// Plugin ids and selectors
	// If selector matches anything, plugin is loaded
	plugins,

	// Inspire will not initialize until any promises pushed here are resolved
	// This is useful for plugins to delay initialization until they've fetched stuff
	delayInit: [],

	slideshowCreated: util.defer(),
	importsLoaded: util.defer(),

	async setup() {
		_.dependencies = [];

		await _.importsLoaded;

		_.dependencies.push(...plugins.loadAll());

		_.ready = Promise.allSettled(_.dependencies).then(() => {
			let loaded = Object.keys(plugins.loaded);
			console.log("Inspire.js plugins loaded:", loaded.length? loaded.join(", ") : "none");

			Promise.all(_.delayInit).then(_.init);
		});

		// Make all external slides open in a new window
		$$('a[href^="http"]:not([target])').forEach(a => a.target = "_blank");
	},

	init() {
		// Current slide
		_.index = 0;

		// Current .delayed item in the slide
		_.item = 0;

		// Slides that have been displayed at least once
		_.displayed = new Set();

		_.hooks.run("init-start");

		// Create slide indicator
		_.indicator = $.create({
			id: "indicator",
			inside: document.body
		});

		// Add on screen navigation
		let onscreen = $.create("nav", {
			id: "onscreen-nav",
			className: "hidden",
			inside: document.body,
			contents: [
				{
					tag: "button",
					className: "onscreen-nav prev",
					textContent: "◂",
					type: "button",
					events: {
						click: evt => _.previous()
					}
				},
				{
					tag: "button",
					className: "onscreen-nav next",
					textContent: "Next ▸",
					type: "button",
					events: {
						click: evt => _.next()
					}
				}
			]
		});

		// Get the slide elements into an array
		_.slides = $$(".slide", document.body);
		document.documentElement.style.setProperty("--total-slides", _.slides.length);

		// Order of the slides
		_.order = [];

		if (!_.slides.length) {
			console.warn('[Inspire.js] There are no slides! Add some elements with class="slide" to create a presentation.')
			return;
		}

		let slideContainers = new Set();

		for (let i=0; i<_.slides.length; i++) {
			let slide = _.slides[i];

			for (let ancestor = slide; (ancestor = ancestor.parentNode); ) {
				slideContainers.add(ancestor);
			}

			if (slide.id && !slide.dataset.originalid) {
				slide.dataset.originalid = slide.id;
			}

			// Set data-title attribute to the title of the slide
			let title = slide.title || slide.getAttribute("data-title");

			if (title) {
				slide.removeAttribute("title");
			}
			else {
				// no title attribute, fetch title from heading(s)
				let heading = $("h1, h2, h3, h4, h5, h6", slide);

				if (heading && heading.textContent.trim()) {
					title = heading.textContent;
				}

				if (!title && slide.id) {
					// Still no title, but it has an id, try from that
					title = slide.id.replace(/-(\w)/g, ($0, $1) => " " + $1.toUpperCase())
					                .replace(/^./, a => a.toUpperCase());
				}
			}

			if (title) {
				slide.setAttribute("data-title", title);

				if (!slide.id) {
					// If a slide has a title but not an id, get its id from that
					let id = title.replace(/[^\w\s-]/g, "") // Remove non-ASCII characters
							.trim().replace(/\s+/g, "-") // Convert whitespace to hyphens
							.toLowerCase();

					if (/\d/.test(id)) {
						// Make sure it doesn't start with a number
						id = "slide-" + id;
					}

					slide.id = id; // Ok if it's duplicate, next bit of code will fix that
				}
			}

			if (slide.id) {
				// If duplicate id, append number to make it unique
				let otherSlide = document.getElementById(slide.id);
				if (otherSlide && otherSlide !== slide) {
					// Id is not unique
					let i = 1, newId;

					do {
						i++;
						newId = slide.id + "-" + i;
					} while (document.getElementById(newId));

					slide.id = newId;
				}
			}
			else {
				// Asign ids to slides that don"t have one
				slide.id = "slide" + (i+1);
			}

			slide.setAttribute("data-index", i);
			let imp = slide.getAttribute("data-insert"),
				imported = imp? _.getSlideById(imp) : null;

			if (imp && !imported) {
				// data-insert to slide that does not exist, remove slide
				console.warn(`Slide not found for data-insert="${imp}", ignoring.`);
				slide.remove();
				_.slides.splice(i, 1);
				i--;
				continue;
			}

			_.order.push(imported? +imported.getAttribute("data-index") : i);

			// [data-steps] can be used to define steps (applied through the data-step
			// property), used in CSS to go through multiple states for an element
			let stepped = $$("[data-steps]", slide);

			if (slide.hasAttribute("data-steps")) {
				stepped.push(slide);
			}

			stepped.forEach(function(element) {
				let steps = +element.getAttribute("data-steps");
				element.removeAttribute("data-step");

				for (let i=0; i<steps; i++) {
					let dummy = document.createElement("span");
					dummy.style.display = "none";
					dummy.className = "delayed dummy";
					dummy.dummyFor = element;
					dummy.dummyIndex = i+1;

					if (element === slide) {
						slide.appendChild(dummy);
					}
					else {
						element.parentNode.insertBefore(dummy, element);
					}
				}
			});
		} // end slide loop

		slideContainers.delete(document.body);
		slideContainers.delete(document.documentElement);
		slideContainers.delete(document);
		slideContainers.forEach(el => el.classList.add("slide-container"));

		addEventListener("hashchange", _.hashchange);

		_.hooks.run("init-before-first-goto", this);

		// If there"s already a hash, update current slide number
		_.goto(location.hash.substr(1) || 0);

		$.bind(window, {
			// Adjust the font-size when the window is resized
			"load resize": evt => _.adjustFontSize(),
			/**
				Keyboard navigation
				Ctrl+G : Go to slide...
				(Shift instead of Ctrl works too)
			*/
			"keyup": evt => {
				if (!document.activeElement.matches("input, textarea, select, button")) {
					let letter = evt.key.toUpperCase();

					if (letter === "G" && (evt.ctrlKey || evt.shiftKey) && !evt.altKey) {
						let slide = prompt("Which slide?");
						_.goto(+slide? slide - 1 : slide);
					}
					else {
						_.hooks.run("keyup", {evt, letter, context: this});
					}
				}
			},
			/**
				Keyboard navigation
				Home : First slide
				End : Last slide
				Space/Up/Right arrow : Next item/slide
				Ctrl + Space/Up/Right arrow : Next slide
				Down/Left arrow : Previous item/slide
				Ctrl + Down/Left arrow : Previous slide
				(Shift instead of Ctrl works too)
			*/
			"keydown": evt => {
				if (evt.altKey || evt.target.contains(_.currentSlide)) {
					if (evt.keyCode >= 32 && evt.keyCode <= 40) {
						evt.preventDefault();
					}

					switch (evt.key) {
						case "PageUp":
							_.previous();
							break;
						case "PageDown":
							_.next();
							break;
						case "End":
							_.end();
							break;
						case "Home":
							_.start();
							break;
						case "ArrowLeft": // <-
						case "ArrowUp":
							_.previous(evt.ctrlKey || evt.shiftKey);
							break;
						case " ": // space
						case "ArrowRight": // ->
						case "ArrowDown":
							_.next(evt.ctrlKey || evt.shiftKey);
							break;
					}
				}
			}
		});

		_.hooks.run("init-end", this);

		_.slideshowCreated.resolve();

		return this;
	},

	hashchange(evt) {
		_.goto(location.hash.substr(1) || 0);
	},

	start() {
		_.goto(0);
	},

	end() {
		_.goto(_.slides.length - 1);
	},

	/**
		@param hard {Boolean} Whether to advance to the next slide (true) or
			just the next step (which could very well be showing a list item)
	 */
	next (hard) {
		if (!hard && _.items.length) {
			_.nextItem();
		}
		else {
			_.goto(_.index + 1);

			_.item = 0;

			// Mark all items as not displayed, if there are any
			_.items.forEach(item => item.classList.remove("displayed", "current"));
		}
	},

	nextItem() {
		if (_.item < _.items.length) {
			_.gotoItem(++_.item);
		}
		else {
			_.item = 0;
			_.next(true);
		}
	},

	previous(hard) {
		if (!hard && _.item > 0) {
			_.previousItem();
		}
		else {
			_.goto(_.index - 1);

			_.item = _.items.length;

			// Mark all items as displayed, if there are any
			if (_.items.length) {
				_.items.forEach(item => item.classList.add("displayed"));

				// Mark the last one as current
				let lastItem = _.items[_.items.length - 1];

				lastItem.classList.remove("displayed");
				lastItem.classList.add("current");
			}
		}
	},

	previousItem() {
		_.gotoItem(--_.item);
	},

	/**
		Go to an aribtary slide
		@param which {Element|String|Integer} Which slide (identifier or slide number)
	*/
	goto: function(which) {
		let slide;
		let prev = _.slide;

		// We have to remove it to prevent multiple calls to goto messing up
		// our current item (and there"s no point either, so we save on performance)
		window.removeEventListener("hashchange", _.hashchange);

		let isWhichAnId = which + "" === which;

		if (isWhichAnId) {
			// Argument is a slide id
			let id = which;
			which = $(which[0] === "#"? which : "#" + which);

			// Id is of the form #slide42, just find that slide by number
			if (!which && /^slide(\d+)$/.test(id)) {
				which = id.slice(5) - 1;
			}
		}

		if (which instanceof Element) {
			// Argument is an element
			// Is it a slide? Inside a slide? Contains a slide?
			slide = which.closest(".slide") || $(".slide", which);
		}

		if (!slide && isWhichAnId && localStorage.Inspire_currentSlide) {
			// No slide found with this id, load the one most recently accessed
			which = +localStorage.Inspire_currentSlide;
		}

		if (slide) {
			if (!slide.matches(":target") || location.hash !== "#" + slide.id) {
				location.hash = ""; // See https://twitter.com/LeaVerou/status/1046114577648422912
				location.hash = slide.id;
			}

			_.slide = _.index = +slide.getAttribute("data-index");
		}
		else if (which + 0 === which && which in _.slides) {
			// Argument is a valid slide number
			_.index = which;
			_.slide = _.order[which];

			slide = _.currentSlide;

			location.hash = "#" + slide.id;
		}

		if (prev !== _.slide) { // Slide actually changed, perform any other tasks needed
			document.title = slide.getAttribute("data-title") || documentTitle;

			let prevSlide = _.slides[prev];
			let firstTime = !_.displayed.has(slide);
			_.displayed.add(slide);

			// Which revisit is this?
			let revisit = 0;

			for (let i = 0; i<_.index; i++) {
				if (_.order[i] === _.slide) {
					revisit++;
				}
			}

			slide.dataset.visit = revisit + 1;

			let env = {slide, prevSlide, firstTime, which, context: this};
			_.hooks.run("slidechange", env);

			localStorage.Inspire_currentSlide = _.index;

			_.adjustFontSize();

			// Show or hide onscreen navigation
			$("#onscreen-nav").classList.toggle("hidden", !slide.matches(".onscreen-nav"));

			// Update the slide number
			_.indicator.textContent = env.slide.classList.contains("no-slide-number")? "" : _.index + 1;

			// Are there any autoplay videos?
			for (let video of $$("video[autoplay]", env.slide)) {
				if (video.currentTime > 0) {
					video.currentTime = 0;
				}

				if (video.paused) {
					video.play().catch(() => {
						video.addEventListener("click", evt => {
							video.play();
						}, {once: true});
					});
				}
			}

			// Make videos without visible controls play/pause on click
			for (let video of $$("video:not([controls])", env.slide)) {
				video.addEventListener("click", evt => {
					if (video.paused) {
						video.play();
					}
					else {
						video.pause();
					}
				});
			}

			// Update items collection
			_.updateItems();
			_.item = 0;

			// Update next/previous
			let previousPrevious = _.slides.previous;
			let previousNext = _.slides.next;

			_.slides.previous = _.slides[_.order[_.index - 1]];
			_.slides.next = _.slides[_.order[_.index + 1]];

			_.slides.previous && _.slides.previous.classList.add("previous");
			_.slides.next && _.slides.next.classList.add("next");

			if (previousPrevious && previousPrevious != _.slides.previous) {
				previousPrevious.classList.remove("previous");
			}

			if (previousNext && previousNext != _.slides.next) {
				previousNext.classList.remove("next");
			}

			// Run the slidechange event and hook
			requestAnimationFrame(() => {
				let evt = new CustomEvent("slidechange", {"bubbles": true});
				$.extend(evt, {prevSlide, firstTime});
				slide.dispatchEvent(evt);

				_.hooks.run("slidechange-async", env);
			});
		}

		// If you attach the listener immediately again then it will catch the event
		// We have to do it asynchronously
		setTimeout(() => addEventListener("hashchange", _.hashchange), 200);
	},

	on(slideId) {
		return new Promise(resolve => {
			_.hooks.add("slidechange", env => {
				if (_.currentSlide.id === slideId) {
					resolve(_.currentSlide);
				}
			});
		});
	},

	updateItems() {
		_.items = $$(".delayed, .delayed-children > *", _.currentSlide);
		_.items = _.items.sort((a, b) => {
			return (a.getAttribute("data-index") || 0) - (b.getAttribute("data-index") || 0);
		});
	},

	gotoItem(which) {
		_.item = which;

		if (_.items.length > 0 && !_.items[0].closest(".slide")) {
			// Items are floating in DOM hyperspace, re-fetch
			_.updateItems();
		}

		for (let item of _.items) {
			item.classList.remove("current", "displayed");

			if (item.classList.contains("dummy") && item.dummyFor) {
				item.dummyFor.removeAttribute("data-step");
			}
		}

		for (let i = _.item - 1; i-- > 0;) {
			_.items[i].classList.add("displayed");
		}

		if (_.item > 0) { // _.item can be zero, at which point no items are current
			let item = _.items[_.item - 1];

			item.classList.add("current");

			// support for nested lists
			for (let i = _.item - 1, cur = _.items[i], j; i > 0; i--) {
			  j = _.items[i - 1];
			  if (j.contains(cur)) {
				j.classList.remove("displayed");
				j.classList.add("current");
			  }
			}

			if (item.classList.contains("dummy") && item.dummyFor) {
				if (item.closest(".additive-steps")) {
					let numbers = [...Array(item.dummyIndex).keys()].map(n => n + 1);

					item.dummyFor.setAttribute("data-step", numbers.join(" "));
				}
				else {
					item.dummyFor.setAttribute("data-step", item.dummyIndex);
				}
			}
		}

		_.hooks.run("gotoitem-end", {which, context: this});
	},

	adjustFontSize() {
		let slide = _.currentSlide;

		if (!slide || document.body.matches(".show-thumbnails") || slide.matches(".dont-resize")) {
			return;
		}

		if (getComputedStyle(slide).getPropertyValue("--dont-resize")) {
			return;
		}

		slide.style.fontSize = "";

		if (slide.scrollHeight <= innerHeight && slide.scrollWidth <= innerWidth) {
			return;
		}

		let size = parseInt(getComputedStyle(slide).fontSize);
		let prev = {scrollHeight: slide.scrollHeight, scrollWidth: slide.scrollWidth};

		for (
			let factor = size / parseInt(getComputedStyle(document.body).fontSize);
			(slide.scrollHeight > innerHeight || slide.scrollWidth > innerWidth) && factor >= 1;
			factor -= .1
		) {
			slide.style.fontSize = factor * 100 + "%";

			if (prev && prev.scrollHeight <= slide.scrollHeight && prev.scrollWidth <= slide.scrollWidth) {
				// Reducing font-size is having no effect, abort mission
				break;
			}
			else {
				prev = null;
			}
		}
	},

	// Get current slide as an element
	get currentSlide() {
		return _.slides[_.slide];
	},

	getSlideById(id) {
		id = id[0] === "#"? id : "#" + id;
		return $(".slide" + id);
	},

	// Get the slide an element belongs to
	getSlide(element) {
		return element.closest(".slide");
	},

	async loadImports() {
		let parser = new DOMParser();

		_.imports = $$('link[rel="inspire-import"]').map(async link => {
			let response = await fetch(link.href);
			let text = await response.text();
			return {
				id: link.id,
				doc: parser.parseFromString(text, "text/html"),
				link
			};
		});

		let talkCSS = $('link[href$="talk.css"]');

		let ret = await Promise.all(_.imports.map(async imported => {
			let info = await imported;
			let link = info.link;
			let doc = info.doc;

			// Make sure local links in the import resolve correctly
			doc.head.append($.create(doc.createElement("base"), {href: link.href}));

			// Go through all linked resources and absolutize their URLs
			let attributes = ["src", "data-src", "href"];
			$$("[src], [data-src], [href]", doc).forEach(resource => {
				for (let attribute of attributes) {
					if (resource.hasAttribute(attribute)) {
						let url = new URL(resource.getAttribute(attribute), link.href);
						resource.setAttribute(attribute, url);
					}
				}
			});

			// Absolutize any URLs in style attributes
			for (let element of $$('[style*="url("]', doc)) {
				let style = element.getAttribute("style");
				let newStyle = style.replace(/url\(('|")?(.+?)\1\)/, ($0, quote, url) => {
					quote = quote || "'";
					return `url(${quote}${new URL(url, link.href)}${quote})`;
				});

				if (style !== newStyle) {
					element.setAttribute("style", newStyle);
				}
			}

			// Load stylesheets and talk.js from import
			let inspireCSS = $('link[href$="inspire.css"]');

			for (let link of $$('link[href$="talk.css"]', doc)) {
				let copy = link.cloneNode();

				if (talkCSS) {
					talkCSS.before(copy);
				}
				else {
					document.head.prepend(copy);
				}
			}

			for (let script of $$('script[src$="talk.js"]', doc)) {
				if (script.type == "module"){
					import(script.src);
				}
				else {
					$.create("script", {
						src: script.src,
						inside: document.head
					});
				}

			}

			// Replace imported slides with their correct HTML
			let inserted = {};
			for (let slide of $$(`.slide[data-insert^="${link.id}#"]`)) {
				let insert = slide.dataset.insert;
				let id = insert.match(/#.*$/)[0];

				if (inserted[insert]) {
					// Already inserted, just link to it
					slide.dataset.insert = inserted[insert].id || id;
				}
				else {
					inserted[insert] = slide;
					let remoteSlide = doc.querySelector(id);

					if (remoteSlide) {
						remoteSlide.setAttribute("data-import-id", remoteSlide.id);

						if ($(id)) {
							// Imported slide's id exists in the document already, prepend with import name
							remoteSlide.id = link.id + "-" + remoteSlide.id;
						}

						slide.replaceWith(remoteSlide);
					}
					else {
						console.warn(`${id} not found in ${link.id} import, ignoring.`);
						slide.remove();
					}
				}
			}

			return doc;
		}));

		_.importsLoaded.resolve();

		return ret;
	},

	// Plugins can call this to signify to other plugins that the DOM changed
	domchanged: element => {
		let evt = new CustomEvent("inspire-domchanged", {bubbles: true});
		element.dispatchEvent(evt);
	},
};

// Cache <title> element, we may need it for slides that don"t have titles
const documentTitle = document.title + "";

if (!window.Inspire || !window.Inspire.loaded) {
	window.Inspire = _;
	_.loaded = util.defer();

	(async () => {
		// Setup Inspire iif it has not already been loaded
		if (!window.Bliss) {
			// Load Bliss if not loaded
			console.log("Bliss not loaded. Loading remotely from blissfuljs.com");

			let bliss = document.createElement("script");
			bliss.src = "https://blissfuljs.com/bliss.shy.min.js";
			document.head.appendChild(bliss);

			await new Promise(resolve => bliss.onload = resolve);
		}

		window.$ = Bliss;
		window.$$ = $.$;

		_.hooks = new $.Hooks();
		_.loaded.resolve(true);

		const url = new URL(location);
		const profile = url.searchParams && url.searchParams.get("profile");

		if (profile) {
			_.profile = profile;
			document.documentElement.dataset.profile = profile;
		}

		await $.ready();

		// Commenting slides out works sometimes, but fails if the slides you're commenting also have comments.
		// These classes work with nesting too
		$$(".inspire-remove, .inspire-comment").forEach(element => element.remove());

		await _.loadImports();
		_.setup();
	})();


}
else {
	// If Inspire has already been loaded, export that and discard this one
	_ = window.Inspire;
}

export default _;

