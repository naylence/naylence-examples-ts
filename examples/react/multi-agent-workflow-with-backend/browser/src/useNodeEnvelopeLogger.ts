import { useEffect } from 'react';
import { useFabric } from '@naylence/react';
import { BaseNodeEventListener, type NodeLike } from '@naylence/runtime';
import type { FameEnvelope, FameDeliveryContext } from '@naylence/core';
import { useEnvelopeContext } from './EnvelopeContext';

class ReactEnvelopeListener extends BaseNodeEventListener {
  private logCallback: (dir: 'inbound' | 'outbound', env: FameEnvelope) => void;

  constructor(
    logCallback: (dir: 'inbound' | 'outbound', env: FameEnvelope) => void
  ) {
    super(10000); // High priority to capture signed envelopes
    this.logCallback = logCallback;
  }

  async onEnvelopeReceived(_node: NodeLike, envelope: FameEnvelope, _context?: FameDeliveryContext): Promise<FameEnvelope | null> {
    this.logCallback('inbound', envelope);
    return envelope;
  }

  async onForwardUpstream(_node: NodeLike, envelope: FameEnvelope, _context?: FameDeliveryContext): Promise<FameEnvelope | null> {
    this.logCallback('outbound', envelope);
    return envelope;
  }

  async onForwardToRoute(_node: NodeLike, _nextSegment: string, envelope: FameEnvelope, _context?: FameDeliveryContext): Promise<FameEnvelope | null> {
    this.logCallback('outbound', envelope);
    return envelope;
  }
}

export function useNodeEnvelopeLogger() {
  const { fabric } = useFabric();
  const { addLog, debugMode } = useEnvelopeContext();

  useEffect(() => {
    if (!fabric || !debugMode) return;

    const node = (fabric as any).node as NodeLike;
    if (!node) return;

    const listener = new ReactEnvelopeListener(addLog);
    node.addEventListener(listener);

    return () => {
      node.removeEventListener(listener);
    };
  }, [fabric, addLog, debugMode]);
}
