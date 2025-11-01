// AI-Powered Emergency Support System
// Provides store locator, claim letter generator, legal advisor, and support chat

interface Warranty {
  id: string;
  product_name: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_end_date?: string;
  store_name?: string;
  store_address?: string;
  store_city?: string;
  store_phone?: string;
  purchase_price?: number;
  notes?: string;
}

interface StoreLocation {
  name: string;
  address: string;
  phone?: string;
  distance?: string;
  rating?: number;
  hours?: string;
  placeId?: string;
}

interface ClaimLetter {
  subject: string;
  body: string;
  recipient: string;
  confidence: 'high' | 'medium' | 'low';
}

interface LegalAdvice {
  rights: string[];
  obligations: string[];
  nextSteps: string[];
  escalationPath: string[];
  resources: Array<{ name: string; url: string; phone?: string }>;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * 1. AI Store Locator
 * Finds nearest service centers using location + AI
 */
export async function findNearestServiceCenter(
  warranty: Warranty,
  userLocation?: { lat: number; lng: number }
): Promise<StoreLocation[]> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!openaiKey) {
    console.warn("⚠️ OpenAI API key not configured");
    return [];
  }

  try {
    console.log("🗺️ Finding service centers for:", warranty.product_name);

    // Step 1: Use AI to determine what type of service center to search for
    const searchQuery = await generateSearchQuery(warranty);

    // Step 2: If we have Google Maps API, use it for precise location
    if (googleMapsKey && userLocation) {
      return await searchGooglePlaces(searchQuery, userLocation, googleMapsKey);
    }

    // Step 3: Fallback to AI-powered search
    return await aiSearchServiceCenters(warranty, searchQuery);
  } catch (error) {
    console.error("Store locator error:", error);
    return [];
  }
}

async function generateSearchQuery(warranty: Warranty): Promise<string> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a service center locator. Generate a precise Google Maps search query to find authorized service centers for warranty repairs. Return ONLY the search query, nothing else.'
        },
        {
          role: 'user',
          content: `Product: ${warranty.product_name}\nBrand: ${warranty.brand || 'Unknown'}\nModel: ${warranty.model || 'Unknown'}\n\nGenerate a search query to find authorized service centers.`
        }
      ],
      max_tokens: 50,
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function searchGooglePlaces(
  query: string,
  location: { lat: number; lng: number },
  apiKey: string
): Promise<StoreLocation[]> {
  // TODO: Implement Google Places API search
  // For now, return empty array (will be implemented when Google Maps API key is added)
  console.log("Google Places search:", query, location);
  return [];
}

async function aiSearchServiceCenters(
  warranty: Warranty,
  searchQuery: string
): Promise<StoreLocation[]> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

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
          content: `You are a service center locator assistant. Provide realistic service center information based on the product and location. Return ONLY valid JSON array with this structure:
[{
  "name": "Service Center Name",
  "address": "Full address",
  "phone": "Phone number",
  "distance": "Distance estimate",
  "rating": 4.5,
  "hours": "Mon-Fri 9AM-6PM"
}]`
        },
        {
          role: 'user',
          content: `Find authorized service centers for:\n\nProduct: ${warranty.product_name}\nBrand: ${warranty.brand || 'Unknown'}\nStore: ${warranty.store_name || 'Unknown'}\nLocation: ${warranty.store_city || 'Unknown'}\n\nProvide 3-5 realistic service center options.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Clean up response
  let cleanedContent = content.trim();
  if (cleanedContent.startsWith('```json')) {
    cleanedContent = cleanedContent.replace(/^```json\s*\n/, '').replace(/\n```\s*$/, '');
  } else if (cleanedContent.startsWith('```')) {
    cleanedContent = cleanedContent.replace(/^```\s*\n/, '').replace(/\n```\s*$/, '');
  }

  return JSON.parse(cleanedContent);
}

/**
 * 2. AI Claim Letter Generator
 * Generates professional warranty claim letters
 */
export async function generateClaimLetter(
  warranty: Warranty,
  issueDescription: string,
  desiredResolution: string
): Promise<ClaimLetter> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!openaiKey) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    console.log("📝 Generating claim letter for:", warranty.product_name);

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
            content: `You are a professional warranty claim letter writer. Write formal, polite, but firm letters that cite consumer rights and warranty terms. Return ONLY valid JSON:
{
  "subject": "Email subject line",
  "body": "Full letter body with proper formatting",
  "recipient": "Suggested recipient (e.g., Customer Service Manager)",
  "confidence": "high|medium|low"
}`
          },
          {
            role: 'user',
            content: `Write a warranty claim letter for:

PRODUCT DETAILS:
- Product: ${warranty.product_name}
- Brand: ${warranty.brand || 'N/A'}
- Model: ${warranty.model || 'N/A'}
- Serial Number: ${warranty.serial_number || 'N/A'}
- Purchase Date: ${warranty.purchase_date || 'N/A'}
- Warranty Expires: ${warranty.warranty_end_date || 'N/A'}
- Store: ${warranty.store_name || 'N/A'}
- Purchase Price: $${warranty.purchase_price || 'N/A'}

ISSUE:
${issueDescription}

DESIRED RESOLUTION:
${desiredResolution}

Write a professional claim letter that:
1. References the warranty terms
2. Clearly describes the issue
3. States the desired resolution
4. Mentions consumer protection rights if applicable
5. Sets a reasonable deadline for response (14 days)
6. Maintains a professional but firm tone`
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Clean up response
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*\n/, '').replace(/\n```\s*$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*\n/, '').replace(/\n```\s*$/, '');
    }

    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error("Claim letter generation error:", error);
    throw error;
  }
}

/**
 * 3. AI Legal Advisor
 * Provides legal guidance for warranty disputes
 */
export async function getLegalAdvice(
  warranty: Warranty,
  situation: string
): Promise<LegalAdvice> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!openaiKey) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    console.log("⚖️ Getting legal advice for:", warranty.product_name);

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
            content: `You are a consumer rights legal advisor specializing in warranty law. Provide clear, actionable advice about warranty rights and obligations. Return ONLY valid JSON:
{
  "rights": ["Your right 1", "Your right 2", ...],
  "obligations": ["Store obligation 1", "Store obligation 2", ...],
  "nextSteps": ["Step 1", "Step 2", ...],
  "escalationPath": ["Level 1: Contact store", "Level 2: ...", ...],
  "resources": [
    {"name": "Resource name", "url": "https://...", "phone": "optional"}
  ],
  "confidence": "high|medium|low"
}

IMPORTANT: This is general information, not legal advice. Always recommend consulting a lawyer for specific cases.`
          },
          {
            role: 'user',
            content: `Provide consumer rights guidance for:

PRODUCT:
- ${warranty.product_name}
- Brand: ${warranty.brand || 'N/A'}
- Purchase Date: ${warranty.purchase_date || 'N/A'}
- Warranty Expires: ${warranty.warranty_end_date || 'N/A'}
- Purchase Price: $${warranty.purchase_price || 'N/A'}

SITUATION:
${situation}

Provide:
1. Consumer rights under warranty law
2. Store/manufacturer obligations
3. Recommended next steps
4. Escalation path if resolution fails
5. Relevant consumer protection resources`
          }
        ],
        max_tokens: 2000,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Clean up response
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*\n/, '').replace(/\n```\s*$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*\n/, '').replace(/\n```\s*$/, '');
    }

    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error("Legal advice error:", error);
    throw error;
  }
}

/**
 * 4. AI Support Chat
 * Real-time chat for warranty questions
 */
export async function chatWithAI(
  warranty: Warranty,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!openaiKey) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    console.log("💬 AI Chat:", userMessage);

    const messages = [
      {
        role: 'system' as const,
        content: `You are a helpful warranty support assistant. You help users with:
- Understanding warranty terms
- Troubleshooting product issues
- Filing warranty claims
- Contacting support
- Consumer rights questions

PRODUCT CONTEXT:
- Product: ${warranty.product_name}
- Brand: ${warranty.brand || 'N/A'}
- Model: ${warranty.model || 'N/A'}
- Purchase Date: ${warranty.purchase_date || 'N/A'}
- Warranty Expires: ${warranty.warranty_end_date || 'N/A'}
- Store: ${warranty.store_name || 'N/A'}

Be helpful, concise, and actionable. If you don't know something, say so.`
      },
      ...conversationHistory,
      {
        role: 'user' as const,
        content: userMessage
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI chat error:", error);
    throw error;
  }
}

