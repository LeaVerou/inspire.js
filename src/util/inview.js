import { defer } from "../util.js";

let inViewObserver = new IntersectionObserver((entries, observer) => {
	for (let entry of entries) {
		if (entry.isIntersecting) {
			observer.unobserve(entry.target);
			let promise = inViewPromises.get(entry.target);
			promise.resolve(entry);
			inViewPromises.delete(entry.target);
		}
	}
});
let inViewPromises = new WeakMap();

export default async function inView (element) {
	inViewObserver.observe(element);
	let ret = defer();
	inViewPromises.set(element, ret);
	return ret;
}