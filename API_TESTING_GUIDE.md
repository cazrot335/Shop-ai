# API Testing Guide for shop-ai

## Current Status
- ✅ Build: Successful
- ✅ Tests: 7/7 passing
- ✅ Validation: 9/9 handlers built
- ⏳ Deployment: Ready (needs environment variables)

## Before Testing

### Option A: Set Environment Variables & Deploy

```bash
# Set required environment variables
export ELEVENLABS_API_KEY="your-key"
export GOOGLE_SEARCH_API_KEY="your-key"
export GOOGLE_SEARCH_ENGINE_ID="your-key"
export AMAZON_API_KEY="your-key"
export FLIPKART_API_KEY="your-key"
export CROMA_API_KEY="your-key"
export OPENAI_API_KEY="your-key"
export GEMINI_API_KEY="your-key"

# Deploy
raindrop build deploy --start

# Get the live URL
raindrop build find
```

### Option B: Test Locally Without Deployment

```bash
# Just validate and run tests (no deployment needed)
npm run build
raindrop build validate
npm test
```

## Testing Methods

### Method 1: Using REST Client Extension (VS Code)

**Install the Extension:**
1. Open VS Code
2. Extensions → Search "REST Client"
3. Install by humao.rest-client

**Then use the file:** `test-api.http`
- Click "Send Request" above each test case
- Responses appear in a new panel

### Method 2: Using curl (Terminal)

After deployment, get your URL:
```bash
raindrop build find
```

Then test:
```bash
# Health check
curl -X GET https://shop-ai-xxx.raindrop.app/health

# Hello endpoint
curl -X GET https://shop-ai-xxx.raindrop.app/api/hello/World

# Echo (POST)
curl -X POST https://shop-ai-xxx.raindrop.app/api/echo \
  -H "Content-Type: application/json" \
  -d '{"message":"test","query":"phone"}'
```

### Method 3: Using Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Create requests matching the endpoints below

### Method 4: Using Node.js/Fetch

Create `test-local.js`:
```javascript
const BASE_URL = 'https://shop-ai-xxx.raindrop.app'; // Replace with actual URL

async function testAPI() {
  // Test health
  const health = await fetch(`${BASE_URL}/health`);
  console.log('Health:', await health.json());

  // Test hello
  const hello = await fetch(`${BASE_URL}/api/hello/Alice`);
  console.log('Hello:', await hello.json());

  // Test echo
  const echo = await fetch(`${BASE_URL}/api/echo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Testing', query: 'laptop' })
  });
  console.log('Echo:', await echo.json());
}

testAPI().catch(console.error);
```

Run:
```bash
node test-local.js
```

## Available Endpoints

### 1. Health Check
**GET** `/health`

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-20T16:28:21.000Z"
}
```

### 2. Simple Greeting
**GET** `/api/hello`

Response:
```json
{
  "message": "Hello from Hono!"
}
```

### 3. Personalized Greeting
**GET** `/api/hello/:name`

Example: `/api/hello/John`

Response:
```json
{
  "message": "Hello, John!"
}
```

### 4. Echo Service
**POST** `/api/echo`

Body:
```json
{
  "message": "Hello",
  "query": "laptop",
  "budget": 50000
}
```

Response:
```json
{
  "received": {
    "message": "Hello",
    "query": "laptop",
    "budget": 50000
  }
}
```

### 5. Status & Resources
**GET** `/api/status`

Response:
```json
{
  "status": "running",
  "handlers": 9,
  "resources": {
    "smartbucket": true,
    "kvCache": true,
    "queue": true,
    "database": true,
    "actors": true
  }
}
```

## Testing Checklist

### Unit Tests
```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
```

### Integration Tests
```bash
raindrop build validate  # Validates all 9 handlers
```

### End-to-End Tests (After Deployment)
```bash
# Using REST Client (VS Code)
# Open test-api.http and click "Send Request"

# Or using curl
curl https://shop-ai-xxx.raindrop.app/health
```

### Performance Tests
```bash
# Using Apache Bench (requires installation)
ab -n 100 -c 10 https://shop-ai-xxx.raindrop.app/health
```

## Deployment Commands

```bash
# Build locally
npm run build

# Validate configuration
raindrop build validate

# Deploy (requires env vars)
npm run start
# or
raindrop build deploy --start

# Check deployment status
raindrop build status

# Find deployed service URLs
raindrop build find

# View live logs
raindrop logs tail

# Query logs
raindrop logs query --limit 50

# Stop application
npm run stop

# Restart application
npm run restart
```

## Troubleshooting

### "0 applications found" after `raindrop build find`
- **Cause**: Nothing deployed yet
- **Solution**: Run `npm run start` or `raindrop build deploy --start`

### Deployment fails with "Missing environment variables"
- **Solution**: Set required env vars before deploying
```bash
export GEMINI_API_KEY="sk-..."
raindrop build deploy --amend
```

### Tests fail locally
```bash
# Clear cache and rebuild
npm run build
npm test
```

### API returns 404
- **Check**: Is the app deployed? Run `raindrop build find`
- **Check**: Is the endpoint path correct? See "Available Endpoints" above

## Next Steps

1. **Set environment variables** for all required APIs
2. **Deploy**: `npm run start`
3. **Test**: Use one of the testing methods above
4. **Monitor**: `raindrop logs tail`
5. **Implement**: Add actual business logic to handlers
