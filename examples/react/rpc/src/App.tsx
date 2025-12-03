import { useState, useEffect } from 'react';
import { FabricProvider } from '@naylence/react';
import { MathSentinel } from './MathSentinel';
import { MathClient } from './MathClient';
import { sentinelConfig, clientConfig } from './config';
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
      <h1>Naylence React RPC Example</h1>
      <p className="app-description">
        This React example demonstrates a Math Agent providing RPC operations (add, multiply, and fibonacci stream)
        with two fabric nodes communicating via BroadcastChannel, running entirely in the browser.
      </p>
      
      <div className="nodes-container">
        {/* Client connects and calls the service - only after sentinel is ready */}
        {clientReady && (
          <FabricProvider opts={clientConfig}>
            <MathClient />
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
          <MathSentinel onReady={() => setSentinelReady(true)} />
        </FabricProvider>
      </div>
    </div>
  );
}

export default App;
