# Gemini Integration with Raindrop MCP - Setup Guide

## 🎯 Overview

This guide explains how to integrate **Google Gemini API** with **Raindrop MCP** for enhanced shopping recommendations with RAG (Retrieval-Augmented Generation) capabilities.

## ✨ What's Integrated

### 1. **Gemini Service** (`src/services/gemini.service.ts`)
Core service that connects to Google Gemini API with:
- ✅ Product recommendations using RAG
- ✅ Product image analysis with vision
- ✅ Product comparison and analysis
- ✅ Multilingual translation for Indian languages
- ✅ Entity extraction from user queries

### 2. **Gemini MCP Server** (`src/handlers/gemini-rag-agent/index.ts`)
Model Context Protocol server exposing 6 tools:
- `generate_recommendations` - Get personalized product suggestions
- `analyze_product_image` - Analyze product images
- `compare_products` - Compare multiple products
- `translate_content` - Translate to Indian languages
- `extract_entities` - Extract shopping intent
- `health_check` - Verify API connectivity

### 3. **RAG Pipeline** (`src/services/rag-pipeline.service.ts`)
Knowledge base management system:
- Product indexing by category
- Intelligent product retrieval based on user preferences
- Context-aware recommendation generation
- Product data augmentation with AI insights

### 4. **Multilingual Support** (`src/services/multilingual.service.ts`)
Support for 8 Indian languages:
- 🇮🇳 Hindi, Tamil, Telugu, Kannada, Marathi, Gujarati, Bengali, Punjabi
- Culturally aware recommendations
- Translation caching for performance
- Language detection

### 5. **Prompt Engineering** (`src/utils/prompt-engineer.util.ts`)
Utilities for effective prompt construction:
- Prompt templates for various use cases
- RAG context building
- Token optimization
- Chain-of-thought reasoning
- Persona-based responses

## 🚀 Setup Instructions

### Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key"
3. Create a new API key
4. Copy your API key

### Step 2: Configure Environment Variables

Add to your deployment environment:

```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash
GEMINI_VISION_MODEL=gemini-2.0-flash-vision
```

The manifest already defines these in `raindrop.manifest`:
```raindrop
env "GEMINI_API_KEY" {
  secret = true
}

env "GEMINI_MODEL" {
  default = "gemini-2.0-flash"
}

env "GEMINI_VISION_MODEL" {
  default = "gemini-2.0-flash-vision"
}
```

### Step 3: Install Dependencies

The `package.json` already includes required packages:

```json
{
  "@google/generative-ai": "^0.11.0",
  "google-auth-library": "^9.6.0"
}
```

Run:
```bash
npm install
```

### Step 4: Deploy

```bash
raindrop build validate      # Validate manifest
raindrop build generate      # Generate handler scaffolds
raindrop build deploy --start # Deploy to Raindrop
```

## 📝 Usage Examples

### Using Gemini Service Directly

```typescript
import { GeminiService } from './src/services/gemini.service';

const gemini = new GeminiService({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-2.0-flash',
  visionModel: 'gemini-2.0-flash-vision'
});

// Generate recommendations
const recommendation = await gemini.generateRecommendations(
  'I need a laptop under ₹50,000 for coding',
  {
    userPreferences: {
      budget: 50000,
      brands: ['Dell', 'HP', 'Lenovo'],
      language: 'hindi'
    }
  }
);

// Translate to Hindi
const hindi = await gemini.translateForIndianLanguage(
  'Best budget laptop for coding',
  'hindi'
);

// Extract entities
const entities = await gemini.extractQueryEntities(
  'I want a smartphone under 30k with good camera'
);
```

### Using RAG Pipeline

```typescript
import { GeminiRagPipeline } from './src/services/rag-pipeline.service';

const pipeline = new GeminiRagPipeline(geminiService);

// Index products
await pipeline.indexProducts(laptopProducts, 'laptops');
await pipeline.indexProducts(phoneProducts, 'smartphones');

// Generate recommendations
const rec = await pipeline.generateRecommendations({
  text: 'Best laptop for coding under 50k',
  budget: { min: 40000, max: 50000 },
  language: 'hindi'
});

console.log(rec.analysis);        // Gemini's analysis
console.log(rec.bestValue);       // Best value product
console.log(rec.topRated);        // Top rated product
```

### Using Multilingual Service

```typescript
import { MultilingualGeminiService } from './src/services/multilingual.service';

const multilingual = new MultilingualGeminiService(geminiService);

// Translate product data
const translations = await multilingual.translateProductMultilingual({
  name: 'Samsung Galaxy S24',
  description: 'Latest flagship smartphone'
});

// Generate culturally aware recommendations
const rec = await multilingual.generateLocalizedRecommendations(
  'best phone under 50k',
  'tamil',
  products
);

// Detect language
const lang = await multilingual.detectLanguage('எனக்கு நல்ல ஸ்மார்ட்ஃபோன் வேண்டும்');
```

### Using Prompt Engineer

```typescript
import { PromptEngineer } from './src/utils/prompt-engineer.util';

const promptEng = new PromptEngineer();

// Generate recommendation prompt
const prompt = promptEng.generateRecommendationPrompt({
  userQuery: 'Best laptop for gaming under 1 lakh',
  userPreferences: {
    budget: 100000,
    brands: ['ASUS', 'MSI']
  },
  productContext: {
    count: 50,
    categories: ['gaming-laptops'],
    priceRange: { min: 60000, max: 100000 }
  }
});

// Add chain-of-thought
const enhanced = promptEng.addChainOfThought(prompt);

// Add persona
const friendly = promptEng.addPersona(enhanced, 'friendly');
```

## 🛠️ API Tools (MCP)

### Tool: `generate_recommendations`

```json
{
  "name": "generate_recommendations",
  "query": "Best laptop for coding",
  "budget": 50000,
  "brands": ["Dell", "HP"],
  "categories": ["laptops"]
}
```

**Returns:** Personalized recommendations with analysis and reasoning

---

### Tool: `analyze_product_image`

```json
{
  "name": "analyze_product_image",
  "image_base64": "base64_encoded_image_data",
  "mime_type": "image/jpeg"
}
```

**Returns:** Product analysis including features, quality, and price estimate

---

### Tool: `compare_products`

```json
{
  "name": "compare_products",
  "products": [
    {
      "id": "1",
      "name": "iPhone 15",
      "price": 79999,
      "rating": 4.8,
      "reviews": "Excellent phone, great camera",
      "platform": "Amazon"
    }
  ],
  "user_query": "Best phone for photography"
}
```

**Returns:** Detailed comparison with recommendation

---

### Tool: `translate_content`

```json
{
  "name": "translate_content",
  "text": "This is the best laptop for coding",
  "target_language": "tamil"
}
```

**Returns:** Translated content

---

### Tool: `extract_entities`

```json
{
  "name": "extract_entities",
  "query": "I need a phone under 30k with good battery life"
}
```

**Returns:** JSON with extracted entities (product type, budget, features, etc.)

---

### Tool: `health_check`

```json
{
  "name": "health_check"
}
```

**Returns:** "✅ Gemini API is healthy and ready" or error message

## 🎯 Benefits

✨ **Advanced RAG Capabilities**
- Context-aware recommendations
- Product knowledge integration
- Intelligent comparison

🌍 **Multilingual Support**
- 8 Indian languages
- Culturally appropriate responses
- Language detection

🖼️ **Vision Capabilities**
- Product image analysis
- Feature extraction
- Quality assessment

⚡ **Performance Optimized**
- Translation caching
- Token optimization
- Batch processing support

🔐 **Secure Integration**
- API key management via environment
- Protected MCP endpoints
- Error handling and logging

## 🔄 Data Flow

```
User Query
    ↓
Language Detection & Entity Extraction (Gemini)
    ↓
Retrieve Relevant Products (RAG)
    ↓
Augment Context (User Preferences + Products)
    ↓
Generate Recommendations (Gemini + RAG Context)
    ↓
Localization (Translate if needed)
    ↓
Response to User
```

## 📊 Knowledge Base Structure

```
products-kb (SmartBucket)
├── Laptops
│   ├── Gaming Laptops
│   ├── Budget Laptops
│   └── Professional Laptops
├── Smartphones
│   ├── Budget Phones
│   ├── Mid-Range Phones
│   └── Premium Phones
└── Other Categories...
```

## 🧪 Testing

```bash
# Test Gemini health check
curl -X POST https://shop-ai.your-tenant.lmapp.run/test \
  -H "Content-Type: application/json" \
  -d '{"tool": "health_check"}'

# Test recommendations
curl -X POST https://shop-ai.your-tenant.lmapp.run/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Best laptop for coding",
    "budget": 50000
  }'
```

## 📈 Metrics to Monitor

- API response time (target: <2 seconds)
- Token usage per request
- Cache hit ratio (translation cache)
- User satisfaction scores
- Recommendation conversion rate

## 🚨 Error Handling

All services include comprehensive error handling:

```typescript
try {
  const recommendation = await gemini.generateRecommendations(query, context);
} catch (error) {
  logger.error('Failed to generate recommendations', error);
  // Fallback to cached or default recommendations
}
```

## 🔐 Security Best Practices

1. ✅ Store `GEMINI_API_KEY` as secret in Raindrop
2. ✅ Use protected MCP endpoints
3. ✅ Validate user input before sending to Gemini
4. ✅ Rate limit API calls
5. ✅ Monitor for suspicious patterns
6. ✅ Implement request signing for MCP

## 📚 Additional Resources

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Raindrop Framework Docs](https://docs.liquidmetal.ai)
- [RAG Best Practices](https://python.langchain.com/docs/use_cases/rag/)

## 🤝 Support

For issues or questions:
1. Check error logs: `raindrop logs tail`
2. Validate manifest: `raindrop build validate`
3. Test health: Access health check tool via MCP

---

**Happy Shopping! 🛍️**
