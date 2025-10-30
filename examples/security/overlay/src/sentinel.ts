/**
 * Sentinel with overlay security profile for envelope signing
 * - Envelope signing for integrity & authenticity
 * - Provenance via SIDs (source node fingerprints)
 * - Tamper-evident routing, non-repudiation, audit trails
 * Public keys are exchanged during node attach
 */

import { Sentinel } from "@naylence/runtime";
import { SENTINEL_CONFIG } from "@naylence/agent-sdk";

await Sentinel.aserve({ rootConfig: SENTINEL_CONFIG });
