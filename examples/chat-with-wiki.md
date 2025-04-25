# Chat with WikiJS Integration Example

This sample demonstrates how a Chat application can search, reference, and edit WikiJS content through MCP-WikiJS.

## Setup

1. Configure your WikiJS instance and obtain an API token.
2. Start the MCP-WikiJS server:

```bash
npx mcp-wikijs
```

3. Set environment variables:

```bash
export WIKIJS_URL=http://localhost:3000
export WIKIJS_TOKEN=your_api_token_here
export MCP_PORT=8080
```

## Usage Examples

### 1. Client Initialization

```javascript
// Connect from Chat application to MCP-WikiJS
const mcpClient = new MCPClient('http://localhost:8080');
await mcpClient.init();
```

### 2. Searching Wiki Content

```javascript
// User asks "Tell me about the project"
const response = await mcpClient.callTool('search', {
  query: 'project documentation',
  limit: 5
});

// Display search results
console.log('Related documents:');
response.results.forEach(page => {
  console.log(`- ${page.title}: ${page.path}`);
});
```

### 3. Reading Documents

```javascript
// User asks about a specific document
const pageInfo = await mcpClient.callTool('read', {
  path: '/project/architecture'
});

// Summarize document content and respond
console.log(`Information about ${pageInfo.title}:`);
console.log(summarizeContent(pageInfo.content));
```

### 4. Updating Documents

```javascript
// User requests "Add a new endpoint to the API documentation"
const existingPage = await mcpClient.callTool('read', {
  path: '/api/endpoints'
});

// Update the content
const updatedContent = addNewEndpoint(existingPage.content);

// Save the update
await mcpClient.callTool('update', {
  id: existingPage.id,
  content: updatedContent
});

console.log('API documentation has been updated.');
```

### 5. Creating New Documents

```javascript
// User requests "Create a new tutorial"
await mcpClient.callTool('create', {
  path: '/tutorials/getting-started',
  title: 'Getting Started',
  content: generateTutorialContent(),
  description: 'A beginner-friendly tutorial for new users'
});

console.log('New tutorial created: /tutorials/getting-started');
```

## Real Conversation Example

```
User: Tell me about the project architecture

AI: I'll search for information about the project architecture.

[Search Results]
- System Architecture Overview: /project/architecture
- Component Design: /project/components
- Data Flow: /project/data-flow

Loading architecture document...

The system uses a 3-tier architecture:
1. Presentation Layer: React+TypeScript SPA
2. Business Logic Layer: Node.js backend
3. Data Layer: PostgreSQL database

Each service is containerized with Docker and runs on Kubernetes.
Key components include authentication service, API gateway, and resource management service.

Would you like more detailed information?
```

In this way, Chat applications can search, reference, and edit WikiJS content through MCP-WikiJS to provide better answers to users.