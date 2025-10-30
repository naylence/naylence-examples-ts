/**
 * Sentinel configured with advanced stickiness to keep encrypted flows pinned
 * to the same replica. The stickiness manager enforces strict overlay.
 */

import { Sentinel } from "@naylence/runtime";
import { STICKINESS_SENTINEL_CONFIG } from "./config.js";

await Sentinel.aserve({
  rootConfig: STICKINESS_SENTINEL_CONFIG,
  logLevel: "warning",
}).catch((error: unknown) => {
  console.error("Sentinel failed:", error);
  process.exit(1);
});
