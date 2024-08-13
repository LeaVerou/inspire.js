import * as plugins from "./plugins.js";
import * as util from "./util.js";
import * as imports from "./imports.js"

const { $, $$, bind, Hooks, create, } = util;

if ($(".additive-steps")) {
	console.warn(".additive-steps is not used anymore. Simply use data-step-all instead of data-step for additive steps.");
}

// Cache <title> element, we may need it for slides that don"t have titles
const documentTitle = document.title + "";

let _ = {
	loaded: util.defer(),

	// Plugin ids and selectors
	// If selector matches anything, plugin is loaded
	plugins,

	// Inspire will not initialize until any promises pushed here are resolved
	// This is useful for plugins to delay initialization until they've fetched stuff
	delayInit: [],

	// Elements to ignore (works with nesting too)
	// This works better than commenting, which cannot be
	ignore: ".inspire-remove, .inspire-comment",

	// Arrow keys inside these elements will not trigger navigation
	editableElements: "input, textarea, select, button, [contenteditable]",

	ready: util.defer(),
	slideshowCreated: util.defer(),
	importsLoaded: imports.loaded,
	loadImports: imports.load,

	hooks: new Hooks(),

	async setup() {
		this.loaded.resolve(true);

		$$(this.ignore).forEach(el => el.remove());

		await this.loadImports();

		this.dependencies = plugins.loadAll();

		this.domSetup();

		await Promise.allSettled(this.dependencies);

		let loaded = Object.keys(plugins.loaded);
		console.info("Inspire.js plugins loaded:", loaded.length? loaded.join(", ") : "none");

		this.ready.resolve();

		await Promise.allSettled(this.delayInit);
		this.init();
	},

	domSetup () {
		// Make all external links open in a new window
		$$('a[href^="http"]:not([target])').forEach(a => a.target = "_blank");

		// Set <html> attributes from query string
		const url = new URL(location);
		const params = url.searchParams;

		for (let [key, value] of params) {
			document.documentElement.setAttribute("data-" + key, value);
		}

		if (params.get("profile")) {
			this.profile = params.get("profile");
		}
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
		_.indicator = create.in(document.body, `<div id=indicator></div>`);

		// Add on screen navigation
		let onscreen = create.in(document.body, `<div id=onscreen-nav class="hidden">
			<button class="onscreen-nav prev" type=button>◂</button>
			<button class="onscreen-nav next" type=button>Next ▸</button>
		</div>`);

		onscreen.children[0].addEventListener("click", evt => _.previous());
		onscreen.children[1].addEventListener("click", evt => _.next());

		// Get the slide elements into an array
		_.slides = $$(`.slide:not(${ _.ignoreSlides })`, document.body);
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
				util.deduplicateId(slide);
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

			for (let element of stepped) {
				let steps = +element.getAttribute("data-steps");
				element.setAttribute("data-step-all", "0");
				element.removeAttribute("data-step");
				element.dummies = [];

				for (let i=0; i<steps; i++) {
					let dummy = create({
						html: `<span class="delayed dummy" style="display: none" data-for-step="${i + 1}"></span>`,
						element,
						position: element === slide ? "in" : "before",
						dummyFor: element,
					});
					element.dummies.push(dummy);
				}
			}
		} // end slide loop

		slideContainers.delete(document.body);
		slideContainers.delete(document.documentElement);
		slideContainers.delete(document);
		slideContainers.forEach(el => el.classList.add("slide-container"));

		addEventListener("hashchange", _.hashchange);

		_.hooks.run("init-before-first-goto", this);

		// If there"s already a hash, update current slide number
		_.goto(location.hash.substr(1) || 0);

		bind(window, {
			// Adjust the font-size when the window is resized
			"load resize": evt => _.adjustFontSize(),
			/**
				Keyboard navigation
				Ctrl+G : Go to slide...
				(Shift instead of Ctrl works too)
			*/
			"keyup": evt => {
				if (!document.activeElement.matches(_.editableElements)) {
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
				if (evt.altKey || evt.target.contains(_.currentSlide) || !evt.target.matches(_.editableElements)) {
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
		this.delayedLast = this.currentSlide.matches(".delayed-last, .delayed-last *");

		if (_.item < _.items.length || this.delayedLast && _.item === _.items.length) {
			_.gotoItem(++_.item);
		}
		else {
			// Finished all slide items, go to next slide
			_.item = 0;
			_.next(true);
		}
	},

	previous (hard) {
		if (!hard && _.item > 0) {
			_.previousItem();
		}
		else {
			_.goto(_.index - 1);

			_.item = _.items.length;

			// Mark all items as displayed, if there are any
			if (_.items.length) {
				_.items.forEach(item => item.classList.add("displayed"));
				_.items.forEach(item => item.classList.remove("future"));

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
		globalThis.removeEventListener("hashchange", _.hashchange);

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

			// Adjust font size to prevent scrolling
			_.adjustFontSize();

			// Adjust color-scheme of Inspire chrome
			document.documentElement.style.setProperty("color-scheme", "");
			document.documentElement.style.setProperty("color-scheme", getComputedStyle(slide).getPropertyValue("color-scheme"));

			// Show or hide onscreen navigation
			$("#onscreen-nav").classList.toggle("hidden", !slide.matches(".onscreen-nav"));

			// Update the slide number
			_.indicator.textContent = env.slide.classList.contains("no-slide-number")? "" : _.index + 1;

			// Are there any autoplay videos?
			processAutoplayVideos(env.slide);

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
				let evt = new Event("slidechange", {"bubbles": true});
				Object.assign(evt, {prevSlide, firstTime});
				slide.dispatchEvent(evt);

				_.hooks.run("slidechange-async", env);
			});
		}

		// If you attach the listener immediately again then it will catch the event
		// We have to do it asynchronously
		setTimeout(() => addEventListener("hashchange", _.hashchange), 200);
	},

	/**
	 * Run code once on a slide when the slide is active
	 * @param {String | HTMLElement} ref CSS selector or slide element
	 * @returns {Promise<HTMLElement>} The slide that was activated
	 */
	async on (ref) {
		if (/^[\w-]+$/.test(ref)) {
			console.warn("Inspire.on() expects a selector now, not an id");
			ref = "#" + ref;
		}

		if (_.currentSlide === ref || _.currentSlide?.matches(ref)) {
			return _.currentSlide;
		}

		return new Promise(resolve => {
			let callback = evt => {
				if (ref === evt.target || typeof ref === "string" && evt.target.matches(ref)) {
					resolve(evt.target);
					evt.target.removeEventListener("slidechange", callback);
				}
			};

			document.body.addEventListener("slidechange", callback);
		});
	},

	/**
	 * Run code for specific elements, once, only when the slide they appear in becomes active
	 * @param {string} selector
	 * @param {function} callback
	 * @returns {HTMLElement[]} The slides that contain elements matching the selector
	 */
	for (selector, callback) {
		let slides = $$(`.slide:has(${ selector})`);

		for (let slide of slides) {
			_.on(slide).then(slide => {
				for (let element of $$(selector, slide)) {
					callback(element);
				}
			});
		}

		return slides;
	},

	updateItems () {
		_.items = $$(".delayed, .delayed-children > *", _.currentSlide);
		_.items = _.items.sort((a, b) => {
			return (a.getAttribute("data-index") || 0) - (b.getAttribute("data-index") || 0);
		});
		document.documentElement.style.setProperty("--total-items", _.items.length);
		document.documentElement.classList.toggle("has-items", _.items.length > 0);

		if (_.items.length > 0) {
			document.documentElement.style.setProperty("--items-done", 0);
		}
		else {
			document.documentElement.style.removeProperty("--items-done");
		}

		for (let element of _.items) {
			if (!element.matches(".current, .displayed")) {
				element.classList.add("future");
			}
		}
	},

	/**
	 * Go to a specific item in the current slide
	 * @param {number} which 1-based index of the item to go to (0 means no items are current, just the slide itself)
	 */
	gotoItem (which) {
		_.item = which;

		if (_.items.length > 0 && !_.items[which - 1]?.isConnected) {
			// Items are floating in DOM hyperspace, re-fetch
			_.updateItems();
		}

		let index = which - 1;

		for (let i=0; i<_.items.length; i++) {
			let item = _.items[i];
			let [future, current, displayed] = [i > index, i === index, i < index];
			item.classList.toggle("future", future);
			item.classList.toggle("current", current);
			item.classList.toggle("displayed", displayed);

			let stepElement = item.classList.contains("dummy") && item.dummyFor;

			if (current) {
				item.dispatchEvent(new Event("itemcurrent", {bubbles: true}));

				// Are there any autoplay videos?
				processAutoplayVideos(item);

				// support for nested lists
				for (let i = _.item - 1, cur = _.items[i], j; i > 0; i--) {
					j = _.items[i - 1];
					if (j.contains(cur)) {
						j.classList.remove("displayed", "future");
						j.classList.add("current");
						j.dispatchEvent(new Event("itemcurrent", {bubbles: true}));
					}
				}
			}

			// Update item index
			let done = _.items.length - _.items.filter(item => item.matches(":not(.current, .displayed)")).length;
			document.documentElement.style.setProperty("--items-done", done);

			// Deal with data-steps
			if (stepElement) {
				let step;

				if (item.classList.contains("current")) {
					step = +item.getAttribute("data-for-step");
				}
				else {
					// Maybe some other item is current?
					let current = stepElement.dummies.find(dummy => dummy.classList.contains("current"));
					if (!current) {
						step = 0;
					}
					// We don’t need to deal with the current dummy, it will be dealt with when its turn comes
				}

				if (step > 0) {
					stepElement.setAttribute("data-step", step);
					stepElement.setAttribute("data-step-all", Array(step + 1).fill().map((_, i) => i).join(" "));
				}
				else if (step === 0) {
					stepElement.removeAttribute("data-step");
					stepElement.setAttribute("data-step-all", "0");
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

		let cs = getComputedStyle(slide);

		if (cs.getPropertyValue("--dont-resize") || cs.getPropertyValue("--font-sizing")?.trim() === "fixed" || cs.overflow === "hidden" || cs.overflow === "clip") {
			return;
		}

		slide.style.fontSize = "";

		if (slide.scrollHeight <= innerHeight && slide.scrollWidth <= innerWidth) {
			return;
		}

		let size = parseInt(getComputedStyle(slide).fontSize);
		let prev = {scrollHeight: slide.scrollHeight, scrollWidth: slide.scrollWidth};
		let limit = 0;

		for (
			let factor = size / parseInt(getComputedStyle(document.body).fontSize);
			(slide.scrollHeight > innerHeight || slide.scrollWidth > innerWidth) && factor >= 1;
			factor -= .1
		) {
			slide.style.fontSize = factor * 100 + "%";

			if (prev && prev.scrollHeight <= slide.scrollHeight && prev.scrollWidth <= slide.scrollWidth) {
				// Reducing font-size is having no effect, abort mission after a few more tries
				if (++limit > 5) {
					break;
				}
			}
			else {
				limit = 0;
				prev = null;
			}
		}
	},

	// Get current slide as an element
	get currentSlide() {
		return _.slides?.[_.slide];
	},

	getSlideById(id) {
		id = id[0] === "#"? id : "#" + id;
		return $(".slide" + id);
	},

	// Get the slide an element belongs to
	getSlide(element) {
		return element.closest(".slide");
	},

	// Plugins can call this to signify to other plugins that the DOM changed
	domchanged: element => {
		let evt = new Event("inspire-domchanged", {bubbles: true});
		element.dispatchEvent(evt);
	},
};

_.util = {};
Object.assign(_.util, util);

export default _;

function processAutoplayVideos (root) {
	// Are there any autoplay videos?
	let videos = root.matches("video[autoplay]") ? [root] : $$("video[autoplay]", root);
	for (let video of videos) {
		let delayed = video.closest(".delayed, .delayed-children > *");

		if (delayed?.classList.contains("future")) {
			// Video is in a future item, don't autoplay
			continue;
		}

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
	return videos;
}
