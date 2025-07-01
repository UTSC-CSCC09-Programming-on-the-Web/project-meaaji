# Google OAuth 2.0 Setup Instructions

## Prerequisites
1. A Google Cloud Platform account
2. A project in Google Cloud Console

## Setup Steps

### 1. Create Google OAuth 2.0 Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in the required fields (App name, User support email, etc.)
   - Add your domain to authorized domains if deploying to production
6. Choose **Web application** as the application type
7. Add authorized redirect URIs:
   - For development: `http://localhost:5173/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`
8. Copy the Client ID and Client Secret

### 2. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Replace the placeholder values with your actual Google Client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
   ```

3. Update the backend environment file (`server/.env`):
   ```env
   GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your_actual_client_secret_here
   ```

### 3. OAuth Consent Screen Configuration

1. In Google Cloud Console, go to **APIs & Services** > **OAuth consent screen**
2. Add the following scopes:
   - `openid`
   - `email`
   - `profile`
3. Add test users during development (optional)
4. For production, submit for verification if needed

### 4. Security Considerations

- **Never expose your Client Secret** in frontend code
- Use HTTPS in production
- Implement proper CORS policies
- Validate tokens on your backend server
- Consider implementing token refresh logic for long-lived sessions

### 5. Backend Integration

The Express backend validates the OAuth token and manages user sessions:

```javascript
// OAuth callback handler
app.post('/auth/google/callback', async (req, res) => {
  const { code, state } = req.body;
  
  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    // Fetch user information
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();
    
    // Create or update user in database
    // Generate JWT token for your app
    // Return user data and subscription status
    
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});
```

## Testing

1. Start the development servers:
   ```bash
   # Terminal 1 - Stripe CLI (required for subscription testing)
   stripe listen --forward-to localhost:3000/webhook
   
   # Terminal 2 - Backend
   cd server && npm run dev
   
   # Terminal 3 - Frontend
   npm run dev
   ```

2. Navigate to `http://localhost:5173`
3. Click "Continue with Google"
4. Complete the OAuth flow
5. You should be redirected based on subscription status

## Troubleshooting

- **"Invalid client" error**: Check your Client ID configuration in both frontend and backend
- **CORS errors**: Ensure your domain is added to authorized origins in Google Console
- **Popup blocked**: Users need to allow popups for OAuth flow
- **Token validation fails**: Verify the token server-side before trusting user data
- **Redirect URI mismatch**: Ensure the redirect URI in Google Console exactly matches `http://localhost:5173/auth/callback`

## Production Considerations

- Add your production domain to authorized redirect URIs
- Update environment variables with production values
- Consider implementing refresh token logic for long-lived sessions
- Ensure HTTPS is enabled for all OAuth flows
- Monitor OAuth usage and quotas in Google Cloud Console