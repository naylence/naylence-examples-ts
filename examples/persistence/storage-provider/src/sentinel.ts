/**
 * Sentinel server for the storage provider example
 *
 * The sentinel acts as a central coordinator for the Fame fabric,
 * routing messages between agents and managing connections.
 *
 * It uses encrypted SQLite storage configured via environment variables.
 */

import { Sentinel } from "@naylence/runtime";
import { SENTINEL_CONFIG } from "@naylence/agent-sdk";

await Sentinel.aserve({
  rootConfig: SENTINEL_CONFIG,
  logLevel: "info",
});
