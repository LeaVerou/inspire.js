// Meta package: the one-install bundle of Inspire.js.
// Imports the core engine (which auto-initializes) and its subpath exports
// needed by plugins at runtime, the official plugins (which attach to Inspire
// and autoload on demand), then re-exports the API.
import Inspire from "@inspirejs/core";
import "@inspirejs/core/util";
import "@inspirejs/plugins";

export default Inspire;
