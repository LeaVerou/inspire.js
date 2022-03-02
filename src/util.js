import $ from "https://v2.blissfuljs.com/src/$.js";

export function defer(source) {
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


export function timeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// Get attribute value, from the first element it's defined on
// Useful for things like global settings where we don't care where the attribute is on
export function getAttribute(attribute) {
	let element = $(`[${attribute}]`);
	return element && element.getAttribute(attribute);
}

export async function importCJS(src) {
	let prevModule = window.module;
	window.module = { exports: {} };
	await import(src);
	let ret = module.exports;
	window.module = prevModule;
	return ret;
}

export function toArray(arr) {
	return arr === undefined? [] : Array.isArray(arr)? arr : [arr];
}