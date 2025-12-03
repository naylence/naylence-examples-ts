import { FameFabric } from '@naylence/core';
import { enableLogging } from '@naylence/runtime';

// Enable debug logging
enableLogging('debug');

let sentinelFabric: any = null;
let clientFabric: any = null;
let messageCount = 0;

// Logging helpers
function log(nodeType: string, message: string, level: string = 'info') {
    const logDiv = document.getElementById(`${nodeType}-log`);
    if (!logDiv) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${level}`;
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${message}`;
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
    console.log(`[${nodeType}] ${message}`);
}

function updateStatus(nodeType: string, status: string, text: string) {
    const statusDiv = document.getElementById(`${nodeType}-status`);
    if (!statusDiv) return;
    
    statusDiv.className = `status ${status}`;
    statusDiv.textContent = text;
}

function updateNodeInfo(nodeType: string, fabric: any) {
    if (fabric && fabric.node) {
        const idEl = document.getElementById(`${nodeType}-id`);
        const sidEl = document.getElementById(`${nodeType}-sid`);
        
        if (idEl) idEl.textContent = fabric.node.id || '-';
        if (sidEl) {
            sidEl.textContent = fabric.node.sid 
                ? `${fabric.node.sid.substring(0, 20)}...` 
                : '-';
        }
    }
}

// Configuration
const channelName = 'test-reconnection';

const sentinelConfig = {
    rootConfig: {
        plugins: ['@naylence/runtime'],
        node: {
            type: 'Sentinel',
            id: 'sentinel-test',
            requestedLogicals: ['fame.fabric'],
            listeners: [{
                type: 'BroadcastChannelListener',
                channelName,
            }],
            security: {
                type: 'DefaultSecurityManager',
                security_policy: { type: 'NoSecurityPolicy' },
                authorizer: { type: 'NoopAuthorizer' },
            },
        },
    },
};

const clientConfig = {
    rootConfig: {
        plugins: ['@naylence/runtime'],
        node: {
            id: 'client-test',
            hasParent: true,
            requestedLogicals: ['fame.fabric'],
            security: {
                type: 'DefaultSecurityManager',
                security_policy: { type: 'NoSecurityPolicy' },
                authorizer: { type: 'NoopAuthorizer' },
            },
            admission: {
                type: 'DirectAdmissionClient',
                connectionGrants: [{
                    type: 'BroadcastChannelConnectionGrant',
                    purpose: 'node.attach',
                    channelName,
                    ttl: 0,
                    durable: false,
                }],
            },
        },
    },
};

// Start Sentinel
async function startSentinel() {
    try {
        log('sentinel', 'Creating fabric...', 'info');
        updateStatus('sentinel', 'connecting', 'Creating...');
        
        sentinelFabric = await FameFabric.create(sentinelConfig);
        log('sentinel', 'Fabric created, entering...', 'info');
        
        await sentinelFabric.enter();
        log('sentinel', 'Fabric entered successfully', 'info');
        
        updateStatus('sentinel', 'connected', 'Connected');
        updateNodeInfo('sentinel', sentinelFabric);
        
        (document.getElementById('start-sentinel') as HTMLButtonElement).disabled = true;
        (document.getElementById('stop-sentinel') as HTMLButtonElement).disabled = false;
        (document.getElementById('start-client') as HTMLButtonElement).disabled = false;
        
        // Register a simple echo service
        await sentinelFabric.serve({
            runTask: async (payload: any) => {
                const msg = payload.message || 'no message';
                log('sentinel', `Received: "${msg}"`, 'info');
                return `Echo: "${msg}"`;
            }
        }, 'test-echo@fame.fabric');
        
        log('sentinel', 'Service registered at test-echo@fame.fabric', 'info');
        
    } catch (err: any) {
        log('sentinel', `Error: ${err.message}`, 'error');
        updateStatus('sentinel', 'disconnected', 'Error');
        console.error('Sentinel error:', err);
    }
}

// Stop Sentinel
async function stopSentinel() {
    try {
        log('sentinel', 'Stopping...', 'warning');
        if (sentinelFabric) {
            await sentinelFabric.exit();
            sentinelFabric = null;
        }
        updateStatus('sentinel', 'disconnected', 'Stopped');
        (document.getElementById('start-sentinel') as HTMLButtonElement).disabled = false;
        (document.getElementById('stop-sentinel') as HTMLButtonElement).disabled = true;
    } catch (err: any) {
        log('sentinel', `Stop error: ${err.message}`, 'error');
    }
}

// Start Client
async function startClient() {
    try {
        log('client', 'Creating fabric...', 'info');
        updateStatus('client', 'connecting', 'Creating...');
        
        // Small delay to ensure sentinel is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        clientFabric = await FameFabric.create(clientConfig);
        log('client', 'Fabric created, entering...', 'info');
        
        await clientFabric.enter();
        log('client', 'Fabric entered successfully', 'info');
        
        updateStatus('client', 'connected', 'Connected');
        updateNodeInfo('client', clientFabric);
        
        (document.getElementById('start-client') as HTMLButtonElement).disabled = true;
        (document.getElementById('stop-client') as HTMLButtonElement).disabled = false;
        (document.getElementById('send-message') as HTMLButtonElement).disabled = false;
        
    } catch (err: any) {
        log('client', `Error: ${err.message}`, 'error');
        updateStatus('client', 'disconnected', 'Error');
        console.error('Client error:', err);
    }
}

// Stop Client
async function stopClient() {
    try {
        log('client', 'Stopping...', 'warning');
        if (clientFabric) {
            await clientFabric.exit();
            clientFabric = null;
        }
        updateStatus('client', 'disconnected', 'Stopped');
        (document.getElementById('start-client') as HTMLButtonElement).disabled = false;
        (document.getElementById('stop-client') as HTMLButtonElement).disabled = true;
        (document.getElementById('send-message') as HTMLButtonElement).disabled = true;
    } catch (err: any) {
        log('client', `Stop error: ${err.message}`, 'error');
    }
}

// Send Message
async function sendMessage() {
    try {
        const messageInput = document.getElementById('message-input') as HTMLInputElement;
        const message = messageInput.value;
        messageCount++;
        
        log('client', `Sending message #${messageCount}: "${message}"`, 'info');
        (document.getElementById('send-message') as HTMLButtonElement).disabled = true;
        
        const result = await clientFabric.invoke('test-echo@fame.fabric', 'runTask', {
            message: message
        });
        
        log('client', `Received response: "${result}"`, 'info');
        
        const responseBox = document.getElementById('response-box');
        const responseText = document.getElementById('response-text');
        if (responseBox) responseBox.style.display = 'block';
        if (responseText) responseText.textContent = result;
        
        (document.getElementById('send-message') as HTMLButtonElement).disabled = false;
        
    } catch (err: any) {
        log('client', `Send error: ${err.message}`, 'error');
        updateStatus('client', 'disconnected', 'Error - Check console');
        (document.getElementById('send-message') as HTMLButtonElement).disabled = false;
        console.error('Send message error:', err);
    }
}

// Setup event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-sentinel')?.addEventListener('click', startSentinel);
    document.getElementById('stop-sentinel')?.addEventListener('click', stopSentinel);
    document.getElementById('start-client')?.addEventListener('click', startClient);
    document.getElementById('stop-client')?.addEventListener('click', stopClient);
    document.getElementById('send-message')?.addEventListener('click', sendMessage);
    
    // Monitor page visibility
    document.addEventListener('visibilitychange', () => {
        const state = document.hidden ? 'hidden' : 'visible';
        log('sentinel', `Page visibility changed: ${state}`, 'warning');
        log('client', `Page visibility changed: ${state}`, 'warning');
    });
    
    // Log when page loads
    log('sentinel', 'Test page loaded - ready to start', 'info');
    log('client', 'Test page loaded - ready to start', 'info');
});
