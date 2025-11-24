import "https://deno.land/std@0.208.0/dotenv/load.ts";
import {
  AnthropicModelProvider,
  createZypherContext,
  ZypherAgent,
} from "@corespeed/zypher";
import { eachValueFrom } from "rxjs-for-await";


// Helper function to safely get environment variables
function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}


// Initialize the agent execution context
const zypherContext = await createZypherContext(Deno.cwd());

// Create the agent with your preferred LLM provider
const agent = new ZypherAgent(
  zypherContext,
  new AnthropicModelProvider({
    apiKey: getRequiredEnv("ANTHROPIC_API_KEY"),
  }),
);

// Register and connect to an MCP server to give the agent web crawling capabilities
await agent.mcp.registerServer({
  id: "firecrawl",
  type: "command",
  command: {
    command: "npx",
    args: ["-y", "firecrawl-mcp"],
    env: {
      FIRECRAWL_API_KEY: getRequiredEnv("FIRECRAWL_API_KEY"),
    },
  },
});

const mood = prompt("What is your today's mood?");

// Run a task - the agent will use web crawling to find current AI news
const event$ = agent.runTask(
  `List the good musics When I am ${mood}`,
  "claude-sonnet-4-20250514",
);

// Stream the results in real-time, but only log the last event when the stream completes
let lastEvent: unknown = undefined;
for await (const event of eachValueFrom(event$)) {
  try{lastEvent = event;}
  catch(e){console.log("Wait")}
  
}
if (lastEvent !== undefined && lastEvent !== null) {
  console.log(lastEvent.message.content[0].text);
}