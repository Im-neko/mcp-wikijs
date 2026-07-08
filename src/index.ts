import mcpServer from './mcp/server';
import { logger } from './logging/logger';

// Main function
async function main() {
  try {
    // Start MCP server with stdio transport
    await mcpServer.start();

    // Signal handling (graceful shutdown)
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
      process.on(signal, async () => {
        await mcpServer.stop();
        process.exit(0);
      });
    });

    // Process error handling
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception', err);
      mcpServer.stop().finally(() => {
        process.exit(1);
      });
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', reason);
      mcpServer.stop().finally(() => {
        process.exit(1);
      });
    });

  } catch (error) {
    logger.error('Error starting server', error);
    process.exit(1);
  }
}

// Entry point
if (require.main === module) {
  main();
}

// Exports (for programmatic usage)
export { mcpServer };
export * from './wikijs/client';
export * from './wikijs/types';