import { useState, useEffect } from 'react';
// Explicitly import the plugin to ensure factory registration happens
import '@naylence/runtime';
import { FabricProvider } from '@naylence/react';
import { SentinelNode } from './SentinelNode';
import { AgentNode } from './AgentNode';
import { ClientNode } from './ClientNode';
import { sentinelConfig, agentConfig, clientConfig } from './config-3node-broadcast';

import './App.css';

function App() {
  const [sentinelReady, setSentinelReady] = useState(false);
  const [agentReady, setAgentReady] = useState(false);
  const [clientReady, setClientReady] = useState(false);

  // Initialize agent after sentinel is ready
  useEffect(() => {
    if (sentinelReady) {
      const timer = setTimeout(() => {
        setAgentReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sentinelReady]);

  // Initialize client after agent is ready
  useEffect(() => {
    if (agentReady) {
      const timer = setTimeout(() => {
        setClientReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [agentReady]);

  return (
    <div className="App">
      <img src="/images/naylence.svg" alt="Naylence" className="app-logo" />
      <h1>Naylence React - 3 Node Example</h1>
      <p className="app-description">
        This React example demonstrates three fabric nodes (Client → Sentinel → Agent) communicating via BroadcastChannel,
        running entirely in the browser.
      </p>
      
      <div className="nodes-container three-node">
        {/* Client - makes requests */}
        {clientReady && (
          <FabricProvider opts={clientConfig}>
            <ClientNode />
          </FabricProvider>
        )}

        {/* Arrows between nodes */}
        <div className="arrows-container">
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

        {/* Sentinel - routes messages */}
        <FabricProvider opts={sentinelConfig}>
          <SentinelNode onReady={() => setSentinelReady(true)} />
        </FabricProvider>

        {/* Second set of arrows */}
        <div className="arrows-container">
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

        {/* Agent - processes requests */}
        {agentReady && (
          <FabricProvider opts={agentConfig}>
            <AgentNode onReady={() => console.log('Agent ready')} />
          </FabricProvider>
        )}
      </div>
    </div>
  );
}

export default App;
