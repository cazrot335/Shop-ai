import { GoogleGenerativeAI } from "@google/generative-ai";
import { Logger } from "../utils/logger.util";

export interface GeminiConfig {
  apiKey: string;
  model: string;
  visionModel: string;
  temperatureDefault?: number;
  maxTokens?: number;
}

export interface RAGContext {
  productData?: Array<{
    id: string;
    name: string;
    price: number;
    reviews: string;
    rating: number;
    platform: string;
  }>;
  userPreferences?: {
    budget?: number;
    brands?: string[];
    categories?: string[];
    language?: string;
  };
  conversationHistory?: Array<{
    role: "user" | "model";
    content: string;
  }>;
}

/**
 * GeminiService - Integration with Google Gemini API
 * Provides RAG capabilities, multilingual support, and advanced NLP
 */
export class GeminiService {
  private client: GoogleGenerativeAI;
  private config: GeminiConfig;
  private logger: Logger;

  constructor(config: GeminiConfig) {
    this.config = config;
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.logger = new Logger("GeminiService");
  }

  /**
   * Generate product recommendations using RAG
   */
  async generateRecommendations(query: string, context: RAGContext) {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model,
      });

      const augmentedPrompt = this.buildRAGPrompt(query, context);

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: augmentedPrompt }],
          },
        ],
      });

      const response = result.response.text();
      this.logger.info("Recommendations generated successfully");
      return response;
    } catch (error) {
      this.logger.error("Failed to generate recommendations", error);
      throw error;
    }
  }

  /**
   * Analyze product images using Gemini Vision
   */
  async analyzeProductImage(imageBase64: string, mimeType: string) {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.visionModel,
      });

      const result = await model.generateContent([
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType as
              | "image/jpeg"
              | "image/png"
              | "image/gif"
              | "image/webp",
          },
        },
        {
          text: "Analyze this product image and provide: 1) Product type and category 2) Visible features 3) Quality assessment 4) Price range estimate. Be concise.",
        },
      ]);

      this.logger.info("Image analysis completed");
      return result.response.text();
    } catch (error) {
      this.logger.error("Failed to analyze product image", error);
      throw error;
    }
  }

  /**
   * Compare products with detailed analysis
   */
  async compareProducts(products: RAGContext["productData"], userQuery: string) {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model,
      });

      const comparisonPrompt = `
        User Query: ${userQuery}
        
        Products to Compare:
        ${products
          ?.map(
            (p) => `
          - Name: ${p.name}
          - Price: ₹${p.price}
          - Platform: ${p.platform}
          - Rating: ${p.rating}/5
          - Reviews: ${p.reviews}
        `
          )
          .join("\n")}
        
        Provide a detailed comparison highlighting:
        1. Best value for money
        2. Top-rated option
        3. Budget-friendly choice
        4. Overall recommendation with reasoning
        
        Format: Clear, concise, and user-friendly with emojis for emphasis.
      `;

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: comparisonPrompt }],
          },
        ],
      });

      this.logger.info("Product comparison completed");
      return result.response.text();
    } catch (error) {
      this.logger.error("Failed to compare products", error);
      throw error;
    }
  }

  /**
   * Translate and localize content for Indian languages
   */
  async translateForIndianLanguage(
    text: string,
    targetLanguage:
      | "hindi"
      | "tamil"
      | "telugu"
      | "kannada"
      | "marathi"
      | "gujarati"
  ) {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model,
      });

      const translationPrompt = `
        Translate the following shopping assistant text to ${targetLanguage}.
        Keep the tone friendly and conversational.
        Maintain the meaning and context for e-commerce shopping.
        
        Text: "${text}"
        
        Provide only the translated text without explanation.
      `;

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: translationPrompt }],
          },
        ],
      });

      this.logger.info(`Translation to ${targetLanguage} completed`);
      return result.response.text();
    } catch (error) {
      this.logger.error(`Failed to translate to ${targetLanguage}`, error);
      throw error;
    }
  }

  /**
   * Extract entities from user query (product type, budget, preferences)
   */
  async extractQueryEntities(userQuery: string) {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model,
      });

      const extractionPrompt = `
        Extract shopping-related entities from this user query.
        
        Query: "${userQuery}"
        
        Return a JSON object with these fields (if found):
        {
          "productType": string,
          "budget": { "min": number, "max": number },
          "brands": string[],
          "features": string[],
          "priority": string (price|quality|ratings|brand),
          "language": string,
          "sentiment": string (positive|neutral|negative)
        }
        
        Return ONLY valid JSON, no markdown or explanation.
      `;

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: extractionPrompt }],
          },
        ],
      });

      const responseText = result.response.text();
      const entities = JSON.parse(responseText);
      this.logger.info("Query entities extracted");
      return entities;
    } catch (error) {
      this.logger.error("Failed to extract query entities", error);
      throw error;
    }
  }

  /**
   * Build RAG prompt with product context
   */
  private buildRAGPrompt(query: string, context: RAGContext): string {
    let prompt = `You are an expert shopping assistant helping users find the best products.

User Query: ${query}

`;

    if (context.productData && context.productData.length > 0) {
      prompt += `Available Products:
${context.productData
  .map(
    (p) => `
- ${p.name} (${p.platform})
  Price: ₹${p.price}
  Rating: ${p.rating}/5 stars
  Reviews Summary: ${p.reviews}
`
  )
  .join("\n")}

`;
    }

    if (context.userPreferences) {
      prompt += `User Preferences:
`;
      if (context.userPreferences.budget) {
        prompt += `- Budget: ₹${context.userPreferences.budget}
`;
      }
      if (context.userPreferences.brands?.length) {
        prompt += `- Preferred Brands: ${context.userPreferences.brands.join(", ")}
`;
      }
      if (context.userPreferences.categories?.length) {
        prompt += `- Interested Categories: ${context.userPreferences.categories.join(", ")}
`;
      }
    }

    prompt += `
Based on the above information, provide personalized product recommendations with:
1. Top 3-5 product suggestions
2. Why each product matches the user's needs
3. Price-to-value analysis
4. Links to purchase (if available)
5. Alternative options if budget changes

Make the response conversational, helpful, and action-oriented.`;

    return prompt;
  }

  /**
   * Check Gemini API connection and availability
   */
  async healthCheck(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model,
      });

      await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: "Say 'OK' if you are ready." }],
          },
        ],
      });

      this.logger.info("Gemini API health check passed");
      return true;
    } catch (error) {
      this.logger.error("Gemini API health check failed", error);
      return false;
    }
  }
}
