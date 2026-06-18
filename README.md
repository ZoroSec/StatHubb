# 

<<<<<<< HEAD
=======
A statistics library inspired by Statista, Our World in Data, and Knoema.

## Quick Start (Local)

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to GitHub Pages (3 Steps)

### Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and log in
2. Click **"+"** → **"New repository"**
3. Name it `stathub` (or anything you want)
4. Select **"Public"**
5. Click **"Create repository"**

### Step 2: Upload Your Code

**Option A — Using GitHub Desktop (easiest):**
1. Download [GitHub Desktop](https://desktop.github.com/)
2. Clone your new repository
3. Copy all the StatHub files into the folder
4. Commit and push

**Option B — Using command line:**
```bash
# In your StatHub folder:
git init
git add .
git commit -m "StatHub website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stathub.git
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **"Settings"** (top tab)
3. Click **"Pages"** (left sidebar)
4. Under "Build and deployment" → **Source** → select **"GitHub Actions"**
5. Done! Wait 2-3 minutes.

Your site is live at: **https://YOUR_USERNAME.github.io/stathub/**

---

## Troubleshooting

### The build fails on GitHub Actions

Check the "Actions" tab in your repository. Common fixes:

1. **"Module not found" error** — Make sure you uploaded `package.json` (not `package.stathub.json`)
2. **Empty page / 404** — Go to Settings → Pages, make sure Source is "GitHub Actions"
3. **Assets not loading (broken CSS/JS)** — This is fixed automatically; the workflow sets `GITHUB_REPO` for correct paths

### The site works locally but not on GitHub Pages

Make sure your repository name matches what's in the URL. The workflow auto-detects your repo name and sets the correct base path. If your repo is named `my-stats-site`, your site will be at `https://USERNAME.github.io/my-stats-site/`.

### I want a custom domain (like stathub.com)

1. Go to Settings → Pages → Custom domain
2. Enter your domain
3. Add a `CNAME` file in the `public/` folder with your domain name
4. Configure DNS with your domain provider

## Admin Panel

- Click the **⚙ gear icon** in the nav
- Default password: `stathub2024`
- Change it immediately via "Change Password"

## Features

- 24 built-in datasets across 12 topics
- 7 chart types with forecast and annotations
- Password-protected admin panel
- Jupyter notebook (.ipynb) upload and viewer
- Dark/light mode
- Fully responsive

## Tech Stack

- Next.js 16 (static export)
- TypeScript
- Tailwind CSS 4
- Zustand (state management)
- Custom SVG chart engine (no external chart library)

## Publishing data from the Local Editor → GitHub (Option 2)

The admin area ("Local Editor") can commit your authored datasets straight to
this repo. GitHub Actions then rebuilds and redeploys automatically, so new data
goes live without a manual `git` step.

### How it works
- Datasets you add/edit are saved in your browser (localStorage).
- "Publish to GitHub" commits them as JSON to `public/data/custom-datasets.json`.
- At runtime the app loads that JSON and merges it with the built-in datasets.
- Merge precedence: built-in < published JSON < your local unsaved edits.

### Token setup (do this once)
1. GitHub → Settings → Developer settings → **Fine-grained personal access tokens** → Generate new token.
2. **Repository access**: Only select repositories → choose `ZoroSec/StatHubb`.
3. **Permissions** → Repository permissions → **Contents: Read and write**. Nothing else.
4. Generate, copy the token (starts with `github_pat_`).
5. In the Local Editor, open **Publish to GitHub**, paste the token, click **Verify token**, then **Publish**.

### Security
- The token lives in the page's memory only. It is **never** saved to
  localStorage, never committed, never bundled into the static site, and is
  cleared on refresh.
- Because this is a static site, there is no safe place for a server-side
  secret — that is why you supply the token at runtime. **Never hardcode a
  token in the source.**
- For unattended or multi-user publishing, move the commit step behind a
  serverless function (Cloudflare/Vercel/Netlify) that holds the token as a
  secret, and have the panel call that instead.
- All datasets are validated before any commit, so malformed data can't be
  pushed into a build that now fails on type errors.
>>>>>>> cfcbfea (Second commit)
