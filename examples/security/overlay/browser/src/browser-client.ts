import { FameDeliveryContext, FameEnvelope, withFabric } from "@naylence/core";
import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { AGENT_ADDR } from "../../src/common.js";
import { BaseNodeEventListener, NodeLike } from "@naylence/runtime";

type EnvRecord = Record<string, string | undefined>;

const ENV_VARS: EnvRecord = (() => {
  if (typeof window === "undefined") {
    return {};
  }
  return ((window as Window & { __ENV__?: EnvRecord }).__ENV__) ?? {};
})();

const INPUT_STATE_STORAGE_KEY = `naylence.overlay.inputs.${ENV_VARS.FAME_ADMISSION_CLIENT_ID ?? "anonymous"}`;

interface InputState {
  addX: string;
  addY: string;
  multiplyX: string;
  multiplyY: string;
  fibCount: string;
}

function getElementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element as T;
}

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function captureInputState(): InputState {
  return {
    addX: getElementById<HTMLInputElement>("addX").value,
    addY: getElementById<HTMLInputElement>("addY").value,
    multiplyX: getElementById<HTMLInputElement>("multiplyX").value,
    multiplyY: getElementById<HTMLInputElement>("multiplyY").value,
    fibCount: getElementById<HTMLInputElement>("fibCount").value,
  };
}

function persistInputState(state: InputState): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(INPUT_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (quota, privacy settings, etc.)
  }
}

function clearInputState(): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(INPUT_STATE_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

function restoreInputState(): boolean {
  const storage = getSessionStorage();
  if (!storage) {
    return false;
  }

  const raw = storage.getItem(INPUT_STATE_STORAGE_KEY);
  if (!raw) {
    return false;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<InputState>;
    if (typeof parsed.addX === "string") {
      getElementById<HTMLInputElement>("addX").value = parsed.addX;
    }
    if (typeof parsed.addY === "string") {
      getElementById<HTMLInputElement>("addY").value = parsed.addY;
    }
    if (typeof parsed.multiplyX === "string") {
      getElementById<HTMLInputElement>("multiplyX").value = parsed.multiplyX;
    }
    if (typeof parsed.multiplyY === "string") {
      getElementById<HTMLInputElement>("multiplyY").value = parsed.multiplyY;
    }
    if (typeof parsed.fibCount === "string") {
      getElementById<HTMLInputElement>("fibCount").value = parsed.fibCount;
    }
    return true;
  } catch {
    storage.removeItem(INPUT_STATE_STORAGE_KEY);
    return false;
  }
}

function setStatus(message: string, className: "default" | "loading" | "success" | "error" = "default"): void {
  const status = getElementById<HTMLDivElement>("status");
  status.textContent = message;
  status.className = className === "default" ? "" : className;
}

function setAddResult(message: string): void {
  const output = getElementById<HTMLSpanElement>("addResult");
  output.textContent = message;
  output.classList.toggle("placeholder", message.trim().length === 0 || message === "—");
}

function setMultiplyResult(message: string): void {
  const output = getElementById<HTMLSpanElement>("multiplyResult");
  output.textContent = message;
  output.classList.toggle("placeholder", message.trim().length === 0 || message === "—");
}

function clearFibStream(): void {
  const container = getElementById<HTMLDivElement>("fibStream");
  container.textContent = "—";
  container.classList.add("placeholder");
}

function appendFibTerm(value: number): void {
  const container = getElementById<HTMLDivElement>("fibStream");
  // Clear placeholder on first append
  if (container.classList.contains("placeholder")) {
    container.textContent = "";
    container.classList.remove("placeholder");
  }
  const chip = document.createElement("span");
  chip.textContent = String(value);
  container.append(chip);
}

function readNumberInput(id: string): number {
  const input = getElementById<HTMLInputElement>(id);
  const parsed = Number.parseFloat(input.value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Input ${id} must be a finite number.`);
  }
  return parsed;
}

function isPkceRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const candidate = error as { name?: string };
  return candidate.name === "OAuth2PkceRedirectInitiatedError";
}

interface RunOptions {
  resume?: boolean;
}

function shouldAutoResumePkce(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const env = (window as Window & { __ENV__?: Record<string, string | undefined> }).__ENV__;
  const clientId = env?.FAME_ADMISSION_CLIENT_ID;
  if (!clientId || typeof window.sessionStorage === "undefined") {
    return false;
  }

  const storageKey = `naylence.oauth2_pkce.${clientId}`;
  const pendingAuth = window.sessionStorage.getItem(storageKey);
  if (!pendingAuth) {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return params.has("code") || params.has("error");
}

let runInFlight = false;

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

async function runOverlayDemo(options: RunOptions = {}): Promise<void> {
  const runButton = getElementById<HTMLButtonElement>("runButton");
  let redirectingForPkce = false;
  const inputState = captureInputState();

  try {
    if (runInFlight) {
      return;
    }
    runInFlight = true;
    runButton.disabled = true;
    if (options.resume) {
      setStatus("Completing PKCE redirect and exchanging token…", "loading");
    } else {
      setStatus("Connecting to fabric with overlay security…", "loading");
    }
    setAddResult("—");
    setMultiplyResult("—");
    clearFibStream();

    const addX = readNumberInput("addX");
    const addY = readNumberInput("addY");
    const multiplyX = readNumberInput("multiplyX");
    const multiplyY = readNumberInput("multiplyY");
    const fibCountRaw = readNumberInput("fibCount");
    const fibCount = Math.max(1, Math.min(32, Math.floor(fibCountRaw)));
    getElementById<HTMLInputElement>("fibCount").value = String(fibCount);
    inputState.fibCount = String(fibCount);

    await withFabric({ rootConfig: CLIENT_CONFIG }, async (fabric) => {
      const node: NodeLike = (fabric as any).node;
      node.addEventListener(new EnvelopeEventListener);
      setStatus("Connected. Performing math operations…", "loading");

      const remote = Agent.remoteByAddress(AGENT_ADDR);

      const addition = await remote.add({ x: addX, y: addY });
      setAddResult(String(addition));

      const multiplication = await remote.multiply({ x: multiplyX, y: multiplyY });
      setMultiplyResult(String(multiplication));

      setStatus("Streaming signed Fibonacci envelopes…", "loading");
      clearFibStream();
      const fibStream = await remote.fib_stream({ _stream: true, n: fibCount });
      for await (const value of fibStream as AsyncIterable<number>) {
        appendFibTerm(value);
      }
      setStatus("Disconnecting…", "loading");
    });

    clearInputState();
    setStatus("✔ Overlay-secured RPC and streaming completed.", "success");
  } catch (error) {
    if (isPkceRedirectError(error)) {
      redirectingForPkce = true;
      persistInputState(inputState);
      setStatus("Redirecting to OAuth provider for PKCE authorization…", "loading");
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    setStatus(`✗ Error: ${message}`, "error");
    console.error("Overlay browser client failed:", error);
  } finally {
    runInFlight = false;
    if (!redirectingForPkce) {
      runButton.disabled = false;
    }
  }
}

function main(): void {
  try {
    const runButton = getElementById<HTMLButtonElement>("runButton");
    const toggleButton = getElementById<HTMLButtonElement>("toggleEnvelopes");
    const clearButton = getElementById<HTMLButtonElement>("clearEnvelopes");
    const envelopeLogContainer = getElementById<HTMLDivElement>("envelopeLog");

    restoreInputState();
    renderEnvelopeLog();

    runButton.addEventListener("click", () => {
      void runOverlayDemo();
    });

    toggleButton.addEventListener("click", () => {
      const isCollapsed = envelopeLogContainer.classList.toggle("collapsed");
      toggleButton.textContent = isCollapsed ? "▼ Show" : "▲ Hide";
      userHasToggledEnvelope = true;
    });

    clearButton.addEventListener("click", () => {
      clearEnvelopeLog();
    });

    if (shouldAutoResumePkce()) {
      void runOverlayDemo({ resume: true });
    }
  } catch (error) {
    console.error("Failed to initialise overlay browser client:", error);
    setStatus("✗ Failed to initialise overlay client. See console for details.", "error");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
