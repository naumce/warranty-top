// Receipt OCR using OpenAI Vision API
// Extracts structured data from receipt images

export interface ReceiptData {
  storeName?: string;
  storeAddress?: string;
  storeCity?: string;
  storeCountry?: string;
  storePhone?: string;
  receiptNumber?: string;
  orderNumber?: string;
  purchaseDate?: string;
  purchaseTime?: string;
  items?: Array<{
    name: string;
    quantity?: number;
    price?: number;
  }>;
  subtotal?: number;
  tax?: number;
  total?: number;
  paymentMethod?: string;
  lastFourDigits?: string;
  confidence: 'high' | 'medium' | 'low';
  rawText?: string;
}

/**
 * Extract data from receipt image using OpenAI Vision
 */
export async function extractReceiptData(imageFile: File): Promise<ReceiptData | null> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!openaiKey) {
    console.warn("⚠️ OpenAI API key not configured. Receipt OCR disabled.");
    return null;
  }

  console.log("📄 Processing receipt image with AI OCR...");

  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);

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
            content: `You are a receipt OCR system. Extract ALL information from receipts accurately.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "storeName": "Store name",
  "storeAddress": "Full address",
  "storeCity": "City",
  "storeCountry": "Country",
  "storePhone": "Phone number",
  "receiptNumber": "Receipt/Transaction number",
  "orderNumber": "Order number if available",
  "purchaseDate": "YYYY-MM-DD format",
  "purchaseTime": "HH:MM format",
  "items": [
    {"name": "Product name", "quantity": 1, "price": 99.99}
  ],
  "subtotal": 99.99,
  "tax": 9.99,
  "total": 109.98,
  "paymentMethod": "credit/debit/cash",
  "lastFourDigits": "1234",
  "confidence": "high|medium|low",
  "rawText": "Any additional important text"
}

If you cannot read something, omit that field. Be as accurate as possible.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all information from this receipt. Be thorough and accurate.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageFile.type};base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1, // Low temperature for accuracy
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI Vision API error:", error);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No response from OpenAI Vision");
      return null;
    }

    console.log("🤖 OCR raw response:", content);

    // Parse JSON response
    const receiptData = JSON.parse(content);

    console.log("✅ Receipt data extracted:", receiptData);
    return receiptData;

  } catch (error) {
    console.error("Receipt OCR error:", error);
    return null;
  }
}

/**
 * Convert File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
  });
}

/**
 * Validate and format extracted date
 */
export function formatExtractedDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return undefined;
    
    // Format as YYYY-MM-DD
    return date.toISOString().split('T')[0];
  } catch {
    return undefined;
  }
}

/**
 * Generate a confidence score based on extracted data completeness
 */
export function calculateDataCompleteness(data: ReceiptData): number {
  const fields = [
    data.storeName,
    data.storeAddress,
    data.receiptNumber,
    data.purchaseDate,
    data.total,
    data.items && data.items.length > 0,
  ];
  
  const filledFields = fields.filter(Boolean).length;
  return Math.round((filledFields / fields.length) * 100);
}

