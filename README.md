# MCP WikiJS

An MCP (Model Context Protocol) server for [WikiJS](https://js.wiki/) that allows AI models to interact with wiki content.

## Features

- Full implementation of the [Model Context Protocol](https://modelcontextprotocol.io/llms-full.txt) server specification
- Built with TypeScript for type safety and modern JavaScript features
- Simple to use - can be started with a single npx command
- Provides AI models with access to WikiJS content through MCP tools:
  - Search documents
  - Read document content
  - Create new documents
  - Update existing documents
  - Delete documents
- Docker-ready for easy development setup

## Installation

```bash
# Install as a dependency
npm install mcp-wikijs

# Or run directly with npx
npx mcp-wikijs
```

## Quick Start

1. Set up environment variables in a `.env` file:

```
WIKIJS_URL=http://your-wikijs-url
WIKIJS_TOKEN=your-api-token
MCP_PORT=8080
```

2. Start the MCP server:

```bash
npx mcp-wikijs
```

3. Connect from your MCP-compatible client:

```javascript
const mcpClient = new MCPClient('http://localhost:8080');
await mcpClient.init();

// Search for documents
const results = await mcpClient.callTool('search', {
  query: 'project documentation',
  limit: 5
});
```

## Docker Development Environment

For development purposes, this project includes a Docker Compose setup that starts:
- A PostgreSQL database
- A WikiJS instance
- The MCP-WikiJS server with hot-reload

To start the development environment:

```bash
docker-compose up
```

For detailed instructions, see the [Docker guide](./DOCKER.md).

## Available Tools

- **search** - Search for wiki pages by query
- **read** - Read a wiki page by ID or path
- **create** - Create a new wiki page
- **update** - Update an existing wiki page
- **delete** - Delete a wiki page by ID

## Examples

See the [examples directory](./examples) for detailed usage examples, including:
- Integrating with chat applications
- Document search and retrieval
- Content creation and management

## Configuration

### WikiJS Configuration

- `WIKIJS_URL`: URL of your WikiJS instance
- `WIKIJS_TOKEN`: API token for authentication with WikiJS

### MCP Server Configuration

- `MCP_PORT`: Port for the MCP server (default: 8080)
- `MCP_HOST`: Host for the MCP server (default: 0.0.0.0)
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

## Development

### Standard Development

```bash
# Clone the repository
git clone https://github.com/im-neko/mcp-wikijs.git
cd mcp-wikijs

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Test
npm test
```

### Docker Development

See the [Docker guide](./DOCKER.md) for instructions on setting up a complete development environment with Docker.

## Project Documentation

- [Architecture Document](./architecture.md) - Detailed design of the system
- [Implementation Plan](./implementation-plan.md) - Development phases and schedule
- [Docker Guide](./DOCKER.md) - Development with Docker

## Architecture

This project follows a modular architecture with clear separation of concerns:
- **Configuration management**: Environment variables and settings
- **WikiJS client**: Handles communication with WikiJS GraphQL API
- **MCP server**: Implements the Model Context Protocol
- **Tools**: Implements specific operations (search, read, update, etc.)

## License

MIT