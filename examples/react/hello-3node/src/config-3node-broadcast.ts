import { generateId } from '@naylence/core';

// Generate a unique channel name
const channelName = `default-${generateId()}`;

// Configuration for Sentinel node (router/coordinator)
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
    plugins: ['@naylence/runtime'],
    node: {
      id: 'agent',
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
    plugins: ['@naylence/runtime'],
    node: {
      id: 'client',
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
