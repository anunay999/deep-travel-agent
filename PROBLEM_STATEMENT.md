# Agentic Bot Flow for Travel Agent

## 🎯 Objective

Build a simplified conversation system that demonstrates **agentic bot flows**.  
The bot will act as a **travel agent** which can prepare an itinerary for the user.

The system should:

- Understand natural language requests.
- Plan and orchestrate multi-step tasks during conversation.
- Maintain conversation context & memory.
- Handle user clarifications/changes gracefully.

---

## 📌 Scope

### 1. Agent Flow

Support a **travel use case**:

- **Flights**: Search by city, date, stops.
- **Hotels**: Search by area, budget.
- **Activities**: Suggest 2–3 things to do.

Agent responsibilities:

- Decide between different queries & requirements.
- Combine results into one cohesive response.
- Reply in a **conversational** style.

### 2. Memory

- Remember user preferences (e.g., “max hotel budget ₹7000”, “vegetarian”).
- Update results if the user changes requirements mid-conversation.

### 3. Failure Handling

- Include error handling.
- Retry when possible, else provide fallback suggestions.
