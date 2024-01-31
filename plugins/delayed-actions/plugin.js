/**
 * Special type of delayed element that actually triggers an action when it's current
 */

export default class InspireAction extends HTMLElement {
	#triggered = 0;

	constructor() {
		super();

		// this.attachShadow({mode: "open"});
		// this.shadowRoot.innerHTML = `:host { display: none }`;
	}

	static get observedAttributes() {
		return ["type", "target", "class"];
	}

	get type() {
		return this.getAttribute("type");
	}

	set type(type) {
		this.setAttribute("type", type);
	}

	get target() {
		return this.getAttribute("target");
	}

	set target(target) {
		this.setAttribute("target", target);
	}

	trigger() {
		if (this.#triggered > 0 && this.hasAttribute("once")) {
			return;
		}

		this.#triggered++;

		let type = this.type || "click";
		let slide = this.closest(".slide");
		let targetSelector = this.target;

		if (!targetSelector) {
			throw new InvalidStateError("No target specified");
		}

		let target = slide.querySelector(targetSelector);

		if (target) {
			// TODO use correct constructor
			target.dispatchEvent(new Event(type));
		}
	}

	connectedCallback() {
		this.classList.add("delayed");
		this.innerHTML = `<slot></slot>`;
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === "class") {
			if (this.classList.contains("current")) {
				this.trigger();
			}
		}
	}
}

customElements.define("inspire-action", InspireAction);