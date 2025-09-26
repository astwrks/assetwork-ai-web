# AssetWorks Client Application

A client web application that connects to the existing AssetWorks backend APIs for user authentication and data viewing.

## 🚀 Features

### Authentication
- **Phone OTP Login**: Send and verify OTP via phone number
- **Google OAuth**: Login with Google account (requires OAuth setup)
- **Apple OAuth**: Login with Apple ID (requires OAuth setup)
- **Persistent Sessions**: Auto-login with stored tokens

### Dashboard
- **User Profile Management**: View and manage user profile data
- **Trending Widgets**: Browse and interact with investment widgets
- **Notifications**: View and manage user notifications  
- **Data Visualization**: Display countries, widget data, and system information

### Widget Interactions
- Like/dislike widgets
- Follow/unfollow widgets
- Save widgets for later
- Share widget information
- Report inappropriate content

## 🏗️ Architecture

### Frontend Stack
- **Next.js 15** with App Router and Turbopack
- **TypeScript** for type safety
- **Tailwind CSS** for styling with design system
- **Zustand** for state management
- **Axios** for API communication
- **Sonner** for toast notifications
- **Lucide React** for icons

### API Integration
- **RESTful APIs**: Direct integration with AssetWorks backend
- **Bearer Token Authentication**: JWT-based authentication
- **Error Handling**: Automatic token refresh and error management
- **Loading States**: User feedback during API operations

## 📋 Prerequisites

### AssetWorks Backend
1. **Running AssetWorks Backend**: The backend server must be running
2. **API Access**: Backend should be accessible at `http://localhost:8080` (or configured URL)
3. **CORS Configuration**: Backend must allow requests from `http://localhost:3000`

### Development Environment
- **Node.js**: Version 18+ required
- **npm**: Package manager

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies
```bash
cd /Users/Victor/Projects/assetworks-client
npm install
```

### 2. Environment Configuration
Create or update `.env.local`:
```bash
# AssetWorks API Configuration
NEXT_PUBLIC_ASSETWORKS_API_URL=http://localhost:8080/api
```

**Important**: Update the URL to match your running AssetWorks backend server.

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## 🔌 API Endpoints Used

### Authentication Endpoints
- `POST /auth/otp/send` - Send OTP to phone
- `POST /auth/otp/verify` - Verify OTP and login
- `POST /auth/callbacks/login/google` - Google OAuth login
- `POST /auth/callbacks/login/apple` - Apple OAuth login

### User Management Endpoints
- `GET /users/profile` - Get user profile
- `PUT /users/profile/update` - Update profile
- `GET /users/notifications` - Get notifications
- `PUT /users/notifications/read` - Mark notifications as read
- `POST /users/signout` - Sign out user

### Data Endpoints
- `GET /data/onboard-data` - Get onboarding data
- `GET /data/countries` - Get countries list
- `GET /data/widget-data` - Get widget data

### Widget Endpoints
- `GET /widgets/trending` - Get trending widgets
- `GET /widgets/{id}/detail` - Get widget details
- `POST /widgets/{id}/like` - Like widget
- `POST /widgets/{id}/follow` - Follow widget
- `POST /widgets/{id}/save` - Save widget

## 🔐 Authentication Flow

### Phone OTP Login
1. User enters phone number
2. System sends OTP via AssetWorks backend
3. User enters OTP code
4. Backend verifies and returns JWT token
5. Token stored locally for future requests

### OAuth Login (Google/Apple)
1. User clicks OAuth login button
2. OAuth provider authentication (requires implementation)
3. OAuth token sent to AssetWorks backend
4. Backend validates and returns JWT token
5. Token stored locally for future requests

## 🎨 User Interface

### Login Screen
- **Method Selection**: Choose between OTP, Google, or Apple login
- **Phone Input**: International phone number format
- **OTP Verification**: 6-digit code input
- **Error Handling**: Clear error messages and retry options

### Dashboard
- **Navigation Tabs**: Overview, Widgets, Notifications, Profile
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Data**: Automatic refresh and loading states
- **Interactive Elements**: Buttons, cards, and data visualization

## 🔧 Configuration

### API Base URL
Update `.env.local` to match your AssetWorks backend:
```bash
NEXT_PUBLIC_ASSETWORKS_API_URL=http://your-backend-server:port/api
```

### CORS Configuration
Ensure your AssetWorks backend allows requests from:
- `http://localhost:3000` (development)
- Your production domain (when deployed)

## 🚨 Troubleshooting

### Common Issues

#### 1. "Network Error" or "Failed to fetch"
- **Cause**: AssetWorks backend not running or incorrect URL
- **Solution**: 
  1. Verify backend is running at configured URL
  2. Check `.env.local` configuration
  3. Ensure CORS is properly configured

#### 2. "401 Unauthorized" errors
- **Cause**: Invalid or expired authentication token
- **Solution**: 
  1. Clear browser localStorage
  2. Login again to get fresh token
  3. Check backend authentication configuration

#### 3. OAuth login not working
- **Cause**: OAuth integration not implemented
- **Solution**: 
  1. Implement Google/Apple OAuth client libraries
  2. Configure OAuth credentials
  3. Update OAuth login handlers

#### 4. No data showing in dashboard
- **Cause**: Backend APIs returning empty data or errors
- **Solution**:
  1. Check browser developer console for errors
  2. Verify backend has data to return
  3. Check API endpoint responses

### Development Tips

#### 1. Check Network Requests
Open browser developer tools (F12) → Network tab to monitor API requests and responses.

#### 2. Check Console Logs
Open browser developer tools (F12) → Console tab to see JavaScript errors and logs.

#### 3. Clear Browser Storage
If having authentication issues:
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
```

#### 4. Test API Endpoints
Use tools like Postman or curl to test AssetWorks API endpoints directly:
```bash
curl -X GET http://localhost:8080/api/data/countries
```

## 🔄 Next Steps

### OAuth Implementation
1. **Google OAuth**:
   - Install `@google-cloud/auth-library`
   - Configure Google OAuth credentials
   - Implement OAuth flow in `LoginForm.tsx`

2. **Apple OAuth**:
   - Install Apple Sign-In SDK
   - Configure Apple Developer account
   - Implement OAuth flow in `LoginForm.tsx`

### Enhanced Features
1. **Real-time Updates**: WebSocket integration for live data
2. **Offline Support**: Service worker and caching
3. **Mobile App**: Convert to React Native or PWA
4. **Advanced Analytics**: Charts and data visualization

### Production Deployment
1. **Environment Configuration**: Production API URLs
2. **Build Optimization**: `npm run build`
3. **Hosting**: Deploy to Vercel, Netlify, or similar
4. **Domain Configuration**: Custom domain and SSL

## 📁 Project Structure

```
assetworks-client/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── ui/              # UI components
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   └── LoginForm.tsx    # Authentication form
│   ├── lib/                 # Utilities
│   │   ├── api.ts           # API client
│   │   └── utils.ts         # Helper functions
│   └── store/               # State management
│       └── authStore.ts     # Authentication store
├── public/                  # Static assets
├── .env.local              # Environment variables
├── tailwind.config.ts      # Tailwind configuration
└── package.json            # Dependencies
```

## 🤝 Contributing

This is a client application for the existing AssetWorks backend. To contribute:

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature-name`
3. **Make changes**: Follow existing code patterns
4. **Test thoroughly**: Ensure all features work with backend
5. **Submit pull request**: Include detailed description

## 📝 License

This project is created for educational and development purposes. Ensure compliance with AssetWorks backend licensing and terms of service.

---

**Note**: This client application requires the AssetWorks backend to be running and accessible. It does not modify any existing AssetWorks code but instead consumes the existing APIs to provide a web-based interface for user authentication and data viewing.