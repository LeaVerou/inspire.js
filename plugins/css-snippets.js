/**
 * Script to add prefixes to standard CSS3 in textareas or style attributes
 * @author Lea Verou
 * MIT License
 */

(function() {

var self = window.CSSSnippet = function(element) {
	var me = this,
	    selector = element.getAttribute('data-subject');
	
	// this holds the elements the CSS is gonna be applied to
	this.subjects = selector? toArray(document.querySelectorAll(selector)) || [] : [];

	// Test if its text field first
	if(/^(input|textarea)$/i.test(element.nodeName)) {
		this.textField = element;
		
		// Turn spellchecking off
		this.textField.spellcheck = false;
		
		// If no subject specified, it will be the slide
		if(!this.subjects.length) {
			// Find containing slide
			this.slide = SlideShow.getSlide(this.textField.parentNode);
			
			if(this.slide) {		
				this.subjects = [this.slide];
			}
			else {
				// If no slide present, it will be the text field itself
				this.subjects = [this.textField];
			}
		}
		
		this.textField.addEventListener('keyup', function() {
			me.update();
		}, false);
		
		this.textField.addEventListener('keydown', function() {
			me.updateStyle();
		}, false);
		
		this.update();
	}
	else {
		// Not a text field, add current element as a subject
		this.subjects.unshift(element);
		
		// Keep original style, just in case
		element.setAttribute('data-originalstyle', element.getAttribute('style'));
		
		// Update style, only once
		this.updateStyle();
	}
}

self.prototype = {
	updateStyle: function() {
		var supportedStyle = self.prefixCSS(this.getCSS());
		
		// If it's a text field, test if style is valid first to avoid applying 
		// random stuff in between valid keystrokes
		if(this.textField) {
			if (!self.isCSSValid(supportedStyle)) {
				this.textField.classList && this.textField.classList.add('error');
				return;
			}
			
			this.textField.classList && this.textField.classList.remove('error');
		}
		
		for (var i=0; i<this.subjects.length; i++) {
			this.subjects[i].setAttribute('style', supportedStyle);
		}
	},
	
	getCSS: function() {
		return this.textField ? this.textField.value : this.subjects[0].getAttribute('style');
	},
	
	adjustHeight: function() {
		if ('rows' in this.textField) {
			this.textField.rows = this.textField.value.split(/\r\n?|\n/).length;
			
			this.textField.style.fontSize = Math.min(90, 100 - this.textField.rows * 5) + '%';
		}
	},
	
	update: function() {
		this.updateStyle();
		this.adjustHeight();
	}
};

/*****************************
 * Static properties 
 *****************************/
self.guineaPig = document.createElement('div');

self.prefix = (function() {
	var element = self.guineaPig,
		// Oldest prefixed properties that browsers still support
		props = {
			'-moz-': 'MozOpacity',
			'-webkit-': 'WebkitOpacity',
			'-o-': 'OLink',
			'-ms-': 'msFilter'
		};
	
	// Determine which is the vendor prefix of the current browser
	for (var prefix in props) {
		var property = props[prefix];
		
		if (property in element.style) {
			return prefix;
		}
	}
	
	return null;
})();

// Properties that *might* need prefixing
self.properties = [
	'appearance',
	'background-clip',
	'background-origin',
	'border-image',
	'border-radius',
	'box-decoration-break',
	'box-shadow',
	'box-sizing',
	'column-count',
	'column-rule',
	'column-rule-width',
	'column-rule-style',
	'column-rule-color',
	'column-span',
	'tab-size',
	'text-decoration-line',
	'text-decoration-color',
	'text-decoration-style',
	'transform',
	'transform-origin',
	'transition',
	'transition-duration',
	'transition-property',
	'transition-timing-function'
];

// Values that *might* need prefixing and support tests
self.values = {
	'repeating-linear-gradient': {
		property: 'backgroundImage',
		value: 'repeating-linear-gradient(white, black)'
	},
	'linear-gradient': {
		property: 'backgroundImage',
		value: 'linear-gradient(white, black)'
	},
	'repeating-radial-gradient': {
		property: 'backgroundImage',
		value: 'repeating-radial-gradient(white, black)'
	},
	'radial-gradient': {
		property: 'backgroundImage',
		value: 'radial-gradient(white, black)'
	},
	'calc': {
		property: 'width',
		value: 'calc(1px + 50%)'
	},
	'initial': {
		property: 'color',
		value: 'initial'
	}
};

// Eliminate the ones that are either supported prefix-less or not at all
(function(properties, values, style) {
	for (var i=0; i<properties.length; i++) {
		var property = camelCase(properties[i]),
			prefixedProperty = camelCase(self.prefix + properties[i]);

		if (property  in style || !(prefixedProperty in style)) {
			properties.splice(i--, 1);
		}
	}
	
	self.values = [];
	
	for (var val in values) {
		// Try if prefix-less version is supported
		var property = values[val].property,
			value = values[val].value;
		
		style[property] = '';
		style[property] = value;
		
		if (style[property]) {
			continue;
		}
		
		// Now try with a prefix
		style[property] = '';
		style[property] = self.prefix + value;
		
		if (!style[property]) {
			continue;
		}
		
		// If we're here, it is supported, but with a prefix
		self.values.push(val);
	}
})(self.properties, self.values, self.guineaPig.style);

/**********************************************
 * Static methods 
 **********************************************/
self.prefixCSS = function(css) {
	if (self.values.length) {
		var regex = RegExp('\\b(' + self.values.join('|') + ')\\b', 'gi');
		
		css = css.replace(regex, self.prefix + "$1");
	}
	
	if (self.properties.length) {
		var regex = RegExp('\\b(' + self.properties.join('|') + '):', 'gi');
		
		css = css.replace(regex, self.prefix + "$1:");
	}
	
	return css;
};

self.isCSSValid = function(code) {
	var guineaPig = self.guineaPig,
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