# inspirejs.org

The one-install bundle of [Inspire.js](https://github.com/inspire-js/inspire.js), the lean, hackable, extensible slide deck framework.

This package just pulls in and re-exports:

- [`@inspirejs/core`](https://github.com/inspire-js/core) — the engine
- [`@inspirejs/plugins`](https://github.com/inspire-js/plugins) — the official, autoloaded plugins

Prefer this if you want everything in one go. For finer control (e.g. core without the official plugins), depend on `@inspirejs/core` and `@inspirejs/plugins` directly.

## Install

```sh
npm install inspirejs.org
```

This is native ESM using bare specifiers — resolve them however your project does (an import map, a bundler, or a no-build tool). Then include the stylesheet and import:

```html
<link href="/path/to/@inspirejs/core/inspire.css" rel="stylesheet" />

<script type="module">
	import "inspirejs.org"; // core + plugins, ready to go
</script>
```

`import Inspire from "inspirejs.org"` gives you the `Inspire` API (also the global `Inspire`).

## License

MIT © Lea Verou and contributors
