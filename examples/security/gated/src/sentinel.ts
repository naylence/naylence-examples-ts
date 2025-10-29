/**
 * Sentinel with gated security profile for OAuth2 admission
 *
 * This sentinel validates OAuth2 bearer tokens before allowing
 * agents and clients to attach to the fabric.
 */

import { Sentinel } from "@naylence/runtime";
import { SENTINEL_CONFIG } from "@naylence/agent-sdk";

await Sentinel.aserve({
  rootConfig: SENTINEL_CONFIG,
  logLevel: "debug",
});
