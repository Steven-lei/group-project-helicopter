# deploy to flyctl using Github Action

Reference: https://fly.io/docs/

## install flyctl locally

### Windows

Run the PowerShell install script

````powershell
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```sh
### Linux

Run the install script

```sh
curl -L https://fly.io/install.sh | sh
````

## Add Dockerfile for containization

```yml
name: Deploy Backend
on:
  push:
    branches: [main] # only on main branch
    paths: ["backend/**"]
jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Setup Flyctl
        uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Deploy to Fly.io
        run: flyctl deploy --remote-only
        working-directory: ./backend
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

## Create a deploy token

```sh
fly tokens create deploy
```

## Add secrets to Github

Github Repo -> Setting -> Secrets and variables -> Action -> New repository secrets
Name: FLY_API_TOKEN
Value: Copy and Paste the token created in the previous step
