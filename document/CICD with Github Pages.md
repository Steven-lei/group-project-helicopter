# Deploy to Github Pages

## Configure github workflows

```yml
name: Deploy Frontend
on:
  push:
    branches: [main] # only on main branch
    paths: ["frontend/**"]
  workflow_dispatch:
permissions:
  contents: read # allow read
  pages: write # allow write to pages
  id-token: write # allow id
jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    environment: github-pages
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "npm"

      - name: Install dependencies
        run: npm install

      - name: Build project
        run: npm run build
        env:
          VITE_BACKEND_BASE_URL: ${{ secrets.VITE_BACKEND_BASE_URL }}
      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "./frontend/dist"

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Configure Github Pages

Repository -> Settings -> Buid and deployment

Choose GitHub Actions

## Use Base Path to avoid path issue

Add base: "/group-project-helicopter/" to vite.config.js

Use
<BrowserRouter basename={import.meta.env.BASE_URL}>
<BrowserRouter>
to wrap Routes
