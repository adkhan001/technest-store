# TechNest Vercel Deployment Guide

This guide will walk you through deploying the TechNest online store to Vercel. The entire process takes about 10 minutes.

## Prerequisites

Before you start, make sure you have:
- A GitHub account (free: https://github.com/signup)
- A Vercel account (free: https://vercel.com/signup)
- Git installed on your computer (https://git-scm.com/download)

---

## Step 1: Set Up Git and GitHub (Local)

### 1.1 Initialize a Git repository in your project folder

Open your terminal/command prompt in the TechNest project folder and run:

```bash
git init
git add .
git commit -m "Initial commit: TechNest e-commerce store"
```

### 1.2 Create a new repository on GitHub

1. Go to https://github.com/new
2. Name your repository: `technest-store` (or your preferred name)
3. Choose **Public** (so Vercel can access it)
4. Click **Create repository**
5. Copy the commands GitHub shows you for "push an existing repository from the command line"

### 1.3 Link your local folder to GitHub

Paste the commands from GitHub into your terminal. They look like:

```bash
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/technest-store.git
git push -u origin main
```

Wait for the upload to finish (you'll see "100%").

---

## Step 2: Deploy to Vercel

### 2.1 Sign up for Vercel

Go to https://vercel.com/signup and create a free account. Choose "Continue with GitHub" for easiest setup.

### 2.2 Import your GitHub project to Vercel

1. After signing in, click **Add New...** → **Project**
2. Click **Import Git Repository**
3. Paste your GitHub repository URL: `https://github.com/YOUR-USERNAME/technest-store`
4. Click **Continue**

### 2.3 Configure the project

On the "Configure Project" page:
- **Project Name**: `technest-store` (or your preferred name)
- **Framework**: Select "Other" (static site)
- **Root Directory**: Leave as `.` (default)
- **Build and Output Settings**: Leave at defaults (nothing to build)
- Click **Deploy**

### 2.4 Wait for deployment

Vercel will now build and deploy your site. You'll see:
1. A deployment progress page with checkmarks
2. When complete, a ✅ **Congratulations** message
3. Your live URL (something like: `https://technest-store.vercel.app`)

---

## Step 3: Verify Your Deployment

Click the **Visit** button or go to your Vercel URL to check:
- ✅ Homepage loads
- ✅ Images display correctly
- ✅ All pages accessible (Shop, About, Cart, etc.)
- ✅ Filters and search work
- ✅ Cart saves items (localStorage works)

---

## Step 4: Set Up a Custom Domain (Optional)

If you own a domain (or want to buy one):

### 4.1 Add a domain in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Domains**
3. Enter your domain name (e.g., `technest.com`)
4. Follow Vercel's instructions to update your domain's DNS settings

---

## Step 5: Update Your Project (After Deployment)

If you make changes to your files:

```bash
# Make your changes, then:
git add .
git commit -m "Describe your changes here"
git push
```

Vercel will **automatically** redeploy your site within 1–2 minutes.

---

## Troubleshooting

### Images not showing?
- Check that all image paths in HTML are correct and relative (e.g., `assets/products/image.jpg`)
- Vercel is case-sensitive on Linux (where it runs), so check folder names match exactly

### Site shows 404 for pages?
- Make sure all `.html` files are in the root directory
- Vercel serves `index.html` for the root and each `.html` file directly
- For example: `shop.html` is served at `/shop` or `/shop.html`

### Deployment fails?
- Go to **Deployments** tab in Vercel to see error logs
- Common issue: Wrong build settings. Make sure you left build settings at defaults.

### Cache issues after update?
- Hard refresh your browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or clear browser cache and reload

---

## File Summary

These files were added to help with deployment:

- **vercel.json**: Tells Vercel how to serve your site
- **.gitignore**: Tells Git which files to skip (OS files, cache, etc.)

Everything else (HTML, CSS, JS, assets) is unchanged.

---

## Your Live URLs

Once deployed:
- **Main site**: `https://technest-store.vercel.app` (or your custom domain)
- **Vercel dashboard**: `https://vercel.com/dashboard`
- **GitHub repo**: `https://github.com/YOUR-USERNAME/technest-store`

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **GitHub Docs**: https://docs.github.com
- **Common Issues**: https://vercel.com/docs/platform/frequently-asked-questions

Good luck with your deployment! 🚀
