import { Logger } from "./logger.util";

/**
 * Prompt Engineering Utilities for Gemini
 * Provides templates and utilities for effective prompt construction
 */

export interface PromptContext {
  userQuery: string;
  userPreferences?: {
    budget?: number;
    language?: string;
    brands?: string[];
  };
  productContext?: {
    count: number;
    categories?: string[];
    priceRange?: { min: number; max: number };
  };
  systemRole?: string;
}

export interface PromptTemplate {
  name: string;
  description: string;
  template: string;
  variables: string[];
  use_case: string;
}

/**
 * Prompt Engineering Service
 */
export class PromptEngineer {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("PromptEngineer");
  }

  /**
   * Generate product recommendation prompt
   */
  generateRecommendationPrompt(
    context: PromptContext
  ): string {
    return `You are an expert shopping assistant helping users find the perfect products.

User Profile:
- Query: "${context.userQuery}"
${context.userPreferences?.budget ? `- Budget: ₹${context.userPreferences.budget}` : ""}
${context.userPreferences?.brands ? `- Preferred Brands: ${context.userPreferences.brands.join(", ")}` : ""}
${context.userPreferences?.language ? `- Language Preference: ${context.userPreferences.language}` : ""}

Product Context:
- Available Products: ${context.productContext?.count || 0}
${context.productContext?.categories ? `- Categories: ${context.productContext.categories.join(", ")}` : ""}
${context.productContext?.priceRange ? `- Price Range: ₹${context.productContext.priceRange.min} - ₹${context.productContext.priceRange.max}` : ""}

Please provide:
1. **Top 3-5 Recommendations** with specific product names and reasons
2. **Value Analysis** - Best for money, premium choice, budget option
3. **Key Features Comparison** - What makes each stand out
4. **Decision Guide** - How to choose based on priorities
5. **Where to Buy** - Platform suggestions and links if available

Keep response conversational, friendly, and action-oriented. Use emojis for emphasis.`;
  }

  /**
   * Generate comparison prompt
   */
  generateComparisonPrompt(
    products: string[],
    criteria: string[],
    context: PromptContext
  ): string {
    return `Compare these products for a user with specific needs:

User Requirement: "${context.userQuery}"
${context.userPreferences?.budget ? `Budget Limit: ₹${context.userPreferences.budget}` : ""}

Products to Compare:
${products.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Comparison Criteria:
${criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Provide a detailed comparison table and final recommendation with clear reasoning for why that choice is best for this specific user.`;
  }

  /**
   * Generate entity extraction prompt
   */
  generateEntityExtractionPrompt(userQuery: string): string {
    return `Extract shopping entities from this query and return ONLY valid JSON.

Query: "${userQuery}"

Extract and return:
{
  "product_type": "main product category",
  "budget": { "min": 0, "max": 0 },
  "brands": ["preferred brands"],
  "features": ["required features"],
  "priority": "price|quality|ratings|brand|delivery",
  "sentiment": "positive|neutral|negative"
}

Return ONLY JSON, no other text.`;
  }

  /**
   * Generate image analysis prompt
   */
  generateImageAnalysisPrompt(productContext?: string): string {
    return `Analyze this product image and provide insights:

${productContext ? `Product Context: ${productContext}` : ""}

Please analyze and provide:
1. **Product Identification** - What is it, brand (if visible)
2. **Visible Features** - Design, color, materials, special features
3. **Quality Assessment** - Build quality indicators, durability signals
4. **Estimated Price Range** - Based on visible quality and features
5. **Target Audience** - Who would benefit most from this product
6. **Potential Use Cases** - Scenarios where this product excels

Be specific and detailed in your analysis.`;
  }

  /**
   * Generate translation prompt for shopping context
   */
  generateTranslationPrompt(
    text: string,
    targetLanguage: string
  ): string {
    return `Translate this shopping-related text to ${targetLanguage} naturally.

Original Text: "${text}"

Requirements:
- Maintain shopping/commerce terminology accuracy
- Keep friendly and conversational tone
- Preserve numerical values and prices
- Adapt cultural references if needed
- Return ONLY the translated text

Translated Text:`;
  }

  /**
   * Generate RAG context prompt
   */
  generateRAGContextPrompt(
    userQuery: string,
    retrievedProducts: any[],
    userProfile: any
  ): string {
    return `Using the provided context, answer the user's shopping query:

User Query: "${userQuery}"

User Profile:
- Budget: ₹${userProfile.budget || "Not specified"}
- Preferred Categories: ${userProfile.categories?.join(", ") || "Any"}
- Previous Interests: ${userProfile.interests?.join(", ") || "None"}

Retrieved Relevant Products:
${retrievedProducts
  .map(
    (p, i) => `
${i + 1}. ${p.name}
   Price: ₹${p.price}
   Rating: ${p.rating}/5 (${p.reviewCount} reviews)
   Platform: ${p.platform}
   Summary: ${p.summary}
`
  )
  .join("\n")}

Based on this context:
1. Provide personalized recommendations
2. Explain why each product matches the user's needs
3. Highlight best value and top-rated options
4. Suggest alternatives if budget changes
5. Provide clear next steps for purchase

Focus on practical, actionable advice.`;
  }

  /**
   * Generate system prompt for shopping assistant
   */
  generateSystemPrompt(language: string = "english"): string {
    const systemPrompts: Record<string, string> = {
      english: `You are an expert shopping assistant with knowledge of Indian e-commerce platforms (Amazon, Flipkart, Croma, etc.). 
Your role is to:
- Help users find the perfect products based on their needs
- Provide honest, unbiased recommendations
- Compare products fairly and transparently
- Consider budget, quality, reviews, and value
- Suggest alternatives and explain trade-offs
- Use emojis and friendly language
- Always prioritize user's best interests`,

      hindi: `आप एक विशेषज्ञ शॉपिंग सहायक हैं जो भारतीय ई-कॉमर्स प्लेटफॉर्म्स (अमेज़न, फ्लिपकार्ट, क्रोमा आदि) के बारे में जानकारी रखते हैं।
आपकी भूमिका:
- उपयोगकर्ताओं को उनकी ज़रूरतों के अनुसार सही उत्पाद खोजने में मदद करना
- ईमानदार, निष्पक्ष सिफारिशें प्रदान करना
- उत्पादों की निष्पक्ष तुलना करना
- बजट, गुणवत्ता, समीक्षाएं और मूल्य विचार करना
- विकल्पों का सुझाव देना और व्यापार-offs समझाना
- इमोजी और दोस्ताना भाषा का उपयोग करना
- हमेशा उपयोगकर्ता के सर्वोत्तम हित को प्राथमिकता देना`,
    };

    return (systemPrompts[language] ?? systemPrompts["english"]) as string;
  }

  /**
   * Build context for RAG from user query and products
   */
  buildRAGContext(
    userQuery: string,
    products: any[],
    userPreferences: any
  ): PromptContext {
    return {
      userQuery,
      userPreferences: {
        budget: userPreferences?.budget,
        language: userPreferences?.language,
        brands: userPreferences?.brands,
      },
      productContext: {
        count: products.length,
        categories: [...new Set(products.map((p) => p.category))],
        priceRange: {
          min: Math.min(...products.map((p) => p.price)),
          max: Math.max(...products.map((p) => p.price)),
        },
      },
    };
  }

  /**
   * Optimize prompt for token efficiency
   */
  optimizePromptTokens(prompt: string, maxTokens: number = 2000): string {
    // Remove excessive whitespace and formatting
    let optimized = prompt.replace(/\s+/g, " ").trim();

    // If exceeds limit, summarize
    if (optimized.length > maxTokens * 4) {
      // Average ~4 chars per token
      optimized = optimized.substring(0, maxTokens * 4);
      optimized = optimized.substring(0, optimized.lastIndexOf(".")) + ".";
    }

    return optimized;
  }

  /**
   * Add chain-of-thought reasoning to prompt
   */
  addChainOfThought(prompt: string): string {
    return `${prompt}

Please think step by step:
1. First, identify the key requirements from the user's query
2. Then, analyze which products match these requirements
3. Next, compare them based on the identified criteria
4. Finally, provide your reasoning for the recommendation`;
  }

  /**
   * Add persona to prompt for better responses
   */
  addPersona(
    prompt: string,
    persona: "expert" | "friendly" | "analytical" | "casual"
  ): string {
    const personas: Record<string, string> = {
      expert:
        "Respond as a product expert with deep knowledge and professional tone.",
      friendly:
        "Respond in a warm, friendly manner like a helpful friend giving advice.",
      analytical:
        "Respond with detailed analysis, data points, and logical reasoning.",
      casual:
        "Respond in a casual, conversational way with a bit of humor and relatable examples.",
    };

    return `${personas[persona]}\n\n${prompt}`;
  }

  /**
   * Get available prompt templates
   */
  getPromptTemplates(): PromptTemplate[] {
    return [
      {
        name: "product_recommendation",
        description: "Generate personalized product recommendations",
        template: this.generateRecommendationPrompt({
          userQuery: "{user_query}",
        }),
        variables: ["user_query", "budget", "preferences"],
        use_case: "User asking for product suggestions",
      },
      {
        name: "product_comparison",
        description: "Compare multiple products",
        template: "Compare: {products}",
        variables: ["products", "criteria"],
        use_case: "User wants to compare specific products",
      },
      {
        name: "entity_extraction",
        description: "Extract shopping entities from query",
        template: this.generateEntityExtractionPrompt("{user_query}"),
        variables: ["user_query"],
        use_case: "Understanding user intent and preferences",
      },
    ];
  }
}

export default PromptEngineer;
