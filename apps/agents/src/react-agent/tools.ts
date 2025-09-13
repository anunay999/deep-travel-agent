/**
 * This file defines the tools available to the ReAct agent.
 * Tools are functions that the agent can use to interact with external systems or perform specific tasks.
 */

import { TavilySearch } from "@langchain/tavily";
import { FLIGHT_TOOLS } from "../tools/flight/tools.js";
import { HOTEL_TOOLS } from "../tools/hotel/tools.js";
import { ACTIVITY_TOOLS } from "../tools/activities/tools.js";
import { ITINERARY_TOOLS } from "../tools/itinerary/tools.js";

/**
 * Tavily search tool configuration
 * This tool allows the agent to perform web searches using the Tavily API.
 */
const tavilyApiKey = process.env.TAVILY_API_KEY;

const searchTavily = new TavilySearch({
  maxResults: 3,
  tavilyApiKey,
});

/**
 * Export an array of all available tools
 * Add new tools to this array to make them available to the agent
 *
 * Note: You can create custom tools by implementing the Tool interface from @langchain/core/tools
 * and add them to this array.
 * See https://js.langchain.com/docs/how_to/custom_tools/#tool-function for more information.
 */
export const TOOLS = [
  searchTavily,
  ...FLIGHT_TOOLS,
  ...HOTEL_TOOLS,
  ...ACTIVITY_TOOLS,
  ...ITINERARY_TOOLS,
];
