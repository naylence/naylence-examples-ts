import { Sentinel } from "@naylence/runtime";

const PEER_SENTINEL_CONFIG = {
  plugins: ["@naylence/runtime"],
  node: {
    type: "Sentinel" as const,
    peers: [{ direct_url: "${env:FAME_PEER_WS_URL}" }],
    listeners: [
      {
        type: "WebSocketListener" as const,
        port: "${env:FAME_SENTINEL_PORT:8000}",
      },
    ],
    security: { type: "SecurityProfile" as const, profile: "open" },
  },
};

await Sentinel.aserve({ rootConfig: PEER_SENTINEL_CONFIG });
