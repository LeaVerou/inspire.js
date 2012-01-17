/**
 * Script for making multiple numbers in a textfield incrementable/decrementable (like Firebug's CSS values)
 * @author Lea Verou
 * @version 1.0
 */

/**
 * Constructor
 * @param textField {HTMLElement} An input or textarea element
 * @param modifiers {Object} An object with params ctrlKey, altKey and/or shiftKey. The key combination must have a sum of >= 3.
 * 							For example, {altKey: 1, ctrlKey: 3, shiftKey: 2} means that either Ctrl has to be pressed with the arrows, or alt+shift, or alt+ctrl, or all three.
 *							The default is 0, which means no modifiers needed.
 */
function Incrementable(textField, modifiers, units) {
	var me = this;

	this.textField = textField;
	
	this.step = +textField.getAttribute('step') || 
				+textField.getAttribute('data-step') || 1;

	modifiers = modifiers || {};
	this.modifiers = {
		ctrlKey: modifiers.ctrlKey || 0,
		altKey: modifiers.altKey || 0,
		shiftKey: modifiers.shiftKey || 0
	};

	if(units) {
		this.units = units;
	}
	
	this.changed = false;

	this.textField.addEventListener('keydown', function(evt) {
		if(me.checkModifiers(evt) && (evt.keyCode == 38 || evt.keyCode == 40)) {
			me.changed = false;
			
			// Up or down arrow pressed, check if there's something
			// increment/decrement-able where the caret is
			var caret = this.selectionStart, text = this.value,
				regex = new RegExp('^([\\s\\S]{0,' + caret + '}[^-0-9\\.])(-?[0-9]*(?:\\.?[0-9]+)(?:' + me.units + '))\\b', 'i');

			this.value = this.value.replace(regex, function($0, $1, $2) {
				if($1.length <= caret && $1.length + $2.length >= caret) {
					me.changed = true;
					return $1 + me.stepValue($2, evt.keyCode == 40, evt.shiftKey);
				}
				else {
					return $1 + $2;
				}
			});

			if(me.changed) {
				this.selectionEnd = this.selectionStart = caret;
				evt.preventDefault();
				evt.stopPropagation();
			}
		}
	}, false);

	this.textField.addEventListener('keypress', function(evt) {
		if(me.changed && me.checkModifiers(evt) 
			&& (evt.keyCode == 38 || evt.keyCode == 40))
			evt.preventDefault();
			evt.stopPropagation();
			me.changed = false;
	}, false);
}

Incrementable.prototype = {
	checkModifiers: function(evt) {
		var m = this.modifiers;

		return m.ctrlKey * evt.ctrlKey + m.altKey * evt.altKey + m.shiftKey * evt.shiftKey >= 3
				|| (m.ctrlKey + m.altKey + m.shiftKey == 0);
	},
	
	/**
	 * Gets a <length> and increments or decrements it
	 */
	stepValue: function(length, decrement, byChunk) {
		var val = parseFloat(length) + (decrement? -1 : 1) * (byChunk? 10 : 1) * this.step;
		
		// Prevent rounding errors
		if(this.step % 1) {
			val = (parseFloat(val.toPrecision(12)));
		}
		
		return val + length.replace(/^-|[0-9]+|\./g, '');
	},

	units: '|%|deg|px|r?em|ex|ch|in|cm|mm|pt|pc|vm|vw|vh|gd|m?s'
};