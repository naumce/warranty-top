// AI-powered barcode lookup using OpenAI or Perplexity

export interface AIProductInfo {
  productName: string;
  brand?: string;
  model?: string;
  category?: string;
  description?: string;
  estimatedWarrantyPeriod?: string;
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

/**
 * Use OpenAI to research a barcode and extract product information
 * This uses GPT-4 with web browsing capabilities
 */
export async function aiLookupBarcode(
  barcode: string, 
  barcodeFormat?: string
): Promise<AIProductInfo | null> {
  
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!openaiKey) {
    console.warn("⚠️ OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env");
    return null;
  }

  console.log("🤖 Using AI to research barcode:", barcode, barcodeFormat);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a product research assistant. When given a barcode number, you research and identify the product.
            
Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "productName": "Full product name",
  "brand": "Brand name",
  "model": "Model number",
  "category": "Product category",
  "description": "Brief product description",
  "estimatedWarrantyPeriod": "Typical warranty period (e.g., '1 year', '2 years')",
  "confidence": "high|medium|low",
  "source": "Where you found this info"
}

If you cannot find the product, return:
{
  "confidence": "low",
  "source": "not found"
}`
          },
          {
            role: 'user',
            content: `Research this barcode and tell me what product it is:

Barcode: ${barcode}
Format: ${barcodeFormat || 'Unknown'}

Search for this product online and give me the details.`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No response from OpenAI");
      return null;
    }

    console.log("🤖 OpenAI raw response:", content);

    // Parse the JSON response
    const productInfo = JSON.parse(content);

    if (productInfo.confidence === 'low' || productInfo.source === 'not found') {
      console.log("❌ AI couldn't find product info");
      return null;
    }

    console.log("✅ AI found product:", productInfo);
    return productInfo;

  } catch (error) {
    console.error("AI lookup error:", error);
    return null;
  }
}

/**
 * Alternative: Use Perplexity AI for web-powered search
 * Perplexity has built-in web search and is often better for real-time info
 */
export async function perplexityLookupBarcode(
  barcode: string,
  barcodeFormat?: string
): Promise<AIProductInfo | null> {
  
  const perplexityKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
  
  if (!perplexityKey) {
    console.warn("⚠️ Perplexity API key not configured. Set VITE_PERPLEXITY_API_KEY in .env");
    return null;
  }

  console.log("🔮 Using Perplexity to research barcode:", barcode);

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: `You are a product research assistant. Search the web for product information based on barcodes.
            
Return ONLY valid JSON (no markdown):
{
  "productName": "Full product name",
  "brand": "Brand name", 
  "model": "Model number",
  "category": "Product category",
  "description": "Brief description",
  "estimatedWarrantyPeriod": "Typical warranty (e.g., '1 year')",
  "confidence": "high|medium|low",
  "source": "Where you found this info"
}`
          },
          {
            role: 'user',
            content: `Search the web for this barcode and tell me what product it is:

Barcode: ${barcode}
Format: ${barcodeFormat || 'Unknown'}

What product is this?`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error("Perplexity API error:", await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) return null;

    console.log("🔮 Perplexity raw response:", content);

    // Extract JSON from response (Perplexity sometimes wraps in markdown)
    let jsonContent = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    const productInfo = JSON.parse(jsonContent);

    if (productInfo.confidence === 'low' || !productInfo.productName) {
      return null;
    }

    console.log("✅ Perplexity found product:", productInfo);
    return productInfo;

  } catch (error) {
    console.error("Perplexity lookup error:", error);
    return null;
  }
}

/**
 * Main AI lookup function - tries Perplexity first (better for web search), 
 * then falls back to OpenAI
 */
export async function smartAILookup(
  barcode: string,
  barcodeFormat?: string
): Promise<AIProductInfo | null> {
  
  // Try Perplexity first (it's built for web search)
  let result = await perplexityLookupBarcode(barcode, barcodeFormat);
  if (result) return result;

  // Fallback to OpenAI
  result = await aiLookupBarcode(barcode, barcodeFormat);
  if (result) return result;

  return null;
}

