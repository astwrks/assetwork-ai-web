# 🚀 AssetWorks Production Deployment - Troubleshooting Guide

## Issue: Cannot Create Threads on Netlify Production

**Date:** October 16, 2025
**Severity:** Critical - Blocks core functionality
**Status:** Root cause identified, solutions available

---

## 🔍 Root Cause

The application uses a **dual-database architecture**:
- **PostgreSQL (Neon):** User authentication, accounts
- **MongoDB:** Reports, threads, financial data

**Missing in Production:**
```
MONGODB_URI environment variable not set in Netlify
```

**Local Development:**
```env
MONGODB_URI=mongodb://localhost:27017/assetworks
```

**Production (Netlify):**
```
MONGODB_URI=NOT_SET ❌
```

---

## ✅ Solution 1: Quick Fix - MongoDB Atlas (Recommended)

### Step 1: Create Free MongoDB Atlas Cluster

1. **Sign up at MongoDB Atlas:**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Create a free account (M0 Cluster - Forever Free)

2. **Create a Cluster:**
   - Choose cloud provider: AWS (recommended for US East compatibility with Neon)
   - Region: us-east-1 (same as your Neon database)
   - Cluster name: `assetworks-production`

3. **Create Database User:**
   - Go to Database Access → Add New Database User
   - Authentication Method: Password
   - Username: `assetworks-admin`
   - Password: Generate secure password (save it!)
   - Database User Privileges: Atlas admin

4. **Whitelist IP Addresses:**
   - Go to Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Confirm

5. **Get Connection String:**
   - Go to Database → Connect
   - Choose "Connect your application"
   - Driver: Node.js (version 5.5 or later)
   - Copy connection string:
   ```
   mongodb+srv://assetworks-admin:<password>@assetworks-production.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password
   - Add database name at the end:
   ```
   mongodb+srv://assetworks-admin:<password>@assetworks-production.xxxxx.mongodb.net/assetworks?retryWrites=true&w=majority
   ```

### Step 2: Set Environment Variable in Netlify

**Option A: Using Netlify CLI (Fastest)**

```bash
# Set MONGODB_URI for production
netlify env:set MONGODB_URI "mongodb+srv://assetworks-admin:<password>@assetworks-production.xxxxx.mongodb.net/assetworks?retryWrites=true&w=majority" --context production

# Verify it was set
netlify env:get MONGODB_URI --context production
```

**Option B: Using Netlify Dashboard**

1. Go to https://app.netlify.com/sites/assetworks/settings/deploys#environment
2. Click "Add a variable" or "Edit variables"
3. Add:
   - **Key:** `MONGODB_URI`
   - **Value:** `mongodb+srv://assetworks-admin:<password>@...`
   - **Scopes:** Check "Production" (and optionally "Deploy previews")
4. Click "Save"

### Step 3: Redeploy

```bash
# Trigger new production deployment
netlify deploy --prod

# OR manually trigger from Netlify dashboard:
# Deploys → Trigger deploy → Deploy site
```

### Step 4: Verify

1. Visit https://assetworks.netlify.app/financial-playground
2. Log in with your credentials
3. Try creating a new thread
4. Should work! ✅

**Expected Result:**
- Thread creation works
- No "Failed to create thread" errors
- Data persists in MongoDB Atlas

---

## 🔧 Solution 2: Migrate to Single Database (PostgreSQL)

**Why Consider This:**
- ✅ Simplify infrastructure (one database instead of two)
- ✅ Reduce costs (one database to maintain)
- ✅ Better data consistency (single source of truth)
- ✅ Easier backup/restore
- ❌ Requires code migration (2-3 weeks of work)

### Migration Checklist

**Phase 1: Schema Design (Week 1)**
- [ ] Design Prisma schema for threads, reports, sections
- [ ] Create migration files
- [ ] Test locally with PostgreSQL

**Phase 2: Code Migration (Week 2)**
- [ ] Replace Mongoose models with Prisma clients
- [ ] Update all API routes (`/api/playground/*`)
- [ ] Migrate utility functions
- [ ] Update types/interfaces

**Phase 3: Data Migration (Week 3)**
- [ ] Export existing data from MongoDB (if any)
- [ ] Transform to PostgreSQL format
- [ ] Import to Neon database
- [ ] Verify data integrity

**Phase 4: Testing & Deployment**
- [ ] End-to-end testing
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Monitor for issues

**Files to Modify:**
```
/models/Report.ts              → Convert to Prisma schema
/models/Thread.ts              → Convert to Prisma schema
/lib/db/mongodb.ts             → Replace with Prisma client
/app/api/playground/*/route.ts → Update all DB calls
/prisma/schema.prisma          → Add new models
```

**Estimated Effort:**
- Developer time: 2-3 weeks
- Testing: 1 week
- Total: 3-4 weeks

**Recommendation:**
Stick with MongoDB Atlas for now (Solution 1). Consider migration if you encounter scaling issues or want to simplify infrastructure later.

---

## 🐛 Common Issues

### Issue: "Failed to create thread" after setting MONGODB_URI

**Possible Causes:**
1. Connection string has incorrect password
2. IP not whitelisted in MongoDB Atlas
3. Database name missing from connection string
4. Netlify environment variable not saved correctly

**Debug Steps:**
```bash
# Check environment variable
netlify env:get MONGODB_URI --context production

# View Netlify function logs
netlify functions:log

# Test connection locally
mongosh "mongodb+srv://assetworks-admin:<password>@..."
```

### Issue: "Authentication failed"

**Fix:**
- Verify username and password in MongoDB Atlas
- Regenerate password and update MONGODB_URI
- Check database user has correct privileges

### Issue: "IP not whitelisted"

**Fix:**
- Go to MongoDB Atlas → Network Access
- Add 0.0.0.0/0 (allow all) or Netlify IP ranges
- Wait 2-3 minutes for changes to propagate

---

## 📊 Environment Variables Checklist

### Currently Set in Netlify Production ✅

```
✅ DATABASE_URL              (PostgreSQL - Neon)
✅ NEXTAUTH_URL              (https://assetworks.netlify.app)
✅ NEXTAUTH_SECRET           (Set)
✅ GOOGLE_CLIENT_ID          (Set)
✅ GOOGLE_CLIENT_SECRET      (Set)
✅ ANTHROPIC_API_KEY         (Set)
✅ ALPHA_VANTAGE_API_KEY     (Set)
✅ COINGECKO_API_KEY         (Set)
✅ ENCRYPTION_KEY            (Set)
```

### Missing in Production ❌

```
❌ MONGODB_URI               (REQUIRED - causing thread creation failure)
```

### Optional (Not Critical)

```
⚠️  OPENAI_API_KEY           (Set to placeholder locally)
⚠️  BLOB_READ_WRITE_TOKEN    (If using Vercel Blob storage)
⚠️  EMAIL_SERVER             (If using email features)
```

---

## 🔐 Security Notes

**When setting MONGODB_URI:**

1. **Never commit connection strings to Git**
   ```bash
   # Already in .gitignore:
   .env.local
   .env.production
   ```

2. **Use strong passwords:**
   - Minimum 20 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Use password generator

3. **Rotate credentials periodically:**
   - Change MongoDB password every 90 days
   - Update MONGODB_URI in Netlify after rotation

4. **Monitor access:**
   - Check MongoDB Atlas logs for suspicious activity
   - Enable alerts for failed login attempts

---

## 🚀 Quick Reference - Set MONGODB_URI via CLI

```bash
# Step 1: Create MongoDB Atlas cluster and get connection string
# (Follow Step 1 from Solution 1 above)

# Step 2: Set environment variable
netlify env:set MONGODB_URI "your-mongodb-connection-string" --context production

# Step 3: Verify
netlify env:get MONGODB_URI --context production

# Step 4: Deploy
netlify deploy --prod

# Step 5: Test
# Visit https://assetworks.netlify.app/financial-playground
# Try creating a thread
```

---

## 📞 Support Resources

**MongoDB Atlas:**
- Docs: https://www.mongodb.com/docs/atlas/
- Support: https://www.mongodb.com/cloud/atlas/support

**Netlify:**
- Docs: https://docs.netlify.com/
- Environment Variables: https://docs.netlify.com/environment-variables/overview/

**Neon (PostgreSQL):**
- Docs: https://neon.tech/docs/introduction
- Console: https://console.neon.tech/

---

## ✅ Success Criteria

After implementing Solution 1, verify:

- [ ] Can log in to https://assetworks.netlify.app
- [ ] Can access Financial Playground
- [ ] Can create a new thread
- [ ] Thread appears in list
- [ ] Can send messages in thread
- [ ] Can generate reports
- [ ] No console errors in browser
- [ ] No server errors in Netlify logs

---

## 📝 Next Steps

1. **Immediate (Today):**
   - Set up MongoDB Atlas (15 minutes)
   - Set MONGODB_URI in Netlify (5 minutes)
   - Deploy and test (10 minutes)

2. **Short-term (This Week):**
   - Monitor production for errors
   - Verify all features work
   - Document any issues

3. **Long-term (Next Month):**
   - Consider migrating to single PostgreSQL database
   - Set up automated backups
   - Configure monitoring/alerts

---

**Status:** Ready to implement Solution 1 (MongoDB Atlas)
**ETA:** 30 minutes to fully resolve
**Impact:** Will restore thread creation functionality in production
