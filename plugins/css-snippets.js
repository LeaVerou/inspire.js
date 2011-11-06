/**
 * Script to add prefixes to standard CSS3 in textareas or style attributes
 * Requires css-edit.js
 * @author Lea Verou
 * MIT License
 */

(function(head) {

var self = window.CSSSnippet = function(element) {
	var me = this;
	
	this.raw = element.hasAttribute('data-raw');
	
	if(this.raw) {
		this.style = document.createElement('style');
		
		if(window.SlideShow) {
			this.slide = SlideShow.getSlide(element);
			
			if(location.hash == '#' + me.slide.id) {
				this.style = head.appendChild(this.style);
			}
			
			// Remove it after we're done with it, to save on resources
			addEventListener('hashchange', function() {
				var appended = !!me.style.parentNode;
				
				if(location.hash == '#' + me.slide.id != appended) {
					me.style = head[(appended? 'remove' : 'append') + 'Child'](me.style);
				}
			}, false);
		}
	}
	else {
		
		// this holds the elements the CSS is gonna be applied to
		this.subjects = CSSEdit.getSubjects(element);
		
		CSSEdit.setupSubjects(this.subjects);
	}

	// Test if its text field first
	if(/^(input|textarea)$/i.test(element.nodeName)) {
		this.textField = element;
		
		// Turn spellchecking off
		this.textField.spellcheck = false;
		
		CSSEdit.elastic(this.textField);
		
		this.textField.addEventListener('input', function() {
			me.update();
		}, false);
		
		this.textField.addEventListener('keyup', function() {
			me.update();
		}, false);
		
		this.update();
	}
	else {
		// Update style, only once
		this.update();
	}
}

self.prototype = {
	update: function() {
		var supportedStyle = PrefixFree.prefixCSS(this.getCSS(), this.raw);
		
		if(this.raw) {
			this.style.textContent = supportedStyle;
		}
		else {
			var valid = CSSEdit.updateStyle(this.subjects, this.getCSS(), 'data-originalstyle');
			
			if(this.textField && this.textField.classList) {
				this.textField.classList[valid? 'remove' : 'add']('error');
			}
		}
	},
	
	getCSS: function() {
		return this.textField ? this.textField.value : this.subjects[0].getAttribute('style');
	}
};

})(document.head);