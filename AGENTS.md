# MARS 2035 Project Notes

## Goal

Build a polished static landing page for a fictional Mars travel experience called `MARS 2035`.

The page should feel cinematic and interactive, with a strong first-screen signal, scannable mission data, selectable cabin cards, and a clear booking call to action.

## Technical Stack

- `index.html` for semantic page structure
- `styles.css` for responsive styling and animations
- `script.js` for canvas rendering, pointer interaction, counters, and scroll reveal behavior

No framework or build step is required.

## Sections

- Hero section with `MARS 2035`, `NEXT DESTINATION: MARS`, an interactive Mars canvas, and primary CTA.
- Data dashboard showing gravity, journey distance, CO2 atmosphere, and travel duration.
- Cabin selection with Explorer, Navigator, and Pioneer options.
- Booking CTA section with email capture and ticket button.

## Local Preview

Run a local static server from the project root:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173/index.html
```
