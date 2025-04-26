import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from 'zod';
import wikiClient from '../wikijs/client';

export class MCPWikiJSServer {
  private server: McpServer;
  private transport: StdioServerTransport;
  
  constructor() {
    // Initialize the MCP server
    this.server = new McpServer({
      name: "mcp-wikijs",
      version: "0.1.0"
    });
    
    // Set up STDIO transport
    this.transport = new StdioServerTransport();
   
    // Initialize tools
    this.registerTools();
  }
  
  // Register all tools
  private registerTools() {
    // Search tool
    this.server.tool(
      "search", 
      "Search for wiki pages by query. The query is only for the title and description and content the page. Not for the path.",
      {
        query: z.string().describe("The search query"),
      },
      async (args: { query: string }) => {
        const { query } = args;
        try {
          const results = await wikiClient.searchPages(query);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  results: results.pages.map(page => ({
                    id: page.id,
                    path: page.path,
                    title: page.title,
                    description: page.description || ''
                  })),
                  totalCount: results.totalCount
                })
              }
            ]
          };
        } catch (error) {
          console.error('Search error:', error);
          throw new Error('Failed to search wiki pages');
        }
      }
    );

    // Read tool
    this.server.tool(
      "read", 
      "Read a wiki page by ID or path",
      {
        id: z.number().optional().describe("The ID of the page to read"),
        path: z.string().optional().describe("The path of the page to read")
      },
      async (args: { id?: number; path?: string }) => {
        const { id, path } = args;
        try {
          const page = id
            ? await wikiClient.getPage(id)
            : await wikiClient.getPage(path||"");
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  id: page.id,
                  path: page.path,
                  title: page.title,
                  description: page.description || '',
                  createdAt: page.createdAt,
                  updatedAt: page.updatedAt
                })
              },
              {
                type: "text",
                text: page.content
              }
            ]
          };
        } catch (error) {
          console.error('Read error:', error);
          throw new Error('Failed to read wiki page');
        }
      }
    );

    // Create tool
    this.server.tool(
      "create", 
      "Create a new wiki page",
      {
        path: z.string().describe("The path of the new page"),
        title: z.string().describe("The title of the new page"),
        content: z.string().describe("The content of the new page in Markdown format"),
        description: z.string().optional().describe("Optional description of the page")
      },
      async (args: { path: string; title: string; content: string; description?: string }) => {
        const { path, title, content, description = '' } = args;
        try {
          const page = await wikiClient.createPage({
            path,
            title,
            content,
            description
          });
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  id: page.id,
                  path: page.path,
                  title: page.title,
                  success: true
                })
              }
            ]
          };
        } catch (error) {
          console.error('Create error:', error);
          throw new Error('Failed to create wiki page');
        }
      }
    );

    // Update tool
    this.server.tool(
      "update", 
      "Update an existing wiki page",
      {
        id: z.string().describe("The ID of the page to update"),
        content: z.string().optional().describe("New content for the page in Markdown format"),
        title: z.string().optional().describe("New title for the page"),
        description: z.string().optional().describe("New description for the page")
      },
      async (args: { id: string; content?: string; title?: string; description?: string }) => {
        const { id, content, title, description } = args;
        try {
          const page = await wikiClient.updatePage({
            id,
            content,
            title,
            description
          });
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({  
                  id: page.id,
                  path: page.path,
                  title: page.title,
                  success: true
                })
              }
            ]
          };
        } catch (error) {
          console.error('Update error:', error);
          throw new Error('Failed to update wiki page');
        }
      }
    );

    // Delete tool
    this.server.tool(
      "delete", 
      "Delete a wiki page by ID",
      {
        id: z.string().describe("The ID of the page to delete")
      },
      async (args: { id: string }) => {
        const { id } = args;
        try {
          const success = await wikiClient.deletePage(id);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  id,
                  success
                })
              }
            ]
          };
        } catch (error) {
          console.error('Delete error:', error);
          throw new Error('Failed to delete wiki page');
        }
      }
    );
  }
  
  // Start the server
  async start(): Promise<void> {
    try {
      // Connect server to stdio transport
      await this.server.connect(this.transport);
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      throw error;
    }
  }
  
  // Stop the server - for cleanup
  async stop(): Promise<void> {
    // No explicit disconnect needed for stdio
    return Promise.resolve();
  }
}

// Create a singleton instance
export default new MCPWikiJSServer();