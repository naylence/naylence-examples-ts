import { FameDeliveryContext, FameEnvelope, withFabric } from "@naylence/core";
import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { MATH_AGENT1_ADDR, MATH_AGENT2_ADDR } from "../../src/common.js";
import { BaseNodeEventListener, NodeLike } from "@naylence/runtime";

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
  logContainer.innerHTML = "";

  if (envelopeLog.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "envelope-empty";
    emptyDiv.textContent = "No envelopes captured yet. Perform an operation to see envelope traffic.";
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

  if (wasCollapsed) {
    logContainer.classList.add("collapsed");
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

async function performAdd(): Promise<void> {
  const addButton = getElementById<HTMLButtonElement>("addButton");
  const xInput = getElementById<HTMLInputElement>("addX");
  const yInput = getElementById<HTMLInputElement>("addY");
  const resultDiv = getElementById<HTMLDivElement>("addResult");

  try {
    addButton.disabled = true;
    resultDiv.className = "result-inline empty";
    resultDiv.textContent = "...";

    const x = parseFloat(xInput.value);
    const y = parseFloat(yInput.value);

    await withFabric({ rootConfig: CLIENT_CONFIG }, async (fabric) => {
      const node: NodeLike = (fabric as any).node;
      node.addEventListener(new EnvelopeEventListener());

      const agent = Agent.remoteByAddress(MATH_AGENT1_ADDR);
      const result = await agent.add({ x, y });

      resultDiv.className = "result-inline";
      resultDiv.textContent = String(result);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Add failed:", error);
    resultDiv.className = "result-inline";
    resultDiv.textContent = "Error";
    resultDiv.title = message;
  } finally {
    addButton.disabled = false;
  }
}

async function performMultiply(): Promise<void> {
  const multiplyButton = getElementById<HTMLButtonElement>("multiplyButton");
  const xInput = getElementById<HTMLInputElement>("multiplyX");
  const yInput = getElementById<HTMLInputElement>("multiplyY");
  const resultDiv = getElementById<HTMLDivElement>("multiplyResult");

  try {
    multiplyButton.disabled = true;
    resultDiv.className = "result-inline empty";
    resultDiv.textContent = "...";

    const x = parseFloat(xInput.value);
    const y = parseFloat(yInput.value);

    await withFabric({ rootConfig: CLIENT_CONFIG }, async (fabric) => {
      const node: NodeLike = (fabric as any).node;
      node.addEventListener(new EnvelopeEventListener());

      const agent = Agent.remoteByAddress(MATH_AGENT2_ADDR);
      const result = await agent.multiply({ x, y });

      resultDiv.className = "result-inline";
      resultDiv.textContent = String(result);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Multiply failed:", error);
    resultDiv.className = "result-inline";
    resultDiv.textContent = "Error";
    resultDiv.title = message;
  } finally {
    multiplyButton.disabled = false;
  }
}

async function performFibStream(): Promise<void> {
  const fibButton = getElementById<HTMLButtonElement>("fibButton");
  const nInput = getElementById<HTMLInputElement>("fibN");
  const resultDiv = getElementById<HTMLDivElement>("fibResult");

  try {
    fibButton.disabled = true;
    resultDiv.className = "result-inline empty";
    resultDiv.textContent = "...";

    const n = parseInt(nInput.value, 10);

    await withFabric({ rootConfig: CLIENT_CONFIG }, async (fabric) => {
      const node: NodeLike = (fabric as any).node;
      node.addEventListener(new EnvelopeEventListener());

      const agent = Agent.remoteByAddress(MATH_AGENT2_ADDR);
      const stream = await agent.fib_stream({ _stream: true, n });

      const numbers: number[] = [];
      for await (const value of stream) {
        numbers.push(value);
      }

      resultDiv.className = "result-inline";
      resultDiv.style.background = "#ffffff";
      resultDiv.style.border = "1px solid #e2e8f0";
      resultDiv.style.fontSize = "14px";
      resultDiv.innerHTML = "";
      
      const streamDiv = document.createElement("div");
      streamDiv.className = "stream-result";
      
      for (const num of numbers) {
        const numSpan = document.createElement("span");
        numSpan.className = "stream-number";
        numSpan.textContent = String(num);
        streamDiv.append(numSpan);
      }
      
      resultDiv.append(streamDiv);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Fib stream failed:", error);
    resultDiv.className = "result-inline";
    resultDiv.textContent = "Error";
    resultDiv.title = message;
  } finally {
    fibButton.disabled = false;
  }
}

function main(): void {
  try {
    const addButton = getElementById<HTMLButtonElement>("addButton");
    const multiplyButton = getElementById<HTMLButtonElement>("multiplyButton");
    const fibButton = getElementById<HTMLButtonElement>("fibButton");
    const toggleButton = getElementById<HTMLButtonElement>("toggleEnvelopes");
    const clearButton = getElementById<HTMLButtonElement>("clearEnvelopes");
    const envelopeLogContainer = getElementById<HTMLDivElement>("envelopeLog");

    renderEnvelopeLog();

    addButton.addEventListener("click", () => {
      void performAdd();
    });

    multiplyButton.addEventListener("click", () => {
      void performMultiply();
    });

    fibButton.addEventListener("click", () => {
      void performFibStream();
    });

    toggleButton.addEventListener("click", () => {
      userHasToggledEnvelope = true;
      const isCollapsed = envelopeLogContainer.classList.toggle("collapsed");
      toggleButton.textContent = isCollapsed ? "▼ Show" : "▲ Hide";
    });

    clearButton.addEventListener("click", () => {
      clearEnvelopeLog();
    });

    // Enter key support for inputs
    const addInputs = [getElementById("addX"), getElementById("addY")];
    for (const input of addInputs) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          void performAdd();
        }
      });
    }

    const multiplyInputs = [getElementById("multiplyX"), getElementById("multiplyY")];
    for (const input of multiplyInputs) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          void performMultiply();
        }
      });
    }

    const fibInput = getElementById("fibN");
    fibInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        void performFibStream();
      }
    });

    console.log("Biomes browser client initialized");
  } catch (error) {
    console.error("Failed to initialize:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
