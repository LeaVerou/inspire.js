/**
 * Dependency of CSS editing plugins like CSS Snippets or CSS Controls
 * @author Lea Verou
 * MIT License
 */
 
(function(){

var dummy = document.createElement('div');
 
var self = window.CSSPrefix = {
	isCSSValid: function(code) {
		var declarationCount = code.split(':').length - 1;
			
		dummy.removeAttribute('style');
		dummy.setAttribute('style', code);
		
		return declarationCount > 0 && dummy.style.length >= declarationCount;
	},
	
	prefixCSS: function(css, raw) {
		var regex;
		
		if (self.values.length) {
			regex = RegExp('\\b(' + self.values.join('|') + ')\\b', 'gi');
			
			css = css.replace(regex, self.prefix + "$1");
		}
		
		if (self.properties.length) {
			regex = RegExp('\\b(' + self.properties.join('|') + '):', 'gi');
			
			css = css.replace(regex, self.prefix + "$1:");
		}
		
		if(raw) {
			if(self.selectors.length) {
				var regex = RegExp('\\b(' + self.selectors.join('|') + ')\\b', 'gi');
				
				css = css.replace(regex, function($0, $1){
					return self.prefixSelector($0);
				});
			}
			
			if(self.atrules.length) {
				var regex = RegExp('@(' + self.atrules.join('|') + ')\\b', 'gi');
				
				css = css.replace(regex, '@' + self.prefix + "$1");
			}
		}
		
		return css;
	},
	
	prefixSelector: function(selector) {
		return selector.replace(/^:{1,2}/, function($0) { return $0 + self.prefix })
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
		
		if (property in dummy.style) {
			return prefix;
		}
	}
	
	return null;
 })();
 
 // Properties that *might* need prefixing
 self.properties = [
	'appearance',
	'animation',
		'animation-delay',
		'animation-direction',
		'animation-duration',
		'animation-fill-mode',
		'animation-iteration-count',
		'animation-name',
		'animation-play-state',
		'animation-timing-function',
	'background-clip',
	'background-origin',
	'border-image',
	'border-radius',
	'box-decoration-break',
	'box-shadow',
	'box-sizing',
	'columns',
		'column-count',
		'column-fill',
		'column-gap',
		'column-rule',
			'column-rule-color',
			'column-rule-style',
			'column-rule-width',
		'column-span',
		'column-width',
	'hyphens',
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

self.selectors = {
	':read-only': null,
	':read-write': null,
	':any-link': null,
	'::selection': null
};
 
self.atrules = {
	'keyframes': 'animation-name',
	'viewport': null,
	'document': 'regexp(".")'
};
 
 // Eliminate the ones that are either supported prefix-less or not at all
 (function(properties, values, selectors, atrules) {
 	var style = dummy.style;
 
	for (var i=0; i<properties.length; i++) {
		var property = properties[i],
			prefixed = self.prefix + property;
		
		style.cssText = property + ':inherit;' + prefixed + ':inherit;';
		
		if(style.getPropertyValue(property) || !style.getPropertyValue(prefixed)) {
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
	
	self.selectors = [];
	
	style = document.head.appendChild(document.createElement('style'));
	
	for(var selector in selectors) {
		var params = selectors[selector]? '(' + selectors[selector] + ')' : '',
			prefixed = selector.replace(/^:{1,2}/, function($0) { return $0 + self.prefix }),
			test = prefixed + params + '{}' + selector + params + '{}';
		
		style.innerHTML = test;
	
		if(style.sheet.cssRules.length === 1 && style.sheet.cssRules[0].selectorText.indexOf(self.prefix) > -1) {
			self.selectors.push(selector);
		}
	}
	
	self.atrules = [];
	
	for(var atrule in atrules) {
		var params = atrules[atrule]? ' ' + atrules[atrule] : '',
			prefixed = self.prefix + atrule;
		
		style.innerHTML = '@' + atrule + params + '{}';
		
		if(style.sheet.cssRules.length > 0) {
			continue;
		}
		
		style.innerHTML = '@' + prefixed + params + '{}';

		if(style.sheet.cssRules.length > 0) {
			self.atrules.push(atrule);
		}
	}
	
	document.head.removeChild(style);
 })(self.properties, self.values, self.selectors, self.atrules);

 
 })()