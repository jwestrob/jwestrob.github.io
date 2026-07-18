# Jacob West-Roberts — personal site

A small, dependency-free static site. Each main route is its own HTML document:

- `/` — home and one real predicted structure
- `/about/` — brief bio
- `/projects/` — Sharur, giant proteins, Talea, ELSA, and Gaia
- `/publications/` — Google Scholar-backed papers
- `/contact/` — email and mailto contact form
- `/art/` — older browser experiments

There is no single-page router and no framework. Normal links load normal pages.

## Local preview

```bash
npm run dev
```

Open `http://127.0.0.1:8000/`.

## Google Scholar data

The papers page renders `data/scholar.json`. Refresh it with:

```bash
python3 scripts/update_scholar.py
```

Google Scholar does not provide a supported public-profile API. The refresh
script makes one low-frequency request to Jacob's public profile, validates the
response, and atomically replaces the checked-in snapshot. A scheduled GitHub
Action runs it weekly. The site never depends on Scholar at page-load time, so
rate limiting or an outage there does not break the publication list.

Each title links to its Scholar detail record. Citation counts with a cited-by
record link directly to that Scholar result.

## Structure

The home page loads one compact C-alpha trace:
`data/structures/protein-fragment.json`.

The model is drawn with the Canvas 2D API. Desktop gets a slow, capped
18-frame-per-second rotation. Phones, reduced-motion devices, and low-power
machines get a static drawing that rotates only when dragged. Mobile also caps
the pixel ratio at 1 and draws every other point. The raw structure payload is
about 75 KB.

To prepare another trace from a Protenix mmCIF:

```bash
python3 scripts/prepare_structure.py MODEL.cif data/structures/model.json \
  --id model --label "Protein label" --segment "chunk 001"
```

## Checks

```bash
npm run validate
npm run build
```

The older generative pieces remain standalone pages and are intentionally kept
off the main site's rendering path.
