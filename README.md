# Inspire.js
### Lean, hackable, extensible slide deck framework. Create basic slides by just writing HTML and CSS, do fancy custom stuff with JS, the sky is the limit!
### Previously known as CSSS.

Code cleanup in progress. Visit later. If you were using CSSS and would rather stay at it, run `git checkout v1.0.0` and stay there.

## Migrating from CSSS

- Almost all HTML syntax is the same! The same JS events are still fired. So, very little should break.
- `slideshow.css` is now `inspire.css`
- `slideshow.js` is now `inspire.js`
- You don't need to run JS to create a slideshow, it is created automatically.
- The `SlideShow` JS class is now `Inspire`
- The `slideshow` JS variable is now `Inspire`
- Presenter view will not be loaded unless there is at least one `class="presenter-notes"` item.
- The CSS Controls plugin is now gone. Use [Mavo](https://mavo.io) if you need this functionality.
- The CSS Snippets plugin is now gone. We will soon add a much better one, extracted based on the live demo script in https://github.com/leaverou/talks.
- Incrementable is no longer a plugin. Use the separate script from https://github.com/leaverou/incrementable.
- `reusable.css` has now been merged into the default theme, `theme.css`.
- `data-import` is now `data-insert`
