# Docker Development Environment

This project includes a Docker setup for local development with a WikiJS instance.

## Prerequisites

- Docker and Docker Compose installed on your system
- Basic knowledge of Docker and containerization

## Getting Started

### 1. Start the Development Environment

```bash
docker-compose up
```

This will start:
- A PostgreSQL database for WikiJS
- A WikiJS instance at http://localhost:3000
- The MCP-WikiJS server at http://localhost:8080

### 2. Setup WikiJS

1. Open http://localhost:3000 in your browser
2. Follow the WikiJS setup wizard to create your admin account
3. After login, go to "Admin Area" > "API Access"
4. Create a new API key with full access permissions
5. Copy the generated API token

### 3. Configure MCP-WikiJS with the API Token

There are two ways to provide the API token:

#### Option A: Using .env file
Create or edit the `.env` file in the project root:
```
WIKIJS_TOKEN=your_api_token_here
```

Then restart the mcp-wikijs container:
```bash
docker-compose restart mcp-wikijs
```

#### Option B: Using Docker Compose environment variable
Stop the environment:
```bash
docker-compose down
```

Then start it again with the WIKIJS_TOKEN environment variable:
```bash
WIKIJS_TOKEN=your_api_token_here docker-compose up
```

### 4. Testing the Connection

Once both services are running and the API token is configured, you can test the connection using:

```bash
curl http://localhost:8080/mcp.init
```

If the connection is successful, you should receive a JSON response with the available tools.

## Development Workflow

The MCP-WikiJS container is configured with hot-reload, so any changes you make to the source files will automatically restart the server.

### Viewing Logs

```bash
docker-compose logs -f mcp-wikijs
```

### Accessing the Container Shell

```bash
docker-compose exec mcp-wikijs sh
```

### Stopping the Environment

```bash
docker-compose down
```

To remove the volumes as well (this will delete all WikiJS data):
```bash
docker-compose down -v
```