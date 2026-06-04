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

This is native ESM using bare specifiers — resolve them however your project does (an import map, a bundler, or a no-build tool — we recommend [Nudeps](https://nudeps.dev)).
Then include the stylesheet and import:

```html
<link href="/path/to/@inspirejs/core/inspire.css" rel="stylesheet" />

<script type="module">
	import "inspirejs.org"; // core + plugins, ready to go
</script>
```

`import Inspire from "inspirejs.org"` gives you the `Inspire` API (also the global `Inspire`).

## Slide decks using Inspire.js

- [Lea Verou’s talks](https://github.com/leaverou/talks)
- [MIT "Design for the Web" course](https://designftw.mit.edu/schedule/)
- [TC39 First-class protocols 2026 update](https://github.com/tc39/proposal-first-class-protocols/tree/main/slides/2026-03)
- https://webplatform.design/talks/tpac2025/
- https://webplatform.design/talks/image-animation/
- https://webplatform.design/talks/mixins/
- https://webplatform.design/talks/class-composition/
