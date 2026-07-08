# MCP-WikiJS Architecture Design

## Overall Structure

```
┌──────────────────┐    ┌─────────────────┐    ┌────────────────┐
│                  │    │                 │    │                │
│  LLM Application ├───►│  MCP-WikiJS    ├───►│    WikiJS      │
│                  │    │                 │    │                │
└──────────────────┘    └─────────────────┘    └────────────────┘
```

## Core Components

### 1. Configuration Management (`src/config`)
- Environment variable loading
- WikiJS connection settings (URL, authentication)
- MCP server configuration

### 2. WikiJS Client (`src/wikijs`)
- GraphQL client implementation
- Document operation features
  - Search
  - View
  - Create/Update
  - Delete

### 3. MCP Server & Tool Definitions (`src/mcp/server.ts`)
- Model Context Protocol server (stdio transport only)
- Tool definitions and handlers, registered inline:
  - `search` - Wiki document search
  - `read` - Document retrieval
  - `update` - Document update
  - `create` - Document creation
  - `delete` - Document deletion
- No MCP resources or prompts are implemented, only tools

### 4. Entry Point (`src/index.ts`)
- Server startup
- Signal handling

## Data Flow

1. LLM application sends MCP request
2. MCP-WikiJS parses the request
3. Converts to appropriate WikiJS operation
4. Calls WikiJS GraphQL API
5. Formats result as MCP response
6. Returns to LLM application

## Deployment

### Development Environment

#### Local Development
- Node.js runtime
- Environment variables via `.env` file
- Hot reload with ts-node

#### Docker Development Environment
- Docker Compose setup with:
  - PostgreSQL database container
  - WikiJS container with GraphQL API
  - MCP-WikiJS container with hot reload
- Isolated network for service communication
- Volume mounts for persistent data and code changes

### Production Environment
- Distributed as an npm package (scoped: `@im-neko/mcp-wikijs`)
- Executable via `npx -y @im-neko/mcp-wikijs`
- Configuration via environment variables
  - `WIKIJS_URL` - WikiJS URL
  - `WIKIJS_TOKEN` - API authentication token
  - `LOG_LEVEL` - logging level (default: info)
- Communicates with its client over stdio only; no network port is opened

## Docker Architecture

```
┌─────────────────────────────────────┐
│           Docker Network            │
│                                     │
│  ┌───────────┐  ┌───────────────┐   │
│  │           │  │               │   │
│  │ PostgreSQL│◄─┤    WikiJS     │   │
│  │           │  │               │   │
│  └───────────┘  └───────┬───────┘   │
│                         │           │
│                         ▼           │
│                 ┌───────────────┐   │
│                 │               │   │
│                 │  MCP-WikiJS   │   │
│                 │               │   │
│                 └───────────────┘   │
│                         ▲           │
└─────────────────────────┼───────────┘
                          │
                  ┌───────────────┐
                  │               │
                  │ LLM Client    │
                  │               │
                  └───────────────┘
```

## Security Considerations

- The WikiJS API token is passed as a bearer header and only ever read from `WIKIJS_TOKEN`; it must not appear in logs or in errors surfaced to the MCP client (`src/logging/logger.ts` enforces this by only ever logging/rethrowing `error.message`, never the raw error object)
- Tool parameters are validated with Zod schemas before any WikiJS call is made
- Network isolation in Docker environment (dedicated compose network)
- Not yet implemented: rate limiting

