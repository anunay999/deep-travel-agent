FROM langchain/langgraphjs-api:20
ADD . /deps/deep-travel-agent
ENV LANGSERVE_GRAPHS='{"agent":"./apps/agents/src/react-agent/graph.ts:graph"}'
WORKDIR /deps/deep-travel-agent
RUN npm ci
RUN (test ! -f /api/langgraph_api/js/build.mts && echo "Prebuild script not found, skipping") || tsx /api/langgraph_api/js/build.mts