// Barcode lookup service to fetch product information

export interface ProductInfo {
  productName?: string;
  brand?: string;
  model?: string;
  imageUrl?: string;
  description?: string;
  category?: string;
  source?: string;
}

/**
 * Try multiple free APIs to get product info from barcode
 */
export async function lookupBarcode(barcode: string): Promise<ProductInfo | null> {
  console.log(`🔍 Looking up barcode: ${barcode}`);

  // Try Open Food Facts first (great for food/consumer products)
  try {
    const foodInfo = await lookupOpenFoodFacts(barcode);
    if (foodInfo) {
      console.log("✅ Found product on Open Food Facts:", foodInfo);
      return foodInfo;
    }
  } catch (err) {
    console.log("❌ Open Food Facts lookup failed:", err);
  }

  // Try UPCItemDB (broad product database)
  try {
    const upcInfo = await lookupUPCItemDB(barcode);
    if (upcInfo) {
      console.log("✅ Found product on UPCItemDB:", upcInfo);
      return upcInfo;
    }
  } catch (err) {
    console.log("❌ UPCItemDB lookup failed:", err);
  }

  // Try World of UPC (another free option)
  try {
    const worldUpcInfo = await lookupWorldOfUPC(barcode);
    if (worldUpcInfo) {
      console.log("✅ Found product on World of UPC:", worldUpcInfo);
      return worldUpcInfo;
    }
  } catch (err) {
    console.log("❌ World of UPC lookup failed:", err);
  }

  console.log("❌ No product info found from any API");
  return null;
}

/**
 * Open Food Facts API - Free, no key required
 * Great for food products and consumer goods
 */
async function lookupOpenFoodFacts(barcode: string): Promise<ProductInfo | null> {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
  );
  
  if (!response.ok) return null;
  
  const data = await response.json();
  
  console.log("🍔 Open Food Facts raw response:", data);
  
  if (data.status === 1 && data.product) {
    const product = data.product;
    
    console.log("📦 Product data:", {
      product_name: product.product_name,
      product_name_en: product.product_name_en,
      brands: product.brands,
      generic_name: product.generic_name,
      categories: product.categories,
      image_url: product.image_url,
    });
    
    // Only return if we have at least product name or brand
    const hasUsefulData = product.product_name || product.product_name_en || product.brands;
    
    if (hasUsefulData) {
      return {
        productName: product.product_name || product.product_name_en || `${product.brands || "Unknown"} Product`,
        brand: product.brands,
        description: product.generic_name || product.categories,
        imageUrl: product.image_url,
        category: product.categories_tags?.[0],
        source: "Open Food Facts",
      };
    }
  }
  
  return null;
}

/**
 * UPCItemDB API - Free tier available
 * Requires API key but has free tier: https://www.upcitemdb.com/
 */
async function lookupUPCItemDB(barcode: string): Promise<ProductInfo | null> {
  // Note: This is a free public endpoint (rate limited)
  // For production, sign up at https://www.upcitemdb.com/ for API key
  const response = await fetch(
    `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`
  );
  
  if (!response.ok) return null;
  
  const data = await response.json();
  
  if (data.items && data.items.length > 0) {
    const item = data.items[0];
    return {
      productName: item.title,
      brand: item.brand,
      description: item.description,
      imageUrl: item.images?.[0],
      category: item.category,
      model: item.model,
      source: "UPCItemDB",
    };
  }
  
  return null;
}

/**
 * World of UPC - Another free option
 */
async function lookupWorldOfUPC(barcode: string): Promise<ProductInfo | null> {
  try {
    const response = await fetch(
      `https://www.digit-eyes.com/gtin/v2_0/?upcCode=${barcode}&field_names=description,brand,image&language=en&app_key=demo&signature=demo`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.description) {
      return {
        productName: data.description,
        brand: data.brand,
        imageUrl: data.image,
        source: "Digit-Eyes",
      };
    }
  } catch (err) {
    // Fail silently
  }
  
  return null;
}

/**
 * Generate smart Google search URL for barcode
 */
export function getBarcodeSearchUrl(barcode: string, barcodeFormat?: string): string {
  const formatType = barcodeFormat || "barcode";
  return `https://www.google.com/search?q=${barcode}+${formatType}+product`;
}

/**
 * Generate Google Shopping search URL
 */
export function getGoogleShoppingUrl(barcode: string): string {
  return `https://www.google.com/search?tbm=shop&q=${barcode}`;
}

/**
 * Generate Amazon search URL
 */
export function getAmazonSearchUrl(barcode: string): string {
  return `https://www.amazon.com/s?k=${barcode}`;
}

