import { SENTINEL_PORT } from "@naylence/agent-sdk";

const ADVANCED_PLUGINS = [
  "@naylence/runtime",
  "@naylence/advanced-security",
] as const;

export const STICKINESS_AGENT_CONFIG = {
  plugins: ADVANCED_PLUGINS,
  node: {
    type: "Node" as const,
    id: "${env:FAME_NODE_ID:}",
    public_url: "${env:FAME_PUBLIC_URL:}",
    requested_logicals: ["*.fame.fabric"] as const,
    security: {
      type: "SecurityProfile" as const,
      profile: "${env:FAME_SECURITY_PROFILE:open}",
    },
    admission: {
      type: "AdmissionProfile" as const,
      profile: "${env:FAME_ADMISSION_PROFILE:open}",
    },
    storage: {
      type: "StorageProfile" as const,
      profile: "${env:FAME_STORAGE_PROFILE:memory}",
    },
    delivery: {
      type: "DeliveryProfile" as const,
      profile: "${env:FAME_DELIVERY_PROFILE:at-most-once}",
    },
  },
} as const;

export const STICKINESS_SENTINEL_CONFIG = {
  plugins: ADVANCED_PLUGINS,
  node: {
    type: "Sentinel" as const,
    id: "${env:FAME_NODE_ID:}",
    public_url: "${env:FAME_PUBLIC_URL:}",
    listeners: [
      {
        type: "HttpListener" as const,
        port: SENTINEL_PORT,
      },
      {
        type: "WebSocketListener" as const,
        port: SENTINEL_PORT,
      },
    ] as const,
    requested_logicals: ["fame.fabric"] as const,
    security: {
      type: "SecurityProfile" as const,
      profile: "${env:FAME_SECURITY_PROFILE:open}",
    },
    admission: {
      type: "AdmissionProfile" as const,
      profile: "${env:FAME_ADMISSION_PROFILE:none}",
    },
    storage: {
      type: "StorageProfile" as const,
      profile: "${env:FAME_STORAGE_PROFILE:memory}",
    },
    delivery: {
      type: "DeliveryProfile" as const,
      profile: "${env:FAME_DELIVERY_PROFILE:at-most-once}",
    },
    stickiness: {
      type: "AFTLoadBalancerStickinessManager" as const,
      security_level: "strict" as const,
    },
  },
} as const;
