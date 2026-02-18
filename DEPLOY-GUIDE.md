# 🚀 Know Your Boo — Deployment Guide

## What You Have

One single file: `index.html` — that's your entire app. No frameworks, no build tools, no npm install. Just one file.

---

## How It Works (Architecture)

```
User opens website
    ↓
Fills in 10 fun questions about their partner
    ↓
Clicks "Decode My Boo"
    ↓
JavaScript sends data to Claude API (directly from browser)
    ↓
Claude AI generates: archetype, compatibility score, flags, forecast
    ↓
Results displayed beautifully + shareable card generated
    ↓
Submission saved (localStorage or Supabase)
```

### Key Technical Decisions:
- **No backend needed** — Claude API is called directly from the browser
- **API key per user** — each user enters their own Claude API key (stored in their browser's localStorage)
- **Storage options**: localStorage (default, per-device) OR Supabase (free, cloud, you see ALL submissions)

---

## Step-by-Step Deployment

### Option A: Netlify (Recommended — Easiest)

1. Go to [netlify.com](https://netlify.com) and sign up (free)
2. Click **"Add new site" → "Deploy manually"**
3. Drag and drop your `index.html` file
4. Done! You get a URL like `random-name.netlify.app`
5. **Custom domain**: Go to Site Settings → Domain → Add your own domain

### Option B: GitHub Pages (Free)

1. Create a new repo on GitHub (e.g., `knowyourboo`)
2. Upload `index.html` to the repo
3. Go to **Settings → Pages → Source: Deploy from branch → main**
4. Your site is live at `yourusername.github.io/knowyourboo`

### Option C: Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. **New Project → Import from Git** (push `index.html` to GitHub first)
3. Deploy — done!

---

## Setting Up Supabase (So You Can See All Submissions)

Without Supabase, submissions are stored in each user's browser (you can only see your own test submissions). With Supabase, ALL submissions go to a cloud database you control.

### Steps:

1. Go to [supabase.com](https://supabase.com) → Sign up (free tier = 500MB, more than enough)

2. Click **"New Project"** → Name it `knowyourboo` → Set a password → Create

3. Go to **SQL Editor** and run this:

```sql
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  input JSONB,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anonymous inserts and reads (for the app)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON submissions
  FOR SELECT USING (true);
```

4. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

5. Open `index.html` and update the CONFIG section:

```javascript
const CONFIG = {
  ADMIN_PASSWORD: 'your-secret-password',
  SUPABASE_URL: 'https://xxxxx.supabase.co',      // paste here
  SUPABASE_ANON_KEY: 'eyJhbGciOi...',              // paste here
};
```

6. Re-deploy your updated `index.html`

Now every submission from every user gets stored in your Supabase database!

---

## Things to Customize

Open `index.html` and search for these:

| What | Where | Change to |
|------|-------|-----------|
| Admin password | `CONFIG.ADMIN_PASSWORD` | Your secret password |
| Twitter handle | `@abolaborishade` | Your real Twitter handle |
| LinkedIn URL | `linkedin.com/in/abolade` | Your real LinkedIn URL |
| Instagram URL | `instagram.com/abolade` | Your real Instagram URL |
| Footer name | `Built by Abolade` | Your preferred name |
| Copyright year | `© 2025` | Current year |

---

## About the Claude API Key

Currently, each user needs to enter their own Claude API key. This is the simplest approach (no backend needed), but it limits your audience to tech-savvy users.

### To make it free for ALL users (no API key needed):

You'd need a small backend proxy. The simplest approach:

1. Create a Vercel project with a serverless function
2. The function holds YOUR API key server-side
3. Your frontend calls your function instead of Claude directly
4. Add rate limiting so people don't abuse your key

If you want me to build this proxy for you, just ask!

---

## Admin Dashboard

- Click **"📊 Admin"** in the top-right corner
- Enter the password you set in `CONFIG.ADMIN_PASSWORD`
- See all submissions: who decoded who, their archetype, compatibility score, etc.
- Stats: total submissions, average score, latest score

---

## File Structure

```
knowyourboo/
  └── index.html    ← This is literally everything
```

That's it. One file. Upload it anywhere that serves static HTML.
