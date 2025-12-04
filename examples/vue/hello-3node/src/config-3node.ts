import { generateId } from '@naylence/core';

const channelName = `default-${generateId()}`;

export const sentinelConfig = {
  rootConfig: {
    plugins: ['@naylence/runtime'],
    node: {
      type: 'Sentinel',
      id: 'sentinel',
      requestedLogicals: ['fame.fabric'],
      listeners: [
        {
          type: 'InPageListener',
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
            type: 'InPageConnectionGrant',
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
            type: 'InPageConnectionGrant',
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
