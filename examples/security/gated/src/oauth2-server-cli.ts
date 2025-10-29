#!/usr/bin/env node
/**
 * Entrypoint for running the Naylence OAuth2 server used in the gated example.
 */
import { runOAuth2Server } from "@naylence/runtime";

runOAuth2Server().catch((error) => {
  console.error("Fatal error starting OAuth2 server:", error);
  process.exit(1);
});
