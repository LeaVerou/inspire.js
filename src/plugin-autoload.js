/**
 * Plugin registry that maps plugins to selectors that will auto-load them.
 * Any dependencies are managed by the plugin itself.
 */
export default {
	timer: "[data-duration]",
	presenter: "details.notes",
	"lazy-load": "[data-src]:not(.slide)",
	"slide-style": "style[data-slide]",
	overview: "*",
	iframe: ".slide[data-src], .iframe.slide, iframe[data-src]",
	prism: "[class*='lang-'], [class*='language-']",
	media: "[data-video], .media-frame, .browser",
	"live-demo": ".demo.slide",
	"resolution": "[data-resolution]",
	"docs": `code.property, .property code,
			code.css, .css code,
			code.function, .function code,
			code.element, .element code,
			code.attribute, .attribute code,
			code[data-mdn], [data-mdn] code`,
	"mavo": "[mv-app]",
	"visible-keys": "[data-visible-keys]",
	"grid-layouts": "[class*='heading-']",
	"balance-lines": ".balance-lines, [data-balance-elements]",
	"details-notes": "details.notes",
	"markdown": "[data-markdown-elements]",
	"delayed-actions": "inspire-action",
};