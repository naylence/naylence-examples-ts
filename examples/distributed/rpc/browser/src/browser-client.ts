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

function setAddResult(result: number): void {
  const resultElement = getElementById<HTMLSpanElement>("addResult");
  resultElement.textContent = result.toString();
  resultElement.classList.remove("placeholder");
}

function setMultiplyResult(result: number): void {
  const resultElement = getElementById<HTMLSpanElement>("multiplyResult");
  resultElement.textContent = result.toString();
  resultElement.classList.remove("placeholder");
}

function clearFibStream(): void {
  const fibStreamElement = getElementById<HTMLDivElement>("fibStream");
  fibStreamElement.textContent = "—";
  fibStreamElement.classList.add("placeholder");
}

function appendFibTerm(value: number): void {
  const fibStreamElement = getElementById<HTMLDivElement>("fibStream");
  // Clear placeholder text on first term
  if (fibStreamElement.classList.contains("placeholder")) {
    fibStreamElement.textContent = "";
    fibStreamElement.classList.remove("placeholder");
  }

  const chip = document.createElement("span");
  chip.textContent = String(value);
  fibStreamElement.append(chip);
}

function readNumberInput(id: string): number {
  const input = getElementById<HTMLInputElement>(id);
  const parsed = Number.parseFloat(input.value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Input ${id} must be a finite number.`);
  }
  return parsed;
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
    emptyDiv.textContent = "No envelopes captured yet. Run the demo to see envelope traffic.";
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

let runInFlight = false;

async function runDemo(): Promise<void> {
  const runButton = getElementById<HTMLButtonElement>("runButton");

  try {
    if (runInFlight) {
      return;
    }
    runInFlight = true;
    runButton.disabled = true;
    setStatus("Connecting to fabric…", "loading");

    const addX = readNumberInput("addX");
    const addY = readNumberInput("addY");
    const multiplyX = readNumberInput("multiplyX");
    const multiplyY = readNumberInput("multiplyY");
    const fibCountRaw = readNumberInput("fibCount");
    const fibCount = Math.max(1, Math.min(32, Math.floor(fibCountRaw)));
    getElementById<HTMLInputElement>("fibCount").value = String(fibCount);

    await withFabric({ rootConfig: CLIENT_CONFIG }, async (fabric) => {
      const node: NodeLike = (fabric as any).node;
      node.addEventListener(new EnvelopeEventListener);
      setStatus("Connected. Performing math operations…", "loading");

      const remote = Agent.remoteByAddress(AGENT_ADDR);

      const addition = await remote.add({ x: addX, y: addY });
      setAddResult(addition);

      const multiplication = await remote.multiply({ x: multiplyX, y: multiplyY });
      setMultiplyResult(multiplication);

      setStatus("Streaming Fibonacci values…", "loading");
      clearFibStream();
      const fibStream = await remote.fib_stream({ _stream: true, n: fibCount });
      for await (const value of fibStream as AsyncIterable<number>) {
        appendFibTerm(value);
      }
    });

    setStatus("✔ RPC and streaming completed.", "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`✗ Error: ${message}`, "error");
    console.error("Distributed RPC demo failed:", error);
  } finally {
    runInFlight = false;
    runButton.disabled = false;
  }
}

function main(): void {
  try {
    const runButton = getElementById<HTMLButtonElement>("runButton");
    const toggleButton = getElementById<HTMLButtonElement>("toggleEnvelopes");
    const clearButton = getElementById<HTMLButtonElement>("clearEnvelopes");
    const envelopeLogContainer = getElementById<HTMLDivElement>("envelopeLog");

    renderEnvelopeLog();

    runButton.addEventListener("click", () => {
      void runDemo();
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
    console.error("Failed to initialise distributed RPC browser client:", error);
    setStatus("✗ Failed to initialise client. See console for details.", "error");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
