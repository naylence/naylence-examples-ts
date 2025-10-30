import { SENTINEL_CONFIG } from "@naylence/agent-sdk";
import { Sentinel } from "@naylence/runtime";

await Sentinel.aserve({
  rootConfig: SENTINEL_CONFIG,
  logLevel: "info",
}).catch((error: unknown) => {
  console.error("Sentinel failed:", error);
  process.exit(1);
});
