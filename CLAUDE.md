# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- Write all comments and documents in English.

## Project Overview

MCP-WikiJS is a Model Context Protocol (MCP) server that exposes [WikiJS](https://js.wiki/) content to AI models as tools (no MCP resources/prompts). It talks to WikiJS over its GraphQL API and communicates with its MCP client over stdio only (no HTTP transport, no port). Package name is `@im-neko/mcp-wikijs` (scoped — the unscoped `mcp-wikijs` name on npm belongs to an unrelated third-party package); once published, it's invoked via `npx -y @im-neko/mcp-wikijs`. Not yet published — see `npm run` commands below for the from-source flow.

## Commands

```bash
npm run build     # tsc compile to dist/ + chmod +x on dist/*.js (also runs on `npm install` via "prepare")
npm run watch      # tsc --watch
npm run dev        # run src/index.ts directly with ts-node (no build step)
npm start          # run the compiled dist/index.js
npm test           # run jest
npm run lint       # eslint src --ext .ts
```

GraphQL codegen (regenerate `src/wikijs/generated/operations.ts` from `src/wikijs/sdl/schema.graphql` and the queries in `src/wikijs/operations.ts`):

```bash
npx graphql-codegen --config codegen.ts
```

Run `npx graphql-codegen` after editing `src/wikijs/operations.ts` or updating `src/wikijs/sdl/schema.graphql` — `src/wikijs/generated/operations.ts` is generated output and should not be hand-edited.

### Docker development environment

`docker-compose up` starts a Postgres DB, a WikiJS instance (`localhost:3000`), and this server with hot-reload (`npm run dev` inside the container). The mcp-wikijs container exposes no port — it's an MCP stdio server, not an HTTP service. See `DOCKER.md` for the full setup flow (WikiJS admin setup, API token creation, `.env`/`WIKIJS_TOKEN` wiring, and testing via `docker-compose exec mcp-wikijs npx @modelcontextprotocol/inspector node dist/index.js`).

## Architecture

Request flow: LLM client → MCP server (stdio transport) → WikiJS GraphQL API.

- `src/index.ts` — entry point; starts the MCP server, wires up SIGINT/SIGTERM and uncaught-exception/rejection handlers for graceful shutdown.
- `src/logging/logger.ts` — the only logging path in this codebase. `logger.{debug,info,warn,error}(message, error?)` filters by `LOG_LEVEL` and always writes to stderr via `console.error` (stdout is reserved for MCP JSON-RPC framing — never `console.log`/`console.info` in this codebase). `toErrorMessage(error, fallback)` extracts a safe `.message` from a caught value; **never log or rethrow a raw caught `error` object** — errors from `graphql-request` carry the outgoing request, which includes the `Authorization: Bearer <token>` header, so doing so risks leaking the WikiJS token into logs or into the MCP client's error output.
- `src/config/` — env-based config loaded via `dotenv` and validated/typed with a Zod schema (`ConfigSchema` in `types.ts`). `WIKIJS_URL` and `WIKIJS_TOKEN` are required; `defaultLocale` and `logging.level` (`LOG_LEVEL`) have defaults. There is no port/host/transport config — the server is stdio-only. Note: `createConfig()` calls `process.exit(1)` on invalid/missing env at import time, which is why jest needs `WIKIJS_URL`/`WIKIJS_TOKEN` set before anything imports `src/config` (see `jest.setup.ts`).
- `src/wikijs/` — the WikiJS integration layer:
  - `sdl/schema.graphql` — the full WikiJS GraphQL schema, used both by graphql-codegen and by the `@0no-co/graphqlsp` TS language service plugin configured in `tsconfig.json`.
  - `operations.ts` — hand-written gql documents (search/get/list/create/update/delete pages, get tags).
  - `generated/operations.ts` — codegen output providing a typed `getSdk()` client; do not edit by hand.
  - `client.ts` — `WikiJSClient` class wrapping the generated SDK with a `GraphQLClient` (bearer-token auth), normalizing GraphQL responses/errors into the app's own types (`types.ts`). Every method's catch block logs via `logger.error(msg, error)` and rethrows `new Error(toErrorMessage(error, fallback))` — follow this pattern for new methods. Exported as a singleton default.
- `src/mcp/server.ts` — `MCPWikiJSServer`, built on `@modelcontextprotocol/sdk`'s `McpServer`. This is where MCP tools are defined and registered (`search`, `read`, `create`, `update`, `delete`), each with inline Zod parameter schemas, calling the `wikijs/client.ts` singleton directly and returning MCP `content` blocks. Exported as a singleton default and re-exported from `src/index.ts`.

There used to be a second, unused tool-definition scheme (`src/tools/*.ts` + `src/mcp/types.ts`) that nothing imported — it has been deleted. `src/mcp/server.ts` is the only place tools are registered.

## Adding a new WikiJS operation/tool

1. Add the GraphQL query/mutation to `src/wikijs/operations.ts`.
2. Run `npx graphql-codegen --config codegen.ts` to regenerate `src/wikijs/generated/operations.ts`.
3. Add a method to `WikiJSClient` in `src/wikijs/client.ts` that calls `this.sdk.<Operation>()`, checks `response.errors`/`responseResult.succeeded`, maps the result to a type in `src/wikijs/types.ts`, and on error logs+rethrows via `logger.error`/`toErrorMessage` (never the raw error object).
4. Register a new tool (or extend an existing one) in `src/mcp/server.ts` via `this.server.tool(name, description, zodParamsShape, handler)`, calling the new client method.

## Tests

Jest + ts-jest. `jest.setup.ts` (referenced via `setupFiles` in `jest.config.js`) sets dummy `WIKIJS_URL`/`WIKIJS_TOKEN` before any test file loads, because importing `src/config` with those unset calls `process.exit(1)` (see above) — tests that need different config values should reset modules (`jest.resetModules()`) and re-`require` after changing `process.env`, rather than relying on the top-level `import`.
