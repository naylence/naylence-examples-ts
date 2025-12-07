import { generateId } from '@naylence/core';

const pageId = generateId();

// Generate a unique channel name
const channelName = `multi-agent-${pageId}`;

// ===== Common Types =====

export interface TextStats {
  charCount: number;
  wordCount: number;
  sentenceCount: number;
  readingTimeMinutes: number;
}

export interface KeywordsResult {
  topWords: Array<{ word: string; count: number }>;
}

export interface SentencesResult {
  preview: string[];
  totalSentences: number;
}

export interface WorkflowResult {
  stats: TextStats;
  keywords: KeywordsResult;
  sentences: SentencesResult;
}

// ===== Agent Addresses =====

export const WORKFLOW_AGENT_ADDR = 'workflow@fame.fabric';
export const STATS_AGENT_ADDR = 'stats@fame.fabric';
export const KEYWORDS_AGENT_ADDR = 'keywords@fame.fabric';
export const SENTENCES_AGENT_ADDR = 'sentences@fame.fabric';

// ===== Node Configurations =====

// Configuration for Sentinel node (router/coordinator)
export const sentinelConfig = {
  rootConfig: {
    plugins: ['@naylence/runtime'],
    node: {
      type: 'Sentinel',
      requestedLogicals: ['fame.fabric'],
      listeners: [
        {
          type: 'BroadcastChannelListener',
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
            type: 'BroadcastChannelConnectionGrant',
            purpose: 'node.attach',
            channelName: channelName,
            ttl: 0,
            durable: false,
          },
        ],
      },
    },
  },
};

// Configuration factory for agent nodes
function createAgentConfig(agentChannelName: string = channelName) {
  return {
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
              type: 'BroadcastChannelConnectionGrant',
              purpose: 'node.attach',
              channelName: agentChannelName,
              ttl: 0,
              durable: false,
            },
          ],
        },
      },
    },
  };
}

export const workflowAgentConfig = createAgentConfig();
export const statsAgentConfig = createAgentConfig();
export const keywordsAgentConfig = createAgentConfig();
export const sentencesAgentConfig = createAgentConfig();