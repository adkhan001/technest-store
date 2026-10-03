# Quick Deployment Checklist (5-minute version)

## What you're deploying
- ✅ Static HTML/CSS/JavaScript site (no backend needed)
- ✅ All images embedded locally (assets folder)
- ✅ Cart works with localStorage (stays on same browser)
- ✅ Works on mobile and desktop

## Before you start
- [ ] Have a GitHub account
- [ ] Have a Vercel account
- [ ] Have Git installed

## The process (3 steps)

### Step 1: Push to GitHub (5 min)
```bash
git init
git add .
git commit -m "TechNest e-commerce store"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/technest-store.git
git push -u origin main
```

### Step 2: Deploy on Vercel (3 min)
1. Go to vercel.com/dashboard
2. Click "Add New" → "Project"
3. Select your GitHub repo `technest-store`
4. Click "Deploy"
5. Wait for checkmarks ✅✅✅

### Step 3: Verify (2 min)
1. Click "Visit" button
2. Check homepage loads
3. Click around - test Shop, Cart, Pages
4. Done! 🎉

## Your live URL
```
https://technest-store.vercel.app
```
(or your custom domain if you added one)

## If images don't show
- Hard refresh: Ctrl+Shift+R
- Check the Vercel deployment logs for errors
- Verify all image paths are relative (not absolute)

## Make updates later
```bash
git add .
git commit -m "Your change description"
git push
```
Vercel redeploys automatically within 1-2 minutes.

---

**That's it! You now have a live online store.** ✨
