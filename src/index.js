// Meta package: the one-install bundle of Inspire.js.
// Imports the core engine (which auto-initializes) and its subpath exports
// needed by plugins at runtime, the official plugins (which attach to Inspire
// and autoload on demand), then re-exports the core object.
export { default } from "@inspirejs/core";
import "@inspirejs/core/util"; // workaround for plugins
import "@inspirejs/plugins";
