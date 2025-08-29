# D&D 5e Character Manager
# D&D 5e Character Manager

A small, client-side web app to help create and manage Dungeons & Dragons 5th Edition characters. This repository contains a minimal static implementation (HTML/CSS/JS) intended for personal use, learning, and easy extension.

## Features

- Simple character creation UI (name, race, class, basic stats).
- Save/load characters in the browser (localStorage).
- Clean, minimal layout with `index.html`, `styles.css`, and `script.js` for easy extension.

## Files

- `index.html` — Single-page UI and markup.
- `styles.css` — Styles for layout and components.
- `script.js` — Client-side logic (character model, storage, UI interactions).
- `README.md` — This file.

## Run / Preview

Because this is a plain static site, there are two easy ways to preview it:

1. Open `index.html` directly in your browser (double-click the file).
2. Serve it from a simple local HTTP server (recommended for correct module/script behavior):

```bash
# From the project root, using Python 3
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```

## Development

- Make UI or logic edits in `index.html` / `script.js` and refresh the browser.
- If you add build tooling or dependencies, include a `package.json` or similar and update this README.

### Suggested small improvements

- Add character export/import (JSON file) to share characters between devices.
- Add validations for stat total / point-buy systems.
- Add unit tests for core logic (if the JS is modularized).

## Contributing

Contributions are welcome. Open an issue to discuss larger changes before submitting a pull request.

## License

This project is provided under the MIT License — see `LICENSE` if you add one. If you prefer a different license, add a `LICENSE` file to the repo.

## Contact

Project maintained by the repository owner. For questions or suggestions, open an issue on GitHub.
# D&D 5e Character Manager
