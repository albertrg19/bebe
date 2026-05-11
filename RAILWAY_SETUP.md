# 🚂 Railway Deployment Guide

## Prerequisites

- A GitHub account
- A Railway account ([railway.app](https://railway.app))
- A Supabase project already set up (run `SUPABASE_SETUP.sql` first)

---

## Step 1: Push Project to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Our Love Story"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/our-love-story.git
git push -u origin main
```

---

## Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub Repo"**
4. Connect your GitHub account if not already connected
5. Select the **our-love-story** repository

---

## Step 3: Add Environment Variables

In your Railway project dashboard:

1. Click on the deployed service
2. Go to the **"Variables"** tab
3. Add the following environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

> **Note:** Railway automatically sets the `PORT` variable. The app is configured to use `${PORT:-3000}`.

---

## Step 4: Deploy

- Railway will automatically detect the project using **Nixpacks**
- It reads the `railway.json` and `.nixpacks.toml` for build/start commands
- The build command runs: `npm run build`
- The start command runs: `npm run start`
- Deployment typically takes 2-4 minutes

---

## Step 5: Get Your Domain

1. After deployment, go to **Settings** → **Networking**
2. Click **"Generate Domain"** to get a `*.up.railway.app` URL
3. Or add a **Custom Domain** if you have one

---

## Step 6: Update Supabase Settings

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Railway domain to **Site URL** and **Redirect URLs**:
   - `https://your-app.up.railway.app`

---

## Step 7: Verify

1. Open your Railway domain in a browser
2. Verify all sections load correctly
3. Test photo uploads (profile photos and calendar photos)
4. Test the edit mode (click Edit, modify text, click Save)
5. Test the Memory Match game
6. Check that the timer is counting correctly

---

## Troubleshooting

### Build Fails
- Check Railway build logs for errors
- Ensure all environment variables are set correctly
- Verify `railway.json` has the correct commands

### Photos Not Uploading
- Verify Supabase Storage bucket `memories` exists and is public
- Check that storage policies are created (run `SUPABASE_SETUP.sql`)
- Verify the Supabase URL and anon key are correct

### Database Not Loading
- Ensure you ran `SUPABASE_SETUP.sql` in the Supabase SQL Editor
- Check that RLS policies are created for both tables
- Verify the anon key has proper permissions

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser   │────▶│   Railway    │────▶│   Supabase   │
│  (Next.js)  │     │  (Node.js)   │     │  (Postgres)  │
│             │     │  Standalone  │     │  + Storage   │
└─────────────┘     └──────────────┘     └──────────────┘
```

Made with ♡
