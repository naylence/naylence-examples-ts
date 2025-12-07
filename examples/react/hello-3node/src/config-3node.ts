import { generateId } from '@naylence/core';

// Generate a unique page name
const pageId = generateId();

const channelName = `default-${pageId}`;

// Configuration for Sentinel node (router/coordinator)
export const sentinelConfig = {
  rootConfig: {
    plugins: ['@naylence/runtime'],
    node: {
      type: 'Sentinel',
      requestedLogicals: ['fame.fabric'],
      listeners: [
        {
          type: 'InPageListener',
          channelName: channelName,
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
            channelName: channelName, // + '-agent',
            ttl: 0,
            durable: false,
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
            channelName: channelName, // + '-client',
            ttl: 0,
            durable: false,
          },
        ],
      },
    },
  },
};
