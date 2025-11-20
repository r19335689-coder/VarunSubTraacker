# Supabase + Google OAuth Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/log in
2. Click **"New Project"**
3. Fill in:
   - **Project name**: `VarunSubTracker` (or your choice)
   - **Database password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"** and wait for setup (~2 minutes)

## Step 2: Get Supabase Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

## Step 3: Set Up Google OAuth

### 3.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `VarunSubTracker`
4. Click **"Create"**

### 3.2 Enable Google+ API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for **"Google+ API"**
3. Click on it and press **"Enable"**

### 3.3 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure OAuth consent screen:
   - User Type: **External** (unless you have Google Workspace)
   - App name: `VarunSubTracker`
   - User support email: Your email
   - Developer contact: Your email
   - Click **"Save and Continue"** through the steps
4. Back to Credentials, click **"Create Credentials"** → **"OAuth client ID"**
5. Configure:
   - **Application type**: Web application
   - **Name**: `VarunSubTracker`
   - **Authorized redirect URIs**: Add this (replace with your Supabase project ref):
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
     To find your project ref: In Supabase → Settings → General → Reference ID
6. Click **"Create"**
7. **Copy the Client ID and Client Secret** (you'll need these)

## Step 4: Configure Supabase for Google OAuth

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click on it
3. Toggle **"Enable Google provider"**
4. Paste:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)
5. Click **"Save"**

## Step 5: Set Up Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace:
- `your_supabase_project_url` with your Project URL from Step 2
- `your_supabase_anon_key` with your anon key from Step 2

**Important**: Never commit `.env.local` to git (it's already in .gitignore)

## Step 6: Test the Setup

1. Run your development server: `npm run dev`
2. Go to the sign-in page
3. Click **"Sign in with Google"**
4. You should be redirected to Google's sign-in page
5. After signing in, you'll be redirected back to your app

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in Google Cloud Console exactly matches:
  `https://<your-project-ref>.supabase.co/auth/v1/callback`
- Check your Supabase project ref in Settings → General

### "Invalid client" error
- Double-check your Client ID and Client Secret in Supabase
- Make sure Google+ API is enabled in Google Cloud Console

### Environment variables not working
- Make sure `.env.local` is in the project root
- Restart your dev server after adding environment variables
- Check that variable names start with `NEXT_PUBLIC_`

## Next Steps

Once Google OAuth is working, you can:
1. Remove the temporary login option from the sign-in page
2. Set up Supabase database tables for subscriptions (optional - currently using localStorage)
3. Add more OAuth providers if needed

