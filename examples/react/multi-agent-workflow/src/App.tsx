import { useState, useEffect } from 'react';
// Explicitly import the plugin to ensure factory registration happens
import '@naylence/runtime';
import { FabricProvider } from '@naylence/react';
import { SentinelNode } from './SentinelNode';
import { AgentNode } from './AgentNode';
import { ClientNode } from './ClientNode';
import { WorkflowAgent } from './WorkflowAgent';
import { StatsAgent } from './StatsAgent';
import { KeywordsAgent } from './KeywordsAgent';
import { SentencesAgent } from './SentencesAgent';
import { EnvelopeInspector } from './EnvelopeInspector';
import { useEnvelopeContext } from './EnvelopeContext';
import {
  sentinelConfig,
  clientConfig,
  workflowAgentConfig,
  statsAgentConfig,
  keywordsAgentConfig,
  sentencesAgentConfig,
  WORKFLOW_AGENT_ADDR,
  STATS_AGENT_ADDR,
  KEYWORDS_AGENT_ADDR,
  SENTENCES_AGENT_ADDR,
} from './config';

import './App.css';

function App() {
  const [sentinelReady, setSentinelReady] = useState(false);
  const [workflowAgentReady, setWorkflowAgentReady] = useState(false);
  const [statsAgentReady, setStatsAgentReady] = useState(false);
  const [keywordsAgentReady, setKeywordsAgentReady] = useState(false);
  const [sentencesAgentReady, setSentencesAgentReady] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const { debugMode, setDebugMode } = useEnvelopeContext();

  // Initialize agents after sentinel is ready
  useEffect(() => {
    if (sentinelReady) {
      const timer = setTimeout(() => {
        setWorkflowAgentReady(true);
        setStatsAgentReady(true);
        setKeywordsAgentReady(true);
        setSentencesAgentReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sentinelReady]);

  // Initialize client after all agents are ready
  useEffect(() => {
    if (workflowAgentReady && statsAgentReady && keywordsAgentReady && sentencesAgentReady) {
      const timer = setTimeout(() => {
        setClientReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [workflowAgentReady, statsAgentReady, keywordsAgentReady, sentencesAgentReady]);

  return (
    <div className="App">
      <div className="app-header">
        <h1 className="app-title">
          <img src="/images/naylence.svg" alt="Naylence" className="app-logo" />
          Naylence React - Multi-Agent Workflow
        </h1>
        <p className="app-description">
          This example demonstrates a browser-only multi-agent workflow for text analysis. A client node
          sends text through a sentinel to a workflow agent, which fans out work to three worker agents
          (stats, keywords, sentences) and aggregates the results.
        </p>
        <p className="app-source">
          <a href="https://github.com/naylence/naylence-examples-ts/tree/main/examples/react/multi-agent-workflow" target="_blank" rel="noreferrer">
            View source on GitHub
          </a>
          {' • '}
          <button 
            onClick={() => setDebugMode(!debugMode)} 
            className="link-button"
            style={{ fontSize: 'inherit' }}
          >
            {debugMode ? 'Disable Debug' : 'Enable Debug'}
          </button>
        </p>
      </div>
      
      <div className="topology-container">
        {/* Left Column: Client */}
        <div className="column client-column">
          {clientReady && (
            <FabricProvider opts={clientConfig}>
              <ClientNode />
            </FabricProvider>
          )}
        </div>

        {/* Arrows between Client and Sentinel */}
        <div className="arrows-container client-sentinel-arrows">
          <svg xmlns="http://www.w3.org/2000/svg"
               width="64" height="64" viewBox="0 0 64 64"
               stroke="currentColor" strokeWidth="3"
               strokeLinecap="round" strokeLinejoin="round" fill="none"
               className="communication-arrows">
            {/* Top arrow: left → right */}
            <line x1="12" y1="22" x2="52" y2="22" />
            <path d="M46 16 L52 22 L46 28" />

            {/* Bottom arrow: right → left */}
            <line x1="52" y1="42" x2="12" y2="42" />
            <path d="M18 36 L12 42 L18 48" />
          </svg>
        </div>

        {/* Center Column: Sentinel */}
        <div className="column sentinel-column">
          <FabricProvider opts={sentinelConfig}>
            <SentinelNode onReady={() => setSentinelReady(true)} />
          </FabricProvider>
        </div>

        {/* Arrows between Sentinel and Agents */}
        <div className="arrows-container sentinel-agents-arrows">
          <svg xmlns="http://www.w3.org/2000/svg"
               width="64" height="64" viewBox="0 0 64 64"
               stroke="currentColor" strokeWidth="3"
               strokeLinecap="round" strokeLinejoin="round" fill="none"
               className="communication-arrows">
            {/* Top arrow: left → right */}
            <line x1="12" y1="22" x2="52" y2="22" />
            <path d="M46 16 L52 22 L46 28" />

            {/* Bottom arrow: right → left */}
            <line x1="52" y1="42" x2="12" y2="42" />
            <path d="M18 36 L12 42 L18 48" />
          </svg>
        </div>

        {/* Right Column: Agent Nodes */}
        <div className="column agents-column">
          {/* Workflow Agent */}
          {workflowAgentReady && (
            <FabricProvider opts={workflowAgentConfig}>
              <AgentNode
                agentClass={WorkflowAgent}
                agentAddress={WORKFLOW_AGENT_ADDR}
                agentName="Workflow Agent"
                agentRole="Orchestrates analysis workflow"
              />
            </FabricProvider>
          )}

          {/* Stats Agent */}
          {statsAgentReady && (
            <FabricProvider opts={statsAgentConfig}>
              <AgentNode
                agentClass={StatsAgent}
                agentAddress={STATS_AGENT_ADDR}
                agentName="Stats Agent"
                agentRole="Computes text statistics"
              />
            </FabricProvider>
          )}

          {/* Keywords Agent */}
          {keywordsAgentReady && (
            <FabricProvider opts={keywordsAgentConfig}>
              <AgentNode
                agentClass={KeywordsAgent}
                agentAddress={KEYWORDS_AGENT_ADDR}
                agentName="Keywords Agent"
                agentRole="Extracts top keywords"
              />
            </FabricProvider>
          )}

          {/* Sentences Agent */}
          {sentencesAgentReady && (
            <FabricProvider opts={sentencesAgentConfig}>
              <AgentNode
                agentClass={SentencesAgent}
                agentAddress={SENTENCES_AGENT_ADDR}
                agentName="Sentences Agent"
                agentRole="Provides sentence preview"
              />
            </FabricProvider>
          )}
        </div>
      </div>
      
      <EnvelopeInspector />
    </div>
  );
}

export default App;
