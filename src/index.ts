import mcpServer from './mcp/server';

// メイン関数
async function main() {
  try {
    // MCPサーバー起動
    await mcpServer.start();
    
    // シグナルハンドリング（正常終了）
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`Received ${signal}, shutting down...`);
        await mcpServer.stop();
        process.exit(0);
      });
    });
    
    // プロセスエラーハンドリング
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      mcpServer.stop().finally(() => {
        process.exit(1);
      });
    });
    
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled rejection:', reason);
      mcpServer.stop().finally(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// エントリーポイント
if (require.main === module) {
  main();
}

// エクスポート（プログラム的に使用する場合のため）
export { mcpServer };
export * from './wikijs/client';
export * from './tools';