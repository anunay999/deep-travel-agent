import { RunnableConfig } from "@langchain/core/runnables";
import { MessagesAnnotation } from "@langchain/langgraph";

import { ensureConfiguration } from "./configuration.js";
import { TOOLS } from "./tools.js";
import { loadChatModel } from "./utils.js";
import { MemorySaver } from "@langchain/langgraph";

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { BaseMessageLike } from "@langchain/core/messages";

const configuration = ensureConfiguration({});

const prompt = (
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig
): BaseMessageLike[] => {
  const configuration = ensureConfiguration(config);
  const systemMsg = configuration.systemPromptTemplate.replace(
    "{system_time}",
    new Date().toISOString(),
  );
  return [{ role: "system", content: systemMsg }, ...state.messages];
};

const llm = await loadChatModel(configuration.model);


const checkpointSaver = new MemorySaver();
const agent = createReactAgent({
  llm,
  tools: TOOLS,
  prompt,
  checkpointSaver,
  // Disable human-in-the-loop interruptions so the agent runs to completion
  interruptBefore: [],
  interruptAfter: [],
});

// Set a higher default recursion limit so complex runs don't stop prematurely
export const graph = agent.withConfig({ recursionLimit: 300 });
