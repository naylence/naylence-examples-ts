import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { FameEnvelope } from '@naylence/core';

export interface EnvelopeLogEntry {
  id: string;
  timestamp: Date;
  direction: 'inbound' | 'outbound';
  envelope: FameEnvelope;
}

interface EnvelopeContextType {
  logs: EnvelopeLogEntry[];
  addLog: (direction: 'inbound' | 'outbound', envelope: FameEnvelope) => void;
  clearLogs: () => void;
  debugMode: boolean;
  setDebugMode: (enabled: boolean) => void;
}

const EnvelopeContext = createContext<EnvelopeContextType | undefined>(undefined);

export function EnvelopeProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<EnvelopeLogEntry[]>([]);
  const [debugMode, setDebugMode] = useState(false);

  const addLog = useCallback((direction: 'inbound' | 'outbound', envelope: FameEnvelope) => {
    // Deep clone to prevent mutation issues
    const clonedEnvelope = JSON.parse(JSON.stringify(envelope));
    
    setLogs((prev) => {
      // Deduplication: Check if we just logged this exact envelope
      const isDuplicate = prev.slice(-5).some(log => 
        log.direction === direction && 
        log.envelope.id === clonedEnvelope.id &&
        (new Date().getTime() - log.timestamp.getTime() < 100)
      );

      if (isDuplicate) {
        return prev;
      }

      const entry: EnvelopeLogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        direction,
        envelope: clonedEnvelope,
      };

      const newLogs = [...prev, entry];
      if (newLogs.length > 200) { // Keep last 200 logs
        return newLogs.slice(newLogs.length - 200);
      }
      return newLogs;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <EnvelopeContext.Provider
      value={{
        logs,
        addLog,
        clearLogs,
        debugMode,
        setDebugMode,
      }}
    >
      {children}
    </EnvelopeContext.Provider>
  );
}

export function useEnvelopeContext() {
  const context = useContext(EnvelopeContext);
  if (!context) {
    throw new Error('useEnvelopeContext must be used within an EnvelopeProvider');
  }
  return context;
}
