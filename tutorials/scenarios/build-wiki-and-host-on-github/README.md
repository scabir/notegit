# Build a Linked Wiki in NoteBranch and Host It Free on GitHub

This scenario starts after repository setup and login. It focuses on wiki structure, linking, images, and publish flow.

## Step 1: Start from a connected repository

This scenario begins after setup/login so you can focus directly on building wiki content.

![Start from a connected repository](images/step-01-connected-workspace.png)

## Step 2: Create a top-level wiki folder

Create a dedicated `wiki/` folder to keep linked docs and assets organized.

![Create a top-level wiki folder](images/step-02-create-wiki-folder.png)

## Step 3: Create the home page

Add `index.md` inside `wiki/` to serve as the wiki entry point.

![Create the home page](images/step-03-create-index-page.png)

## Step 4: Write and preview linked wiki pages

Use relative links between markdown pages so wiki navigation works naturally.

![Write and preview linked wiki pages](images/step-04-linked-home-page.png)

## Step 5: Navigate by clicking links in preview

Clicking an internal markdown link in preview opens the linked page in-place.

![Navigate by clicking links in preview](images/step-05-open-linked-page-from-preview.png)

## Step 6: Embed and render an imported image

After importing an image into `wiki/assets/`, embed it with a relative markdown image path.

![Embed and render an imported image](images/step-06-embedded-image-rendered.png)

## Step 7: Follow cross-links across the wiki

Cross-page links make the wiki browseable, similar to how readers move across docs on GitHub.

![Follow cross-links across the wiki](images/step-07-navigate-to-another-linked-page.png)

## Publish on GitHub (Free)

Use one of these paths:

1. Repository-hosted docs (fastest)
   Keep wiki files in the repo (for example under `wiki/`) and push normally. GitHub renders markdown pages with working relative links and images when browsed in the repo.

2. GitHub Pages (public static docs)
   Push your markdown pages and configure Pages from your default branch. For a clean multi-page wiki site, pair this with a static-site setup (for example Jekyll/MkDocs) so linked markdown pages are published as HTML routes.

Typical publish commands:

```bash
git add wiki
git commit -m "docs: build wiki pages"
git push origin main
```
