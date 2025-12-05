import { useState } from 'react';
import { useFabric, useRemoteAgent } from '@naylence/react';
import type { WorkflowAgent } from './WorkflowAgent';
import type { WorkflowResult } from './config';
import { useNodeEnvelopeLogger } from './useNodeEnvelopeLogger';
import { useEnvelopeContext } from './EnvelopeContext';

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog. This classic pangram contains every letter of the English alphabet. It has been used for decades to test typewriters and fonts. The sentence is memorable and easy to type. Many people use it for keyboard practice and design work.`;
const MAX_LENGTH = 5000;

export function ClientNode() {
  const { fabric, error } = useFabric();
  const [text, setText] = useState('');
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const nodeId = 'Client';
  useNodeEnvelopeLogger(nodeId);
  const { selectedNodeId, setSelectedNodeId } = useEnvelopeContext();
  const isSelected = selectedNodeId === nodeId;
  
  // Use the useRemoteAgent hook to get the workflow agent proxy
  const workflowAgent = useRemoteAgent<WorkflowAgent>('workflow@fame.fabric');

  const runWorkflow = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when clicking button
    if (!workflowAgent || !text.trim()) return;
    
    try {
      setLoading(true);
      // Don't clear results to avoid flicker - just keep previous results visible
      // Call the workflow agent's runTask method
      const workflowResult = await workflowAgent.runTask({ text });
      setResult(workflowResult);
    } catch (err) {
      console.error('Workflow call failed:', err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    setText(SAMPLE_TEXT);
    setResult(null);
  };

  return (
    <div 
      className={`card client-card ${isSelected ? 'selected' : ''}`}
      onClick={() => setSelectedNodeId(nodeId)}
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
            <div className="input-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label htmlFor="text-input" className="input-label">Enter text to analyze:</label>
              <span style={{ fontSize: '11px', color: text.length >= MAX_LENGTH ? '#e53e3e' : '#718096' }}>
                {text.length}/{MAX_LENGTH}
              </span>
            </div>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Prevent card selection when typing
              placeholder="Type or paste text here..."
              className="client-textarea"
              rows={4}
              maxLength={MAX_LENGTH}
            />
            <div className="button-group">
              <button 
                onClick={loadSample}
                className="secondary-button"
              >
                Load Sample
              </button>
              <button 
                onClick={runWorkflow} 
                disabled={loading || !workflowAgent || !text.trim()}
                className="primary-button"
              >
                {loading ? 'Analyzing...' : 'Run Workflow'}
              </button>
            </div>
          </div>
          
          <div className="client-results">
            {loading && <div className="results-loading-overlay">Analyzing...</div>}
            <h3>Analysis Results</h3>
            
            {result ? (
              <div className="results-content">
                {/* Summary - always visible */}
                <div className="results-summary">
                  <div className="results-summary-line">
                    <div><strong>Characters:</strong> {result.stats.charCount}</div>
                    <div><strong>Words:</strong> {result.stats.wordCount}</div>
                  </div>
                  <div className="results-summary-line">
                    <div><strong>Sentences:</strong> {result.stats.sentenceCount}</div>
                    <div><strong>Reading time:</strong> ~{result.stats.readingTimeMinutes} min</div>
                  </div>
                </div>
                
                <div className="details-content">
                    <div className="result-section">
                      <h4>🔑 Top Keywords</h4>
                      {result.keywords.topWords.length > 0 ? (
                        <ul className="keywords-list">
                          {result.keywords.topWords.map(({ word, count }) => (
                            <li key={word}>
                              <span className="keyword">{word}</span>
                              <span className="count">×{count}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="no-data">No keywords found</p>
                      )}
                    </div>
                    
                    <div className="result-section">
                      <h4>📝 Preview</h4>
                      {result.sentences.preview.length > 0 ? (
                        <div className="preview-sentences">
                          {result.sentences.preview.map((sentence, idx) => (
                            <p key={idx} className="preview-sentence">{sentence}.</p>
                          ))}
                          {result.sentences.totalSentences > result.sentences.preview.length && (
                            <p className="preview-more">
                              ...and {result.sentences.totalSentences - result.sentences.preview.length} more sentence(s)
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="no-data">No sentences found</p>
                      )}
                    </div>
                  </div>
              </div>
            ) : (
              <div className="results-placeholder">
                <p>Enter text and click "Run Workflow" to analyze</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
