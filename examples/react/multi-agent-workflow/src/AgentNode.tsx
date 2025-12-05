import { useState, useRef, useCallback } from 'react';
import { useFabric, useFabricEffect } from '@naylence/react';
import { BaseAgent } from '@naylence/agent-sdk';
import { useNodeEnvelopeLogger } from './useNodeEnvelopeLogger';
import { useEnvelopeContext } from './EnvelopeContext';

interface AgentNodeProps {
  agentClass: new () => BaseAgent;
  agentAddress: string;
  agentName: string;
  agentRole: string;
  onReady?: () => void;
}

export function AgentNode({ 
  agentClass, 
  agentAddress, 
  agentName, 
  agentRole, 
  onReady 
}: AgentNodeProps) {
  const { fabric, error } = useFabric();
  const [pulseActive, setPulseActive] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useNodeEnvelopeLogger(agentName);
  const { selectedNodeId, setSelectedNodeId } = useEnvelopeContext();
  const isSelected = selectedNodeId === agentName;

  const triggerPulse = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    
    setPulseActive(true);
    timeoutRef.current = window.setTimeout(() => {
      setPulseActive(false);
      timeoutRef.current = null;
    }, 600);
  }, []);

  useFabricEffect((fabric) => {
    // Serve the agent
    const agent = new agentClass();
    
    // Wrap runTask to trigger pulse animation
    const originalRunTask = agent.runTask.bind(agent);
    agent.runTask = async (payload: any, id: string | null) => {
      triggerPulse();
      return originalRunTask(payload, id);
    };
    
    fabric.serve(agent, agentAddress).then(() => {
      console.log(`${agentName} served at: ${agentAddress}`);
      onReady?.();
    });

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [agentAddress, triggerPulse]);

  return (
    <div 
      className={`card agent-card ${isSelected ? 'selected' : ''}`}
      onClick={() => setSelectedNodeId(agentName)}
    >
      <div className="agent-icon-container">
        <img 
          src="/images/agent.svg" 
          alt={agentName} 
          className={`agent-icon ${pulseActive ? 'pulse-active' : ''}`}
        />
        {pulseActive && <div className="pulse-overlay" />}
      </div>
      <h3>{agentName}</h3>
      {error != null && <p className="status-error">Error: {String(error)}</p>}
      {fabric && (
        <div>
          <p className="status-active">✅ Active</p>
          <p className="agent-role">{agentRole}</p>
        </div>
      )}
    </div>
  );
}
