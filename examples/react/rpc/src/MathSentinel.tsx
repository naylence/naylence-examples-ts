import { useState, useRef, useEffect } from 'react';
import { useFabric, useFabricEffect } from '@naylence/react';
import { MathAgent } from './MathAgent';

interface MathSentinelProps {
  onReady?: () => void;
}

interface OperationLog {
  operation: string;
  params: Record<string, any>;
  timestamp: number;
}

export function MathSentinel({ onReady }: MathSentinelProps) {
  const { fabric, error } = useFabric();
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [pulseActive, setPulseActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [operationLogs]);

  useFabricEffect((fabric) => {
    const agent = new MathAgent();
    const agentId = agent.debugId ?? 'math-agent-unknown';
  
    // Wrap operations to log them
    const originalAdd = agent.add.bind(agent);
    const originalMulti = agent.multi.bind(agent);
    const originalFib = agent.fib.bind(agent);

    agent.add = async (params: { x: number; y: number }) => {
      logOperation('add', params);
      return originalAdd(params);
    };

    agent.multi = async (params: { x: number; y: number }) => {
      logOperation('multiply', params);
      return originalMulti(params);
    };

    agent.fib = async function* (params: { n: number }) {
      logOperation('fib_stream', params);
      yield* originalFib(params);
    };

    function logOperation(operation: string, params: Record<string, any>) {
      const timestamp = Date.now();
      setOperationLogs(prev => [...prev.slice(-4), { operation, params, timestamp }]);
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 600);
    }

    fabric
      .serve(agent, 'math@fame.fabric')
      .then(() => {
        console.log('[MathSentinel]', agentId, 'served at math@fame.fabric');
        onReady?.();
      })
      .catch((serveError) => {
        console.error('[MathSentinel]', agentId, 'failed to serve', serveError);
      });
  }, []);

  return (
    <div className="card">
      <div className="sentinel-icon-container">
        <img 
          src="/images/agent-on-sentinel.svg" 
          alt="Math Agent on Sentinel" 
          className={`sentinel-icon ${pulseActive ? 'pulse-active' : ''}`}
        />
        {pulseActive && <div className="pulse-overlay" />}
      </div>
      <h2>Math Agent on Sentinel</h2>
      {error != null && <p className="status-error">Error: {String(error)}</p>}
      {fabric && (
        <div>
          <p className="status-active">✅ Active</p>
          
          <div className="messages-container">
            <p className="messages-title">{operationLogs.length > 0 ? 'Operation Log:' : '\u00A0'}</p>
            <div className="messages-list">
              {operationLogs.map((log, idx) => (
                <div 
                  key={log.timestamp}
                  className={`message-item ${idx === operationLogs.length - 1 ? 'new' : ''}`}
                >
                  <div className="message-text">
                    🔧 {log.operation}({JSON.stringify(log.params)})
                  </div>
                  <div className="message-timestamp">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="sentinel-spacer"></div>
        </div>
      )}
    </div>
  );
}
