# Google OAuth Setup for Supabase

Google authentication is now integrated into the chat app! Follow these steps to enable it:

## 1. Set Up Google OAuth in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to your project: `mrxdqmkrynxhvepiolna`
3. In the left sidebar, click **Authentication** → **Providers**
4. Find **Google** in the provider list and click on it
5. Click **Enable** to enable Google authentication

## 2. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth Client ID**
5. Choose **Web application**
6. Add the following **Authorized JavaScript origins**:
   - `http://localhost:3000` (for local development)
   - `https://mrxdqmkrynxhvepiolna.supabase.co` (Supabase domain)
   - Your production domain (if applicable)

7. Add the following **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://mrxdqmkrynxhvepiolna.supabase.co/auth/v1/callback` (Supabase OAuth callback)
   - Your production OAuth callback URL (if applicable)

8. Copy the **Client ID** and **Client Secret** from the credentials page

## 3. Configure Google Provider in Supabase

1. In the Supabase dashboard, under **Authentication** → **Providers** → **Google**:
2. Paste the **Client ID** in the first field
3. Paste the **Client Secret** in the second field
4. Click **Save**

## 4. Test It Out

1. Start your development server: `npm run dev`
2. Go to http://localhost:3000/login or http://localhost:3000/register
3. Click the **"Sign in with Google"** or **"Sign up with Google"** button
4. Follow the Google login flow
5. You'll be redirected back to the app and logged in!

## Features Enabled

✅ **Sign in with Google** on the login page  
✅ **Sign up with Google** on the register page  
✅ **Automatic profile creation** from Google account info  
✅ **OAuth callback handling** at `/auth/callback`  

## Troubleshooting

**"Redirect URI mismatch" error**
- Make sure you've added the correct redirect URIs to the Google Console
- For local dev: use `http://localhost:3000/auth/callback`
- For production: use your domain with `/auth/callback`

**"Invalid Client ID" error**
- Double-check that you copied the credentials correctly
- Refresh the Supabase page and try again

**Profile not created**
- Check that your Supabase RLS policies allow profile creation
- The schema.sql has a trigger that auto-creates profiles from OAuth metadata

---

**Credentials file saved:** `.dev-login.json` (for reference)
