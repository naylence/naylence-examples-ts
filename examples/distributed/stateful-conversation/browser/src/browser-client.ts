import { FameFabric, FameDeliveryContext, FameEnvelope } from "@naylence/core";
import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { AGENT_ADDR } from "../../src/common.js";
import { BaseNodeEventListener, NodeLike, generateId } from "@naylence/runtime";

// Fabric lifecycle state
let activeFabric: FameFabric | null = null;
let conversationId: string | null = null;

// Chat state
type ChatState = "disconnected" | "connecting" | "connected";
let chatState: ChatState = "disconnected";

function getElementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element as T;
}

function setChatStatus(state: ChatState, message?: string): void {
  const statusElement = getElementById<HTMLDivElement>("chatStatus");
  chatState = state;
  statusElement.className = `chat-status ${state}`;
  statusElement.textContent = message || state.charAt(0).toUpperCase() + state.slice(1);
}

function addMessage(role: "user" | "assistant" | "system", content: string): void {
  const messagesContainer = getElementById<HTMLDivElement>("chatMessages");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = content;
  messagesContainer.append(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addLoadingMessage(): HTMLDivElement {
  const messagesContainer = getElementById<HTMLDivElement>("chatMessages");
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "message loading";
  loadingDiv.innerHTML = `
    <div class="loading-dots">
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
    </div>
    <span>Thinking...</span>
  `;
  messagesContainer.append(loadingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return loadingDiv;
}

function removeLoadingMessage(loadingDiv: HTMLDivElement): void {
  loadingDiv.remove();
}

function clearMessages(): void {
  const messagesContainer = getElementById<HTMLDivElement>("chatMessages");
  messagesContainer.innerHTML = "";
}

// Envelope tracking infrastructure
interface EnvelopeLogEntry {
  timestamp: Date;
  direction: "inbound" | "outbound";
  envelope: FameEnvelope;
}

const envelopeLog: EnvelopeLogEntry[] = [];
const MAX_ENVELOPES = 100;
let userHasToggledEnvelope = false;

function addEnvelopeToLog(direction: "inbound" | "outbound", envelope: FameEnvelope): void {
  const clonedEnvelope = JSON.parse(JSON.stringify(envelope)) as FameEnvelope;
  
  envelopeLog.push({
    timestamp: new Date(),
    direction,
    envelope: clonedEnvelope,
  });
  if (envelopeLog.length > MAX_ENVELOPES) {
    envelopeLog.shift();
  }
  renderEnvelopeLog();
}

function clearEnvelopeLog(): void {
  envelopeLog.length = 0;
  renderEnvelopeLog();
}

function formatTimestamp(date: Date): string {
  const timeStr = date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const ms = date.getMilliseconds().toString().padStart(3, "0");
  return `${timeStr}.${ms}`;
}

function syntaxHighlightJson(json: string): string {
  return json
    .replace(/("(?:\\.|[^"\\])*")\s*:/g, '<span style="color:#63b3ed">$1</span>:')
    .replace(/:\s*("(?:\\.|[^"\\])*")/g, ': <span style="color:#9ae6b4">$1</span>')
    .replace(/:\s*(\d+)/g, ': <span style="color:#f6ad55">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span style="color:#fc8181">$1</span>');
}

function renderEnvelopeLog(): void {
  const logContainer = getElementById<HTMLDivElement>("envelopeLog");
  const wasCollapsed = logContainer.classList.contains("collapsed");
  logContainer.innerHTML = "";

  if (envelopeLog.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "envelope-empty";
    emptyDiv.textContent = "No envelopes captured yet. Start a chat to see envelope traffic.";
    logContainer.append(emptyDiv);
    if (wasCollapsed) {
      logContainer.classList.add("collapsed");
    }
    return;
  }

  if (envelopeLog.length === 1 && wasCollapsed && !userHasToggledEnvelope) {
    logContainer.classList.remove("collapsed");
    const toggleButton = getElementById<HTMLButtonElement>("toggleEnvelopes");
    toggleButton.textContent = "▲ Hide";
  } else if (wasCollapsed) {
    logContainer.classList.add("collapsed");
  }

  for (const entry of envelopeLog) {
    const entryDiv = document.createElement("div");
    entryDiv.className = "envelope-entry";

    const headerDiv = document.createElement("div");
    headerDiv.className = "envelope-entry-header";

    const directionSpan = document.createElement("span");
    directionSpan.className = `envelope-direction ${entry.direction}`;
    directionSpan.textContent = entry.direction === "inbound" ? "⬇️" : "⬆️";

    const metaDiv = document.createElement("div");
    metaDiv.className = "envelope-meta";

    const timestampSpan = document.createElement("span");
    timestampSpan.className = "envelope-timestamp";
    timestampSpan.textContent = formatTimestamp(entry.timestamp);

    const typeSpan = document.createElement("span");
    typeSpan.className = "envelope-type";
    const frame = entry.envelope.frame as any;
    const envelopeType = frame?.type || frame?.method || "envelope";
    typeSpan.textContent = entry.direction === "inbound" ? `← ${envelopeType}` : `→ ${envelopeType}`;

    const expandIcon = document.createElement("span");
    expandIcon.className = "envelope-expand-icon";
    expandIcon.textContent = "▼";

    metaDiv.append(timestampSpan, typeSpan);
    headerDiv.append(directionSpan, metaDiv, expandIcon);

    const contentDiv = document.createElement("div");
    contentDiv.className = "envelope-content";

    const preElement = document.createElement("pre");
    preElement.className = "envelope-json";
    const jsonString = JSON.stringify(entry.envelope, null, 2);
    preElement.innerHTML = syntaxHighlightJson(jsonString);

    contentDiv.append(preElement);

    headerDiv.addEventListener("click", () => {
      entryDiv.classList.toggle("expanded");
    });

    entryDiv.append(headerDiv, contentDiv);
    logContainer.append(entryDiv);
  }
}

class EnvelopeEventListener extends BaseNodeEventListener {
  constructor() {
    super(10000);
  }
  async onEnvelopeReceived(_node: NodeLike, envelope: FameEnvelope, _context?: FameDeliveryContext): Promise<FameEnvelope | null> {
    addEnvelopeToLog("inbound", envelope);
    return envelope;
  }

  async onForwardUpstream(_node: NodeLike, envelope: FameEnvelope, _context?: FameDeliveryContext): Promise<FameEnvelope | null> {
    addEnvelopeToLog("outbound", envelope);
    return envelope;
  }
}

// Chat session management
async function startChat(): Promise<void> {
  const startButton = getElementById<HTMLButtonElement>("startChatButton");
  const stopButton = getElementById<HTMLButtonElement>("stopChatButton");
  const messageInput = getElementById<HTMLTextAreaElement>("messageInput");
  const sendButton = getElementById<HTMLButtonElement>("sendButton");

  try {
    startButton.disabled = true;
    setChatStatus("connecting", "Connecting to fabric...");
    clearMessages();

    // Create and enter fabric (persistent connection)
    activeFabric = await FameFabric.create({ rootConfig: CLIENT_CONFIG });
    await activeFabric.enter();

    // Register envelope listener
    const node: NodeLike = (activeFabric as any).node;
    if (node) {
      node.addEventListener(new EnvelopeEventListener());
    }

    // Start conversation with agent
    const agent = Agent.remoteByAddress(AGENT_ADDR);
    conversationId = generateId();

    await agent.startTask({
      id: conversationId,
      historyLength: 10,
      payload: { system_prompt: "You are a helpful assistant" },
    });

    setChatStatus("connected", "Connected — Chat active");
    addMessage("system", "Chat started. The assistant is ready to help you.");

    // Enable chat controls
    stopButton.disabled = false;
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setChatStatus("disconnected", `Error: ${message}`);
    addMessage("system", `Failed to start chat: ${message}`);
    console.error("Failed to start chat:", error);

    // Cleanup on error
    if (activeFabric) {
      try {
        await activeFabric.exit();
      } catch (exitError) {
        console.error("Error during fabric cleanup:", exitError);
      }
      activeFabric = null;
    }
    conversationId = null;
    startButton.disabled = false;
  }
}

async function stopChat(): Promise<void> {
  const startButton = getElementById<HTMLButtonElement>("startChatButton");
  const stopButton = getElementById<HTMLButtonElement>("stopChatButton");
  const messageInput = getElementById<HTMLTextAreaElement>("messageInput");
  const sendButton = getElementById<HTMLButtonElement>("sendButton");

  try {
    stopButton.disabled = true;
    messageInput.disabled = true;
    sendButton.disabled = true;

    if (conversationId && activeFabric) {
      setChatStatus("connecting", "Ending conversation...");
      try {
        const agent = Agent.remoteByAddress(AGENT_ADDR);
        await agent.end_conversation(conversationId);
        addMessage("system", "Conversation ended.");
      } catch (error) {
        console.error("Error ending conversation:", error);
      }
    }

    // Exit fabric
    if (activeFabric) {
      await activeFabric.exit();
      activeFabric = null;
    }

    conversationId = null;
    setChatStatus("disconnected", "Disconnected");
    startButton.disabled = false;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to stop chat:", error);
    setChatStatus("disconnected", `Error: ${message}`);
    addMessage("system", `Error stopping chat: ${message}`);
    startButton.disabled = false;
  }
}

async function sendMessage(): Promise<void> {
  const messageInput = getElementById<HTMLTextAreaElement>("messageInput");
  const sendButton = getElementById<HTMLButtonElement>("sendButton");

  if (!activeFabric || !conversationId) {
    addMessage("system", "Error: Chat not started. Please click 'Start Chat' first.");
    return;
  }

  const userMessage = messageInput.value.trim();
  if (!userMessage) {
    return;
  }

  try {
    sendButton.disabled = true;
    messageInput.disabled = true;

    // Display user message
    addMessage("user", userMessage);
    messageInput.value = "";

    // Show loading animation
    const loadingDiv = addLoadingMessage();

    // Send to agent and get response
    const agent = Agent.remoteByAddress(AGENT_ADDR);
    const response = await agent.run_turn(conversationId, userMessage);

    // Remove loading animation and display assistant response
    removeLoadingMessage(loadingDiv);
    addMessage("assistant", String(response));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to send message:", error);
    addMessage("system", `Error: ${message}`);
  } finally {
    if (chatState === "connected") {
      sendButton.disabled = false;
      messageInput.disabled = false;
      messageInput.focus();
    }
  }
}

function main(): void {
  try {
    const startButton = getElementById<HTMLButtonElement>("startChatButton");
    const stopButton = getElementById<HTMLButtonElement>("stopChatButton");
    const sendButton = getElementById<HTMLButtonElement>("sendButton");
    const messageInput = getElementById<HTMLTextAreaElement>("messageInput");
    const toggleButton = getElementById<HTMLButtonElement>("toggleEnvelopes");
    const clearButton = getElementById<HTMLButtonElement>("clearEnvelopes");
    const envelopeLogContainer = getElementById<HTMLDivElement>("envelopeLog");

    renderEnvelopeLog();

    startButton.addEventListener("click", () => {
      void startChat();
    });

    stopButton.addEventListener("click", () => {
      void stopChat();
    });

    sendButton.addEventListener("click", () => {
      void sendMessage();
    });

    messageInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void sendMessage();
      }
    });

    toggleButton.addEventListener("click", () => {
      const isCollapsed = envelopeLogContainer.classList.toggle("collapsed");
      toggleButton.textContent = isCollapsed ? "▼ Show" : "▲ Hide";
      userHasToggledEnvelope = true;
    });

    clearButton.addEventListener("click", () => {
      clearEnvelopeLog();
    });

    // Handle page unload - cleanup fabric
    window.addEventListener("beforeunload", () => {
      if (activeFabric) {
        void activeFabric.exit();
      }
    });
  } catch (error) {
    console.error("Failed to initialise stateful conversation browser client:", error);
    addMessage("system", "Failed to initialise client. See console for details.");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
