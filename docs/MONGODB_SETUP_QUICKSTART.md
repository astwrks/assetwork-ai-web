# ⚡ MongoDB Atlas Setup - Quick Start (5 Minutes)

## 🎯 Goal
Fix thread creation on https://assetworks.netlify.app by connecting MongoDB Atlas

---

## 🚀 Steps

### 1. Create MongoDB Atlas Account (2 minutes)

Visit: https://www.mongodb.com/cloud/atlas/register

```
✅ Sign up with Google or email
✅ Choose "M0 Free" tier
✅ Cloud: AWS
✅ Region: us-east-1 (Virginia)
✅ Cluster name: assetworks-production
```

### 2. Create Database User (1 minute)

In MongoDB Atlas Dashboard:

1. **Database Access** → **Add New Database User**
2. Username: `assetworks-admin`
3. Password: Click "Autogenerate Secure Password" → **Copy and save it!**
4. Privileges: **Atlas admin**
5. Click **Add User**

### 3. Allow Network Access (30 seconds)

1. **Network Access** → **Add IP Address**
2. Click **"Allow Access from Anywhere"**
3. Confirm: `0.0.0.0/0`
4. Click **Confirm**

### 4. Get Connection String (1 minute)

1. **Database** → **Connect**
2. **Drivers** → **Node.js**
3. Copy connection string
4. **IMPORTANT:** Replace `<password>` with your actual password
5. **IMPORTANT:** Add `/assetworks` before the `?` at the end

**Example:**
```
mongodb+srv://assetworks-admin:YOUR_PASSWORD_HERE@assetworks-production.xxxxx.mongodb.net/assetworks?retryWrites=true&w=majority
```

### 5. Set in Netlify (30 seconds)

Run this command (replace with your actual connection string):

```bash
netlify env:set MONGODB_URI "mongodb+srv://assetworks-admin:YOUR_PASSWORD@assetworks-production.xxxxx.mongodb.net/assetworks?retryWrites=true&w=majority" --context production
```

Verify:
```bash
netlify env:get MONGODB_URI --context production
```

### 6. Deploy (30 seconds)

```bash
netlify deploy --prod
```

### 7. Test ✅

1. Visit: https://assetworks.netlify.app/financial-playground
2. Log in
3. Click **"+ New Thread"**
4. Should work! 🎉

---

## 🔍 Troubleshooting

**Error: "Failed to create thread"**
- Check password in connection string (no < or >)
- Verify `/assetworks` database name is in the string
- Wait 2-3 minutes for network access to propagate

**Error: "Authentication failed"**
- Regenerate password in MongoDB Atlas
- Update MONGODB_URI in Netlify
- Redeploy

---

## ✅ Checklist

- [ ] MongoDB Atlas account created
- [ ] Free M0 cluster created (us-east-1)
- [ ] Database user created (assetworks-admin)
- [ ] Network access allowed (0.0.0.0/0)
- [ ] Connection string copied
- [ ] Password replaced in connection string
- [ ] `/assetworks` database name added
- [ ] MONGODB_URI set in Netlify production
- [ ] Deployed to production
- [ ] Thread creation tested and working

---

**Total Time:** ~5 minutes
**Status:** Ready to implement
