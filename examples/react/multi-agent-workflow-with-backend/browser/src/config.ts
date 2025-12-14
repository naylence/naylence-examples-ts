// Get WebSocket URL from env.js
declare global {
  interface Window {
    WEBSOCKET_URL: string;
  }
}

const WEBSOCKET_URL = window.WEBSOCKET_URL || 'ws://localhost:8000/fame/v1/attach/ws/downstream';

// Configuration for Client node connecting to backend sentinel via WebSocket
export const clientConfig = {
  rootConfig: {
    node: {
      hasParent: true,
      requestedLogicals: ['fame.fabric'],
      security: {
        type: 'DefaultSecurityManager',
        securityPolicy: {
          type: 'NoSecurityPolicy',
        },
        authorizer: {
          type: 'NoopAuthorizer',
        },
      },
      admission: {
        type: 'DirectAdmissionClient',
        connectionGrants: [
          {
            type: 'WebSocketConnectionGrant',
            purpose: 'node.attach',
            url: WEBSOCKET_URL,
            ttl: 0,
            durable: false,
          },
        ],
      },
      delivery: {
        type: 'DeliveryProfile' as const,
        profile: 'at-most-once',
      },
    },
  },
};
