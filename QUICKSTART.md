# ⚡ Quick Start - Warranty Tracker

**Get up and running in 5 minutes!**

---

## 📦 Step 1: Install

```bash
cd warranty-bot-main
npm install
```

---

## 🔐 Step 2: Environment Setup

Create `.env.local` in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_OPENAI_API_KEY=sk-your-openai-key-here
```

**Get credentials:**
- Supabase: [supabase.com](https://supabase.com) → New Project → Settings → API
- OpenAI: [platform.openai.com](https://platform.openai.com) → API Keys

---

## 💾 Step 3: Database Setup

1. Open [your Supabase dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Copy contents from `supabase/COPY_PASTE_THIS_TO_SUPABASE.sql`
4. Paste and click **Run** ▶️

**Optional:** Run `ADD_TEST_WARRANTIES.sql` for sample data

---

## 🚀 Step 4: Start Dev Server

```bash
npm run dev
```

Visit http://localhost:8080 🎉

---

## ✅ Step 5: Test

1. Sign up with test email
2. Add a warranty
3. Try Emergency Mode
4. Test Smart Insights

---

## 🌐 Step 6: Deploy (Optional)

```bash
# Vercel (recommended)
npm i -g vercel
vercel

# Netlify
npm i -g netlify-cli
netlify deploy
```

**Don't forget:** Add environment variables in hosting dashboard!

---

## 📚 Full Documentation

- **README.md** - Complete project overview
- **DEPLOYMENT_GUIDE.md** - Detailed deployment steps
- **FEATURES_COMPLETE.md** - All 24 features explained
- **FINAL_SUMMARY.md** - Build summary & launch guide

---

## 🆘 Common Issues

**Problem:** `VITE_SUPABASE_URL is not defined`  
**Solution:** Check `.env.local` exists and variables start with `VITE_`

**Problem:** Database errors  
**Solution:** Run migration SQL in Supabase SQL Editor

**Problem:** Camera not working  
**Solution:** Grant browser camera permissions, use HTTPS or localhost

---

## 🎯 What's Included

✅ 24 Major Features  
✅ AI-Powered Barcode & OCR  
✅ Smart Notifications  
✅ Emergency Mode  
✅ Claims Management  
✅ Beautiful UI  
✅ Mobile Responsive  
✅ Production Ready  

---

**You're all set! Start building something amazing.** 🚀

