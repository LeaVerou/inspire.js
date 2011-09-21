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
		code = CSSPrefix.prefixCSS(code.trim());
		
		if(code && CSSPrefix.isCSSValid(code)) {
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
  
 })()