import { GeminiService, RAGContext } from "../services/gemini.service";
import { Logger } from "../utils/logger.util";

export interface Product {
  id: string;
  name: string;
  price: number;
  platform: string;
  rating: number;
  reviews: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  inStock?: boolean;
}

export interface SearchQuery {
  text: string;
  budget?: { min: number; max: number };
  brands?: string[];
  categories?: string[];
  language?: string;
}

export interface RAGRecommendation {
  products: Product[];
  analysis: string;
  reasoning: string;
  alternatives?: Product[];
  bestValue: Product;
  topRated: Product;
}

/**
 * RAG Pipeline using Gemini
 * Retrieves product data and generates recommendations using Retrieval-Augmented Generation
 */
export class GeminiRagPipeline {
  private geminiService: GeminiService;
  private logger: Logger;
  private productDatabase: Map<string, Product[]> = new Map();

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
    this.logger = new Logger("GeminiRagPipeline");
  }

  /**
   * Index products into the knowledge base
   */
  async indexProducts(products: Product[], category: string) {
    try {
      this.productDatabase.set(category, products);
      this.logger.info(
        `Indexed ${products.length} products for category: ${category}`
      );
      return true;
    } catch (error) {
      this.logger.error("Failed to index products", error);
      throw error;
    }
  }

  /**
   * Retrieve relevant products based on query
   */
  private async retrieveRelevantProducts(
    query: SearchQuery
  ): Promise<Product[]> {
    try {
      // Extract entities from query using Gemini
      const entities =
        await this.geminiService.extractQueryEntities(query.text);

      const productType = entities.productType || "";
      const relevantProducts: Product[] = [];

      // Search across indexed products
      for (const [category, products] of this.productDatabase.entries()) {
        if (
          category.toLowerCase().includes(productType.toLowerCase()) ||
          productType.toLowerCase().includes(category.toLowerCase())
        ) {
          // Filter by budget if specified
          let filtered = products;

          if (query.budget || entities.budget) {
            const maxBudget = query.budget?.max || entities.budget?.max || 0;
            if (maxBudget > 0) {
              filtered = filtered.filter((p) => p.price <= maxBudget);
            }
          }

          // Filter by brands if specified
          if (query.brands && query.brands.length > 0) {
            filtered = filtered.filter((p) =>
              query.brands?.some((b) =>
                p.name.toLowerCase().includes(b.toLowerCase())
              )
            );
          }

          relevantProducts.push(...filtered);
        }
      }

      // Sort by rating and relevance
      relevantProducts.sort((a, b) => b.rating - a.rating);

      this.logger.info(
        `Retrieved ${relevantProducts.length} relevant products`
      );
      return relevantProducts.slice(0, 10); // Top 10 results
    } catch (error) {
      this.logger.error("Failed to retrieve products", error);
      return [];
    }
  }

  /**
   * Generate recommendations using RAG
   */
  async generateRecommendations(
    query: SearchQuery
  ): Promise<RAGRecommendation> {
    try {
      this.logger.info("Starting RAG recommendation pipeline");

      // Step 1: Retrieve relevant products
      const relevantProducts = await this.retrieveRelevantProducts(query);

      if (relevantProducts.length === 0) {
        throw new Error(
          "No products found matching your criteria. Please try a different search."
        );
      }

      // Step 2: Prepare RAG context
      const ragContext: RAGContext = {
        productData: relevantProducts,
        userPreferences: {
          budget: query.budget?.max,
          brands: query.brands,
          categories: query.categories,
          language: query.language,
        },
      };

      // Step 3: Generate recommendations using Gemini
      const analysis = await this.geminiService.generateRecommendations(
        query.text,
        ragContext
      );

      // Step 4: Compare top products
      const topProducts = relevantProducts.slice(0, 5);
      const comparison = await this.geminiService.compareProducts(
        topProducts,
        query.text
      );

      // Step 5: Identify best options
      const bestValue = relevantProducts.reduce((prev, current) =>
        prev.price / (prev.rating || 1) > current.price / (current.rating || 1)
          ? current
          : prev
      );

      const topRated = relevantProducts.reduce((prev, current) =>
        prev.rating > current.rating ? prev : current
      );

      const recommendation: RAGRecommendation = {
        products: topProducts,
        analysis,
        reasoning: comparison,
        alternatives: relevantProducts.slice(5, 10),
        bestValue,
        topRated,
      };

      this.logger.info("RAG recommendation pipeline completed successfully");
      return recommendation;
    } catch (error) {
      this.logger.error("Failed to generate recommendations", error);
      throw error;
    }
  }

  /**
   * Augment product data with AI analysis
   */
  async augmentProductData(product: Product): Promise<Product> {
    try {
      // Use Gemini to generate enhanced description and insights
      const prompt = `
        Based on this product:
        Name: ${product.name}
        Price: ₹${product.price}
        Rating: ${product.rating}/5
        
        Provide a one-line value proposition that highlights why this product is worth buying.
      `;

      const model = (global as any).geminiClient?.getGenerativeModel({
        model: "gemini-2.0-flash",
      });

      if (model) {
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        });

        product.description = result.response.text();
      }

      return product;
    } catch (error) {
      this.logger.warn("Failed to augment product data", error);
      return product; // Return original product if augmentation fails
    }
  }

  /**
   * Get knowledge base statistics
   */
  getKnowledgeBaseStats() {
    const stats = {
      categoriesCount: this.productDatabase.size,
      totalProducts: 0,
      categories: [] as {
        name: string;
        productCount: number;
      }[],
    };

    for (const [category, products] of this.productDatabase.entries()) {
      stats.totalProducts += products.length;
      stats.categories.push({
        name: category,
        productCount: products.length,
      });
    }

    return stats;
  }
}

export default GeminiRagPipeline;
