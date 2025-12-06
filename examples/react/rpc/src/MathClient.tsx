import { useState } from 'react';
import { useFabric, useRemoteAgent } from '@naylence/react';
import type { MathAgent } from './MathAgent';
import { useNodeEnvelopeLogger } from './useNodeEnvelopeLogger';
import { useEnvelopeContext } from './EnvelopeContext';

export function MathClient() {
  const { fabric, error } = useFabric();
  const [x, setX] = useState(3);
  const [y, setY] = useState(4);
  const [n, setN] = useState(10);
  const [result, setResult] = useState<string | null>(null);
  
  // Use the useRemoteAgent hook to get the agent proxy
  const mathAgent = useRemoteAgent<MathAgent>('math@fame.fabric');

  // Enable envelope logging
  useNodeEnvelopeLogger('client');
  const { selectedNodeId, setSelectedNodeId } = useEnvelopeContext();
  const isSelected = selectedNodeId === 'client';

  const handleAdd = async () => {
    if (!mathAgent) return;
    
    try {
      const sum = await mathAgent.add({ x, y });
      setResult(`${x} + ${y} = ${sum}`);
    } catch (err) {
      console.error('Add operation failed:', err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleMultiply = async () => {
    if (!mathAgent) return;
    
    try {
      const product = await mathAgent.multiply({ x, y });
      setResult(`${x} × ${y} = ${product}`);
    } catch (err) {
      console.error('Multiply operation failed:', err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleFibStream = async () => {
    if (!mathAgent) return;
    
    try {
      const fibStream = await mathAgent.fib_stream({ _stream: true, n });
      const results: number[] = [];
      
      for await (const value of fibStream) {
        results.push(value);
      }
      
      setResult(`Fibonacci(${n}): ${results.join(', ')}`);
    } catch (err) {
      console.error('Fibonacci stream failed:', err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div 
      className={`card ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedNodeId(isSelected ? null : 'client');
      }}
    >
      <div className="client-icon-container">
        <img src="/images/browser-client.svg" alt="Browser Client" className="client-icon" />
      </div>
      <h2>Client</h2>
      {error != null && <p className="status-error">Error: {String(error)}</p>}
      {fabric && (
        <div>
          <p className="status-active">✅ Connected</p>
          
          <div className="client-input-container">
            <div className="input-row">
              <label>x:</label>
              <input
                type="number"
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
                className="client-input"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="input-row">
              <label>y:</label>
              <input
                type="number"
                value={y}
                onChange={(e) => setY(Number(e.target.value))}
                className="client-input"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="button-group">
              <button 
                onClick={(e) => { e.stopPropagation(); handleAdd(); }} 
                disabled={/*addLoading || */ !mathAgent}
              >
                Add
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleMultiply(); }} 
                disabled={/*multiplyLoading || */ !mathAgent}
              >
                Multiply
              </button>
            </div>

            <div className="input-row">
              <label>n:</label>
              <input
                type="number"
                value={n}
                onChange={(e) => setN(Number(e.target.value))}
                className="client-input"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); handleFibStream(); }} 
              disabled={/*fibLoading || */ !mathAgent}
              className="fib-button"
            >
              Fibonacci Stream
            </button>
          </div>
          
          <div className={`client-response ${!result ? 'empty' : ''}`}>
            {result || '\u00A0'}
          </div>
        </div>
      )}
    </div>
  );
}
