import { generateId } from '@naylence/core';

const channelName = `rpc-example-${generateId()}`;

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
            channelName,
            ttl: 0,
            durable: false,
          },
        ],
      },
    },
  },
};
