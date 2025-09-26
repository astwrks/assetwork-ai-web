# OAuth Implementation Guide for AssetWorks Client

## Overview
This guide helps you implement **Google OAuth** and **Apple Sign-In** for the AssetWorks client application.

## 🔧 Current Setup Status
- ✅ **UI Components**: Google and Apple login buttons ready
- ✅ **API Integration**: Backend endpoints configured
- ✅ **Auth Store**: State management ready
- ⚠️ **OAuth SDKs**: Need to be implemented (placeholders in place)

---

## 🔴 Google OAuth Implementation

### Step 1: Install Google OAuth SDK
```bash
npm install @google-cloud/auth-library google-auth-library
```

### Step 2: Configure Google OAuth Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing one
3. Enable **Google Sign-In API**
4. Create **OAuth 2.0 Client ID** credentials
5. Add authorized domains:
   - `http://localhost:3000` (development)
   - Your production domain

### Step 3: Add Google OAuth Script
Add to `src/app/layout.tsx`:
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google OAuth Script */}
        <script src="https://accounts.google.com/gsi/client" async></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Step 4: Update Google Login Handler
Replace the placeholder in `src/components/LoginForm.tsx`:

```tsx
const handleGoogleLogin = async () => {
  try {
    clearError();
    
    // Initialize Google OAuth
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            // Send Google token to AssetWorks backend
            await googleLogin(response.credential);
            toast.success('Successfully logged in with Google!');
          } catch (error) {
            toast.error('Google login failed. Please try again.');
          }
        }
      });

      // Show Google sign-in popup
      window.google.accounts.id.prompt();
    } else {
      toast.error('Google OAuth SDK not loaded');
    }
  } catch (error) {
    toast.error('Google login failed. Please try again.');
  }
};
```

### Step 5: Environment Variables
Add to `.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com
```

---

## 🍎 Apple Sign-In Implementation

### Step 1: Install Apple Sign-In SDK
```bash
npm install @apple/apple-signin-api
```

### Step 2: Configure Apple Developer Console
1. Go to [Apple Developer Console](https://developer.apple.com)
2. Create **App ID** with Sign In with Apple capability
3. Create **Services ID** for web authentication
4. Configure domains and return URLs:
   - `http://localhost:3000` (development)
   - Your production domain
5. Create **Private Key** for Sign In with Apple

### Step 3: Add Apple Sign-In Script
Add to `src/app/layout.tsx`:
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google OAuth Script */}
        <script src="https://accounts.google.com/gsi/client" async></script>
        {/* Apple Sign-In Script */}
        <script 
          type="text/javascript" 
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" 
          async
        ></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Step 4: Update Apple Login Handler
Replace the placeholder in `src/components/LoginForm.tsx`:

```tsx
const handleAppleLogin = async () => {
  try {
    clearError();
    
    // Initialize Apple Sign-In
    if (typeof window !== 'undefined' && window.AppleID) {
      await window.AppleID.auth.init({
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID,
        scope: 'name email',
        redirectURI: `${window.location.origin}/auth/apple/callback`,
        state: 'apple-signin'
      });

      // Trigger Apple Sign-In
      const data = await window.AppleID.auth.signIn();
      
      // Send Apple data to AssetWorks backend
      await appleLogin({
        authorization_code: data.authorization.code,
        id_token: data.authorization.id_token,
        user: data.user
      });
      
      toast.success('Successfully logged in with Apple!');
    } else {
      toast.error('Apple Sign-In SDK not loaded');
    }
  } catch (error: any) {
    if (error.error !== 'popup_closed_by_user') {
      toast.error('Apple login failed. Please try again.');
    }
  }
};
```

### Step 5: Environment Variables
Add to `.env.local`:
```bash
NEXT_PUBLIC_APPLE_CLIENT_ID=your.apple.service.id
```

---

## 🔧 TypeScript Definitions

Create `src/types/oauth.d.ts`:
```typescript
// Google OAuth Types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
    AppleID: {
      auth: {
        init: (config: any) => Promise<void>;
        signIn: () => Promise<any>;
      };
    };
  }
}

export {};
```

---

## 🛠️ Backend Integration Points

### Expected Request Format for Google
```typescript
// AssetWorks backend expects:
POST /api/auth/callbacks/login/google
{
  "token": "google_jwt_token_here"
}
```

### Expected Request Format for Apple
```typescript
// AssetWorks backend expects:
POST /api/auth/callbacks/login/apple
{
  "authorization_code": "apple_auth_code",
  "id_token": "apple_id_token",
  "user": {
    "name": { "firstName": "...", "lastName": "..." },
    "email": "..."
  }
}
```

### Expected Response Format
Both endpoints should return:
```typescript
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    // ... other user fields
  },
  "token": "jwt_token_for_future_requests"
}
```

---

## 🧪 Testing the Implementation

### Local Testing
1. **Start the development server**: `npm run dev`
2. **Open** `http://localhost:3000`
3. **Test Google OAuth**:
   - Click "Google" tab
   - Click "Continue with Google" button
   - Complete OAuth flow
   - Verify JWT token received from backend

4. **Test Apple Sign-In**:
   - Click "Apple" tab  
   - Click "Continue with Apple" button
   - Complete Sign-In with Apple flow
   - Verify response data sent to backend

### Debug Steps
1. **Check Browser Console** for JavaScript errors
2. **Check Network Tab** for API requests/responses
3. **Verify Environment Variables** are loaded correctly
4. **Test Backend Endpoints** directly with Postman/curl

---

## 🚀 Production Deployment

### Environment Configuration
Update production `.env.local`:
```bash
NEXT_PUBLIC_ASSETWORKS_API_URL=https://your-backend.com/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_APPLE_CLIENT_ID=your-apple-service-id
```

### OAuth Provider Configuration
1. **Google**: Add production domain to authorized origins
2. **Apple**: Add production domain to return URLs
3. **Backend**: Ensure CORS allows production domain

### SSL Requirements
- **Apple Sign-In**: Requires HTTPS in production
- **Google OAuth**: Recommends HTTPS for security

---

## 🔍 Troubleshooting

### Common Issues

#### Google OAuth Issues
- **"popup_blocked"**: Browser blocking popup - instruct users to allow popups
- **"invalid_client"**: Wrong client ID or domain not authorized
- **"access_denied"**: User canceled OAuth flow

#### Apple Sign-In Issues
- **"invalid_client"**: Wrong service ID or configuration
- **"invalid_grant"**: Authorization code expired or invalid
- **Domain issues**: Return URL not configured correctly

### Debug Checklist
- [ ] OAuth SDK scripts loaded correctly
- [ ] Client IDs configured in environment variables
- [ ] Backend endpoints responding correctly
- [ ] CORS configuration allows frontend domain
- [ ] OAuth provider console configured correctly

---

## 📝 Next Steps

1. **Choose OAuth Provider**: Start with Google or Apple
2. **Configure OAuth Console**: Set up credentials and domains
3. **Install SDKs**: Add required dependencies
4. **Implement Handlers**: Replace placeholder code
5. **Test Integration**: Verify end-to-end flow
6. **Deploy**: Update production configurations

This implementation will connect your AssetWorks client to the existing backend OAuth endpoints without requiring any backend code changes.