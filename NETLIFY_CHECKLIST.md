# 🚀 Netlify Deployment Checklist

## Quick Status Check

Your code has been successfully pushed to GitHub on the `main` branch! Now let's ensure Netlify deploys it correctly.

---

## 1. Check Netlify Auto-Deploy Status

### Visit Your Netlify Dashboard
1. Go to: **https://app.netlify.com**
2. Find your **AssetWorks** site
3. Click on the site to open its dashboard

### Check Deploys Tab
1. Click on the **Deploys** tab
2. Look for a new deploy that started after your push
3. Check the deploy status:
   - ✅ **Building** - Deployment is in progress (wait for it to complete)
   - ✅ **Published** - Deployment succeeded! 🎉
   - ❌ **Failed** - See troubleshooting section below

---

## 2. Verify Build Configuration

### Go to Site Settings
1. Click **Site settings** in the left sidebar
2. Go to **Build & deploy** → **Continuous Deployment**

### Verify These Settings
- **Repository**: `astwrks/assetwork-ai-web` ✅
- **Production branch**: `main` ✅
- **Base directory**: (empty or `/`) ✅
- **Build command**: `npm run build` ✅
- **Publish directory**: `.next` ✅
- **Node version**: 18.x or higher ✅

### If Settings Are Wrong
Update them and trigger a new deploy:
1. Save any changes
2. Go to **Deploys** tab
3. Click **Trigger deploy** → **Clear cache and deploy site**

---

## 3. Set Environment Variables

### Go to Environment Variables
1. In **Site settings**, go to **Environment variables**
2. Verify these variables are set:

```
REQUIRED:
✅ DATABASE_URL              - PostgreSQL connection string
✅ ENCRYPTION_KEY            - For API key encryption (32+ chars)
✅ NEXTAUTH_SECRET           - For authentication (32+ chars)
✅ NEXTAUTH_URL              - Your production URL (e.g., https://yoursite.netlify.app)

OPTIONAL (for financial data):
⚪ ALPHA_VANTAGE_API_KEY     - If using Alpha Vantage
⚪ COINGECKO_API_KEY         - If using CoinGecko Pro
⚪ POLYGON_API_KEY           - If using Polygon
⚪ FINNHUB_API_KEY           - If using Finnhub
⚪ COINMARKETCAP_API_KEY     - If using CoinMarketCap
```

### To Add Environment Variables
1. Click **Add a variable**
2. Enter key name (e.g., `DATABASE_URL`)
3. Enter value
4. Click **Create variable**
5. Repeat for all required variables

### After Adding Variables
**Important**: Trigger a new deploy to use the new variables:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**

---

## 4. Monitor Build Logs

### Watch the Build Process
1. In the **Deploys** tab, click on the most recent deploy
2. Click **Deploy log** to see real-time build output
3. Look for:
   - ✅ "Dependencies installed" - npm packages installed successfully
   - ✅ "Build successful" - Next.js build completed
   - ✅ "Site is live" - Deployment published

### Common Build Errors
| Error | Solution |
|-------|----------|
| "Missing environment variable" | Add the variable in Site settings → Environment variables |
| "Module not found" | Usually means dependencies weren't installed - try "Clear cache and deploy site" |
| "Build failed" | Check the full error message in deploy logs |
| "Out of memory" | Contact Netlify support or upgrade plan |

---

## 5. Test Deployed Site

### Once Deploy Succeeds
Visit your site URL (shown in Netlify dashboard) and test:

#### Core Pages
- [ ] Home page (`/`) loads correctly
- [ ] Dashboard (`/dashboard`) displays properly
- [ ] Settings (`/settings`) shows financial data integration tab

#### Financial Playground
- [ ] `/financial-playground` - Opens successfully
- [ ] Can create a new report
- [ ] AI chat responds correctly
- [ ] Sections can be edited

#### Financial Playground V2
- [ ] `/financial-playground` - Opens successfully
- [ ] Enhanced editing works
- [ ] Cancel edit button appears
- [ ] All features functional

#### Settings Integration
- [ ] Navigate to `/settings`
- [ ] Scroll to "Financial Data Integration" section
- [ ] See connection status summary (connected/error/unknown counts)
- [ ] Click "Check All Connections" button
- [ ] Status badges update with correct colors
- [ ] Last checked timestamps display

#### API Functionality
- [ ] Add a test API key in settings
- [ ] Test connection using "Check Connection" button
- [ ] Verify status updates (green = connected, red = error)
- [ ] Check that data is persisted (refresh page, status should remain)

---

## 6. Troubleshooting Common Issues

### Issue: Build Fails with "Module not found: @/components/ui/switch"
**Status**: ✅ **FIXED** - The switch component is now in your repository

**If still seeing this**:
1. Clear Netlify cache: **Trigger deploy** → **Clear cache and deploy site**
2. Verify you're deploying from `main` branch
3. Check that commit `cd788dc` is the latest on `main`

---

### Issue: "Environment variable not found"
**Solution**:
1. Go to **Site settings** → **Environment variables**
2. Add the missing variable
3. **Trigger deploy** → **Deploy site**

---

### Issue: "Database connection failed"
**Solution**:
1. Verify `DATABASE_URL` is set in environment variables
2. Check that PostgreSQL is accessible from external IPs
3. Ensure connection string is correct (includes credentials)

---

### Issue: "Financial data API not working"
**Solution**:
1. Go to your deployed site `/settings`
2. Add API keys for financial data providers
3. Test connection using "Check Connection" button
4. Verify API keys are valid

---

### Issue: "Site loads but features don't work"
**Solution**:
1. Open browser console (F12)
2. Check for JavaScript errors
3. Look for API errors (4xx, 5xx status codes)
4. Verify environment variables are set correctly

---

## 7. Post-Deployment Verification

### Database Check
1. Open PostgreSQL Compass or Atlas
2. Verify collections exist:
   - `apikeys` - Should have connection status fields
   - `playgroundsettings` - For user preferences
   - `reportsections` - For report data
   - `templates` - For report templates
   - `threads` - For chat conversations

### API Key Encryption
1. Add a test API key in `/settings`
2. Check PostgreSQL - key should be encrypted (not plaintext)
3. Verify preview shows last 4 characters only
4. Test connection to ensure decryption works

### MCP Server Integration
1. Try using financial data in playground
2. Ask for stock information (e.g., "Get info on AAPL stock")
3. Ask for crypto information (e.g., "What's the price of Bitcoin?")
4. Verify data is retrieved and displayed correctly

---

## 8. Final Checklist

Before considering deployment complete:

- [ ] ✅ Code pushed to GitHub `main` branch
- [ ] ✅ Netlify detected push and triggered build
- [ ] ✅ Build completed successfully
- [ ] ✅ All environment variables set
- [ ] ✅ Site is accessible at production URL
- [ ] ✅ Settings page shows financial data integration
- [ ] ✅ Financial playground works
- [ ] ✅ Financial playground V2 works
- [ ] ✅ API connection testing works
- [ ] ✅ Database operations work
- [ ] ✅ No console errors in browser

---

## 9. Quick Commands Reference

### If You Need to Redeploy
```bash
# Make changes, commit, and push
git add .
git commit -m "Your commit message"
git push origin main
```

### If You Need to Force Push Again
```bash
git push origin main --force
```

### Check Current Branch and Status
```bash
git status
git log --oneline -5
```

---

## 10. Getting Help

### Netlify Support
- **Documentation**: https://docs.netlify.com
- **Support**: https://answers.netlify.com
- **Status**: https://www.netlifystatus.com

### Check Build Logs Location
1. Netlify Dashboard → Your Site
2. Click **Deploys** tab
3. Click on the specific deploy
4. Click **Deploy log** button

### Common Netlify Commands
- **Clear cache**: Removes old build cache
- **Deploy site**: Redeploys without rebuilding
- **Clear cache and deploy site**: Full rebuild from scratch

---

## Success! 🎉

If all checks pass, your deployment is complete and your financial playground features are live in production!

### Share Your Site
Your site should now be live at:
- **Netlify URL**: `https://your-site-name.netlify.app`
- **Custom domain** (if configured): Your custom domain

### Next Steps
1. Test all features thoroughly in production
2. Monitor Netlify analytics for any issues
3. Set up custom domain (if needed)
4. Configure HTTPS/SSL (automatic with Netlify)
5. Set up deployment notifications (optional)

---

**Deployment Date**: 2025-10-13
**Commit**: `cd788dc`
**Status**: ✅ Ready for production use
