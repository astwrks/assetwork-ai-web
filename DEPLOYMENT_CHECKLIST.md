# Netlify Deployment Checklist

## Current Status: Site Deployed but Not Working (502 Error)

**Issue**: HTTP 502 Bad Gateway - Functions are crashing
**Cause**: Either environment variables not applied or database connection failing

---

## ✅ IMMEDIATE FIX - Follow These Steps:

### Step 1: Verify Environment Variables Were Added
1. Go to: https://app.netlify.com
2. Select your site
3. Go to: **Site settings** → **Environment variables**
4. Verify you see all 10 variables:
   - DATABASE_URL
   - DIRECT_URL
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - ENCRYPTION_KEY
   - ANTHROPIC_API_KEY
   - ALPHA_VANTAGE_API_KEY
   - COINGECKO_API_KEY

### Step 2: Trigger a Redeploy (CRITICAL!)
**Environment variables only apply to NEW deploys!**

1. Go to: **Deploys** tab
2. Click: **Trigger deploy**
3. Click: **Deploy site**
4. Wait 2-3 minutes for build to complete
5. Check the deploy log for errors

### Step 3: Check Deploy Logs
While the deploy is running, look for:
- ✅ "Compiled successfully"
- ✅ "Generating static pages (40/40)"
- ❌ Any error messages

### Step 4: Test After Deploy Completes
1. Visit: https://assetworks.netlify.app
2. You should see the homepage (not a 502 error)
3. If still 502, check function logs (instructions below)

---

## 🔍 If Still Getting 502 After Redeploy

### Check Netlify Function Logs:
1. Go to: https://app.netlify.com
2. Your site → **Functions** tab
3. Click on any function
4. Check the logs for error messages
5. Share the error with me

### Common Issues:

**Issue 1: Database Connection Failing**
- Error: "getaddrinfo ENOTFOUND"
- Solution: Verify DATABASE_URL is correct

**Issue 2: MongoDB Still Being Called**
- Error: "MongoDB URI not configured"
- Solution: The app might be trying to use MongoDB routes
- This shouldn't happen but let me know if you see this

**Issue 3: Missing Environment Variable**
- Error: "Cannot read property 'X' of undefined"
- Solution: One of the environment variables wasn't set correctly

---

## 🛠️ Alternative: Deploy via CLI

If the dashboard isn't working, try CLI:

```bash
cd /Users/Victor/Projects/AssetWorks/assetworks-webapp

# Install Netlify CLI if not installed
npm install -g netlify-cli

# Login
netlify login

# Link to your site
netlify link

# Verify environment variables
netlify env:list

# If variables are missing, import them
netlify env:import .env.netlify

# Deploy
netlify deploy --prod
```

---

## 📊 Debugging Checklist

- [ ] Environment variables added in Netlify dashboard
- [ ] Triggered redeploy after adding variables
- [ ] Deploy completed successfully (no build errors)
- [ ] Checked function logs for runtime errors
- [ ] Verified DATABASE_URL is correct
- [ ] Verified NEXTAUTH_URL matches actual site URL
- [ ] Google OAuth redirect URIs updated
- [ ] Site loads without 502 error

---

## 🔄 Current Deployment Status

**Last Known Status**:
- Build: ✅ Succeeded
- Deployment: ✅ Live
- Runtime: ❌ 502 Bad Gateway (functions crashing)
- Env Vars: ⚠️  Added but redeploy needed

**Next Action**: Trigger redeploy in Netlify dashboard

---

## 📞 Need Help?

If after redeploying you still see 502:
1. Go to: Functions tab in Netlify
2. Find the error logs
3. Share the specific error message
4. I'll help you fix it!

---

**Created**: October 13, 2025
**Site**: https://assetworks.netlify.app
**Status**: Troubleshooting runtime errors
