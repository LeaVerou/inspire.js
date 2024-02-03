export const hasCSS = true;

for (let el of document.querySelectorAll(('[class*="heading-"]'))) {
	let [, m, n] = el.className.match(/\bheading-(\d)x(\d)/) || [];

	if (m && n) {
		el.classList.add("heading-MxN");

		if (!el.style.getPropertyValue("--columns")) {
			el.style.setProperty("--columns", m);
		}

		if (!el.style.getPropertyValue("--rows")) {
			el.style.setProperty("--rows", n);
		}
	}
}
