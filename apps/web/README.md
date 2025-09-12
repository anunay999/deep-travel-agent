# Travel Planning Web Interface

A Next.js 15 web application built on LangChain's prebuilt agent chat UI foundation, providing an intelligent interface for travel planning through LangGraph agents.

## Foundation & Customizations

### LangChain Prebuilt Base
This web application is built upon LangChain's agent chat UI template (`npx create-agent-chat-app@latest`), which provides:

- **Stream-enabled chat interface**: Real-time agent response streaming
- **Thread management**: Conversation history and state persistence  
- **LangGraph integration**: Seamless connection to agent servers
- **Modern React patterns**: Hooks, providers, and component architecture

### Travel-Specific Customizations
The base template was extended with travel planning features:

- **Travel-focused UI components**: Trip planning interface elements
- **Specialized chat patterns**: Handling structured itinerary data
- **Visual enhancements**: Travel-themed styling and icons
- **Integration patterns**: Connecting to travel agent workflows

## Architecture

### Component Structure
```
apps/web/src/
├── components/
│   ├── thread/           # Chat interface components (LangChain base)
│   │   ├── Thread.tsx        # Main chat thread component
│   │   ├── Messages.tsx      # Message rendering and display
│   │   └── Input.tsx         # Message input with streaming support
│   └── ui/               # Reusable UI components (Radix-based)
│       ├── Button.tsx        # Consistent button styling
│       ├── Input.tsx         # Form input components
│       └── Card.tsx          # Content container components
├── providers/            # React context providers (LangChain base)
│   ├── Stream.tsx            # Streaming state management
│   └── Thread.tsx            # Thread/conversation state
├── hooks/               # Custom React hooks
│   └── useThread.ts          # Thread state and actions
└── app/                 # Next.js 15 App Router
    ├── layout.tsx            # Root layout with providers
    ├── page.tsx              # Main chat interface
    └── globals.css           # Tailwind CSS imports
```

### State Management

#### Stream Provider (`src/providers/Stream.tsx`)
Manages real-time streaming from LangGraph agents:
- **Message streaming**: Handles token-by-token responses
- **Connection state**: WebSocket/SSE connection management
- **Error handling**: Graceful degradation on connection issues
- **Performance**: Optimized rendering for streaming content

#### Thread Provider (`src/providers/Thread.tsx`) 
Manages conversation state and history:
- **Thread lifecycle**: Create, resume, and manage conversations
- **Message history**: Persistent conversation storage
- **User context**: Travel preferences and session data
- **Integration**: Connects to LangGraph thread management

### Integration with LangGraph

#### Agent Connection
The web app connects to the LangGraph server running on port 2024:

```typescript
// Agent server configuration
const LANGGRAPH_API_URL = "http://localhost:2024"
const ASSISTANT_ID = "agent" // Configured in langgraph.json
```

#### Message Flow
1. **User Input**: Captured via chat interface
2. **Stream Request**: Sent to LangGraph `/threads/{thread_id}/runs` endpoint  
3. **Agent Processing**: Travel Coordinator agent processes request
4. **Tool Calls**: Agent invokes flight/hotel/activity tools
5. **Response Stream**: Structured responses streamed back to UI
6. **State Update**: Thread state updated with agent responses

## Key Features

### Chat Interface (LangChain Foundation)
- **Real-time streaming**: Live agent responses with typing indicators
- **Message history**: Persistent conversation threads
- **Input validation**: Type-safe message handling
- **Responsive design**: Mobile-optimized chat experience

### Travel Planning Extensions  
- **Structured data display**: Renders itinerary JSON as formatted content
- **Travel context preservation**: Maintains trip preferences across messages
- **Multi-modal responses**: Handles text, tables, and structured travel data
- **Error recovery**: Graceful handling of agent timeouts and failures

## Development

### Prerequisites
- Node.js 18+
- npm 9+
- Running LangGraph server on port 2024

### Environment Variables
Create `.env.local` in the web app directory:

```bash
# LangGraph Server Configuration
NEXT_PUBLIC_LANGGRAPH_API_URL=http://localhost:2024
NEXT_PUBLIC_ASSISTANT_ID=agent

# Optional: Analytics and monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production  
npm run build

# Start production server
npm run start

# Linting and formatting
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

### Development Server
```bash
npm run dev
```
- Starts Next.js development server on http://localhost:3000
- Hot reload enabled for rapid development
- Connects to LangGraph server on port 2024

## Deployment

### Production Build
```bash
npm run build
```
Generates optimized production build in `.next/` directory.

### Environment Configuration
Configure production environment variables:

```bash
# Production LangGraph server
NEXT_PUBLIC_LANGGRAPH_API_URL=https://your-langgraph-server.com
NEXT_PUBLIC_ASSISTANT_ID=travel-agent

# Performance monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=analytics-id
```

### Deployment Options
- **Vercel**: Zero-config deployment for Next.js
- **Docker**: Container deployment with included Dockerfile
- **Static Export**: Generate static files for CDN hosting
- **Self-hosted**: Node.js server deployment

## Customization

### Extending the Base Template

#### Adding Travel-Specific Components
```typescript
// Example: Trip summary component
export function TripSummary({ itinerary }: { itinerary: any }) {
  return (
    <Card className="border-travel-blue">
      <CardHeader>
        <CardTitle>Trip Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Custom travel data rendering */}
      </CardContent>
    </Card>
  );
}
```

#### Custom Message Rendering
```typescript
// Extend base message component for travel data
export function TravelMessage({ message }: { message: Message }) {
  if (message.type === 'itinerary') {
    return <TripSummary itinerary={message.content} />;
  }
  
  // Fall back to base rendering
  return <BaseMessage message={message} />;
}
```

### Styling Customization

#### Tailwind Configuration
The app uses Tailwind CSS with travel-specific theming:

```javascript
// tailwind.config.js extensions
module.exports = {
  theme: {
    extend: {
      colors: {
        'travel-blue': '#1e40af',
        'travel-gold': '#f59e0b',
      }
    }
  }
}
```

#### Component Styling
Built on Radix UI primitives with consistent design tokens:
- **Colors**: Travel-themed color palette
- **Typography**: Optimized for chat and data display  
- **Spacing**: Consistent margins and padding
- **Responsive**: Mobile-first responsive design

## Performance Considerations

### Optimization Features
- **Next.js 15**: Latest performance optimizations
- **React 19**: Concurrent features and streaming SSR
- **Bundle splitting**: Automatic code splitting
- **Image optimization**: Next.js image component
- **Caching**: Aggressive caching for static assets

### Streaming Performance
- **Chunk rendering**: Efficient streaming message display
- **Memory management**: Cleanup of old conversation data
- **Connection pooling**: Optimized WebSocket connections
- **Error boundaries**: Isolated error handling

## Integration Points

### LangGraph Communication
- **REST API**: HTTP endpoints for thread management
- **WebSocket/SSE**: Real-time streaming connections
- **Error handling**: Retry logic and fallbacks
- **Authentication**: Token-based agent access (if configured)

### State Synchronization
- **Thread persistence**: Conversation history storage
- **Cross-tab sync**: SharedWorker for multi-tab coordination
- **Offline handling**: Graceful offline behavior
- **Recovery**: Automatic reconnection and state recovery

## Troubleshooting

### Common Issues

#### Connection Problems
- **Agent server not running**: Ensure LangGraph server is active on port 2024
- **CORS errors**: Configure proper CORS headers in agent server
- **Network timeouts**: Check firewall and network connectivity

#### Performance Issues
- **Slow streaming**: Verify WebSocket connection stability
- **Memory leaks**: Monitor React DevTools for component cleanup
- **Bundle size**: Use webpack-bundle-analyzer to identify large dependencies

#### Development Issues
- **Hot reload**: Clear Next.js cache with `rm -rf .next`
- **Type errors**: Ensure LangGraph types are properly installed
- **Environment variables**: Verify `.env.local` configuration

---

Built on the solid foundation of LangChain's agent chat UI with travel-specific enhancements for intelligent trip planning.