import { generateId } from '@naylence/core';

const pageId = generateId();
// Generate a unique channel name
const channelName = `default-${pageId}`;

// Configuration for Sentinel node (router/coordinator)
export const sentinelConfig = {
  rootConfig: {
    node: {
      type: 'Sentinel',
      requestedLogicals: ['fame.fabric'],
      listeners: [
        {
          type: 'BroadcastChannelListener',
          channelName: channelName
        },
      ],
      security: {
        type: 'DefaultSecurityManager',
        securityPolicy: {
          type: 'NoSecurityPolicy',
        },
        authorizer: {
          type: 'NoopAuthorizer',
        },
      },
    },
  },
};

// Configuration for Agent node (hosts the agent)
export const agentConfig = {
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
            type: 'BroadcastChannelConnectionGrant',
            purpose: 'node.attach',
            channelName: channelName,
            ttl: 0,
            durable: false,
            initialWindow: 16,
          },
        ],
      },
    },
  },
};

// Configuration for Client node (makes requests)
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
            type: 'BroadcastChannelConnectionGrant',
            purpose: 'node.attach',
            channelName: channelName,
            ttl: 0,
            durable: false,
            initialWindow: 12,
          },
        ],
      },
    },
  },
};
