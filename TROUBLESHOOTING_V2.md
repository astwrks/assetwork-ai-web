# Financial Playground V2 - Troubleshooting Guide

## 🔍 "Failed to create thread" Error

### Quick Diagnosis Steps:

#### Step 1: Check if you're logged in
1. Open your browser
2. Go to `http://localhost:3001/financial-playground`
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

#### Step 3: Check PostgreSQL Connection
```bash
# Test Prisma connection
npx prisma studio
```

**Expected**: Prisma Studio opens at http://localhost:5555
**Error**: Connection issues (see "Database Issues" below)

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

## 🗄️ Database Issues (PostgreSQL)

### Problem: Cannot connect to database

**Check DATABASE_URL in .env.local:**
```bash
cat .env.local | grep DATABASE_URL
```

**Should include connection parameters:**
```bash
DATABASE_URL=postgresql://...?sslmode=require&connect_timeout=30&pool_timeout=30&pgbouncer=true
DIRECT_URL=postgresql://...?sslmode=require&connect_timeout=30
```

### Problem: Prisma Client errors

**Regenerate Prisma Client:**
```bash
npx prisma generate
```

**Push schema changes:**
```bash
npx prisma db push
```

### Problem: Connection timeout

**Cause:** Neon serverless database might be in cold start

**Solution:** Wait 5-10 seconds and retry. The database will wake up automatically.

### Problem: Database schema out of sync

**Reset and sync schema:**
```bash
npx prisma db push --force-reset
```

**Warning:** This will delete all data. Only use in development!

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

- [ ] PostgreSQL (Neon) connection working (`npx prisma studio`)
- [ ] Dev server is running (`ps aux | grep "next dev"`)
- [ ] You're logged in (check `/api/test-session`)
- [ ] .env.local has all required variables (DATABASE_URL, DIRECT_URL)
- [ ] Prisma Client generated (`npx prisma generate`)
- [ ] Browser cache cleared (Cmd+Shift+R)
- [ ] No console errors in browser DevTools
- [ ] Tried in incognito/private window

---

## 🆘 Still Having Issues?

### Check server console logs:

1. Look at the terminal where `npm run dev` is running
2. See if there are any error messages
3. Common errors:
   - "PrismaClientInitializationError" → Database connection issue
   - "Can't reach database server" → Check DATABASE_URL or Neon status
   - "TypeError" → Code issue
   - "ECONNREFUSED" → Service not running

### Restart everything:

```bash
# Stop dev server (Ctrl+C in terminal)

# Regenerate Prisma Client
npx prisma generate

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
# Check dev server is running
ps aux | grep "next dev" | grep -v grep

# Test session
curl http://localhost:3001/api/test-session

# Test database connection
npx prisma studio

# Generate Prisma Client
npx prisma generate

# View server logs
tail -f ~/.npm/_logs/*.log

# Restart everything
cd /Users/Victor/Projects/AssetWorks/assetworks-webapp
npx prisma generate
rm -rf .next
npm run dev
```

---

## ✅ Success Indicators

When everything works:
- ✅ `/api/test-session` shows you're logged in
- ✅ Prisma Studio opens successfully
- ✅ No errors in browser console
- ✅ "New Report" button creates thread successfully
- ✅ All features work (PDF, Share, Entity extraction, etc.)

---

**Last Updated:** October 14, 2025  
**Migrated Features:** 10/10 ✅  
**Status:** Production Ready

