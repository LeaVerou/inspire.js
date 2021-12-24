import Inspire from "../../../inspire.mjs";

export const hasCSS = true;

let selector = $$("[data-balance-elements]").map(e => e.getAttribute("data-balance-elements")).join(", ");

selector = selector? selector + ", " : "";
selector += ".balance-lines";

var resizeObserver = new ResizeObserver(entries => {
	for (let entry of entries) {
		let h1 = entry.target;

		if (h1.balanced) {
			h1.balanced = false;
		}
		else if (!h1.style.width) {
			balanceLines(h1);
		}
	}
});

Inspire.hooks.add("slidechange", env => {
	// Stop observing everything
	resizeObserver.disconnect();

	$$(selector, env.slide).forEach(h1 => {
		if (!h1.balanced) {
			balanceLines(h1);
		}

		resizeObserver.observe(h1);
	});
});

let delay = ms => new Promise(r => setTimeout(r, ms));

async function balanceLines(h1) {
	resizeObserver.unobserve(h1);
	h1.balanced = true;

	const step = 10; // in pixels

	await delay(1);

	h1.style.minWidth = "min-content";
	h1.style.width = ""; // reset to auto width

	let parent = h1.parentNode;
	let maxWidth = parent.getBoundingClientRect().width;
	let parentCS = getComputedStyle(parent);
	maxWidth -= (parseInt(parentCS.paddingLeft) || 0) + (parseInt(parentCS.paddingRight) || 0);

	await delay(1);

	let rect = h1.getBoundingClientRect();
	let autoWidth = rect.width;
	let autoHeight = rect.height;

	if (autoWidth >= maxWidth - step - 1) { // if auto width is < max width it means no text wrapping is happening
		h1.style.opacity = "0";
		h1.style.width = autoWidth + "px";
		h1.style.transition = ".3s opacity";

		// Iteratively reduce width until height increases
		// TODO convert to binary search
		for (let w = autoWidth; w > step; w -= step) {
			if (rect.width > maxWidth) {
				// Something has gone really wrong, abort mission!
				h1.style.width = "";
				break;
			}

			h1.style.width = w + "px";
			rect = h1.getBoundingClientRect();

			if (autoHeight < rect.height - 5) {
				// We found the right width, revert to it and break
				h1.style.width = w + step + "px";
				break;
			}
		}
		h1.style.opacity = "";
	}

	let slide = Inspire.currentSlide;

	await delay(1000);

	if (slide === Inspire.currentSlide) {
		resizeObserver.observe(h1);
	}

}


