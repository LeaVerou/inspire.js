/**
 * CSSS javascript code
 * @author Lea Verou (http://lea.verou.me)
 * @version 2.1
 */

/**
 * Make the environment a bit friendlier
 */
function $(expr, con) { return typeof expr === 'string'? (con || document).querySelector(expr) : expr; }
function $$(expr, con) { return [].slice.call((con || document).querySelectorAll(expr)); }

(function(head, body, html){

// Check for classList support and include the polyfill if it's not supported
if(!('classList' in body)) {
	var thisScript = $('script[src$="slideshow.js"]'),
	    script = document.createElement('script');
	    script.src = thisScript.src.replace(/\bslideshow\.js/, 'classList.js');
	thisScript.parentNode.insertBefore(script, thisScript);
}

// http://ichuan.net/post/52/stable-sort-of-javascript-array/
Array.prototype.stableSort = function (fn) {
  if (!fn) {
    return this.sort();
  }
  var newArr = this.map(function (i, j) { return {i:i, j:j}; });
  return newArr.sort(function (a, b) {
    result = fn(a.i, b.i);
    if (result === 0) {
      return a.j - b.j;
    }
    return result;
  }).map(function (i) { return i.i; });
};

// Cache <title> element, we may need it for slides that don't have titles
var documentTitle = document.title + '';

var _ = window.SlideShow = function(slide) {
	var me = this;

	// Set instance
	if(!window.slideshow) {
		window.slideshow = this;
	}

	// Current slide
	this.index = this.slide = slide || 0;

	// Current .delayed item in the slide
	this.item = 0;

	// Create timer, if needed
	this.duration = body.getAttribute('data-duration');

	if(this.duration > 0) {
		var timer = document.createElement('div');

		timer.id = 'timer';
		timer.setAttribute('style', PrefixFree.prefixCSS('transition-duration: ' + this.duration * 60 + 's;'));
		body.appendChild(timer);

		addEventListener('load', function() {
			timer.className = 'end';

			setTimeout(function() {
				timer.classList.add('overtime');
			}, me.duration * 60000);
		});
	}

	// Create slide indicator
	this.indicator = document.createElement('div');

	this.indicator.id = 'indicator';
	body.appendChild(this.indicator);
	
	// Add on screen navigation
	var onscreen = document.createElement('nav');
	onscreen.id = 'onscreen-nav';
	
	var prev = document.createElement('button');
	prev.className = 'onscreen-nav prev';
	prev.textContent = '◀';
	prev.type = 'button';
	prev.onclick = function() { me.previous(); }
	
	var next = document.createElement('button');
	next.className = 'onscreen-nav next';
	next.textContent = 'Next ▶';
	next.type = 'button';
	next.onclick = function() { me.next(); }

	onscreen.appendChild(prev);
	onscreen.appendChild(next);
	onscreen.style.display = 'none';
	document.body.appendChild(onscreen);
	
	// Expand multiple imported slides
	$$('.slide[data-base][data-src*=" "]').forEach(function(slide) {
		var hashes = slide.getAttribute('data-src').split(/\s+/).forEach(function (hash) {
			var s = slide.cloneNode(true);
			s.setAttribute('data-src', hash);
			slide.parentNode.insertBefore(s, slide);
		});
		
		slide.parentNode.removeChild(slide);
	});

	// Get the slide elements into an array
	this.slides = $$('.slide', body);

	// Get the overview
	this.overview = function(evt) {
        if(body.classList.contains('show-thumbnails')) {
            body.classList.remove('show-thumbnails');
            body.classList.remove('headers-only');
        }
        else {
            body.classList.add('show-thumbnails');

            if(evt && (!evt.shiftKey || !evt.ctrlKey)) {
                body.classList.add('headers-only');
            }

            body.addEventListener('click', function(evt) {
                var slide = evt.target;

                while(slide && !slide.classList.contains('slide')) {
                    slide = slide.parentNode;
                }

                if(slide) {
                    me.goto(slide.id);
                    setTimeout(function() { me.adjustFontSize(); }, 1000); // for Opera
                }

                body.classList.remove('show-thumbnails');
                body.classList.remove('headers-only');

                body.removeEventListener('click', arguments.callee);
            }, false);
        }
    }
    
    // Process iframe slides
	$$('.slide[data-src]:not([data-base]):empty').forEach(function(slide) {
		var iframe = document.createElement('iframe');

		iframe.setAttribute('data-src', slide.getAttribute('data-src'));
		slide.removeAttribute('data-src');

		slide.appendChild(iframe);
	});

	$$('.slide > iframe:only-child').forEach(function(iframe) {
		var slide = iframe.parentNode,
			src = iframe.src || iframe.getAttribute('data-src');

		slide.classList.add('iframe');

		if(!slide.classList.contains('notitle')) {
			addTitle(slide, src, iframe.title);
		}
		
		slide.classList.add('onscreen-nav');
	});
	
	this.isIpad = navigator.userAgent.indexOf('iPad;') > -1;

	// Order of the slides
	this.order = [];

	for (var i=0; i<this.slides.length; i++) {
		var slide = this.slides[i]; // to speed up references

		// Asign ids to slides that don't have one
		if(!slide.id) {
			slide.id = 'slide' + (i+1);
		}

		// Set data-title attribute to the title of the slide
		if(!slide.title) {
			// no title attribute, fetch title from heading(s)
			var heading = $('hgroup', slide) || $('h1,h2,h3,h4,h5,h6', slide);

			if(heading && heading.textContent.trim()) {
				slide.setAttribute('data-title', heading.textContent);
			}
		}
		else {
			// The title attribute is set, use that
			slide.setAttribute('data-title', slide.title);
			slide.removeAttribute('title');
		}

		slide.setAttribute('data-index', i);

		var imp = slide.getAttribute('data-import'),
			imported = imp? this.getSlideById(imp) : null;
		
		this.order.push(imported? +imported.getAttribute('data-index') : i);
		
		// [data-steps] can be used to define steps (applied through the data-step
		// property), used in CSS to go through multiple states for an element
		var stepped = $$('[data-steps]', slide);
		
		if (slide.hasAttribute('data-steps')) {
			stepped.push(slide);
		}
		
		stepped.forEach(function(element) {
			var steps = +element.getAttribute('data-steps');
			element.removeAttribute('data-step');
			
			for(var i=0; i<steps; i++) {
				var dummy = document.createElement('span');
				dummy.style.display = 'none';
				dummy.className = 'delayed dummy';
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

	if(window.name === 'projector' && window.opener && opener.slideshow) {
		body.classList.add('projector');
		this.presenter = opener.slideshow;
		this.presenter.projector = this;
	}

	// Adjust the font-size when the window is resized
	addEventListener('resize', this, false);

	// In some browsers DOMContentLoaded is too early, so try again onload
	addEventListener('load', this, false);

	addEventListener('hashchange', this, false);

	// If there's already a hash, update current slide number...
	this.handleEvent({type: 'hashchange'});

	document.addEventListener('keyup', this, false);
	document.addEventListener('keydown', this, false);
	
	$$('link[rel~="csss-import"]').forEach(function (link) {
		var url = link.href;
		var id = link.id;
		var slides = $$('.slide[data-base="' + id + '"][data-src^="#"]');
		var isSlideshow = link.rel.indexOf('slides') > -1;
		
		if (slides.length) {
			var iframe = document.createElement('iframe');
			var hash = slides[0].getAttribute('data-src');
			iframe.className = 'csss-import';
			iframe.src = url + hash;
			
			document.body.insertBefore(iframe, document.body.firstChild);
			
			// Process the rest of the slides, which should use the same iframe
			slides.forEach(function (slide) {
				var hash = slide.getAttribute('data-src');
				
				slide.classList.add('dont-resize');
				
				this.onSlide(slide.id, function () {
					onscreen.style.display = '';
					
					iframe.src = iframe.src.replace(/#.+$/, hash);
					iframe.className = 'csss-import show';
				});
			}, this);
		}
	}, this);
	
	function addTitle(slide, url, title) {
		var h = document.createElement('h1'),
		    a = document.createElement('a');
		
		title = title || slide.title || slide.getAttribute('data-title') ||
		            url.replace(/\/#?$/, '').replace(/^\w+:\/\/(www\.)?/, '');

		a.href = url;
		a.target = '_blank';
		a.textContent = title;
		h.appendChild(a);

		slide.appendChild(h);
	}
};

_.prototype = {
	handleEvent: function(evt) {
		var me = this;

		// Prevent script from hijacking the user’s navigation
		if (evt.metaKey && evt.keyCode) {
			return true;
		}

		switch(evt.type) {
			/**
				Keyboard navigation
				Ctrl+G : Go to slide...
				Ctrl+H : Show thumbnails and go to slide
				Ctrl+P : Presenter view
				(Shift instead of Ctrl works too)
			*/
			case 'keyup':
				if((evt.ctrlKey || evt.shiftKey) && !evt.altKey && !/^(?:input|textarea)$/i.test(document.activeElement.nodeName)) {
					switch(evt.keyCode) {
						case 71: // G
							var slide = prompt('Which slide?');
							me.goto(+slide? slide - 1 : slide);
							break;
						case 72: // H
						    me.overview(evt);
							break;
						case 74: // J
							if(body.classList.contains('hide-elements')) {
								body.classList.remove('hide-elements');
							}
							else {
								body.classList.add('hide-elements');
							}
							break;
						case 80: // P
							// Open new window for attendee view
							this.projector = open(location, 'projector');

							// Get the focus back
							window.focus();

							// Switch this one to presenter view
							body.classList.add('presenter');
					}
				}
				break;
			case 'keydown':
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
				if(evt.target === body || evt.target === body.parentNode || evt.metaKey && evt.altKey) {
					if(evt.keyCode >= 32 && evt.keyCode <= 40) {
						evt.preventDefault();
					}

					switch(evt.keyCode) {
						case 33: //page up
							this.previous();
							break;
						case 34: //page down
							this.next();
							break;
						case 35: // end
							this.end();
							break;
						case 36: // home
							this.start();
							break;
						case 37: // <-
						case 38: // up arrow
							this.previous(evt.ctrlKey || evt.shiftKey);
							break;
						case 32: // space
						case 39: // ->
						case 40: // down arrow
							this.next(evt.ctrlKey || evt.shiftKey);
							break;
					}
				}
				break;
			case 'load':
			case 'resize':
				this.adjustFontSize();
				break;
			case 'hashchange':
				this.goto(location.hash.substr(1) || 0);
		}
	},

	start: function() {
		this.goto(0);
	},

	end: function() {
		this.goto(this.slides.length - 1);
	},

	/**
		@param hard {Boolean} Whether to advance to the next slide (true) or
			just the next step (which could very well be showing a list item)
	 */
	next: function(hard) {
		if(!hard && this.items.length) {
			this.nextItem();
		}
		else {
			this.goto(this.index + 1);

			this.item = 0;

			// Mark all items as not displayed, if there are any
			if(this.items.length) {
				for (var i=0; i<this.items.length; i++) {
					var classes = this.items[i].classList;
					if(classes) {
						classes.remove('displayed');
						classes.remove('current');
					}
				}
			}
		}
	},

	nextItem: function() {
		if(this.item < this.items.length) {
			this.gotoItem(++this.item);
		}
		else {
			this.item = 0;
			this.next(true);
		}
	},

	previous: function(hard) {
		if(!hard && this.item > 0) {
			this.previousItem();
		}
		else {
			this.goto(this.index - 1);

			this.item = this.items.length;

			// Mark all items as displayed, if there are any
			if(this.items.length) {
				for (var i=0; i<this.items.length; i++) {
					if(this.items[i].classList) {
						this.items[i].classList.add('displayed');
					}
				}

				// Mark the last one as current
				var lastItem = this.items[this.items.length - 1];

				lastItem.classList.remove('displayed');
				lastItem.classList.add('current');
			}
		}
	},

	previousItem: function() {
		this.gotoItem(--this.item);
	},

	getSlideById: function(id) {
		return $('.slide#' + id);
	},

	/**
		Go to an aribtary slide
		@param which {String|Integer} Which slide (identifier or slide number)
	*/
	goto: function(which) {
		var slide;

		// We have to remove it to prevent multiple calls to goto messing up
		// our current item (and there's no point either, so we save on performance)
		window.removeEventListener('hashchange', this, false);

		var id;

		if (which + 0 === which && which in this.slides) {
			// Argument is a valid slide number
			this.index = which;
			this.slide = this.order[which]

			slide = this.slides[this.slide];

			location.hash = '#' + slide.id;
		}
		else if (which + '' === which) { // Argument is a slide id
			slide = this.getSlideById(which);

			if(slide) {
				this.slide = this.index = +slide.getAttribute('data-index');
				location.hash = '#' + which;
			}
		}

		if (slide) { // Slide actually changed, perform any other tasks needed
			document.title = slide.getAttribute('data-title') || documentTitle;

			if (slide.classList.contains('iframe')) {
				var iframe = $('iframe', slide), src;

				if(iframe && !iframe.hasAttribute('src') && (src = iframe.getAttribute('data-src'))) {
					iframe.setAttribute('src', src);
				}
			}
			else {
				this.adjustFontSize();
			}
			
			$('#onscreen-nav').style.display = this.isIpad || slide.classList.contains('onscreen-nav')? '' : 'none';
			
			// Hide iframes from CSSS imports
			$$('iframe.csss-import').forEach(function (iframe) { iframe.classList.remove('show'); });

			this.indicator.textContent = this.index + 1;

			// Update items collection
			this.items = $$('.delayed, .delayed-children > *', this.slides[this.slide]);
			this.items.stableSort(function(a, b){
				return (a.getAttribute('data-index') || 0) - (b.getAttribute('data-index') || 0)
			});
			this.item = 0;

			this.projector && this.projector.goto(which);

			// Update next/previous
			var previousPrevious = this.slides.previous,
			    previousNext = this.slides.next;

			this.slides.previous = this.slides[this.order[this.index - 1]];
			this.slides.next = this.slides[this.order[this.index + 1]];

			this.slides.previous && this.slides.previous.classList.add('previous');
			this.slides.next && this.slides.next.classList.add('next');

			if (previousPrevious && previousPrevious != this.slides.previous) {
				previousPrevious.classList.remove('previous');
			}

			if (previousNext && previousNext != this.slides.next) {
				previousNext.classList.remove('next');
			}
		}

		// If you attach the listener immediately again then it will catch the event
		// We have to do it asynchronously
		var me = this;
		setTimeout(function() {
			addEventListener('hashchange', me, false);
		}, 1000);
	},

	gotoItem: function(which) {
		this.item = which;

		var items = this.items, classes;

		for(var i=items.length; i-- > 0;) {
			classes = this.items[i].classList;

			classes.remove('current');
			classes.remove('displayed');
			
			if (classes.contains('dummy') && items[i].dummyFor) {
				items[i].dummyFor.removeAttribute('data-step');
			}
		}
		
		for (var i=this.item - 1; i-- > 0;) {
			items[i].classList.add('displayed');
		}
		
		if (this.item > 0) { // this.item can be zero, at which point no items are current
			var item = items[this.item - 1];
			
			item.classList.add('current');

            // support for nested lists
            for (var i = this.item - 1, cur = items[i], j; i > 0; i--) {
              j = items[i - 1];
              if (j.contains(cur)) {
                j.classList.remove('displayed');
                j.classList.add('current');
              }
            }
			
			if (item.classList.contains('dummy') && item.dummyFor) {
				item.dummyFor.setAttribute('data-step', item.dummyIndex);
			}
		}

		this.projector && this.projector.gotoItem(which);
	},

	adjustFontSize: function() {
		// Cache long lookup chains, for performance
		var htmlStyle = html.style,
			scrollRoot = html.scrollHeight? html : body,
			innerHeight = window.innerHeight,
			innerWidth = window.innerWidth,
			slide = this.slides[this.slide];

		// Clear previous styles
		htmlStyle.fontSize = '';

		if(body.classList.contains('show-thumbnails')
			|| slide.classList.contains('dont-resize')) {
			return;
		}

		for(
			var percent = 100;
			(scrollRoot.scrollHeight > innerHeight || scrollRoot.scrollWidth > innerWidth) && percent >= 35;
			percent-=5
		) {
			htmlStyle.fontSize = percent + '%';
		}

		// Individual slide

		if(slide.clientHeight && slide.clientWidth) {
			// Strange FF bug: scrollHeight doesn't work properly with overflow:hidden
			var previousStyle = slide.getAttribute('style');
			slide.style.overflow = 'auto';

			for(
				;
				(slide.scrollHeight > slide.clientHeight || slide.scrollWidth > slide.clientWidth) && percent >= 35;
				percent--
			) {
				htmlStyle.fontSize = percent + '%';
			}

			slide.setAttribute('style', previousStyle);
		}

		if(percent <= 35) {
			// Something probably went wrong, so just give up altogether
			htmlStyle.fontSize = '';
		}
	},

	// Is the element on the current slide?
	onCurrent: function(element) {
		var slide = _.getSlide(element);

		if (slide) {
			return '#' + slide.id === location.hash;
		}

		return false;
	},
	
	onSlide: function(id, callback, once) {
		var me = this;
		
		id = (id.indexOf('#') !== 0? '#' : '') + id;
		
		var fired = false;
		
		if (id == location.hash) {
			callback.call(this.slides[this.slide]);
			fired = true;
		}
		
		if (!fired || !once) {
			addEventListener('hashchange', function() {
				if (id == location.hash) {
					callback.call(me.slides[me.slide]);
					fired = true;
					
					if (once) {
						removeEventListener('hashchange', arguments.callee);
					}
				}
				
			});
		}
	}
};

/**********************************************
 * Static methods
 **********************************************/

// Helper method for plugins
_.getSlide = function(element) {
	var slide = element;

	while (slide && slide.classList && !slide.classList.contains('slide')) {
		slide = slide.parentNode;
	}

	return slide;
}

})(document.head || document.getElementsByTagName('head')[0], document.body, document.documentElement);

// Rudimentary style[scoped] polyfill
if (!('scoped' in document.createElement('style'))) {
	addEventListener('load', function(){ // no idea why the timeout is needed
		$$('style[scoped]').forEach(function(style) {
			var rulez = style.sheet.cssRules,
				parentid = style.parentNode.id || SlideShow.getSlide(style).id || style.parentNode.parentNode.id;
	
			for(var j=rulez.length; j--;) {
				var selector = rulez[j].selectorText.replace(/^|,/g, function($0) {
					return '#' + parentid + ' ' + $0
				});
	
				var cssText = rulez[j].cssText.replace(/^.+?{/, selector + '{');
	
				style.sheet.deleteRule(j);
				style.sheet.insertRule(cssText, j);
			}
			
			style.removeAttribute('scoped');
			style.setAttribute('data-scoped', '');
		});
	});
}
