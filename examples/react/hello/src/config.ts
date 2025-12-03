import { generateId } from '@naylence/core'; 
// Generate a unique channel name
const channelName = `default-${generateId()}`;

// Configuration for Sentinel node (server)
export const sentinelConfig = {
  rootConfig: {
    plugins: ['@naylence/runtime'],
    node: {
      type: 'Sentinel',
      id: 'sentinel',
      requestedLogicals: ['fame.fabric'],
      listeners: [
        {
          type: 'BroadcastChannelListener',
          channelName,
        },
      ],
      security: {
        type: 'DefaultSecurityManager',
        security_policy: {
          type: 'NoSecurityPolicy',
        },
        authorizer: {
          type: 'NoopAuthorizer',
        },
      },
    },
  },
};

// Configuration for Client node
export const clientConfig = {
  rootConfig: {
    plugins: ['@naylence/runtime'],
    node: {
      id: 'client',
      hasParent: true,
      requestedLogicals: ['fame.fabric'],
      security: {
        type: 'DefaultSecurityManager',
        security_policy: {
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
            type: 'BroadcastChannelConnectionGrant',
            purpose: 'node.attach',
            channelName,
            ttl: 0,
            durable: false,
          },
        ],
      },
    },
  },
};
