(function(){

var self = window.CSSControl = function(control) {
	var me = this,
	    selector = control.getAttribute('data-subject');
	
	this.control = control;
	
	// this holds the elements the CSS is gonna be applied to
	this.subjects = selector? toArray(document.querySelectorAll(selector)) || [] : [];
	
	if(!this.subjects.length) {
		// Find containing slide
		this.slide = SlideShow.getSlide(this.control.parentNode);
		
		if (this.slide) {		
			this.subjects = [this.slide];
		}
		else {
			return;
		}
	}
	
	control.addEventListener('input', function() {
		me.update();
	}, false);
	
	control.addEventListener('change', function() {
		me.update();
	}, false);
	
	this.update();
};

self.prototype = {
	update: function() {
		// Get code
		var code = this.control.getAttribute('data-style').replace(/\{value\}/gi, this.control.value);
		
		// Prefix code, if CSS Snippets is loaded
		if (window.CSSSnippet) {
			code = CSSSnippet.prefixCSS(code);
		}
		
		if(self.isCSSValid(code)) {
			var properties = code.match(/\b[a-z-]+(?=:)/gi), propRegex = [];
			
			for(var i=0; i<properties.length; i++) {
				properties[i] = camelCase(properties[i]);
			}
			
			for (var i=0; i<this.subjects.length; i++) {
				var element = this.subjects[i],
					prevStyle = this.subjects[i].getAttribute('style'),
					style = prevStyle;
				
				if(prevStyle && prevStyle !== 'null') {	
					for(var j=0; j<properties.length; j++) {
						element.style[properties[i]] = null;
					}
					
					element.setAttribute('style', element.getAttribute('style') + '; ' + code);
				}
				else {
					element.setAttribute('style', code);
				}
			}
		}
	}
};

/**********************************************
 * Static methods 
 **********************************************/

self.isCSSValid = function(code) {
	var guineaPig = self.guineaPig = self.guineaPig || document.createElement('div'),
		declarationCount = code.split(':').length - 1;
		
	guineaPig.removeAttribute('style');
	guineaPig.setAttribute('style', code);
	
	return guineaPig.style.length >= declarationCount;
};

/**********************************************
 * Private helpers
 **********************************************/
function camelCase(str) {
	return str.replace(/-(.)/g, function($0, $1) { return $1.toUpperCase() })
}

function toArray(collection) {
	return Array.prototype.slice.apply(collection);
}

})();