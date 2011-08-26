/**
 * Dependency of CSS editing plugins like CSS Snippets or CSS Controls
 * @author Lea Verou
 * MIT License
 */
 
(function(){

var guineaPig = document.createElement('div');
 
var self = window.CSSEdit = {
	setupSubjects: function(subjects) {
		for (var i=0; i<subjects.length; i++) {
			var subject = subjects[i];
			
			subject.setAttribute('data-originalstyle', subject.getAttribute('style'));
			subject.setAttribute('data-originalcssText', subject.style.cssText);
		}
	},
	
	isCSSValid: function(code) {
		var declarationCount = code.split(':').length - 1;
			
		guineaPig.removeAttribute('style');
		guineaPig.setAttribute('style', code);
		
		return declarationCount > 0 && guineaPig.style.length >= declarationCount;
	},
	
	prefixCSS: function(css) {
		if (self.values.length) {
			var regex = RegExp('\\b(' + self.values.join('|') + ')\\b', 'gi');
			
			css = css.replace(regex, self.prefix + "$1");
		}
		
		if (self.properties.length) {
			var regex = RegExp('\\b(' + self.properties.join('|') + '):', 'gi');
			
			css = css.replace(regex, self.prefix + "$1:");
		}
		
		return css;
	},
	
	getSubjects: function(element) {
		var selector = element.getAttribute('data-subject'),
			subjects;
		
		if(selector) {
			subjects = self.util.toArray(document.querySelectorAll(selector)) || [];
		}
		else {
			subjects = element.hasAttribute('data-subject')? [element] : [];
		}
		
		if(/^(input|textarea)$/i.test(element.nodeName)) {
			// If no subject specified, it will be the slide
			if(!subjects.length) {
				// Find containing slide
				var slide = SlideShow.getSlide(element.parentNode);
				
				subjects = [slide? slide : element];
			}
		}
		else {
			subjects.unshift(element);
		}
		
		return subjects;
	},
	
	updateStyle: function(subjects, code, originalAttribute) {
		code = self.prefixCSS(code.trim());
		
		if(code && self.isCSSValid(code)) {
			guineaPig.setAttribute('style', code);
			
			var appliedCode = guineaPig.style.cssText;
			if(appliedCode.match(/\b[a-z-]+(?=:)/gi) === null) console.log('"' + appliedCode + '"');
			var properties = appliedCode.match(/\b[a-z-]+(?=:)/gi), propRegex = [];
			
			for(var i=0; i<properties.length; i++) {
				properties[i] = self.util.camelCase(properties[i]);
			}
			
			for (var i=0; i<subjects.length; i++) {
				var element = subjects[i],
					prevStyle = subjects[i].getAttribute('style'),
					style = prevStyle;
				
				if(prevStyle && prevStyle !== 'null') {	
					for(var j=0; j<properties.length; j++) {
						element.style[properties[i]] = null;
					}
					
					element.setAttribute('style', element.getAttribute(originalAttribute) + '; ' + code);
				}
				else {
					element.setAttribute('style', code);
				}
			}
			
			return true;
		}
		else {
			return false;
		}
	},
	
	util: {
		camelCase: function(str) {
			return str.replace(/-(.)/g, function($0, $1) { return $1.toUpperCase() })
		},
		
		toArray: function(collection) {
			return Array.prototype.slice.apply(collection);
		}
	}
 };
 

 
 self.prefix = (function() {
	// Oldest prefixed properties that browsers still support
	var props = {
			'-moz-': 'MozOpacity',
			'-webkit-': 'WebkitOpacity',
			'-o-': 'OLink',
			'-ms-': 'msFilter'
		};
	
	// Determine which is the vendor prefix of the current browser
	for (var prefix in props) {
		var property = props[prefix];
		
		if (property in guineaPig.style) {
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
		var property = self.util.camelCase(properties[i]),
			prefixedProperty = self.util.camelCase(self.prefix + properties[i]);
 
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
 })(self.properties, self.values, guineaPig.style);

 
 })()