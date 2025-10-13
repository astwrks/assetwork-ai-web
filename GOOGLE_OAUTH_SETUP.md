# Google OAuth Setup for Netlify Deployment

## ✅ Deployment Status: SUCCESSFUL

Your AssetWorks application is now live at: **https://assetworks.netlify.app**

The 502 error has been resolved by migrating from MongoDB to PostgreSQL (Prisma) for authentication.

---

## 🔧 Final Configuration Step: Update Google OAuth Redirect URIs

To enable Google Sign-In on your deployed site, you need to add the production URL to your Google Cloud Console OAuth configuration.

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Select your project (or create one if you haven't already)
3. Navigate to: **APIs & Services** → **Credentials**

### Step 2: Find Your OAuth 2.0 Client ID

1. Look for your OAuth 2.0 Client ID in the list
2. The Client ID should start with: `993469826091-...`
3. Click on the Client ID name to edit it

### Step 3: Add Authorized Redirect URIs

In the **"Authorized redirect URIs"** section, click **"ADD URI"** and add these two URIs:

```
https://assetworks.netlify.app/api/auth/callback/google
```

**IMPORTANT**: Make sure to include both:
- ✅ `https://` (not `http://`)
- ✅ `/api/auth/callback/google` (exact path)

### Step 4: Save Changes

1. Click **"SAVE"** at the bottom of the page
2. Wait a few seconds for changes to propagate (usually instant)

### Step 5: Test Google Sign-In

1. Visit: https://assetworks.netlify.app/auth/signin
2. Click "Sign in with Google"
3. You should be redirected to Google's login page
4. After signing in, you'll be redirected back to your app

---

## 🔍 Troubleshooting

### Error: "redirect_uri_mismatch"

If you see this error after clicking "Sign in with Google":

**Cause**: The redirect URI hasn't been added to Google Cloud Console yet.

**Solution**:
1. Go back to Step 3 above
2. Verify the URL is exactly: `https://assetworks.netlify.app/api/auth/callback/google`
3. Make sure there are no trailing slashes
4. Save and try again

### Error: "Access Blocked: Authorization Error"

**Cause**: Your OAuth consent screen might not be configured or your app is in testing mode.

**Solution**:
1. Go to: **APIs & Services** → **OAuth consent screen**
2. If the app is in "Testing" mode:
   - Add your email address to "Test users"
   - OR publish the app (click "PUBLISH APP")

### Error: "Invalid client"

**Cause**: The GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables might be incorrect.

**Solution**:
1. Go back to Google Cloud Console
2. Copy the correct Client ID and Client Secret
3. Update them in Netlify: **Site settings** → **Environment variables**
4. Trigger a new deploy

---

## 📊 Current Environment Variables

Your Netlify site has these environment variables configured:

✅ DATABASE_URL (Neon PostgreSQL)
✅ DIRECT_URL (Neon direct connection)
✅ NEXTAUTH_SECRET
✅ NEXTAUTH_URL (https://assetworks.netlify.app)
✅ GOOGLE_CLIENT_ID
✅ GOOGLE_CLIENT_SECRET
✅ ENCRYPTION_KEY
✅ ANTHROPIC_API_KEY
✅ ALPHA_VANTAGE_API_KEY
✅ COINGECKO_API_KEY

---

## 🚀 What's Been Fixed

1. ✅ **Migrated from MongoDB to PostgreSQL**: Now using Neon PostgreSQL with Prisma
2. ✅ **Fixed NextAuth adapter**: Using PrismaAdapter instead of MongoDBAdapter
3. ✅ **Added NextAuth database tables**: Account, Session, VerificationToken
4. ✅ **Resolved 502 errors**: Site now returns HTTP 200 and renders correctly
5. ✅ **Singleton Prisma client**: Prevents connection pool exhaustion
6. ✅ **Removed MongoDB dependencies**: Disabled CredentialsProvider to eliminate MongoDB calls

---

## 📝 Next Steps After Google OAuth Setup

Once you've updated the Google OAuth redirect URIs:

1. **Test the sign-in flow** on https://assetworks.netlify.app/auth/signin
2. **Verify user creation** by checking the Neon database (use Prisma Studio)
3. **Test protected routes** like /financial-playground
4. **Monitor Netlify function logs** for any runtime errors

---

## 📞 Support

If you encounter any issues:

1. **Check Netlify function logs**: https://app.netlify.com → Your site → Functions
2. **Check Netlify deployment logs**: https://app.netlify.com → Your site → Deploys
3. **Verify environment variables**: https://app.netlify.com → Your site → Site settings → Environment variables

---

**Site URL**: https://assetworks.netlify.app
**Admin Panel**: https://app.netlify.com
**Database**: Neon PostgreSQL (configured)

Last updated: 2025-10-13
