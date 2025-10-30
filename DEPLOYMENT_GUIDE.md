# 🚀 Warranty Tracker - Deployment Guide

Complete guide to deploy your Warranty Tracker application to production.

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup (Supabase)](#database-setup-supabase)
4. [Deploy Frontend (Vercel)](#deploy-frontend-vercel)
5. [Deploy Frontend (Netlify)](#deploy-frontend-netlify)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## ✅ PREREQUISITES

Before deploying, ensure you have:

- [x] GitHub account
- [x] Supabase account (free tier works)
- [x] OpenAI API key (for AI features)
- [x] Vercel or Netlify account (free tier works)
- [x] Git installed locally
- [x] Node.js 18+ installed

---

## 🔐 ENVIRONMENT SETUP

### 1. Create `.env.local` File

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI Configuration (for AI features)
VITE_OPENAI_API_KEY=sk-your-openai-key-here
```

### 2. Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Go to **Settings > API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 3. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create account
3. Navigate to **API Keys**
4. Create new secret key
5. Copy key → `VITE_OPENAI_API_KEY`

**⚠️ IMPORTANT:** Never commit `.env.local` to Git. It's already in `.gitignore`.

---

## 💾 DATABASE SETUP (SUPABASE)

### Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file `/supabase/COPY_PASTE_THIS_TO_SUPABASE.sql`
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **Run** ▶️

This creates:
- `warranties` table with all columns
- `warranty_claims` table
- `warranty_claim_attachments` table
- `warranty_images` table
- `warranty_documents` table
- `warranty_reminders` table
- Row Level Security (RLS) policies
- Helper functions

### Step 2: Verify Tables

Go to **Database > Tables** and confirm you see:
- ✅ warranties
- ✅ warranty_claims
- ✅ warranty_claim_attachments
- ✅ warranty_images
- ✅ warranty_documents
- ✅ warranty_reminders

### Step 3: Configure Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Create three buckets:
   - `receipts` (Public)
   - `products` (Public)
   - `documents` (Public)

3. For each bucket, set RLS policies:
   ```sql
   -- Allow users to upload to their own folder
   CREATE POLICY "Users can upload own files"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

   -- Allow users to read their own files
   CREATE POLICY "Users can read own files"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (auth.uid()::text = (storage.foldername(name))[1]);
   ```

### Step 4: (Optional) Add Test Data

For testing, run `ADD_TEST_WARRANTIES.sql` in SQL Editor to add 15 sample warranties with various expiry dates.

---

## 🌐 DEPLOY FRONTEND (VERCEL)

### Option A: Deploy via Vercel Dashboard

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click **"New Project"**
   - Import your GitHub repository
   - Vercel auto-detects it's a Vite app

3. **Configure Environment Variables**
   - In Vercel project settings, go to **Environment Variables**
   - Add all three variables from your `.env.local`:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_OPENAI_API_KEY`

4. **Deploy**
   - Click **Deploy**
   - Wait 2-3 minutes for build
   - You'll get a URL like `https://your-project.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_OPENAI_API_KEY

# Deploy to production
vercel --prod
```

---

## 🌐 DEPLOY FRONTEND (NETLIFY)

### Option A: Deploy via Netlify Dashboard

1. **Push to GitHub** (same as Vercel)

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click **"Add new site" > Import an existing project**
   - Choose your GitHub repository

3. **Configure Build Settings**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

4. **Add Environment Variables**
   - Go to **Site settings > Environment variables**
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_OPENAI_API_KEY`

5. **Deploy**
   - Click **Deploy site**
   - You'll get a URL like `https://your-project.netlify.app`

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

---

## ✅ POST-DEPLOYMENT

### 1. Test Authentication

- Sign up with a test account
- Verify email confirmation works
- Test login/logout

### 2. Test Core Features

- ✅ Add warranty manually
- ✅ Scan barcode
- ✅ Upload receipt (AI OCR)
- ✅ Edit warranty
- ✅ Delete warranty
- ✅ Emergency mode
- ✅ File claim
- ✅ Export to CSV/PDF
- ✅ Notifications

### 3. Configure Supabase Auth Settings

In Supabase Dashboard > **Authentication > URL Configuration**:

- **Site URL:** `https://your-deployed-url.com`
- **Redirect URLs:** Add:
  - `https://your-deployed-url.com`
  - `https://your-deployed-url.com/auth`
  - `https://your-deployed-url.com/dashboard`

### 4. Enable Email Templates (Optional)

Go to **Authentication > Email Templates** and customize:
- Confirmation email
- Password reset email
- Invitation email

### 5. Set Up Custom Domain (Optional)

**Vercel:**
- Go to **Settings > Domains**
- Add your custom domain
- Follow DNS configuration steps

**Netlify:**
- Go to **Domain settings**
- Add custom domain
- Configure DNS records

---

## 📊 MONITORING & MAINTENANCE

### Analytics (Optional)

Add Google Analytics or Mixpanel:

```typescript
// src/main.tsx
import ReactGA from 'react-ga4';

ReactGA.initialize('G-YOUR-MEASUREMENT-ID');
```

### Error Monitoring (Recommended)

Add Sentry for error tracking:

```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### Backup Strategy

**Supabase Backups:**
- Free tier: Daily automatic backups (7 days retention)
- Pro tier: Point-in-time recovery

**Manual Backup:**
```bash
# Export all data
pg_dump -h your-supabase-host -U postgres -d postgres > backup.sql
```

### Update Dependencies

Regularly update dependencies:

```bash
npm update
npm audit fix
```

---

## 🐛 TROUBLESHOOTING

### Build Fails

**Error:** `Module not found`
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error:** `VITE_SUPABASE_URL is not defined`
- Verify environment variables are set in hosting platform
- Check variable names (must start with `VITE_`)

### Database Connection Issues

**Error:** `Invalid API key`
- Verify `VITE_SUPABASE_ANON_KEY` is correct
- Check Supabase project is not paused (free tier auto-pauses after 7 days inactivity)

**Error:** `Row Level Security policy violation`
- Verify RLS policies are set up correctly
- Run migration script again

### Authentication Issues

**Error:** `Invalid redirect URL`
- Add your production URL to Supabase redirect URLs
- Check Site URL in Supabase settings

**Error:** `Email confirmation not working`
- Verify SMTP is configured in Supabase (or use Supabase's built-in email)
- Check spam folder

### AI Features Not Working

**Error:** `OpenAI API key invalid`
- Verify API key is correct and active
- Check OpenAI account has credits

**Error:** `Rate limit exceeded`
- Upgrade OpenAI plan or implement rate limiting on frontend
- Add error handling for rate limits

### Performance Issues

**Slow loading:**
- Enable caching headers
- Optimize images (use WebP format)
- Lazy load components
- Add indexes to frequently queried database columns

---

## 🔒 SECURITY CHECKLIST

Before going live:

- [ ] All environment variables are set correctly
- [ ] `.env.local` is in `.gitignore`
- [ ] RLS policies are enabled on all tables
- [ ] Storage buckets have proper access policies
- [ ] Supabase API keys are rotated (if exposed)
- [ ] OpenAI API key has usage limits set
- [ ] HTTPS is enabled (automatic on Vercel/Netlify)
- [ ] Content Security Policy headers configured
- [ ] Rate limiting implemented (optional)
- [ ] Error messages don't expose sensitive data

---

## 📱 MOBILE APP (Future)

To create a mobile version:

### React Native Setup

```bash
npx create-expo-app warranty-tracker-mobile
cd warranty-tracker-mobile
npm install @supabase/supabase-js
```

Reuse most of your logic and components!

---

## 💰 COST ESTIMATES

### Free Tier (Suitable for MVP/Personal Use)

- **Supabase Free:** 500MB database, 1GB storage, 50K monthly active users
- **Vercel/Netlify Free:** 100GB bandwidth, unlimited builds
- **OpenAI:** Pay-as-you-go ($0.01 per GPT-4 call, $0.001 per Vision API call)

**Estimated monthly cost for 100 users:** $5-10 (mostly OpenAI usage)

### Production Tier (For Growth)

- **Supabase Pro:** $25/month (8GB database, 100GB storage)
- **Vercel Pro:** $20/month (1TB bandwidth)
- **OpenAI:** ~$50-200/month (depending on usage)

**Estimated monthly cost for 1000 users:** $100-250

---

## 🎉 YOU'RE LIVE!

Your Warranty Tracker is now deployed and ready for users! 

**Next steps:**
1. Share with beta testers
2. Collect feedback
3. Iterate on features
4. Launch! 🚀

---

## 📚 ADDITIONAL RESOURCES

- [Vite Documentation](https://vitejs.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [React Documentation](https://react.dev/)

---

## 🆘 SUPPORT

If you encounter issues:
1. Check this troubleshooting guide
2. Review Supabase logs (Dashboard > Logs)
3. Check browser console for errors
4. Review Vercel/Netlify build logs

---

*Built with ❤️ and ready for the world!*

