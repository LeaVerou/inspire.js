{

// let forceResolution;
//
// if (forceResolution = $("[data-resolution]")) {
// 	let [width, height] = forceResolution.dataset.resolution.split(/\s+/);
//
// 	forceResolution.style.setProperty("--vw", width);
// 	forceResolution.style.setProperty("--vh", height);
//
// 	var adjustZoom = () => {
// 		let [wratio, hratio] = [innerWidth / width, innerHeight / height];
//
// 		document.documentElement.style.zoom = Math.min(wratio, hratio) * 100 + "%";
// 	}
//
// 	adjustZoom();
// 	addEventListener("resize", adjustZoom, {passive: true});
// }

$$("[data-resolution]").forEach(element => {
	let [width, height] = element.closest("[data-resolution]").dataset.resolution.split(/\s+/);
	element.style.setProperty("--vw", width);
	element.style.setProperty("--vh", height);
});

let width, height;

var adjustZoom = () => {
	let zoom = "";

	if (width && height) {
		let [wratio, hratio] = [innerWidth / width, innerHeight / height];

		zoom = Math.min(wratio, hratio) * 100 + "%";
	}

	document.documentElement.style.zoom = zoom;
}

Inspire.hooks.add("slidechange", env => {
	if (Inspire.currentSlide.closest("[data-resolution]")) {
		let cs = getComputedStyle(Inspire.currentSlide);
		[width, height] = [cs.getPropertyValue("--vw"), cs.getPropertyValue("--vh")];
		adjustZoom();
		addEventListener("resize", adjustZoom, {passive: true});
	}
	else if (env.prevSlide.closest("[data-resolution]")) {
		// Cleanup
		[width, height] = ["", ""];
		adjustZoom();
		removeEventListener("resize", adjustZoom, {passive: true});
	}
});

}
