import { useState } from 'react';
import { useEnvelopeContext, type EnvelopeLogEntry } from './EnvelopeContext';

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 });
}

function syntaxHighlightJson(json: string): string {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
}

function LogEntry({ entry }: { entry: EnvelopeLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const frame = entry.envelope.frame as any;
  const envelopeType = frame?.type || frame?.method || "envelope";

  const jsonHtml = syntaxHighlightJson(JSON.stringify(entry.envelope, null, 2));

  return (
    <div className={`envelope-entry ${expanded ? 'expanded' : ''}`}>
      <div className="envelope-entry-header" onClick={() => setExpanded(!expanded)}>
        <span className={`envelope-direction ${entry.direction}`}>
          {entry.direction === 'inbound' ? '⬇️' : '⬆️'}
        </span>
        <div className="envelope-meta">
          <span className="envelope-timestamp">{formatTimestamp(entry.timestamp)}</span>
          <span className="envelope-type">
            {entry.direction === 'inbound' ? `← ${envelopeType}` : `→ ${envelopeType}`}
          </span>
        </div>
        <span className="envelope-expand-icon">▼</span>
      </div>
      {expanded && (
        <div className="envelope-content">
          <pre 
            className="envelope-json" 
            dangerouslySetInnerHTML={{ __html: jsonHtml }} 
          />
        </div>
      )}
    </div>
  );
}

export function EnvelopeInspector() {
  const { logs, clearLogs, selectedNodeId, debugMode, setDebugMode } = useEnvelopeContext();

  if (!debugMode) {
    return (
      <div className="envelope-inspector-hint">
        <p>Debug is off. <button onClick={() => setDebugMode(true)} className="link-button">Enable</button> to inspect envelopes.</p>
      </div>
    );
  }

  const filteredLogs = selectedNodeId 
    ? logs.filter(l => l.nodeId === selectedNodeId)
    : logs;

  return (
    <div className="envelope-inspector">
      <div className="envelope-inspector-header">
        <h2>
          Envelope Inspector 
          {selectedNodeId && <span className="selected-node-badge">{selectedNodeId}</span>}
        </h2>
        <div className="envelope-controls">
          <button onClick={clearLogs} className="small-button">Clear</button>
          <button onClick={() => setDebugMode(false)} className="small-button">Hide</button>
        </div>
      </div>
      
      <div className="envelope-log" id="envelopeLog">
        {filteredLogs.length === 0 ? (
          <div className="envelope-empty">
            {selectedNodeId 
              ? `No envelopes captured for ${selectedNodeId}.` 
              : "No envelopes captured yet. Select a node to filter."}
          </div>
        ) : (
          filteredLogs.map(entry => (
            <LogEntry key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}
