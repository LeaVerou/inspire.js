{

let forceResolution;

if (forceResolution = $("[data-resolution]")) {
	let [width, height] = forceResolution.dataset.resolution.split(/\s+/);

	forceResolution.style.setProperty("--vw", width);
	forceResolution.style.setProperty("--vh", height);

	var adjustZoom = () => {
		let [wratio, hratio] = [innerWidth / width, innerHeight / height];

		document.documentElement.style.zoom = Math.min(wratio, hratio) * 100 + "%";
	}

	adjustZoom();
	addEventListener("resize", adjustZoom, {passive: true});
}

}
