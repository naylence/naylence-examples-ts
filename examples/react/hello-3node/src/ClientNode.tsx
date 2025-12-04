import { useState } from 'react';
import { useFabric, useRemoteAgent } from '@naylence/react';

export function ClientNode() {
  const { fabric, error } = useFabric();
  const [message, setMessage] = useState('Hello, World!');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Use the useRemoteAgent hook to get the agent proxy
  const helloAgent = useRemoteAgent<any>('hello@fame.fabric');

  const sayHello = async () => {
    if (!helloAgent) return;
    
    setLoading(true);
    try {
      // Call the agent's runTask method
      const result = await helloAgent.runTask({ message });
      setResponse(result);
    } catch (err) {
      console.error('Agent call failed:', err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      // Small delay to prevent flickering
      setTimeout(() => setLoading(false), 100);
    }
  };

  return (
    <div className="card">
      <img src="/images/browser-client.svg" alt="Browser Client" className="client-icon" />
      <h2>Client</h2>
      {error != null && <p className="status-error">Error: {String(error)}</p>}
      {fabric && (
        <div>
          <p className="status-active">✅ Connected</p>
          
          <div className="client-input-container">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a message"
              className="client-input"
              onKeyDown={(e) => e.key === 'Enter' && sayHello()}
            />
            <button 
              onClick={sayHello} 
              disabled={/*loading || */ !helloAgent}
            >
               Send
            </button>
          </div>
          
          {response && (
            <div className="client-response">
              {response}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
