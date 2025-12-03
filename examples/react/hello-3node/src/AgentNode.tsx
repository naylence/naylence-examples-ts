import { useState, useRef, useEffect } from 'react';
import { useFabric, useFabricEffect } from '@naylence/react';
import { HelloAgent } from './HelloAgent';

interface AgentNodeProps {
  onReady?: () => void;
}

interface ReceivedMessage {
  message: string;
  timestamp: number;
}

export function AgentNode({ onReady }: AgentNodeProps) {
  const { fabric, error } = useFabric();
  const [receivedMessages, setReceivedMessages] = useState<ReceivedMessage[]>([]);
  const [pulseActive, setPulseActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [receivedMessages]);

  useFabricEffect((fabric) => {
    // Serve the hello agent on a separate node
    const agent = new HelloAgent();
    
    // Set up callback to track received messages
    agent.setMessageCallback((message: string) => {
      const timestamp = Date.now();
      setReceivedMessages(prev => [...prev.slice(-4), { message, timestamp }]);
      setPulseActive(true);
      
      // Reset pulse after animation
      setTimeout(() => setPulseActive(false), 600);
    });
    
    fabric.serve(agent, 'hello@fame.fabric').then(() => {
      console.log('Hello agent served at: hello@fame.fabric');
      // Signal that agent is ready
      onReady?.();
    });
  }, []);

  return (
    <div className="card">
      <div className="sentinel-icon-container">
        <img 
          src="/images/agent.svg" 
          alt="Agent Node" 
          className={`sentinel-icon ${pulseActive ? 'pulse-active' : ''}`}
        />
        {pulseActive && <div className="pulse-overlay" />}
      </div>
      <h2>Agent Node</h2>
      {error != null && <p className="status-error">Error: {String(error)}</p>}
      {fabric && (
        <div>
          <p className="status-active">✅ Active</p>
          
          <div className="messages-container">
            <p className="messages-title">{receivedMessages.length > 0 ? 'Received Messages:' : '\u00A0'}</p>
            <div className="messages-list">
              {receivedMessages.map((msg, idx) => (
                <div 
                  key={msg.timestamp}
                  className={`message-item ${idx === receivedMessages.length - 1 ? 'new' : ''}`}
                >
                  <div className="message-text">📨 {msg.message}</div>
                  <div className="message-timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
