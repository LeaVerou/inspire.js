/**
 * Inspire.js
 * https://inspirejs.org
 * MIT Licensed
 * Copyright (C) 2010-2018 Lea Verou, http://lea.verou.me
 */

(async function(body, html){

if (!window.Bliss) {
	// Load Bliss if not loaded
	console.log("Bliss not loaded. Loading remotely from blissfuljs.com");

	let bliss = document.createElement("script");
	bliss.src = "https://blissfuljs.com/bliss.shy.min.js";
	document.head.appendChild(bliss);

	await new Promise(resolve => bliss.onload = resolve);
}

// Cache <title> element, we may need it for slides that don"t have titles
var documentTitle = document.title + "";
var scriptSrc = document.currentScript ? document.currentScript.src : "";

var _ = class Inspire {
	constructor() {
		var me = this;

		// Current slide
		this.index = this.slide = 0;

		// Current .delayed item in the slide
		this.item = 0;

		_.hooks.run("init-start");

		// Create slide indicator
		this.indicator = $.create({
			id: "indicator",
			inside: body
		});

		// Add on screen navigation
		var onscreen = $.create("nav", {
			id: "onscreen-nav",
			hidden: true,
			inside: body,
			contents: [
				{
					tag: "button",
					className: "onscreen-nav prev",
					textContent: "◂",
					type: "button",
					events: {
						click: evt => me.previous()
					}
				},
				{
					tag: "button",
					className: "onscreen-nav next",
					textContent: "Next ▸",
					type: "button",
					events: {
						click: evt => me.next()
					}
				}
			]
		});

		// Expand multiple imported slides
		$$(".slide[data-base][data-src*=\" \"]").forEach(function(slide) {
			var hashes = slide.getAttribute("data-src").split(/\s+/).forEach(function (hash) {
				var s = slide.cloneNode(true);
				s.setAttribute("data-src", hash);
				slide.parentNode.insertBefore(s, slide);
			});

			slide.parentNode.removeChild(slide);
		});

		// Get the slide elements into an array
		this.slides = $$(".slide", body);

		// Get the overview
		this.overview = function(evt) {
			if (body.classList.contains("show-thumbnails")) {
				body.classList.remove("headers-only");
			}
			else {
				if (evt && (!evt.shiftKey || !evt.ctrlKey)) {
					body.classList.add("headers-only");
				}

				body.addEventListener("click", function(evt) {
					var slide = evt.target.closest(".slide");

					if (slide) {
						me.goto(slide.id);
						setTimeout(() => me.adjustFontSize(), 1000); // for Opera
					}

					body.classList.remove("show-thumbnails");
					body.classList.remove("headers-only");
				}, {
					capture: false,
					once: true
				});
			}

			body.classList.toggle("show-thumbnails");
		};

		// Process iframe slides
		$$(".slide[data-src]:not([data-base]):empty").forEach(slide => {
			var iframe = $.create("iframe", {
				"data-src": slide.getAttribute("data-src"),
				inside: slide
			});


			slide.removeAttribute("data-src");

			var src = iframe.src || iframe.getAttribute("data-src");

			slide.classList.add("iframe");

			if (!slide.classList.contains("notitle")) {
				addTitle(slide, src, iframe.title);
			}

			slide.classList.add("onscreen-nav");
		});

		this.isIpad = navigator.userAgent.indexOf("iPad;") > -1;

		// Order of the slides
		this.order = [];

		for (var i=0; i<this.slides.length; i++) {
			var slide = this.slides[i]; // to speed up references

			// Asign ids to slides that don"t have one
			if (!slide.id) {
				slide.id = "slide" + (i+1);
			}

		// Set data-title attribute to the title of the slide
		var title = slide.title || slide.getAttribute("data-title");

		if (title) {
			slide.removeAttribute("title");
		}
		else {
			// no title attribute, fetch title from heading(s)
			var heading = $("hgroup", slide) || $("h1,h2,h3,h4,h5,h6", slide);

			if (heading && heading.textContent.trim()) {
				title = heading.textContent;
			}
		}

		if (title) {
			slide.setAttribute("data-title", title);
		}

			slide.setAttribute("data-index", i);

			var imp = slide.getAttribute("data-import"),
				imported = imp? this.getSlideById(imp) : null;

			this.order.push(imported? +imported.getAttribute("data-index") : i);

			// [data-steps] can be used to define steps (applied through the data-step
			// property), used in CSS to go through multiple states for an element
			var stepped = $$("[data-steps]", slide);

			if (slide.hasAttribute("data-steps")) {
				stepped.push(slide);
			}

			stepped.forEach(function(element) {
				var steps = +element.getAttribute("data-steps");
				element.removeAttribute("data-step");

				for (var i=0; i<steps; i++) {
					var dummy = document.createElement("span");
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
		}

		// Adjust the font-size when the window is resized
		addEventListener("resize", this, false);

		// In some browsers DOMContentLoaded is too early, so try again onload
		addEventListener("load", this, false);

		addEventListener("hashchange", this, false);

		// If there"s already a hash, update current slide number...
		this.handleEvent({type: "hashchange"});

		document.addEventListener("keyup", this, false);
		document.addEventListener("keydown", this, false);

		this.currentSlide.dispatchEvent(new CustomEvent("slidechange", {
			"bubbles": true
		}));

		$$('link[rel~="csss-import"]').forEach(function (link) {
			var url = link.href;
			var id = link.id;
			var slides = $$('.slide[data-base="' + id + '"][data-src^="#"]');
			var isSlideshow = link.rel.indexOf("slides") > -1;

			if (slides.length) {
				var iframe = document.createElement("iframe");
				var hash = slides[0].getAttribute("data-src");
				iframe.className = "csss-import";
				iframe.src = url + hash;

				document.body.insertBefore(iframe, document.body.firstChild);

				// Process the rest of the slides, which should use the same iframe
				slides.forEach(function (slide) {
					var hash = slide.getAttribute("data-src");

					slide.classList.add("dont-resize");

					this.onSlide(slide.id, function () {
						onscreen.removeAttribute("hidden");

						iframe.src = iframe.src.replace(/#.+$/, hash);
						iframe.className = "csss-import show";
					});
				}, this);
			}
		}, this);

		function addTitle(slide, url, title) {
			var h = document.createElement("h1"),
				a = document.createElement("a");

			title = title || slide.title || slide.getAttribute("data-title") ||
						url.replace(/\/#?$/, "").replace(/^\w+:\/\/(www\.)?/, "");

			a.href = url;
			a.target = "_blank";
			a.textContent = title;
			h.appendChild(a);

			slide.appendChild(h);
		}

		document.body.dispatchEvent(new CustomEvent("inspireinit", {
			"bubbles": true
		}));

		_.hooks.run("init-end", this);
	}

	handleEvent(evt) {
		var me = this;

		// Prevent script from hijacking the user’s navigation
		if (evt.metaKey && evt.keyCode) {
			return true;
		}

		switch (evt.type) {
			/**
				Keyboard navigation
				Ctrl+G : Go to slide...
				Ctrl+H : Show thumbnails and go to slide
				Ctrl+P : Presenter view
				(Shift instead of Ctrl works too)
			*/
			case "keyup":
				if ((evt.ctrlKey || evt.shiftKey) && !evt.altKey && !/^(?:input|textarea)$/i.test(document.activeElement.nodeName)) {

					switch (evt.key) {
						case "G": // G
							var slide = prompt("Which slide?");
							me.goto(+slide? slide - 1 : slide);
							break;
						case "H": // H
							if (evt.ctrlKey) {
								me.overview(evt);
							}
							break;
						default:
							_.hooks.run("keyup", {evt, context: this});
					}
				}
				break;
			case "keydown":
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
				if(evt.target === body || evt.target === body.parentNode || evt.altKey) {
					if(evt.keyCode >= 32 && evt.keyCode <= 40) {
						evt.preventDefault();
					}

					switch (evt.key) {
						case "PageUp":
							this.previous();
							break;
						case "PageDown":
							this.next();
							break;
						case "End":
							this.end();
							break;
						case "Home":
							this.start();
							break;
						case "ArrowLeft": // <-
						case "ArrowUp":
							this.previous(evt.ctrlKey || evt.shiftKey);
							break;
						case " ": // space
						case "ArrowRight": // ->
						case "ArrowDown":
							this.next(evt.ctrlKey || evt.shiftKey);
							break;
					}
				}
				break;
			case "load":
			case "resize":
				this.adjustFontSize();
				break;
			case "hashchange":
				this.goto(location.hash.substr(1) || 0);
		}
	}

	start() {
		this.goto(0);
	}

	end() {
		this.goto(this.slides.length - 1);
	}

	/**
		@param hard {Boolean} Whether to advance to the next slide (true) or
			just the next step (which could very well be showing a list item)
	 */
	next(hard) {
		if (!hard && this.items.length) {
			this.nextItem();
		}
		else {
			this.goto(this.index + 1);

			this.item = 0;

			// Mark all items as not displayed, if there are any
			if (this.items.length) {
				for (var i=0; i<this.items.length; i++) {
					var classes = this.items[i].classList;
					if (classes) {
						classes.remove("displayed");
						classes.remove("current");
					}
				}
			}
		}
	}

	nextItem() {
		if (this.item < this.items.length) {
			this.gotoItem(++this.item);
		}
		else {
			this.item = 0;
			this.next(true);
		}
	}

	previous(hard) {
		if (!hard && this.item > 0) {
			this.previousItem();
		}
		else {
			this.goto(this.index - 1);

			this.item = this.items.length;

			// Mark all items as displayed, if there are any
			if (this.items.length) {
				for (var i=0; i<this.items.length; i++) {
					if (this.items[i].classList) {
						this.items[i].classList.add("displayed");
					}
				}

				// Mark the last one as current
				var lastItem = this.items[this.items.length - 1];

				lastItem.classList.remove("displayed");
				lastItem.classList.add("current");
			}
		}
	}

	previousItem() {
		this.gotoItem(--this.item);
	}

	getSlideById(id) {
		return $(".slide#" + id);
	}

	/**
		Go to an aribtary slide
		@param which {String|Integer} Which slide (identifier or slide number)
	*/
	goto(which) {
		var slide;

		// We have to remove it to prevent multiple calls to goto messing up
		// our current item (and there"s no point either, so we save on performance)
		window.removeEventListener("hashchange", this, false);

		var id;

		if (which + "" === which) { // Argument is a slide id
			slide = this.getSlideById(which);

			if (slide) {
				this.slide = this.index = +slide.getAttribute("data-index");
				location.hash = "#" + which;
			}
			else if (/^slide(\d+)$/.test(which)) { // No slide found with that id. Perhaps it's in the slideN format?
				which = which.slice(5) - 1;
			}
			else {
				// No slide found
			}
		}

		if (which + 0 === which && which in this.slides) {
			// Argument is a valid slide number
			this.index = which;
			this.slide = this.order[which];

			slide = this.currentSlide;

			location.hash = "#" + slide.id;
		}

		if (slide) { // Slide actually changed, perform any other tasks needed
			document.title = slide.getAttribute("data-title") || documentTitle;

			if (slide.classList.contains("iframe")) {
				var iframe = $("iframe", slide), src;

				if (iframe && !iframe.hasAttribute("src") && (src = iframe.getAttribute("data-src"))) {
					iframe.setAttribute("src", src);
				}
			}
			else {
				this.adjustFontSize();
			}

			$.toggleAttribute($("#onscreen-nav"), "hidden", "", !this.isIpad && !slide.classList.contains("onscreen-nav"));

			// Hide iframes from CSSS imports
			$$("iframe.csss-import").forEach(iframe => iframe.classList.remove("show"));

			this.indicator.textContent = this.index + 1;

			// Update items collection
			this.items = $$(".delayed, .delayed-children > *", this.currentSlide);
			_.stableSort(this.items, function(a, b) {
				return (a.getAttribute("data-index") || 0) - (b.getAttribute("data-index") || 0);
			});
			this.item = 0;

			this.projector && this.projector.goto(which);

			// Update next/previous
			var previousPrevious = this.slides.previous;
			var previousNext = this.slides.next;

			this.slides.previous = this.slides[this.order[this.index - 1]];
			this.slides.next = this.slides[this.order[this.index + 1]];

			this.slides.previous && this.slides.previous.classList.add("previous");
			this.slides.next && this.slides.next.classList.add("next");

			if (previousPrevious && previousPrevious != this.slides.previous) {
				previousPrevious.classList.remove("previous");
			}

			if (previousNext && previousNext != this.slides.next) {
				previousNext.classList.remove("next");
			}

			requestAnimationFrame(() => {
				slide.dispatchEvent(new CustomEvent("slidechange", {
					"bubbles": true
				}));
			});
		}

		// If you attach the listener immediately again then it will catch the event
		// We have to do it asynchronously
		requestAnimationFrame(() => addEventListener("hashchange", this, false));
	}

	gotoItem(which) {
		this.item = which;

		var items = this.items, classes;

		for (var i=items.length; i-- > 0;) {
			classes = this.items[i].classList;

			classes.remove("current");
			classes.remove("displayed");

			if (classes.contains("dummy") && items[i].dummyFor) {
				items[i].dummyFor.removeAttribute("data-step");
			}
		}

		for (var i=this.item - 1; i-- > 0;) {
			items[i].classList.add("displayed");
		}

		if (this.item > 0) { // this.item can be zero, at which point no items are current
			var item = items[this.item - 1];

			item.classList.add("current");

			// support for nested lists
			for (var i = this.item - 1, cur = items[i], j; i > 0; i--) {
			  j = items[i - 1];
			  if (j.contains(cur)) {
				j.classList.remove("displayed");
				j.classList.add("current");
			  }
			}

			if (item.classList.contains("dummy") && item.dummyFor) {
				item.dummyFor.setAttribute("data-step", item.dummyIndex);
			}
		}

		this.projector && this.projector.gotoItem(which);
	}

	adjustFontSize() {
		// Cache long lookup chains, for performance
		var scrollRoot = html.scrollHeight? html : body;
		var slide = this.currentSlide;

		// Clear previous styles
		html.style.fontSize = "";

		if (body.classList.contains("show-thumbnails")
			|| slide.classList.contains("dont-resize")) {
			return;
		}

		for (
			var percent = 100;
			(scrollRoot.scrollHeight > innerHeight || scrollRoot.scrollWidth > innerWidth) && percent >= 35;
			percent-=5
		) {
			html.style.fontSize = percent + "%";
		}

		// Individual slide

		if (slide.clientHeight && slide.clientWidth) {
			// Strange FF bug: scrollHeight doesn"t work properly with overflow:hidden
			var previousStyle = slide.getAttribute("style");
			slide.style.overflow = "auto";

			for (
				;
				(slide.scrollHeight > slide.clientHeight || slide.scrollWidth > slide.clientWidth) && percent >= 35;
				percent--
			) {
				html.style.fontSize = percent + "%";
			}

			slide.setAttribute("style", previousStyle);
		}

		if (percent <= 35) {
			// Something probably went wrong, so just give up altogether
			html.style.fontSize = "";
		}
	}

	// Get current slide as an element
	get currentSlide() {
		return this.slides[this.slide];
	}

	// Is the element on the current slide?
	onCurrent(element) {
		var slide = _.getSlide(element);

		if (slide) {
			return "#" + slide.id === location.hash;
		}

		return false;
	}

	onSlide(id, callback, once) {
		var me = this;

		id = (id.indexOf("#") !== 0? "#" : "") + id;

		var fired = false;

		if (id == location.hash) {
			callback.call(this.currentSlide);
			fired = true;
		}

		if (!fired || !once) {
			addEventListener("hashchange", function callee() {
				if (id == location.hash) {
					callback.call(me.slides[me.slide]);
					fired = true;

					if (once) {
						removeEventListener("hashchange", callee);
					}
				}

			});
		}
	}

	static getSlide(element) {
		return element.closest(".slide");
	}

	// http://ichuan.net/post/52/stable-sort-of-javascript-array/
	static stableSort(arr, fn) {
		if (!fn) {
			return arr.sort();
		}

		var newArr = arr.map((i, j) => {
			return {i, j};
		});

		return newArr.sort((a, b) => {
			var result = fn(a.i, b.i);
			return result === 0? a.j - b.j : result;
		}).map(i => i.i);
	}

	static load(url, base = location.href) {
		url = new URL(url, base);

		if (/\.css$/.test(url.pathname)) {
			// CSS file
			return new Promise((resolve, reject) => {
				$.create("link", {
					"href": url,
					"rel": "stylesheet",
					"inside": document.head,
					"onload": resolve,
					"onerror": reject
				});
			});
		}

		// JS file
		return $.include(url);
	}

	static loadPlugin(id) {
		_.load(`${id}/plugin.css`, scriptSrc).catch(e => e);
		return _.load(`${id}/plugin.js`, scriptSrc);
	}

	static init() {
		var dependencies = [];

		for (let id in _.plugins) {
			if ($(_.plugins)) {
				dependencies.push(_.loadPlugin(id));
			}
		}

		Promise.all(dependencies).then(() => {
			window.inspire = new _();
		});
	}
};

// Plugin ids and selectors
// If selector matches anything, plugin is loaded
_.plugins = {
	timer: "[data-duration]",
	presenter: ".enable-presenter",
	slidescript: "slide-script",
	slidestyle: "style[data-slide]"
};

_.hooks = new $.Hooks();

// Account for slide-specific style
document.documentElement.addEventListener("slidechange", function(evt) {
	_.hooks.run("slidechange", evt.target);
});

document.addEventListener("DOMContentLoaded", _.init);

})(document.body, document.documentElement);
