import { FameDeliveryContext, FameEnvelope, withFabric } from "@naylence/core";
import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { ANALYSIS_AGENT_ADDR } from "../../src/common.js";
import { BaseNodeEventListener, NodeLike } from "@naylence/runtime";

// Get WebSocket URL from env.js
declare global {
  interface Window {
    WEBSOCKET_URL: string;
  }
}

const WEBSOCKET_URL = window.WEBSOCKET_URL;

function getElementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element as T;
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
  
  // Clear and rebuild content, but preserve scroll position
  const scrollTop = logContainer.scrollTop;
  logContainer.innerHTML = "";

  if (envelopeLog.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "envelope-empty";
    emptyDiv.textContent = "No envelopes captured yet. Perform an analysis to see envelope traffic.";
    logContainer.append(emptyDiv);
    if (wasCollapsed) {
      logContainer.classList.add("collapsed");
    }
    return;
  }

  // Auto-expand on first envelope if user hasn't manually toggled
  if (envelopeLog.length === 1 && !userHasToggledEnvelope) {
    logContainer.classList.remove("collapsed");
    const toggleButton = getElementById<HTMLButtonElement>("toggleEnvelopes");
    toggleButton.textContent = "▲ Hide";
  }

  for (const entry of envelopeLog) {
    const entryDiv = document.createElement("div");
    entryDiv.className = "envelope-entry";

    const headerDiv = document.createElement("div");
    headerDiv.className = "envelope-entry-header";

    const directionSpan = document.createElement("span");
    directionSpan.className = `envelope-direction ${entry.direction}`;
    directionSpan.textContent = entry.direction === "inbound" ? "↓" : "↑";

    const metaDiv = document.createElement("div");
    metaDiv.className = "envelope-meta";

    const timestampSpan = document.createElement("span");
    timestampSpan.className = "envelope-timestamp";
    timestampSpan.textContent = formatTimestamp(entry.timestamp);

    const typeSpan = document.createElement("span");
    typeSpan.className = "envelope-type";
    typeSpan.textContent = entry.envelope.frame.type || "Unknown";

    const expandIcon = document.createElement("span");
    expandIcon.className = "envelope-expand-icon";
    expandIcon.textContent = "▼";

    metaDiv.append(timestampSpan, typeSpan);
    headerDiv.append(directionSpan, metaDiv, expandIcon);

    const contentDiv = document.createElement("div");
    contentDiv.className = "envelope-content";

    const jsonPre = document.createElement("pre");
    jsonPre.className = "envelope-json";
    const jsonString = JSON.stringify(entry.envelope, null, 2);
    jsonPre.innerHTML = syntaxHighlightJson(jsonString);

    contentDiv.append(jsonPre);

    headerDiv.addEventListener("click", () => {
      entryDiv.classList.toggle("expanded");
    });

    entryDiv.append(headerDiv, contentDiv);
    logContainer.append(entryDiv);
  }

  // Restore collapsed state only if it was already collapsed and user has toggled
  if (wasCollapsed && userHasToggledEnvelope) {
    logContainer.classList.add("collapsed");
  }
  
  // Restore scroll position
  logContainer.scrollTop = scrollTop;
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

// Operation: Analyze Text
async function performAnalysis(): Promise<void> {
  const analyzeButton = getElementById<HTMLButtonElement>("analyzeButton");
  const textInput = getElementById<HTMLTextAreaElement>("textInput");
  const summaryDiv = getElementById<HTMLDivElement>("summaryResult");
  const sentimentDiv = getElementById<HTMLDivElement>("sentimentResult");

  try {
    analyzeButton.disabled = true;
    summaryDiv.className = "result-box loading";
    summaryDiv.textContent = "Analyzing...";
    sentimentDiv.className = "result-box loading";
    sentimentDiv.textContent = "...";

    const text = textInput.value.trim();
    if (!text) {
      throw new Error("Please enter some text to analyze");
    }

    await withFabric({ rootConfig: { ...CLIENT_CONFIG, websocketUrl: WEBSOCKET_URL } }, async (fabric) => {
      const node: NodeLike = (fabric as any).node;
      node.addEventListener(new EnvelopeEventListener());

      const agent = Agent.remoteByAddress(ANALYSIS_AGENT_ADDR);
      const result = await agent.runTask(text);

      summaryDiv.className = "result-box";
      summaryDiv.textContent = result.summary || "No summary available";

      sentimentDiv.className = "result-box sentiment";
      const sentimentScore = parseInt(result.sentiment, 10);
      sentimentDiv.textContent = result.sentiment;
      sentimentDiv.setAttribute("data-sentiment", String(sentimentScore));
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Analysis failed:", error);
    summaryDiv.className = "result-box error";
    summaryDiv.textContent = `Error: ${message}`;
    sentimentDiv.className = "result-box error";
    sentimentDiv.textContent = "—";
  } finally {
    analyzeButton.disabled = false;
  }
}

function loadSampleText(): void {
  const textInput = getElementById<HTMLTextAreaElement>("textInput");
  textInput.value = `I just watched the new sci-fi film "Galactic Frontier" and I have mixed feelings. The visuals were stunning and the world-building immersive, but the plot felt predictable and some characters lacked depth. Overall, it was an entertaining experience but not groundbreaking.`;
}

function main(): void {
  try {
    const analyzeButton = getElementById<HTMLButtonElement>("analyzeButton");
    const loadSampleButton = getElementById<HTMLButtonElement>("loadSampleButton");
    const toggleButton = getElementById<HTMLButtonElement>("toggleEnvelopes");
    const clearButton = getElementById<HTMLButtonElement>("clearEnvelopes");
    const envelopeLogContainer = getElementById<HTMLDivElement>("envelopeLog");

    renderEnvelopeLog();

    analyzeButton.addEventListener("click", () => {
      void performAnalysis();
    });

    loadSampleButton.addEventListener("click", () => {
      loadSampleText();
    });

    toggleButton.addEventListener("click", () => {
      userHasToggledEnvelope = true;
      const isCollapsed = envelopeLogContainer.classList.toggle("collapsed");
      toggleButton.textContent = isCollapsed ? "▼ Show" : "▲ Hide";
    });

    clearButton.addEventListener("click", () => {
      clearEnvelopeLog();
    });

    console.log("✅ Multi-agent browser client initialized");
    console.log(`📡 Connecting to: ${WEBSOCKET_URL}`);
  } catch (error) {
    console.error("Failed to initialize browser client:", error);
  }
}

main();
