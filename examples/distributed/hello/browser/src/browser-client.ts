import { FameDeliveryContext, FameEnvelope, withFabric } from "@naylence/core";
import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { AGENT_ADDR } from "../../src/common.js";
import { BaseNodeEventListener, NodeLike } from "@naylence/runtime";

function getElementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element as T;
}

function setStatus(message: string, className: "default" | "loading" | "success" | "error" = "default"): void {
  const status = getElementById<HTMLDivElement>("status");
  status.textContent = message;
  status.className = className === "default" ? "" : className;
}

function setEchoResult(result: string): void {
  const resultElement = getElementById<HTMLDivElement>("echoResult");
  resultElement.textContent = result;
  resultElement.classList.remove("placeholder");
}

function clearEchoResult(): void {
  const resultElement = getElementById<HTMLDivElement>("echoResult");
  resultElement.textContent = "—";
  resultElement.classList.add("placeholder");
}

interface EnvelopeLogEntry {
  timestamp: Date;
  direction: "inbound" | "outbound";
  envelope: FameEnvelope;
}

const envelopeLog: EnvelopeLogEntry[] = [];
const MAX_ENVELOPES = 100;
let userHasToggledEnvelope = false;

function addEnvelopeToLog(direction: "inbound" | "outbound", envelope: FameEnvelope): void {
  // Deep clone the envelope to capture its state at this moment
  // This prevents mutations from affecting the logged version
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
  return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 });
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
    emptyDiv.textContent = "No envelopes captured yet. Send a message to see envelope traffic.";
    logContainer.append(emptyDiv);
    // Preserve collapsed state when empty
    if (wasCollapsed) {
      logContainer.classList.add("collapsed");
    }
    return;
  }

  // Auto-expand when first envelope arrives (only if user hasn't manually toggled)
  if (envelopeLog.length === 1 && wasCollapsed && !userHasToggledEnvelope) {
    logContainer.classList.remove("collapsed");
    const toggleButton = getElementById<HTMLButtonElement>("toggleEnvelopes");
    toggleButton.textContent = "▲ Hide";
  } else if (wasCollapsed) {
    // Preserve collapsed state
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
    // The 10000 priority ensures we capture envelopes after they've been signed
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

let sendInFlight = false;

async function sendMessage(): Promise<void> {
  const sendButton = getElementById<HTMLButtonElement>("sendButton");
  const messageInput = getElementById<HTMLInputElement>("messageInput");

  try {
    if (sendInFlight) {
      return;
    }
    sendInFlight = true;
    sendButton.disabled = true;
    setStatus("Connecting to fabric…", "loading");
    clearEchoResult();

    const message = messageInput.value.trim();
    if (!message) {
      setStatus("✗ Please enter a message to send.", "error");
      return;
    }

    await withFabric({ rootConfig: CLIENT_CONFIG }, async (fabric) => {
      const node: NodeLike = (fabric as any).node;
      node.addEventListener(new EnvelopeEventListener);
      setStatus("Connected. Sending message to Echo agent…", "loading");

      const remote = Agent.remoteByAddress(AGENT_ADDR);
      const echoResponse = await remote.runTask(message);

      setEchoResult(String(echoResponse));
      setStatus("✔ Message sent and echo received successfully.", "success");
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`✗ Error: ${message}`, "error");
    console.error("Echo message failed:", error);
  } finally {
    sendInFlight = false;
    sendButton.disabled = false;
  }
}

function main(): void {
  try {
    const sendButton = getElementById<HTMLButtonElement>("sendButton");
    const messageInput = getElementById<HTMLInputElement>("messageInput");
    const toggleButton = getElementById<HTMLButtonElement>("toggleEnvelopes");
    const clearButton = getElementById<HTMLButtonElement>("clearEnvelopes");
    const envelopeLogContainer = getElementById<HTMLDivElement>("envelopeLog");

    renderEnvelopeLog();

    sendButton.addEventListener("click", () => {
      void sendMessage();
    });

    messageInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
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
  } catch (error) {
    console.error("Failed to initialise hello browser client:", error);
    setStatus("✗ Failed to initialise client. See console for details.", "error");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
