import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ProactivaApiClient } from "./client.js";
import { readConfigFromEnv, type ProactivaMcpConfig } from "./config.js";
import { createToolDefinitions } from "./tools.js";

export function createProactivaMcpServer(config: ProactivaMcpConfig = readConfigFromEnv()) {
  const server = new McpServer({
    name: "proactiva",
    version: "0.1.0",
  });

  const client = new ProactivaApiClient(config);
  const tools = createToolDefinitions(client);
  for (const tool of tools) {
    server.tool(tool.name, tool.description, tool.schema.shape, tool.execute);
  }

  return {
    server,
    tools,
    client,
  };
}

export async function runServer(config: ProactivaMcpConfig = readConfigFromEnv()) {
  const { server } = createProactivaMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
