(function(){
let selector = $$("[data-balance-elements]").map(e => e.getAttribute("data-balance-elements"));

selector = selector? selector + ", " : "";
selector += ".balance-lines";

var resizeObserver = new ResizeObserver(entries => {
	for (let entry of entries) {
		let h1 = entry.target;

		if (h1.balanced) {
			h1.balanced = false;
		}
		else {
			balanceLines(h1);
		}
	}
});

Inspire.hooks.add("slidechange", env => {
	if (env.prevSlide) {
		$$(selector, env.prevSlide).forEach(h1 => {
			h1.balanced = true;
			resizeObserver.unobserve(h1);
		});
	}

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

	let viewportWidth = innerWidth;
	const step = 10; // in pixels

	await delay(100);

	let minWidth = h1.getBoundingClientRect().width;

	h1.style.minWidth = "min-content";
	h1.style.width = ""; // reset to auto width

	await delay(100);

	let rect = h1.getBoundingClientRect();
	let autoWidth = rect.width;
	let autoHeight = rect.height;

	if (autoWidth > minWidth) {
		h1.style.opacity = "0";
		h1.style.width = autoWidth + "px";
		h1.style.transition = ".3s opacity";

		// Iteratively reduce width until height increases
		// TODO convert to binary search
		for (let w = autoWidth; w > minWidth; w -= step) {
			if (rect.width > viewportWidth) {
				// Something has gone really wrong, abort mission!
				h1.style.width = "";
				break;
			}

			h1.style.width = w + "px";
			rect = h1.getBoundingClientRect();

			if (autoHeight < rect.height - 5) {
				// We found the right width, revert to it and break
				h1.style.width = w + step + "px";
				h1.balanced = true;
				break;
			}
		}
		h1.style.opacity = "";
	}

	let slide = Inspire.currentSlide;

	await delay(2000);

	if (slide === Inspire.currentSlide) {
		resizeObserver.observe(h1);
	}

}


})();
