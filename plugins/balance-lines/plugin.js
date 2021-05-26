(function(){
let selector = $$("[data-balance-elements]").map(e => e.getAttribute("data-balance-elements"));

selector = selector? selector + ", " : "";
selector += ".balance-lines";

var resizeObserver = new ResizeObserver(entries => {
	for (let entry of entries) {
		let h1 = entry.target;
		balanceLines(h1);
	}
});

Inspire.hooks.add("slidechange", env => {
	$$(selector, env.slide).forEach(h1 => {
		balanceLines(h1);
		resizeObserver.observe(h1);
	});
});

function balanceLines(h1) {
	resizeObserver.disconnect(h1);
	h1.style.width = "";

	requestAnimationFrame(() => {
		var rect = h1.getBoundingClientRect();

		h1.style.width = rect.width + "px";
		var height = rect.height;
		let viewportWidth = innerWidth;

		// Iteratively reduce width until height increases
		for (let i=0; i<rect.width/10; i++) {
			if (rect.width > viewportWidth) {
				// Something has gone really wrong, abort mission!
				h1.style.width = "";
				break;
			}

			h1.style.width = rect.width - 10 + "px";
			rect = h1.getBoundingClientRect();

			if (height < rect.height - 5) {
				// We found the right width, revert to it and break
				h1.style.width = rect.width + 10 + "px";
				return i;
			}
		}

		setTimeout(() => {
			resizeObserver.observe(h1);
		}, 2000);
	});

}


})();
