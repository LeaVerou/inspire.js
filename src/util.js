import $ from "https://v2.blissfuljs.com/src/$.js";

export function defer() {
	var res, rej;

	var promise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;
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

