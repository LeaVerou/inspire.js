/**
 * Super simple syntax highlighting plugin for CSSS code snippets
 * Usage: <code lang="javascript">
 * @author Lea Verou
 */

(function(){ 

if(!document.body.insertAdjacentHTML) {
	return;
}

var self = window.Highlight = {
	languages: {
		javascript: {
			'comment': /(\/\*.*?\*\/)|\/\/.*?(\r?\n|$)/g, // TODO multiline support
			'string': /(('|").*?(\2))/g, // used to be: /'.*?'|".*?"/g,
			'keyword': /\b(var|let|if|else|while|do|for|return|in|instanceof|function|new|with|typeof)\b/g,
			'boolean': /\b(true|false)\b/g,
			'number': /\b-?(0x)?\d*\.?\d+\b/g,
			'regex': /\/.+?\/[gim]{0,3}/g
		}
	},
	
	isInited: function(code) {
		return code.hasAttribute('data-highlighted');
	},
	
	init: function(code) {
		if(!code || self.isInited(code)) {
			return; // or should I rehighlight?
		}
		
		var lang = self.languages[code.getAttribute('lang')];
		
		if(!lang) {
			return;
		}
		
		code.normalize();
		
		for(var token in lang) {
			// Assumption: If there are other tags in the code, they don't cut a token in half
			var textNodes = getTextNodes(code, function(node) {
				var parent = node.parentNode;
				return !(/span/i.test(parent.nodeName) && /^token\s/.test(parent.className));
			});
			
			for(var i=0; i<textNodes.length; i++) {
				var oldNode = textNodes[i],
					text = oldNode.nodeValue
							.replace(/&/g, '&amp;')
							.replace(/</g, '&lt;')
							.replace(/>/g, '&gt;');
				
				
				var newText = text.replace(lang[token], function($0) {
					return '<span class="token ' + token + '">' + $0 + '</span>'
				});
				
				if(newText !== text) {
					replaceNodeWithHTML(oldNode, newText);
				}
			}
		}
		
		code.setAttribute('data-highlighted', 'true');
	},
	
	container: function(container) {
		if(!container) {
			return;
		}
		
		var codes = container.querySelectorAll('code[lang]');
	
		for(var i=0; i<codes.length; i++) {
			Highlight.init(codes[i]);
		}
	}
}

function getTextNodes(root, filter) {
	var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, filter? {acceptNode: filter} : null, false),
		node, textNodes = [];
	
	while(node = walker.nextNode()) {
		textNodes.push(node);
	}
	
	return textNodes;
}

function replaceNodeWithHTML(node, html) {
	// Replace text node with element
	var temp = document.createElement('div');
	node.parentNode.replaceChild(temp, node);
	
	// Use insertAdjacentHTML to insert the new markup
	temp.insertAdjacentHTML('beforeBegin', html);
	
	// Remove the element
	temp.parentNode.removeChild(temp);
}

// Highlight current slide
function highlightSlide() {
	self.container(document.getElementById(location.hash.slice(1)));
}

addEventListener('hashchange', highlightSlide, false);
addEventListener('DOMContentLoaded', highlightSlide, false);

})();