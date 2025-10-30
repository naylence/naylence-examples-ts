/**
 * Sentinel with advanced security (strict overlay) profile
 *
 * This sentinel uses:
 * - X.509/SPIFFE certificates for node identity
 * - Welcome service admission with OAuth2
 * - JWT ticket validation for attachments
 * - Strict overlay encryption
 */

import { Sentinel } from "@naylence/runtime";
import { SENTINEL_CONFIG } from "@naylence/agent-sdk";

await Sentinel.aserve({
  rootConfig: SENTINEL_CONFIG,
  logLevel: "info",
});
