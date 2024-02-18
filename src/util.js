export function defer (source) {
	var res, rej;

	var promise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;

		source?.then(res, rej);
	});

	promise.resolve = res;
	promise.reject = rej;

	return promise;
}


export function timeout (ms, {reject, value} = {}) {
	return new Promise((res, rej) => {
		let fn = reject? rej : res;
		return ms > 0 ? setTimeout(_ => fn(value), ms) : requestAnimationFrame(fn);
	});
}

export const wait = timeout;

// Get attribute value, from the first element it's defined on
// Useful for things like global settings where we don't care where the attribute is on
export function getAttribute (attribute) {
	let element = document.querySelector(`[${attribute}]`);
	return element && element.getAttribute(attribute);
}

export async function importCJS (src) {
	let prevModule = window.module;
	window.module = { exports: {} };
	await import(src);
	let ret = module.exports;
	window.module = prevModule;
	return ret;
}

export function toArray (arr) {
	return arr === undefined? [] : Array.isArray(arr)? arr : [arr];
}

export function deduplicateId (element) {
	// The first element with an id gets to keep it
	// Otherwise we'd end up with foo-2 before foo
	let firstWithId = document.getElementById(element.id);

	if (firstWithId === element) {
		// Already first with its id
		return;
	}

	let id = element.id.replace(/-\d+$/, ""); // avoid foo-1-1
	let related = [...document.querySelectorAll(`[id^="${id}-"]`)].filter(e => e !== element && RegExp(`^${id}-\\d+$`).test(e.id));
	let relatedIds = new Set(related.map(e => e.id))

	for (let i=2; ; i++) {
		let newId = `${id}-${i}`;

		if (!relatedIds.has(newId)) {
			element.id = newId;
			return;
		}
	}
}

export function bind (element, events) {
	for (let names in events) {
		for (let name of names.split(/\s+/)) {
			element.addEventListener(name, events[name]);
		}
	}
}

export { default as inView } from "./util/inview.js";
export { default as create } from "./util/create.js";

export { default as $ } from "../../bliss/src/$.js";
export { default as $$ } from "../../bliss/src/$$.js";
export { default as Hooks } from "../../bliss/src/Hooks.js";