# Website (`app/website`)

Static React/Vite landing page for the NoteBranch desktop app.

## Run locally

```bash
cd app/website
pnpm install
pnpm run dev
```

## Build static output

```bash
cd app/website
pnpm run build
```

Build artifacts are generated in `app/website/dist/` and are suitable for GitHub Pages publishing.

## Rebrand and content updates

- Brand name, links, tutorial URLs, features, and section text: `src/data/siteContent.ts`
- Main layout composition: `src/App.tsx`
- Dark theme visual system: `src/styles.css`
- Screenshot assets used by the page: `src/assets/screenshots/`
