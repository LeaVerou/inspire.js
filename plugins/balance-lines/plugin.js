(function(){

var resizeObserver = new ResizeObserver(entries => {
	for (let entry of entries) {
		let h1 = entry.target;
		balanceLines(h1);
	}
});

Inspire.hooks.add("slidechange", env => {
	$$(".balance-lines", env.slide).forEach(h1 => {
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

		// Iteratively reduce width until height increases
		for (let i=0; i<rect.width/10; i++) {
			h1.style.width = rect.width - 10 + "px";
			rect = h1.getBoundingClientRect();

			if (height < rect.height - 5) {
				// We found the right width, revert to it and break
				h1.style.width = rect.width + 10 + "px";
				return i;
			}
		}

		requestAnimationFrame(() => {
			resizeObserver.observe(h1);
		});
	});

}


})();
