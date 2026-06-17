# StatHub — Premium Statistics Publication

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
