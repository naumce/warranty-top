# 🚀 QUICK START - FIX THE 400 ERROR!

## Step 1: Run Database Migration (REQUIRED!)

### Go to Supabase Dashboard:
1. Open: **https://supabase.com/dashboard**
2. Select your project
3. Click **"SQL Editor"** (left sidebar)
4. Click **"New Query"**
5. Open the file: `RUN_THIS_NOW.sql` in this folder
6. **Copy ALL the SQL** from that file
7. **Paste into SQL Editor**
8. Click **"RUN"** (bottom right)
9. Wait for success message ✅

**That's it!** Your database now has all the new columns.

---

## Step 2: Refresh Your App

```
http://localhost:8082/
```

Or on iPhone:
```
http://192.168.8.202:8082/
```

---

## Step 3: Test the New Smart Warranty Duration!

1. Click **"Add Warranty"**
2. Click **"Manual Entry"** (or scan/upload)
3. Fill in product details
4. **Set Purchase Date** (e.g., today)
5. **Set Warranty Duration:**
   - Type: `12` 
   - Select: `months`
   - 🎉 **End date auto-calculated!**

### Examples:
- **1 year warranty:** `12` months → Auto-calculates end date
- **90 days warranty:** `90` days → Auto-calculates end date  
- **2 years warranty:** `2` years → Auto-calculates end date

---

## What's New:

### ✨ Smart Warranty Duration Picker
**Before:** Manually pick end date (annoying!)
**After:** Just enter duration (12 months, 90 days, 2 years) → Auto-calculates end date!

Shows you:
```
Warranty expires on: November 28, 2026
```

### 🗄️ Database Fixed
All new columns added:
- Receipt number
- Store address, city, phone
- Receipt OCR data
- Tags, reminders, etc.

---

## Troubleshooting:

### Still getting 400 error?
- Did you run `RUN_THIS_NOW.sql` in Supabase?
- Check Supabase SQL Editor for any red errors
- Make sure you clicked "RUN" button

### Duration not calculating?
- Set **Purchase Date first**
- Then set duration
- End date auto-fills

---

## 🎯 You're Done!

The app now:
- ✅ Saves warranties (no more 400 error)
- ✅ Smart duration picker (enter "12 months" instead of manual date)
- ✅ Auto-calculates warranty end date
- ✅ Shows expiry date in readable format
- ✅ Receipt OCR ready
- ✅ Barcode scanning with AI
- ✅ Manual entry option

**Go test it!** 🚀

