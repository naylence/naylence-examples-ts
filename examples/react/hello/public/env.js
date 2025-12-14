// WebSocket URL for backend sentinel
window.WEBSOCKET_URL = window.WEBSOCKET_URL || 'ws://localhost:8000/fame/v1/attach/ws/downstream';
window.__ENV__ = window.__ENV__ || {};
window.__ENV__.FAME_LOG_LEVEL = 'WARNING';
window.__ENV__.FAME_SHOW_ENVELOPES = 'false';

