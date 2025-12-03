import { useFabric, useFabricEffect } from '@naylence/react';

interface SentinelNodeProps {
  onReady?: () => void;
}

export function SentinelNode({ onReady }: SentinelNodeProps) {
  const { fabric, error } = useFabric();

  useFabricEffect(() => {
    // Sentinel is ready as soon as fabric is initialized
    console.log('Sentinel is ready');
    onReady?.();
  }, []);

  return (
    <div className="card">
      <div className="sentinel-icon-container">
        <img src="/images/sentinel.svg" alt="Sentinel" className="sentinel-icon" />
      </div>
      <h2>Sentinel</h2>
      {error != null && <p className="status-error">Error: {String(error)}</p>}
      {fabric && (
        <div>
          <p className="status-active">✅ Active</p>
          <p className="node-info">Routing messages between nodes</p>
        </div>
      )}
    </div>
  );
}
