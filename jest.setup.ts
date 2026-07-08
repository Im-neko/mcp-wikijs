// Importing src/config parses env into a Zod schema and calls process.exit(1) on
// failure, so WIKIJS_URL/WIKIJS_TOKEN must be set before any test file imports it.
process.env.WIKIJS_URL = process.env.WIKIJS_URL || 'http://localhost:3000';
process.env.WIKIJS_TOKEN = process.env.WIKIJS_TOKEN || 'test-token';
