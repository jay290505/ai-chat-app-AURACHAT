# Google OAuth Setup - Step by Step Guide

## Part 1: Create Google OAuth Credentials (5 minutes)

### Step 1.1: Go to Google Cloud Console
1. Open https://console.cloud.google.com in your browser
2. Click on the project dropdown at the top
3. Click **NEW PROJECT**
4. Enter project name: `Aura Chat App`
5. Click **CREATE**
6. Wait 1-2 minutes for the project to be created

### Step 1.2: Enable Google+ API
1. In the top search bar, type `Google+ API`
2. Click on **Google+ API** in the results
3. Click **ENABLE**
4. Wait for it to enable

### Step 1.3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials** (left sidebar)
2. Click **+ CREATE CREDENTIALS**
3. Select **OAuth Client ID**
4. You'll see a message: "To create an OAuth client ID, you must first set your OAuth consent screen"
5. Click **CREATE OAUTH CONSENT SCREEN**

### Step 1.4: Configure OAuth Consent Screen
1. Select **External** for User Type
2. Click **CREATE**
3. Fill in the form:
   - **App name**: `Aura Messenger`
   - **User support email**: Use your email
   - **Developer contact**: Use your email
4. Click **SAVE AND CONTINUE**
5. Click **SAVE AND CONTINUE** on the next screen (Scopes)
6. Click **SAVE AND CONTINUE** on the next screen (Summary)

### Step 1.5: Create OAuth Client ID
1. Go back to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS**
3. Select **OAuth Client ID**
4. For **Application type**, select **Web application**
5. For **Name**, enter: `Aura Web Client`
6. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
   ```
   http://localhost:3000
   ```
7. Click **+ ADD URI** again and add:
   ```
   https://mrxdqmkrynxhvepiolna.supabase.co
   ```
8. Under **Authorized redirect URIs**, click **+ ADD URI** and add:
   ```
   http://localhost:3000/auth/callback
   ```
9. Click **+ ADD URI** again and add:
   ```
   https://mrxdqmkrynxhvepiolna.supabase.co/auth/v1/callback
   ```
10. Click **CREATE**

### Step 1.6: Copy Your Credentials
1. A popup will appear with your credentials
2. **Copy the Client ID** (you'll need this in Part 2)
3. **Copy the Client Secret** (you'll need this in Part 2)
4. Click **OK**
5. Keep this browser tab open - you'll need it in Part 2

---

## Part 2: Configure Supabase (3 minutes)

### Step 2.1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Sign in with your Supabase account
3. Click on your project: `mrxdqmkrynxhvepiolna`

### Step 2.2: Go to Authentication Settings
1. In the left sidebar, click **Authentication**
2. Click **Providers** (under Authentication heading)

### Step 2.3: Enable Google Provider
1. Scroll down to find **Google**
2. Click on **Google** to expand it
3. Toggle the switch to **ENABLE** (turn it on)

### Step 2.4: Add Your Credentials
1. In the **Client ID** field, paste the Client ID you copied from Google Cloud
2. In the **Client Secret** field, paste the Client Secret you copied from Google Cloud
3. Check the box: **Skip nonce validation for Azure, Okta, and Google**
4. Click **SAVE**

### Step 2.5: Verify It's Enabled
You should see a **green checkmark** next to Google in the providers list.

---

## Part 3: Test It (2 minutes)

### Step 3.1: Start Your App
1. Open terminal in your project folder
2. Run: `npm run dev`
3. Wait for the server to start
4. You should see: `✓ Ready in XXXms`

### Step 3.2: Test Login with Google
1. Open http://localhost:3000/login in your browser
2. You should see **Sign in with Google** button
3. Click the **Sign in with Google** button
4. You'll be redirected to Google login
5. Select a Google account to sign in with
6. You'll see a permission screen - click **Allow**
7. You'll be redirected back to the app
8. **You should be logged in!** ✅

### Step 3.3: Test Sign Up with Google
1. Go to http://localhost:3000/register
2. Click **Sign up with Google**
3. Follow the same process as above
4. You should be logged in with a new account ✅

---

## Part 4: Troubleshooting

### ❌ "Redirect URI mismatch"
**Solution:**
- Go back to Google Cloud Console
- Go to **APIs & Services** → **Credentials**
- Click on your OAuth Client ID
- Make sure these URIs are added:
  - `http://localhost:3000/auth/callback`
  - `https://mrxdqmkrynxhvepiolna.supabase.co/auth/v1/callback`
- Click **SAVE**
- Try again in your app

### ❌ "Invalid Client ID or Secret"
**Solution:**
- Go back to Supabase Dashboard
- Go to **Authentication** → **Providers** → **Google**
- Delete the current Client ID and Secret
- Copy them again from Google Cloud Console
- Paste them in Supabase
- Click **SAVE**

### ❌ "Sign in button doesn't appear"
**Solution:**
- Make sure Supabase is configured (check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`)
- Refresh the page (Ctrl+R or Cmd+R)
- Check browser console for errors (F12)

### ❌ "I get sent to Google but error after selecting account"
**Solution:**
- Go back to Google Cloud Console
- Check that these origins are added:
  - `http://localhost:3000`
  - `https://mrxdqmkrynxhvepiolna.supabase.co`
- Click **SAVE**
- Refresh and try again

---

## Part 5: For Production (Optional)

When you deploy to production, you'll need to:

1. **Add your production domain** to both Google Cloud and Supabase
   - Example: `https://myapp.com`

2. **Add production redirect URIs** to Google Cloud
   - `https://myapp.com/auth/callback`
   - `https://mrxdqmkrynxhvepiolna.supabase.co/auth/v1/callback`

3. **No additional setup needed in Supabase** - it will work automatically with your new domain

---

## ✅ You're Done!

Your app now has:
- ✅ Google sign-in on login page
- ✅ Google sign-up on register page
- ✅ Automatic profile creation from Google data
- ✅ Seamless OAuth flow

**Next time users visit your app, they can sign in with one click using their Google account!**
