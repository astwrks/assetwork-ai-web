# Fix Netlify Deployment - Step by Step

## Problem Summary
Netlify is trying to build files that don't exist in this repository:
- `src/app/settings/advanced/page.tsx`
- Missing components: `switch`, `badge`, `select`, `separator`, `tabs`

## Solution

### Step 1: Go to Netlify Dashboard
1. Visit https://app.netlify.com
2. Find your AssetWorks site
3. Go to **Site Settings** → **Build & Deploy**

### Step 2: Check Current Configuration
Look for:
- **Repository**: Should be `astwrks/assetwork-ai-web`
- **Branch**: Check which branch is being deployed (likely `main`)
- **Base directory**: Should be empty or `/`
- **Build command**: Should be `npm run build`
- **Publish directory**: Should be `.next`

### Step 3: Update Branch to Deploy Your Features
Since you just pushed to `feature/financial-playground-cancel-edit`, you have 2 options:

#### Option A: Merge to Main (Recommended for Production)
```bash
# Switch to main branch
git checkout main

# Merge your feature branch
git merge feature/financial-playground-cancel-edit

# Push to main
git push origin main
```

Then Netlify will automatically deploy from `main`.

#### Option B: Deploy from Feature Branch (For Testing)
1. In Netlify Dashboard → **Site Settings** → **Build & Deploy** → **Continuous Deployment**
2. Under **Branch deploys**, click **Configure**
3. Change **Production branch** from `main` to `feature/financial-playground-cancel-edit`
4. Click **Save**

### Step 4: Clear Build Cache
1. In Netlify Dashboard → **Deploys**
2. Click **Trigger deploy** → **Clear cache and deploy site**

### Step 5: Monitor the Build
Watch the build logs at:
https://app.netlify.com/sites/YOUR-SITE-NAME/deploys

## Alternative: If Errors Persist

If you still see errors about `src/app/settings/advanced/page.tsx`, it means Netlify has old files.

### Clean Solution:
1. Delete the site in Netlify
2. Create a new site
3. Connect to repository: `astwrks/assetwork-ai-web`
4. Set branch to: `feature/financial-playground-cancel-edit` (or `main` after merging)
5. Build command: `npm run build`
6. Publish directory: `.next`

## Quick Command to Merge to Main

If you want to merge your work to main branch right now:

```bash
# Make sure your feature branch is up to date
git checkout feature/financial-playground-cancel-edit
git pull origin feature/financial-playground-cancel-edit

# Switch to main
git checkout main
git pull origin main

# Merge your feature
git merge feature/financial-playground-cancel-edit

# Push to main
git push origin main
```

After pushing to main, Netlify will automatically rebuild (if it's watching the main branch).

## Verify Your Changes

After deployment succeeds, test these URLs:
- `/settings` - Should show the new financial data integration tab
- `/financial-playground` - Should show the playground
- `/financial-playground` - Should show financial playground

## Need Help?

If you see any errors during deployment, share the build logs and I can help debug them!
