import '@naylence/runtime';
import { FabricProvider } from '@naylence/react';
import { ClientNode } from './ClientNode';
import { EnvelopeInspector } from './EnvelopeInspector';
import { EnvelopeProvider, useEnvelopeContext } from './EnvelopeContext';
import { clientConfig } from './config';
import './App.css';

function AppContent() {
  const { debugMode, setDebugMode } = useEnvelopeContext();

  return (
    <div className="App">
      <div className="app-header">
        <h1 className="app-title">
          <img src="/images/naylence.svg" alt="Naylence" className="app-logo" />
          Naylence React - Multi-Agent Workflow with Backend
        </h1>
        <p className="app-description">
          This example demonstrates a distributed multi-agent workflow where the client runs in the browser
          and connects to a backend sentinel and agent services via WebSocket. The workflow agent orchestrates
          three worker agents (stats, keywords, sentences) and returns aggregated results.
        </p>
        <p className="app-source">
          <a 
            href="https://github.com/naylence/naylence-examples-ts/tree/main/examples/react/multi-agent-workflow-with-backend" 
            target="_blank" 
            rel="noreferrer"
          >
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
      
      <FabricProvider opts={clientConfig}>
        <ClientNode />
      </FabricProvider>
      
      <EnvelopeInspector />
    </div>
  );
}

function App() {
  return (
    <EnvelopeProvider>
      <AppContent />
    </EnvelopeProvider>
  );
}

export default App;
