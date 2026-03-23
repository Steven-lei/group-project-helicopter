# deploy to flyctl using Github Action

Reference: https://fly.io/docs/

## install flyctl locally

### Windows

Run the PowerShell install script
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"

### Linux

Run the install script

```sh
curl -L https://fly.io/install.sh | sh
```

## Add Dockerfile for containization

# for command test
FROM node:22-alpine
WORKDIR /app
COPY package\*.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=3000
EXPOSE $PORT
CMD ["node", "--max-old-space-size=200", "src/app.js"]

## Configure fly.toml

app = "cs732-groupproj"
primary_region = "syd"
[http_service]
internal_port = 3000
force_https = true
auto_stop_machines = true # turn off when no traffic
auto_start_machines = true

## Configure github workflows

name: Deploy Backend
on:
push:
branches: [main] # only on main branch
paths: ["backend/**"]
jobs:
deploy-backend:
runs-on: ubuntu-latest
steps: - name: Checkout code
uses: actions/checkout@v4 - name: Setup Node
uses: actions/setup-node@v4
with:
node-version: 22 - name: Setup Flyctl
uses: superfly/flyctl-actions/setup-flyctl@master - name: Deploy to Fly.io
run: flyctl deploy --remote-only
working-directory: ./backend
env:
FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

## Create a deploy token

```sh
fly tokens create deploy
```

## Add secrets to Github

Github Repo -> Setting -> Secrets and variables -> Action -> New repository secrets
Name: FLY_API_TOKEN
Value: Copy and Paste the token created in the previous step
