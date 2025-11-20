import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  TextContent
} from "@modelcontextprotocol/sdk/types.js";
import { GeminiService, RAGContext } from "../../services/gemini.service";
import { Logger } from "../../utils/logger.util";

/**
 * Gemini RAG MCP Server
 * Exposes Gemini capabilities through the Model Context Protocol
 */
export class GeminiRagMcpServer {
  private server: Server;
  private geminiService: GeminiService;
  private logger: Logger;

  constructor(apiKey: string, model: string, visionModel: string) {
    this.server = new Server({
      name: "gemini-rag-agent",
      version: "1.0.0"
    });
    this.geminiService = new GeminiService({
      apiKey,
      model,
      visionModel,
      temperatureDefault: 0.7,
      maxTokens: 2048
    });
    this.logger = new Logger("GeminiRagMcpServer");
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getAvailableTools()
    }));
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return this.handleToolCall(request);
    });
  }

  private getAvailableTools(): Array<{
    name: string;
    description: string;
    inputSchema: any;
  }> {
    return [
      {
        name: "generate_recommendations",
        description: "Generate personalized product recommendations based on user query and context",
        inputSchema: {
          type: "object" as const,
          properties: {
            query: { type: "string", description: "The user's shopping query or requirements" },
            budget: { type: "number", description: "Maximum budget in rupees (optional)" },
            brands: { type: "array", items: { type: "string" }, description: "Preferred brands (optional)" },
            categories: { type: "array", items: { type: "string" }, description: "Product categories of interest (optional)" }
          },
          required: ["query"]
        }
      },
      {
        name: "analyze_product_image",
        description: "Analyze a product image to extract features, quality, and pricing insights",
        inputSchema: {
          type: "object" as const,
          properties: {
            image_base64: { type: "string", description: "Base64 encoded product image" },
            mime_type: { type: "string", description: "MIME type of the image (image/jpeg, image/png, etc.)" }
          },
          required: ["image_base64", "mime_type"]
        }
      },
      {
        name: "compare_products",
        description: "Compare multiple products with detailed analysis and recommendations",
        inputSchema: {
          type: "object" as const,
          properties: {
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  price: { type: "number" },
                  reviews: { type: "string" },
                  rating: { type: "number" },
                  platform: { type: "string" }
                }
              },
              description: "Array of products to compare"
            },
            user_query: { type: "string", description: "User's specific requirements or preferences" }
          },
          required: ["products", "user_query"]
        }
      },
      {
        name: "translate_content",
        description: "Translate shopping content to Indian regional languages",
        inputSchema: {
          type: "object" as const,
          properties: {
            text: { type: "string", description: "Text to translate" },
            target_language: {
              type: "string",
              enum: [
                "hindi",
                "tamil",
                "telugu",
                "kannada",
                "marathi",
                "gujarati"
              ],
              description: "Target Indian language"
            }
          },
          required: ["text", "target_language"]
        }
      },
      {
        name: "extract_entities",
        description: "Extract shopping entities (product type, budget, preferences) from user query",
        inputSchema: {
          type: "object" as const,
          properties: {
            query: { type: "string", description: "User's shopping query" }
          },
          required: ["query"]
        }
      },
      {
        name: "health_check",
        description: "Check if Gemini API is available and responsive",
        inputSchema: { type: "object" as const, properties: {} }
      }
    ];
  }

  private async handleToolCall(request: any) {
    const { name, arguments: args } = request.params;
    try {
      let result: string;
      switch (name) {
        case "generate_recommendations":
          {
            const context: RAGContext = {
              userPreferences: {
                budget: args.budget,
                brands: args.brands,
                categories: args.categories
              }
            };
            result = await this.geminiService.generateRecommendations(args.query, context);
            break;
          }
        case "analyze_product_image":
          {
            result = await this.geminiService.analyzeProductImage(args.image_base64, args.mime_type);
            break;
          }
        case "compare_products":
          {
            result = await this.geminiService.compareProducts(args.products, args.user_query);
            break;
          }
        case "translate_content":
          {
            result = await this.geminiService.translateForIndianLanguage(args.text, args.target_language);
            break;
          }
        case "extract_entities":
          {
            const entities = await this.geminiService.extractQueryEntities(args.query);
            result = JSON.stringify(entities, null, 2);
            break;
          }
        case "health_check":
          {
            const isHealthy = await this.geminiService.healthCheck();
            result = isHealthy
              ? "✅ Gemini API is healthy and ready"
              : "❌ Gemini API health check failed";
            break;
          }
        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true
          };
      }
      return {
        content: [{ type: "text" as const, text: result }]
      };
    } catch (error) {
      this.logger.error(`Tool execution failed: ${name}`, error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }

 async start() {
  const transport = new StdioServerTransport();
  await this.server.connect(transport);
  this.logger.info("Gemini RAG MCP Server started successfully");
}

}

if (require.main === module) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const visionModel = process.env.GEMINI_VISION_MODEL || "gemini-2.0-flash-vision";
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is required");
    process.exit(1);
  }
  const server = new GeminiRagMcpServer(apiKey, model, visionModel);
  server.start().catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  });
}

export default GeminiRagMcpServer;
