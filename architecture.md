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

### 3. MCP Server Implementation (`src/mcp`)
- Model Context Protocol implementation
- Tool definitions
- Resource definitions

### 4. Tool Definitions (`src/tools`)
- `search` - Wiki document search
- `read` - Document retrieval
- `update` - Document update
- `create` - Document creation
- `delete` - Document deletion

### 5. Entry Point (`src/index.ts`)
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
- Distributed as npm package
- Executable via npx command
- Configuration via environment variables
  - `WIKIJS_URL` - WikiJS URL
  - `WIKIJS_TOKEN` - API authentication token
  - `MCP_PORT` - MCP server port number (default: 8080)

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

- Secure management of authentication information
- MCP request validation
- Rate limiting implementation
- Error handling and logging
- Network isolation in Docker environment