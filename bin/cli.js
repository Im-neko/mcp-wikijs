#!/usr/bin/env node

// require()'d (not run directly), so dist/index.js's own require.main check
// doesn't fire -- start the server explicitly.
require('../dist/index.js').main();