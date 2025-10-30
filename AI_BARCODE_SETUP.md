# 🤖 AI-Powered Barcode Lookup Setup

The app now supports **AI-powered barcode research** that actually searches the web and extracts product information automatically!

## How It Works

When you scan a barcode, the system tries in this order:

1. **🤖 AI Web Search** (Perplexity or OpenAI) - **BEST RESULTS**
   - Actually searches the web for the barcode
   - Returns structured product data
   - Includes warranty estimates
   
2. **📚 Free Product APIs** (Open Food Facts, etc.) - Fallback
   - Limited to products in their databases
   - Often incomplete data
   
3. **🔍 Manual Search Links** - Last resort
   - Google/Amazon search buttons
   - You do it yourself

## Setup (Choose One)

### Option 1: Perplexity AI (RECOMMENDED ⭐)
**Best for real-time web search. More accurate for product lookups.**

1. Get API key: https://www.perplexity.ai/settings/api
2. Create `.env.local` file in project root:
```bash
VITE_PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxx
```
3. Restart dev server

**Cost:** ~$0.001 per lookup (very cheap)

### Option 2: OpenAI
**Good alternative if you already have OpenAI credits.**

1. Get API key: https://platform.openai.com/api-keys
2. Create `.env.local` file in project root:
```bash
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```
3. Restart dev server

**Cost:** ~$0.01-0.02 per lookup (uses GPT-4o)

### Option 3: Use Both (Ultimate Setup)
```bash
VITE_PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxx
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```
System will try Perplexity first, fallback to OpenAI.

## Without AI Keys
The app still works! It will:
- Try free APIs (limited results)
- Show search buttons for manual lookup
- You can still enter everything manually

## Testing

1. Scan a barcode
2. Watch the console for AI research logs
3. Form auto-fills with product name, brand, model, description, estimated warranty

## Example Console Output (With AI)

```
🔥 BARCODE SCANNED SUCCESSFULLY!
📦 Decoded Text: 8384266487716
📋 Format Name: CODE_39
🤖 Using Perplexity to research barcode: 8384266487716
✅ Perplexity found product: {
  "productName": "Samsung 27\" Curved Monitor",
  "brand": "Samsung",
  "model": "C27F390",
  "category": "Electronics - Monitors",
  "description": "27-inch Full HD curved gaming monitor with AMD FreeSync",
  "estimatedWarrantyPeriod": "3 years",
  "confidence": "high",
  "source": "Multiple retail sources"
}
```

## Security Note

⚠️ **For Production:** Don't expose API keys in frontend code!

Instead, create a Supabase Edge Function:
```bash
supabase functions new barcode-lookup
```
Move the AI logic to the edge function and call it from the frontend.

This setup is for **development/testing only**.

