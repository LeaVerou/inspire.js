# Presenter View

## Features

- Speaker notes (use `<details class="notes>`)
- Next slide preview
- Future delayed items preview
- Timing help (use `data-start-time` and `data-time` to specify ideal times)
- Add custom CSS to either the presenter or the audience view

## Autoload

The plugin autoloads if speaker notes (`<details class="notes">`) are found in any slide.

## Usage

Enter presenter mode by pressing <kbd>Ctrl</kbd> + <kbd>P</kbd>.
Yes, this is <kbd>Ctrl</kbd>, even on OSX.
This will make the current window the Presenter view, and will open another window for the audience view.
You are meant to move the audience view to the projector screen, and interact with the presenter view yourself.
Navigation in the two views is synced (including `.delayed` items).

If you refresh the presenter view, you need to press <kbd>Ctrl</kbd> + <kbd>P</kbd> again to reconnect with the audience view,
but it will reuse the same tab.
On the other hand, if you refresh the audience view, the presenter view will automatically reconnect.

To exit presenter view, simply refresh the window.

## Limitations

- You cannot use mirroring when connecting to the projector, you need to treat the projector as a separate screen.
- Only slide/item navigation is synced across the two views, not keyboard or mouse events.
This means that you need to interact with the projector window to e.g. play videos, open links, or show a live demo.