# Financial Playground V2 - Troubleshooting Guide

## 🔍 "Failed to create thread" Error

### Quick Diagnosis Steps:

#### Step 1: Check if you're logged in
1. Open your browser
2. Go to `http://localhost:3001/financial-playground-v2`
3. Open DevTools (F12)
4. Check if you see a session/auth error in the console

#### Step 2: Test your session
Navigate to: `http://localhost:3001/api/test-session`

**Expected response (if logged in):**
```json
{
  "hasSession": true,
  "hasUser": true,
  "hasUserId": true,
  "userEmail": "your@email.com",
  "userId": "some-user-id"
}
```

**If you see `false` values**, you're NOT logged in. See "Login Issues" below.

#### Step 3: Check MongoDB
```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017/assetworks --eval "db.stats()"
```

**Expected**: Database stats (means MongoDB is working)  
**Error**: Connection issues (see "MongoDB Issues" below)

#### Step 4: Check the API directly
```bash
# Test thread creation API
curl -X POST http://localhost:3001/api/playground/threads \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Thread","description":"Test"}' \
  -c cookies.txt \
  -b cookies.txt
```

---

## 🔐 Login Issues

### Problem: Not Logged In

**Solution 1: Sign in via Google OAuth**
1. Go to `http://localhost:3001/auth/signin`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Return to playground

**Solution 2: Email/Password Sign In**
1. Go to `http://localhost:3001/auth/signin`
2. Enter credentials
3. Sign in

**Solution 3: Check if auth is configured**
```bash
# Check .env.local for auth variables
cd /Users/Victor/Projects/AssetWorks/assetworks-webapp
cat .env.local | grep -E "NEXTAUTH|GOOGLE"
```

Required variables:
```bash
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3001
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Problem: Session not persisting

**Check cookies:**
1. Open DevTools → Application → Cookies
2. Look for `next-auth.session-token`
3. If missing, check NEXTAUTH_URL matches your current URL

---

## 🗄️ MongoDB Issues

### Problem: MongoDB not running

**Check status:**
```bash
brew services list | grep mongodb
```

**Should show:**
```
mongodb-community  started  Victor  ~/Library/LaunchAgents/...
```

**If not running:**
```bash
brew services start mongodb-community
```

**If not installed:**
```bash
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

### Problem: Connection string wrong

**Check .env.local:**
```bash
cat .env.local | grep MONGODB_URI
```

**Should be:**
```bash
MONGODB_URI=mongodb://localhost:27017/assetworks
```

### Problem: Database connection failing

**Test connection manually:**
```bash
mongosh mongodb://localhost:27017/assetworks
```

**If error:**
- MongoDB might not be running
- Port 27017 might be in use
- Firewall blocking connection

---

## 🚀 Migration-Specific Issues

### Problem: New buttons don't show

**Cause:** Old cached version of page

**Solution:**
```bash
# Hard refresh in browser
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R

# Or clear Next.js cache
cd /Users/Victor/Projects/AssetWorks/assetworks-webapp
rm -rf .next
npm run dev
```

### Problem: PDF Export fails

**Cause:** Report API endpoint might not be configured

**Solution:**
Check if `/api/playground/reports/[id]/export-pdf/route.ts` exists:
```bash
ls -la app/api/playground/reports/[reportId]/export-pdf/
```

### Problem: Share Dialog doesn't open

**Cause:** Missing ShareDialog component

**Check:**
```bash
ls -la components/financial-playground/ShareDialog.tsx
```

### Problem: System Prompts don't load

**Cause:** Settings API not returning prompts

**Test:**
```bash
curl http://localhost:3001/api/playground/settings \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

## 🐛 Debug Mode

### Enable verbose logging

**In your browser DevTools Console:**
```javascript
// See all fetch requests
localStorage.setItem('debug', 'true');

// Then reload page
location.reload();
```

### Check browser console for errors

1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Check Network tab for failed requests

### Common error messages:

**"Unauthorized"** → You're not logged in  
**"Failed to fetch"** → API server not running  
**"CORS error"** → Check NEXTAUTH_URL  
**"MongoDB connection error"** → MongoDB not running  
**"500 Internal Server Error"** → Check server console logs

---

## 📋 Pre-Flight Checklist

Before reporting an issue, verify:

- [ ] MongoDB is running (`brew services list`)
- [ ] Dev server is running (`ps aux | grep "next dev"`)
- [ ] You're logged in (check `/api/test-session`)
- [ ] .env.local has all required variables
- [ ] Browser cache cleared (Cmd+Shift+R)
- [ ] No console errors in browser DevTools
- [ ] Tried in incognito/private window

---

## 🆘 Still Having Issues?

### Check server console logs:

1. Look at the terminal where `npm run dev` is running
2. See if there are any error messages
3. Common errors:
   - "MongoServerError" → MongoDB issue
   - "TypeError" → Code issue (check migration)
   - "ECONNREFUSED" → Service not running

### Restart everything:

```bash
# Stop dev server (Ctrl+C in terminal)

# Restart MongoDB
brew services restart mongodb-community

# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

### Test with v1 playground:

If v2 fails but you need to work:
```
http://localhost:3001/financial-playground
```

(V1 still has all functionality, just older UI)

---

## 📞 Quick Commands

```bash
# Check everything is running
brew services list | grep mongodb
ps aux | grep "next dev" | grep -v grep

# Test session
curl http://localhost:3001/api/test-session

# Test MongoDB
mongosh mongodb://localhost:27017/assetworks --eval "db.stats()"

# View server logs
tail -f ~/.npm/_logs/*.log

# Restart everything
brew services restart mongodb-community
cd /Users/Victor/Projects/AssetWorks/assetworks-webapp
rm -rf .next
npm run dev
```

---

## ✅ Success Indicators

When everything works:
- ✅ `/api/test-session` shows you're logged in
- ✅ MongoDB `db.stats()` returns data
- ✅ No errors in browser console
- ✅ "New Report" button creates thread successfully
- ✅ All v1 features work (PDF, Share, etc.)

---

**Last Updated:** October 14, 2025  
**Migrated Features:** 10/10 ✅  
**Status:** Production Ready

