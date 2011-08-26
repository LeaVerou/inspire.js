/**
 * Script to add prefixes to standard CSS3 in textareas or style attributes
 * Requires css-edit.js
 * @author Lea Verou
 * MIT License
 */

(function() {

var self = window.CSSSnippet = function(element) {
	var me = this;
	
	// this holds the elements the CSS is gonna be applied to
	this.subjects = CSSEdit.getSubjects(element);
	
	CSSEdit.setupSubjects(this.subjects);

	// Test if its text field first
	if(/^(input|textarea)$/i.test(element.nodeName)) {
		this.textField = element;
		
		// Turn spellchecking off
		this.textField.spellcheck = false;
		
		this.textField.addEventListener('keyup', function() {
			me.update();
		}, false);
		
		this.textField.addEventListener('keydown', function() {
			me.updateStyle();
		}, false);
		
		this.update();
	}
	else {
		// Update style, only once
		this.updateStyle();
	}
}

self.prototype = {
	updateStyle: function() {
		var supportedStyle = CSSEdit.prefixCSS(this.getCSS());
		
		var valid = CSSEdit.updateStyle(this.subjects, this.getCSS(), 'data-originalstyle');
		
		if(this.textField && this.textField.classList) {
			this.textField.classList[valid? 'remove' : 'add']('error');
		}
	},
	
	getCSS: function() {
		return this.textField ? this.textField.value : this.subjects[0].getAttribute('style');
	},
	
	adjustHeight: function() {
		if ('rows' in this.textField && !this.textField.classList.contains('dont-adjust')) {
			this.textField.rows = this.textField.value.split(/\r\n?|\n/).length;
			
			this.textField.style.fontSize = Math.min(90, 100 - this.textField.rows * 5) + '%';
		}
	},
	
	update: function() {
		this.updateStyle();
		this.adjustHeight();
	}
};

})();