/**
 * Sentinel configured via YAML to export spans through OpenTelemetry.
 */

import { Sentinel } from "@naylence/runtime";

await Sentinel.aserve({}).catch((error: unknown) => {
  console.error("Sentinel failed:", error);
  process.exit(1);
});
