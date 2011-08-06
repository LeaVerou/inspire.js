/**
 * CSSS javascript code
 * @author Lea Verou (http://leaverou.me)
 * @version 2.0
 */
 
(function(head, body){

// Check for classList support and include the polyfill if it's not supported
if(!('classList' in body)) {
	var thisScript = document.querySelector('script[src$="slideshow.js"]'),
	    script = document.createElement('script');
	    script.src = thisScript.src.replace(/\bslideshow\.js/, 'classList.js');
	thisScript.parentNode.insertBefore(script, thisScript);
}

// Cache <title> element, we may need it for slides that don't have titles
var documentTitle = document.title + '';

window.SlideShow = function(container, slide) {
	var me = this;
	
	if(!window.slideshow) {
		window.slideshow = this;
	}
	
	container = container || body;
	
	// Current slide
	this.slide = slide || 0;
	
	// Current .delayed item in the slide
	this.item = 0;
	
	// Do we need to add a timer?
	this.duration = container.getAttribute('data-duration');
	
	if(this.duration > 0) {
		var timer = document.createElement('div'),
		    declaration = 'transition: ' + this.duration * 60 + 's; ';
		    
		timer.id = 'timer';
		timer.setAttribute('style', '-moz-' + declaration + '-webkit-' + declaration + '-o-' + declaration + '-ms-' + declaration + declaration);
		container.appendChild(timer);
		
		setTimeout(function() {
			timer.className = 'end';
		}, 1);
	}
	
	// Get the slide elements into an array
	this.slides = Array.prototype.slice.apply(container.querySelectorAll('.slide'));
	
	for(var i=0; i<this.slides.length; i++) {
		var slide = this.slides[i]; // to speed up references
		
		// Asign ids to slides that don't have one
		if(!slide.id) {
			slide.id = 'slide' + (i+1);
		}
		
		// Set data-title attribute to the title of the slide
		if(!slide.title) {
			// no title attribute, fetch title from heading(s)
			var heading = slide.querySelector('hgroup') || slide.querySelector('h1,h2,h3,h4,h5,h6');
			
			if(heading && heading.textContent.trim()) {
				slide.setAttribute('data-title', heading.textContent);
			}
		}
		else {
			// The title attribute is set, use that
			slide.setAttribute('data-title', slide.title);
			slide.removeAttribute('title');
		}
	}
	
	// If there's already a hash, update current slide number...
	this.goto(location.hash.substr(1) || 0);
	
	// ...and keep doing so every time the hash changes
	this.onhashchange = function() {
		me.goto(location.hash.substr(1) || 0);
	};
	window.addEventListener('hashchange', this.onhashchange, false);
	
	if(window.name === 'projector') {
		document.body.classList.add('projector');
	}
	
	// Adjust the font-size when the window is resized
	addEventListener('resize', function() {
		me.adjustFontSize();
	}, false);
	
	// In some browsers DOMContentLoaded is too early, so try again onload
	addEventListener('load', function() {
		me.adjustFontSize();
	}, false);
	
	/**
		Keyboard navigation
		Home : First slide
		End : Last slide
		Up/Right arrow : Next item/slide
		Ctrl + Up/Right arrow : Next slide
		Down/Left arrow : Previous item/slide
		Ctrl + Down/Left arrow : Previous slide 
		Ctrl+G : Go to slide...
		Ctrl+H : Show thumbnails and go to slide
		Ctrl+P : Presenter view
		(Shift instead of Ctrl works too)
	*/
	document.addEventListener('keyup', function(evt) {
		if(evt.ctrlKey || evt.shiftKey) {
			switch(evt.keyCode) {
				case 71: // G
					var slide = prompt('Which slide?');
					me.goto(+slide? slide - 1 : slide);
					break;
				case 72: // H
					if(body.classList.contains('show-thumbnails')) {
						body.classList.remove('show-thumbnails');
						body.classList.remove('headers-only');
					}
					else {
						body.classList.add('show-thumbnails');
						
						if(!evt.shiftKey || !evt.ctrlKey) {
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
						}, false);
					}
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
					me.projector = window.open(location, 'projector', 'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes');
					
					// Get the focus back
					window.focus();
					
					// Switch this one to presenter view
					body.classList.add('presenter');
			}
		}
		
		if(evt.target === body || evt.target === body.parentNode) {
			if(evt.keyCode >= 35 && evt.keyCode <= 40) {
				evt.preventDefault();
			}

			switch(evt.keyCode) {
				case 35: // end
					me.end();
					break;
				case 36: // home
					me.start();
					break;
				case 37: // <-
				case 38: // up arrow
					me.previous(evt.ctrlKey || evt.shiftKey);
					break;
				case 39: // ->
				case 40: // down arrow
					me.next(evt.ctrlKey || evt.shiftKey);
					break;
			}
		}
	}, false);
}

SlideShow.prototype = {
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
			// If there's no current, then just mark the first one as such
			if(!this.item) {
				this.items[this.item++].classList.add('current');
			}
			// Add .current to current item if it exists, otherwise advance to next slide
			else if(this.item < this.items.length) {
				classes = this.items[this.item - 1].classList; // to speed up lookups
				
				classes.remove('current');
				classes.add('displayed');
				
				this.items[this.item++].classList.add('current');
			}
			else {
				this.item = 0;
				this.next(true);
			}
		}
		else {	
			this.goto(this.slide + 1);
			
			this.item = 0;
			
			// Mark all items as not displayed, if there are any
			if(this.items.length) {	
				for (var i=0; i<this.items.length; i++) {
					if(this.items[i].classList) {
						this.items[i].classList.remove('displayed');
						this.items[i].classList.remove('current');
					}
				}
			}
		}
	},
	
	previous: function(hard) {
		if(!hard && this.item > 0) {
			var classes = this.items[this.item - 1].classList; // to speed up lookups
				
			classes.remove('current');
			
			if(this.item > 1) {
				classes = this.items[--this.item - 1].classList;
				
				classes.remove('displayed');
				classes.add('current');
			}
			else {
				this.item = 0;
			}	
		}
		else {	
			
			this.goto(this.slide - 1);
			
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
	
	/**
		Go to an aribtary slide
		@param which {String|Integer} Which slide (identifier or slide number)
	*/
	goto: function(which) {
		var slide;
		
		// We have to remove it to prevent multiple calls to goto messing up
		// our current item (and there's no point either, so we save on performance)
		window.removeEventListener('hashchange', this.onhashchange, false);
		
		if(which + 0 === which && which in this.slides) { // Argument is a valid slide number
			this.slide = which;
			
			slide = this.slides[this.slide];
			location.hash = '#' + slide.id;
		}
		else if(which + '' === which) { // Argument is a slide id
			slide = document.getElementById(which);
			
			if(slide) {
				this.slide = this.slides.indexOf(slide);
				location.hash = '#' + which;	
			}
		}
		
		if(slide) { // Slide actually changed, perform any other tasks needed
			document.title = slide.getAttribute('data-title') || documentTitle;
			
			this.adjustFontSize();
			
			// Update items collection
			this.items = this.slides[this.slide].querySelectorAll('.delayed');
			this.item = 0;
			
			// Tell other windows
			if(this.projector && this.projector.slideshow && this.projector.slideshow.slide != this.slide) {
				this.projector.slideshow.goto(this.slide);
			}
			
			if(window.opener && opener.slideshow && opener.slideshow.slide != this.slide) {
				opener.slideshow.goto(this.slide);
			}
		}
		
		// If you attach the listener immediately again then it will catch the event
		// We have to do it asynchronously
		var me = this;
		setTimeout(function() {
			window.addEventListener('hashchange', me.onhashchange, false);
		}, 1000);
	},
	
	adjustFontSize: function() {
		// Cache long lookup chains, for performance
		var bodyStyle = body.style,
			scrollRoot = document[document.documentElement.scrollHeight? 'documentElement' : 'body'],
			innerHeight = window.innerHeight,
			innerWidth = window.innerWidth,
			slide = this.slides[this.slide];
			
		// Clear previous styles
		bodyStyle.fontSize = '';
		
		if(body.classList.contains('show-thumbnails') 
			|| slide.classList.contains('dont-resize')) {
			return;
		}

		for(
			var percent = 100;	
			(scrollRoot.scrollHeight > innerHeight || scrollRoot.scrollWidth > innerWidth) && percent >= 35;
			percent-=5
		) {
			bodyStyle.fontSize = percent + '%';
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
				bodyStyle.fontSize = percent + '%';
			}
			
			slide.setAttribute('style', previousStyle);
		}
	}
};

/**********************************************
 * Static methods 
 **********************************************/
 
// Helper method for plugins
SlideShow.getSlide = function(element) {
	var slide = element;
	
	while (slide && slide.classList && !slide.classList.contains('slide')) {
		slide = slide.parentNode;
	}
	
	return slide;
}

})(document.head || document.getElementsByTagName('head')[0], document.body);