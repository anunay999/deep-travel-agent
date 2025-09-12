# Deep Travel Agent

An intelligent travel planning companion built with LangGraph and Next.js that orchestrates end-to-end trip planning through a single AI agent coordinating specialized tools.

# Demo

[Demo](https://www.loom.com/share/f995f849e58a412792208549fce475d1?sid=1b85b46b-8534-46d0-a175-a3d350ff4abc)

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

**Decision**: MemorySaver checkpoint system with recursion limit of 300  
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
│   │       └── tools/       # Specialized travel tools
│   │           ├── flight/      # Duffel API integration
│   │           ├── hotel/       # SerpAPI hotel search
│   │           ├── activities/  # SerpAPI activities + weather
│   │           └── itinerary/   # State management tools
│   └── web/                 # Next.js frontend (LangChain base)
├── langgraph.json          # LangGraph configuration
└── turbo.json             # Turbo monorepo config
```

## Technology Stack

### Agents Application

- **LangGraph**: Agent orchestration framework
- **LangChain**: LLM integration and tooling
- **Anthropic**: Claude model integration
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

**Purpose**: Powers the AI agent for intelligent travel planning
**Cost**: Free tier with generous limits

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add to `.env`: `GOOGLE_API_KEY=your-api-key-here`

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
   OPENWEATHER_API_KEY=your-openweather-api-key

   # Optional: LangSmith tracing
   LANGCHAIN_API_KEY=your-langsmith-key
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_PROJECT=deep-travel-agent
   ```

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

### Available Commands

#### Root Level

- `npm run dev` - Start both apps concurrently
- `npm run build` - Build all applications
- `npm run lint` - Run linting across workspaces
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code across workspaces

#### Agents App (`apps/agents`)

- `npm run dev` - Start LangGraph dev server (port 2024)
- `npm run build` - Clean and compile TypeScript
- `npm run lint` - Run ESLint on source

#### Web App (`apps/web`)

- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js application
- `npm run start` - Start production server

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
