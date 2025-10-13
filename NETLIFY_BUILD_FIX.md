# 🚨 Netlify Build Error - Fix Guide

## Error Summary

**Build Failed**: Module resolution errors for UI components
**Error Type**: `Module not found: Can't resolve '@/components/ui/badge'`
**Root Cause**: Path alias mismatch or stale Netlify configuration

---

## 🔍 Problem Analysis

### Error Details
```
./src/app/settings/advanced/page.tsx:8:1
Module not found: Can't resolve '@/components/ui/badge'
```

### Issue
1. The error references `src/app/settings/advanced/page.tsx`
2. **Our repository structure uses `app/` NOT `src/app/`**
3. The file `settings/advanced/page.tsx` doesn't exist in our repo
4. This suggests Netlify is building from:
   - Wrong commit
   - Stale cache
   - Wrong repository
   - Old branch

---

## ✅ Solutions

### Option 1: Clear Netlify Build Cache (Recommended)

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com
   - Select your site: `assetwork-ai-web`

2. **Clear Cache and Deploy**
   - Go to "Deploys" tab
   - Click "Trigger deploy"
   - Select **"Clear cache and deploy site"**

3. **Wait for Build**
   - Monitor the build logs
   - Verify it clones the correct code

---

### Option 2: Verify Netlify Configuration

1. **Check Deploy Settings**
   ```
   Build command: npm run build
   Publish directory: .next
   Base directory: (leave empty)
   ```

2. **Check Branch Settings**
   - Ensure it's deploying from the correct branch
   - Default should be `main`

3. **Check Environment Variables**
   Netlify needs these variables:
   ```bash
   DATABASE_URL=<your-neon-url>
   MONGODB_URI=<your-mongodb-url>
   NEXTAUTH_SECRET=<your-secret>
   NEXTAUTH_URL=<your-production-url>
   ANTHROPIC_API_KEY=<your-key>
   # ... other keys
   ```

---

### Option 3: Force Push to Trigger Clean Build

```bash
# Ensure you're on the correct branch
git checkout main

# Create empty commit to force rebuild
git commit --allow-empty -m "Trigger Netlify rebuild"

# Push to trigger deployment
git push origin main
```

---

## 🔧 Verify Local Build Works

Before deploying, ensure the build works locally:

```bash
# Clean everything
rm -rf .next node_modules

# Reinstall dependencies
npm install

# Test build
npm run build

# If build succeeds locally, the issue is with Netlify
```

---

## 📝 Check Current Repository State

```bash
# Our repository structure:
app/                  # ✅ We use this
  settings/
    page.tsx          # ✅ Exists
  financial-playground-v2/
    page.tsx          # ✅ Exists
  api/
  ...

src/                  # ❌ We DON'T have this
  app/
    settings/
      advanced/       # ❌ Doesn't exist in our repo
```

---

## 🎯 Root Cause Identification

The Netlify error shows:
```
Line 74: ./src/app/settings/advanced/page.tsx:8:1
```

But our repo has:
- `app/settings/page.tsx` ✅
- NOT `src/app/settings/advanced/page.tsx` ❌

**Conclusion**: Netlify is building **old or wrong code**.

---

## 🚀 Immediate Action Plan

### Step 1: Check Netlify Dashboard
1. Log into Netlify
2. Go to your site settings
3. Check "Build & deploy" → "Deploy contexts"
4. Verify production branch is set correctly

### Step 2: Clear Cache
1. Go to "Deploys"
2. Click "Trigger deploy" → "Clear cache and deploy site"

### Step 3: Monitor Build
1. Watch the new build logs
2. Verify it shows the correct repository structure
3. Check for `app/` not `src/app/`

### Step 4: If Still Failing
1. Check if there are multiple branches being deployed
2. Verify the GitHub repository connected to Netlify is correct
3. Check for any deploy hooks or plugins that might be interfering

---

## 🔐 Environment Variables Needed

Make sure these are set in Netlify:

```bash
# Database (Required)
DATABASE_URL="postgresql://..."
MONGODB_URI="mongodb://..."

# Auth (Required)
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="https://your-domain.netlify.app"

# Google OAuth (Required)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI APIs (Required)
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# Financial APIs (Optional)
ALPHA_VANTAGE_API_KEY="..."
COINGECKO_API_KEY="..."

# Encryption (Required)
ENCRYPTION_KEY="..."
```

---

## 📊 Build Configuration

### netlify.toml (Create if missing)

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "22.20.0"
  NPM_FLAGS = "--legacy-peer-deps"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

## 🐛 Debugging Steps

### 1. Check What Netlify is Building

In Netlify build logs, look for:
```
Line 5: git clone --filter=blob:none https://github.com/astwrks/assetwork-ai-web
Line 7: Preparing Git Reference refs/heads/main
```

Verify this matches your repository.

### 2. Check Commit Hash

In build logs:
```
git clone ... (shows commit hash)
```

Compare with:
```bash
git log main --oneline -1
```

Should match!

### 3. Verify Directory Structure in Build

Netlify logs should show:
```
app/             # ✅ Should see this
  settings/
  api/
  financial-playground-v2/
```

NOT:
```
src/             # ❌ Should NOT see this
  app/
```

---

## ✅ Success Criteria

Build is fixed when you see:
1. ✅ No "Module not found" errors
2. ✅ Build logs show `app/` structure (not `src/app/`)
3. ✅ "Build succeeded" message
4. ✅ Site deploys successfully

---

## 🆘 If Nothing Works

### Nuclear Option: Re-link Repository

1. **In Netlify Dashboard**:
   - Go to Site settings
   - Build & deploy
   - Link to a different repository
   - Re-link to the same repository (forces fresh connection)

2. **Delete and Recreate Site**:
   - Delete the Netlify site
   - Create new site
   - Connect to GitHub repository
   - Configure build settings
   - Add environment variables
   - Deploy

---

## 📞 Quick Reference

| Issue | Solution |
|-------|----------|
| Stale cache | Clear cache and deploy |
| Wrong structure | Verify branch being deployed |
| Missing modules | Check package.json is committed |
| Path alias errors | Verify tsconfig.json paths |
| Build timeout | Increase build timeout in settings |

---

## 🎓 Prevention

To avoid this in the future:

1. **Always test build locally** before pushing:
   ```bash
   npm run build
   ```

2. **Use branch previews** for testing:
   - Enable deploy previews in Netlify
   - Test feature branches before merging to main

3. **Monitor deploy notifications**:
   - Enable Netlify notifications
   - Get alerts on failed builds

---

## 📝 Current Status

```yaml
Repository: assetwork-ai-web
Structure: app/ (Next.js 15 App Router)
Issue: Netlify building from wrong/stale code
Solution: Clear Netlify cache and redeploy
```

---

**Next Step**: Go to Netlify Dashboard and trigger "Clear cache and deploy site"

**Last Updated**: October 13, 2025
