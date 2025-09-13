# Deep Travel Agent

An intelligent travel planning companion built with LangGraph and Next.js that orchestrates end-to-end trip planning through a single AI agent coordinating specialized tools.

> [!TIP]
> Don't want to run the app locally? Use the deployed site here: [deep-travel-agent-production.up.railway.app](https://deep-travel-agent-production.up.railway.app)!

## Table of Contents

- [Demo](#demo)
- [Quick Start](#quick-start)
- [Project Foundation](#project-foundation)
- [Architecture Overview](#architecture-overview)
- [Key Architectural Decisions](#key-architectural-decisions)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Setup Instructions](#setup-instructions)
- [Available Commands](#available-commands)
- [Production Deployment](#production-deployment-railway)
- [Key Features](#key-features)
- [Troubleshooting](#troubleshooting)
- [Extension Points](#extension-points)
- [Contributing](#contributing)

## Demo

[Demo](https://www.loom.com/share/f995f849e58a412792208549fce475d1?sid=1b85b46b-8534-46d0-a175-a3d350ff4abc)

## Quick Start

Want to try it immediately? Follow these minimal steps:

1. **Clone and install**:

   ```bash
   git clone <repo-url>
   cd deep-travel-agent
   npm install
   ```

2. **Set up environment**:

   ```bash
   cp .env.example .env
   # Add your GOOGLE_API_KEY (get free key from Google AI Studio)
   # Other APIs optional for testing
   ```

3. **Start the application**:

   ```bash
   npm run dev
   ```

4. **Open and test**: Visit http://localhost:3000 and ask for a travel plan!

> **Note**: The app works with just a Google API key. Other services enhance functionality but aren't required for basic testing.

## Project Foundation

This application is built upon LangChain's prebuilt agent chat UI foundation, created using:

```bash
npx create-agent-chat-app@latest
```

The foundation provides a solid base for agent-UI interactions, which was then extended with custom travel planning capabilities. See the [LangGraph.js Full-Stack Quickstart](https://langchain-ai.github.io/langgraphjs/#full-stack-quickstart) for more details on the underlying architecture.

## Architecture Overview

![Architecture](./public/architecture.png)

## Key Architectural Decisions

### 1. Single Agent vs Multi-Agent Architecture

**Decision**: Single orchestrator agent with specialized tools  
**Rationale**: Tool orchestration, not agent orchestration

- **Tools**: Search flights, hotels, activities (simple functions)
- **Agent**: Decision maker that calls tools
- Creating separate agents for each tool would be like hiring 3 managers to each press one button - unnecessary abstraction
- Simpler coordination, reduced complexity, better performance

### 2. State Management Strategy

**Decision**: File-based persistence with in-memory caching  
**Implementation**:

- Itinerary state persisted to JSON files in `/itinerary/` directory
- In-memory Map for fast access during conversation
- Session-based state management with unique trip IDs

### 3. Memory and Autonomy

**Decision**: MemorySaver checkpoint system with recursion limit of 700  
**Benefits**:

- Conversation continuity across interactions
- Agent autonomy for complex multi-step planning
- User can continue if recursion limit reached
- Prevents infinite loops while allowing deep reasoning

### 4. Tool Orchestration Design

**Decision**: Centralized tool coordination through single agent  
**Tool Categories**:

- **Flight Tools**: Search, filter, and book flights via Duffel Test API
- **Hotel Tools**: Search and filter accommodations via SerpAPI
- **Activity Tools**: Find attractions, restaurants, tours with weather integration
- **Itinerary Tools**: Manage trip state, preferences, and budget tracking
- **Search Tools**: General web search via Tavily for contextual information

### 5. Hotel Location Optimization Strategy

**Decision**: Search activities first to understand geographic clusters → Select centrally located hotel  
**Rationale**: Strategic hotel placement for optimal travel efficiency

- **Approach**: Analyze activity distribution before hotel selection
- **Benefits**: Minimized transportation costs, reduced travel time, cohesive daily itineraries
- **Implementation**: Activity-first planning sequence with geographic clustering analysis
- **Multi-day optimization**: Consider multiple hotels for geographically dispersed itineraries

## Project Structure

```
deep-travel-agent/
├── apps/
│   ├── agents/              # LangGraph AI agents
│   │   └── src/
│   │       ├── react-agent/ # Main travel coordinator agent
│   │       │   ├── graph.ts         # Agent workflow graph
│   │       │   ├── tools.ts         # Tool orchestration
│   │       │   ├── prompts.ts       # System prompts
│   │       │   ├── configuration.ts # Agent config
│   │       │   └── tests/           # Unit & integration tests
│   │       └── tools/       # Specialized travel tools
│   │           ├── flight/      # Duffel API integration
│   │           ├── hotel/       # SerpAPI hotel search
│   │           ├── activities/  # SerpAPI activities + weather
│   │           ├── itinerary/   # State management tools
│   │           └── index.ts     # Tool exports & search tools
│   └── web/                 # Next.js frontend (LangChain base)
│       └── src/
│           ├── components/      # UI components
│           │   ├── thread/         # Chat interface
│           │   └── ui/             # Reusable components
│           ├── providers/       # React context providers
│           └── hooks/           # Custom React hooks
├── langgraph.json          # LangGraph configuration
├── turbo.json             # Turbo monorepo config
└── .env.example           # Environment template
```

## Technology Stack

### Agents Application

- **LangGraph**: Agent orchestration framework
- **LangChain**: LLM integration and tooling
- **Google Gemini**: AI model integration (gemini-2.0-flash-exp)
- **TypeScript**: Type safety and development experience
- **Zod**: Schema validation for tool inputs/outputs

### External APIs

- **Duffel API**: Flight search and booking
- **SerpAPI**: Hotel and activity search
- **Weather API**: Weather-based activity recommendations
- **Tavily**: Web search for contextual information

### Web Application (LangChain Base)

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React features
- **Tailwind CSS**: Styling framework
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Animation library

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm 9+

### API Key Setup

This application requires API keys from several external services. Follow the step-by-step guides below to obtain all necessary keys.

#### Required API Keys

##### 1. Google Gemini API (GOOGLE_API_KEY)

**Purpose**: Powers the AI agent for intelligent travel planning (uses Gemini 2.0 Flash model)

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add to `.env`: `GOOGLE_API_KEY=your-api-key-here`

> **Note**: This is the only required API key to start testing the application. Other APIs enhance functionality but the agent will work with web search fallbacks.

##### 2. Tavily API (TAVILY_API_KEY)

**Purpose**: Web search functionality for destination research
**Cost**: Free tier (1,000 searches/month), then $50/month

1. Visit [Tavily](https://www.tavily.com/)
2. Click "Sign Up" and create an account
3. Navigate to your dashboard
4. Find your API key in the "API Keys" section
5. Add to `.env`: `TAVILY_API_KEY=your-api-key-here`

##### 3. SerpAPI (SERPAPI_API_KEY)

**Purpose**: Hotel and activity search functionality
**Cost**: Free tier (100 searches/month), then $50/month for 5,000 searches

1. Visit [SerpAPI](https://serpapi.com/)
2. Click "Register" and create an account
3. Go to your [dashboard](https://serpapi.com/dashboard)
4. Find your "Secret API Key"
5. Add to `.env`: `SERPAPI_API_KEY=your-api-key-here`

##### 4. Duffel API (DUFFEL_API_KEY)

**Purpose**: Flight search (no actual booking - search only)
**Cost**: Free for search operations

**Option A: Test Mode (Recommended First)**

1. Visit [Duffel's registration page](https://app.duffel.com/join)
2. Create account (use "Personal Use" for Company Name)
3. Navigate to More > Developer in the dashboard
4. Use the provided test API key (starts with `duffel_test`)
5. Add to `.env`: `DUFFEL_API_KEY=duffel_test_...`

**Option B: Live Mode**
For live flight data, account verification and payment setup required:

1. Complete account verification process
2. Add payment information (no charges for search operations)
3. Generate live API key from developer section
4. Add to `.env`: `DUFFEL_API_KEY=duffel_live_...`

#### Optional API Keys

##### LangSmith (for debugging and monitoring)

```bash
LANGCHAIN_API_KEY=your-langsmith-key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=deep-travel-agent
```

#### Environment Setup

1. **Copy the environment template**:

   ```bash
   cp .env.example .env
   ```

2. **Add your API keys** to the `.env` file:

   ```bash
   # Required API Keys
   GOOGLE_API_KEY=your-google-api-key
   TAVILY_API_KEY=your-tavily-api-key
   SERPAPI_API_KEY=your-serpapi-api-key
   DUFFEL_API_KEY=your-duffel-api-key

   # Frontend Configuration
   NEXT_PUBLIC_API_URL="http://localhost:2024"
   NEXT_PUBLIC_ASSISTANT_ID="agent"

   # Production Configuration (optional)
   LANGGRAPH_BASE_URL="http://localhost:2024"

   # Optional: LangSmith tracing
   LANGCHAIN_API_KEY=your-langsmith-key
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_PROJECT=deep-travel-agent
   ```

> **Environment Variables Explained:**
>
> - `NEXT_PUBLIC_API_URL`: Frontend connection to LangGraph server (default: `http://localhost:2024`)
> - `NEXT_PUBLIC_ASSISTANT_ID`: Agent identifier for routing messages (use "agent" for this project)
> - `LANGGRAPH_BASE_URL`: Production proxy configuration for Next.js rewrites
>
> For production deployments, update `NEXT_PUBLIC_API_URL` to your deployed server address and ensure `LANGGRAPH_BASE_URL` points to your LangGraph server.

#### Security Notes

- **Never commit API keys**: The `.env` file is in `.gitignore`
- **Use test keys first**: Start with Duffel test mode to verify functionality
- **Monitor usage**: Check your API dashboards regularly for usage limits
- **Rotate keys**: Regenerate keys if you suspect they've been compromised

### Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development servers**:

   ```bash
   npm run dev
   ```

   This starts both agents (port 2024) and web (port 3000) concurrently.

3. **Access the application**:
   - Web UI: http://localhost:3000
   - LangGraph API: http://localhost:2024
   - API Health Check: http://localhost:2024/info

4. **Verify setup**:
   - Check API connectivity at http://localhost:2024/info
   - Test agent response by asking for a simple travel plan
   - Monitor console for any API key errors

#### Testing

**Agents Application Tests**:

```bash
cd apps/agents
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
```

**Manual Testing Checklist**:

- [ ] Agent responds to basic queries
- [ ] Flight search works (if Duffel API configured)
- [ ] Hotel search works (if SerpAPI configured)
- [ ] Activity recommendations work
- [ ] Itinerary persistence works
- [ ] Error handling for missing APIs works

### Available Commands

#### Root Level

- `npm run dev` - Start both apps concurrently
- `npm run build` - Build all applications
- `npm run lint` - Run linting across workspaces
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code across workspaces

#### Agents App (`apps/agents`)

- `npm run dev` - Start LangGraph dev server (port 2024)
- `npm run start` - Start LangGraph production server (port 2024)
- `npm run build` - Clean and compile TypeScript
- `npm run lint` - Run ESLint on source

#### Web App (`apps/web`)

- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js application
- `npm run start` - Start production server

## Production Deployment (Railway)

### Deployment Challenges

This application faces challenges when deploying to platforms like Railway due to its monorepo structure with separate workspaces:

- **Web app** runs on port 3000 (Next.js frontend)
- **Agents app** runs on port 2024 (LangGraph API server)

### Key Issues & Solutions

#### 1. Cross-Origin Browser Requests

**Problem**: In production, the browser cannot directly call `http://localhost:2024` because:

- `localhost` refers to the user's machine, not the server
- Creates CORS and mixed-content security issues with HTTPS

**Solution**: Implemented reverse proxy using Next.js rewrites in `apps/web/next.config.mjs`:

```javascript
const LANGGRAPH_BASE_URL =
  process.env.LANGGRAPH_BASE_URL || "http://localhost:2024";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/langgraph/:path*",
        destination: `${LANGGRAPH_BASE_URL}/:path*`,
      },
    ];
  },
};
```

#### 2. URL Construction Errors

- URL normalization in `apps/web/src/providers/Stream.tsx`:
- Converts relative URLs to absolute URLs at runtime
- Maintains compatibility with both local development and production

### Railway Deployment Steps

1. **Environment Configuration**:

   ```bash
   # Set in Railway dashboard - Required API Keys
   GOOGLE_API_KEY=your-api-key
   TAVILY_API_KEY=your-api-key
   SERPAPI_API_KEY=your-api-key
   DUFFEL_API_KEY=your-api-key

   # Production Configuration
   LANGGRAPH_BASE_URL=http://localhost:2024  # Internal container communication
   NEXT_PUBLIC_API_URL=/langgraph             # Use relative URL for production
   NEXT_PUBLIC_ASSISTANT_ID=agent

   # Optional: Monitoring
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=your-langsmith-key
   LANGCHAIN_PROJECT=deep-travel-agent-prod
   ```

2. **Deploy Configuration**:
   - Create two services: one for web app, one for agents app
   - Ensure both services can communicate internally
   - Web app should proxy requests to agents service via Next.js rewrites

3. **Service Communication**:
   - Frontend uses same-origin requests to `/langgraph/`
   - Next.js server forwards requests to LangGraph API internally via `LANGGRAPH_BASE_URL`
   - No CORS issues or mixed-content problems

### Troubleshooting

**Health Check**: Test API connectivity at `https://deep-travel-agent-production.up.railway.app/langgraph/info`

**Common Issues**:

- **"Invalid URL" errors**: Ensure URL normalization is working
- **404 on /langgraph/**: Check `LANGGRAPH_BASE_URL` environment variable
- **Connection refused**: Verify agents app is bound to correct interface (`0.0.0.0:2024`)

**Development vs Production**:

- **Local**: Direct connection to `http://localhost:2024`
- **Production**: Proxied through `/langgraph/` endpoint

This architecture ensures seamless deployment while maintaining the benefits of the monorepo structure and avoiding common multi-service deployment pitfalls.

## Key Features

### Intelligent Trip Planning

- **End-to-end orchestration**: From initial request to finalized itinerary
- **Multi-modal search**: Flights, hotels, activities, restaurants
- **Weather integration**: Activity recommendations based on conditions
- **Budget tracking**: Real-time cost calculation and per-person breakdown

### State Management

- **Persistent itineraries**: JSON file storage with in-memory caching
- **Session continuity**: Conversation memory across interactions
- **Incremental updates**: Add, modify, or remove trip components
- **Validation**: Schema-validated state transitions

### Tool Coordination

- **Autonomous planning**: Agent runs to completion with 300 recursion limit
- **Error recovery**: Graceful handling of API failures with fallbacks
- **Structured outputs**: JSON responses for programmatic integration
- **User preferences**: Dietary restrictions, accessibility, budget constraints

## Prompt Engineering & Agent Direction

### Agent Philosophy

The travel agent is designed as an **autonomous travel expert** that eliminates decision fatigue by making confident, well-reasoned choices based on user preferences.

### Core Behavioral Principles

#### 1. Intelligent Information Extraction

- **Smart Questioning**: Analyzes user input to avoid redundant questions
- **Acknowledgment First**: Recognizes information already provided before asking for missing details
- **Contextual Adaptation**: Adjusts conversation flow based on what's known vs. unknown

#### 2. Comprehensive Preference Discovery

- **Mandatory Collection**: Captures both logistics (dates, budget) and preferences (style, interests) upfront
- **Structured Storage**: Uses notes field format: `"TRAVEL_STYLE: [style] | INTERESTS: [list] | COMFORT: [tiers] | SPECIAL: [considerations]"`
- **Decision Integration**: References stored preferences throughout autonomous planning process

#### 3. Autonomous Execution Pattern

- **SEARCH → ANALYZE → SELECT → PERSIST → CONTINUE**: Never breaks this workflow chain
- **No Confirmation Loops**: Makes expert decisions without asking "Should I add this?"
- **Complete Delivery**: Runs to completion, delivering ready-to-book itineraries

#### 4. Tool Orchestration Strategy

- **State Persistence**: Uses itinerary tools to maintain planning state across steps
- **Validation Checkpoints**: Regular `get_itinerary` calls to verify completeness
- **Budget Awareness**: Continuous cost tracking and preference-based allocation

### Prompt Engineering Techniques

#### Strategic Question Design

- **Crisp Format**: Simple, numbered questions matching user expectations
- **Preference Integration**: Embeds travel style and interest capture in basic logistics flow
- **Conditional Logic**: Only asks for missing information, acknowledges known details

#### Autonomous Decision Making

- **Preference-Driven Selections**: Flight/hotel/activity choices based on stored user preferences
- **Geographic Optimization**: Activity-first planning for strategic hotel placement
- **Error Recovery**: Automatic retry logic for API failures and schema corrections

#### Enforcement Mechanisms

- **Mandatory Checkpoints**: Prevents planning without complete preferences
- **Structured Validation**: Explicit preference confirmation before itinerary creation
- **Workflow Guards**: Conditional logic preventing workflow shortcuts

### Customization Guidelines

When modifying the agent's behavior:

1. **Preserve Autonomy**: Maintain the no-confirmation execution pattern
2. **Enhance Intelligence**: Improve information extraction and contextual awareness
3. **Strengthen Enforcement**: Add validation checkpoints for critical requirements
4. **Maintain Structure**: Keep preference storage format for decision integration
5. **Test End-to-End**: Verify complete planning workflows work as intended

The agent's effectiveness comes from balancing comprehensive preference capture with autonomous execution, creating personalized travel plans without overwhelming users with decisions.

## Troubleshooting

### Common Setup Issues

#### "Connection refused" or "Cannot connect to localhost:2024"

**Symptoms**: Frontend shows connection errors, API calls fail
**Solutions**:

1. Ensure agents server is running: `npm run dev` or check if port 2024 is occupied
2. Verify `NEXT_PUBLIC_API_URL` in `.env` matches the agents server URL
3. Check LangGraph server logs for startup errors

#### "Invalid API key" or "Authentication failed"

**Symptoms**: Agent responses with API errors, specific service failures
**Solutions**:

1. Verify API keys are correctly set in `.env` file
2. Test individual API keys:
   - Google: Visit https://aistudio.google.com/ to verify key works
   - Tavily: Check dashboard at https://app.tavily.com/
   - SerpAPI: Test at https://serpapi.com/dashboard
3. Ensure `.env` file is in the root directory, not in `apps/` subdirectories

#### "Agent not found" or routing errors

**Symptoms**: Messages not reaching the agent, empty responses
**Solutions**:

1. Verify `NEXT_PUBLIC_ASSISTANT_ID="agent"` matches `langgraph.json` configuration
2. Check LangGraph server is exposing the correct agent endpoint
3. Test agent directly: `curl http://localhost:2024/info`

#### Build or dependency errors

**Symptoms**: `npm install` or `npm run dev` fails
**Solutions**:

1. Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
2. Ensure Node.js version 18+ is installed
3. Check for conflicting global packages: `npm ls -g --depth=0`

### Development Tips

#### LangSmith Debugging

Enable detailed tracing for debugging:

```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-key
LANGCHAIN_PROJECT=deep-travel-agent
```

#### API Rate Limits

- **Google Gemini**: 15 requests/minute on free tier
- **Tavily**: 1,000 searches/month on free tier
- **SerpAPI**: 100 searches/month on free tier

#### Performance Optimization

- Use test/mock APIs during development to avoid rate limits
- Enable LangSmith to monitor token usage and response times
- Consider caching strategies for repeated API calls

### Getting Help

1. **Check logs**: Monitor both web and agents console output
2. **Test APIs individually**: Verify each service works independently
3. **Use health checks**: Test endpoints directly with curl or browser
4. **Enable debugging**: Use LangSmith for detailed execution traces

## Extension Points

### Adding New Tools

1. Create tool implementation in `apps/agents/src/tools/[category]/`
2. Define Zod schemas for input validation
3. Export tools array from `tools.ts`
4. Import and include in main `TOOLS` array

### Customizing the Agent

- **Prompts**: Modify `apps/agents/src/react-agent/prompts.ts`
- **Models**: Update configuration in `apps/agents/src/react-agent/configuration.ts`
- **Behavior**: Adjust graph logic in `apps/agents/src/react-agent/graph.ts`

### UI Customization

The web application is built on LangChain's prebuilt foundation but can be customized:

- **Components**: Extend base components in `apps/web/src/components/`
- **Styling**: Modify Tailwind configuration
- **Features**: Add travel-specific UI elements

## Contributing

1. Follow the existing code structure and patterns
2. Add tests for new tools and functionality
3. Update documentation for architectural changes
4. Ensure TypeScript types are properly defined
5. Test end-to-end workflows before submitting

## License

Apache 2.0 License

---

Built using [LangGraph.js](https://langchain-ai.github.io/langgraphjs/).
