import { useState, useEffect } from 'react';
import { FabricProvider } from '@naylence/react';
import { SentinelNode } from './SentinelNode';
import { ClientNode } from './ClientNode';
import { sentinelConfig, clientConfig } from './config-in-page-connector';
import './App.css';

function App() {
  const [sentinelReady, setSentinelReady] = useState(false);
  const [clientReady, setClientReady] = useState(false);

  // Delay client start to avoid race conditions
  useEffect(() => {
    if (sentinelReady) {
      const timer = setTimeout(() => {
        setClientReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sentinelReady]);

  return (
    <div className="App">
      <img src="/images/naylence.svg" alt="Naylence" className="app-logo" />
      <h1>Naylence React Hello World</h1>
      <p className="app-description">
        This React example demonstrates two fabric nodes communicating via BroadcastChannel with an agent service,
        running entirely in the browser.
      </p>
      
      <div className="nodes-container">
        {/* Client connects and calls the service - only after sentinel is ready */}
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

        {/* Sentinel provides the agent service */}
        <FabricProvider opts={sentinelConfig}>
          <SentinelNode onReady={() => setSentinelReady(true)} />
        </FabricProvider>
      </div>
    </div>
  );
}

export default App;

