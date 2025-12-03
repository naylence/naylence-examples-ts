import { withFabric, generateId } from "@naylence/core";
import {
  Agent,
  CLIENT_CONFIG,
  makeTaskParams,
  type DataPart,
  type TaskArtifactUpdateEvent,
  type TaskStatusUpdateEvent,
} from "@naylence/agent-sdk";
import { AGENT_ADDR } from "../../src/common.js";

const TERMINAL_STATES = new Set(["COMPLETED", "FINISHED", "FAILED", "CANCELED", "CANCELLED"]);
const LAST_TASK_ID_KEY = "naylence:cancellable:lastTaskId";

function isTerminalState(stateName: string | null | undefined): boolean {
  if (!stateName) {
    return false;
  }
  return TERMINAL_STATES.has(stateName.toUpperCase());
}

let cancelAction: (() => Promise<void>) | null = null;
let cancelInFlight = false;
let activeTaskId: string | null = null;

function getElementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element as T;
}

function setStatus(message: string, className: string = ""): void {
  const statusBox = getElementById<HTMLDivElement>("status");
  statusBox.textContent = message;
  statusBox.className = className;
}

function resetProgress(): void {
  const fill = getElementById<HTMLDivElement>("progressFill");
  fill.style.width = "0%";

  const track = getElementById<HTMLDivElement>("progressTrack");
  track.setAttribute("aria-valuenow", "0");

  const label = getElementById<HTMLDivElement>("progressLabel");
  label.textContent = "Progress updates will appear here.";
}

function updateProgressDisplay(message: string, percentage: number | null): void {
  const label = getElementById<HTMLDivElement>("progressLabel");
  label.textContent = message;

  if (percentage !== null) {
    const fill = getElementById<HTMLDivElement>("progressFill");
    const track = getElementById<HTMLDivElement>("progressTrack");
    const value = Math.max(0, Math.min(100, percentage));
    fill.style.width = `${value}%`;
    track.setAttribute("aria-valuenow", value.toFixed(0));
  }
}

function setStartDisabled(disabled: boolean): void {
  const startButton = getElementById<HTMLButtonElement>("startButton");
  startButton.disabled = disabled;
}

function setCancelAction(action: (() => Promise<void>) | null, { resetCancelState = true } = {}): void {
  cancelAction = action;
  if (resetCancelState) {
    cancelInFlight = false;
  }
  const cancelButton = getElementById<HTMLButtonElement>("cancelButton");
  cancelButton.disabled = action === null;
}

function readStoredTaskId(): string | null {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return null;
  }
  try {
    return window.localStorage.getItem(LAST_TASK_ID_KEY);
  } catch (error) {
    console.warn("Failed to read stored task id", error);
    return null;
  }
}

function storeTaskId(taskId: string | null): void {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return;
  }
  try {
    if (taskId) {
      window.localStorage.setItem(LAST_TASK_ID_KEY, taskId);
    } else {
      window.localStorage.removeItem(LAST_TASK_ID_KEY);
    }
  } catch (error) {
    console.warn("Failed to store task id", error);
  }
}

function applyFinalState(taskId: string, stateName: string): void {
  const normalized = stateName.toUpperCase();
  const isFinished = normalized === "FINISHED" || normalized === "COMPLETED";
  const isCancelled = normalized === "CANCELED" || normalized === "CANCELLED";
  const isFailed = normalized === "FAILED";

  cancelInFlight = false;
  setCancelAction(null);
  activeTaskId = null;
  storeTaskId(null);

  if (isFinished) {
    setStatus(`Task ${taskId} completed.`, "success");
    updateProgressDisplay("Task complete.", 100);
    return;
  }

  if (isCancelled) {
    setStatus(`Task ${taskId} was cancelled.`, "error");
    updateProgressDisplay("Task cancelled.", null);
    return;
  }

  if (isFailed) {
    setStatus(`Task ${taskId} failed.`, "error");
    updateProgressDisplay("Task failed.", null);
    return;
  }

  setStatus(`Task ${taskId} reached state ${normalized}.`, "error");
  updateProgressDisplay("No further progress available.", null);
}

function extractProgress(event: TaskArtifactUpdateEvent): { message: string; percentage: number | null } {
  const part = event.artifact.parts.find((p) => p.type === "data") as DataPart | undefined;
  if (!part) {
    return {
      message: JSON.stringify(event.artifact.parts),
      percentage: null,
    };
  }

  const progressValue = (part.data as Record<string, unknown>)?.progress;

  if (typeof progressValue === "number") {
    const percentage = progressValue * 100;
    return {
      message: `Progress: ${percentage.toFixed(0)}%`,
      percentage,
    };
  }

  if (typeof progressValue === "string") {
    const numeric = Number.parseFloat(progressValue);
    if (Number.isFinite(numeric)) {
      const percentage = numeric <= 1 ? numeric * 100 : numeric;
      return {
        message: `Progress: ${percentage.toFixed(0)}%`,
        percentage,
      };
    }

    return {
      message: progressValue,
      percentage: null,
    };
  }

  return {
    message: JSON.stringify(part.data),
    percentage: null,
  };
}

async function startTaskFlow(): Promise<void> {
  setStartDisabled(true);
  setCancelAction(null);
  resetProgress();
  setStatus("Connecting to fabric...", "loading");

  try {
    let finalState: string | null = null;
    let hasProgressUpdate = false;
    await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
      const remote = Agent.remoteByAddress(AGENT_ADDR);
      const taskId = generateId();
      activeTaskId = taskId;

      const previousTaskId = readStoredTaskId();
      if (previousTaskId && previousTaskId !== taskId) {
        try {
          setStatus(`Cancelling previous task ${previousTaskId}...`, "loading");
          await remote.cancelTask({ id: previousTaskId });
        } catch (cancelError) {
          console.warn("Failed to cancel previous task", cancelError);
        }
      }

      setStatus(`Connected. Starting task ${taskId}...`, "loading");
      await remote.startTask(makeTaskParams({ id: taskId }));
      storeTaskId(taskId);

      setStatus(`Task ${taskId} started. Listening for updates...`, "loading");
      updateProgressDisplay("Progress: 0%", 0);
      setCancelAction(async () => {
        setStatus(`Cancel requested for ${taskId}...`, "loading");
        await remote.cancelTask({ id: taskId });
      });

      const updates = await remote.subscribeToTaskUpdates(
        makeTaskParams({ id: taskId }),
      );

      for await (const evt of updates as AsyncIterable<
        TaskStatusUpdateEvent | TaskArtifactUpdateEvent
      >) {
        if ("status" in evt) {
          const statusEvt = evt as TaskStatusUpdateEvent;
          const stateName = String(statusEvt.status.state);

          if (isTerminalState(stateName)) {
            finalState = stateName;
            applyFinalState(taskId, stateName);
          } else {
            setStatus(`Task ${taskId} status: ${stateName}`, "loading");
            if (!hasProgressUpdate) {
              updateProgressDisplay("Progress: 0%", 0);
            }
          }
        } else if ("artifact" in evt) {
          const artifactEvt = evt as TaskArtifactUpdateEvent;
          const { message, percentage } = extractProgress(artifactEvt);
          updateProgressDisplay(message, percentage);
          hasProgressUpdate = true;
        }
      }

      if (!finalState) {
        try {
          const status = await remote.getTaskStatus({ id: taskId });
          const stateName = String(status.status?.state ?? "");
          if (isTerminalState(stateName)) {
            finalState = stateName;
            applyFinalState(taskId, stateName);
          } else if (stateName) {
            setStatus(`Task ${taskId} latest state: ${stateName}`, "loading");
            if (!hasProgressUpdate) {
              updateProgressDisplay("Progress: 0%", 0);
            }
          }
        } catch (statusError) {
          console.warn("Failed to fetch final task status", statusError);
          if (cancelInFlight) {
            setStatus("Task cancellation requested. Awaiting agent confirmation.", "error");
            updateProgressDisplay("Task cancelled.", null);
          } else {
            setStatus("Task completed. No further updates.", "success");
          }
        }
      }
    });
    if (!finalState) {
      if (cancelInFlight) {
        setStatus("Task cancellation requested. Awaiting agent confirmation.", "error");
        updateProgressDisplay("Task cancelled.", null);
      } else {
        setStatus("Task completed. No further updates.", "success");
        storeTaskId(null);
        activeTaskId = null;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`✗ Error: ${message}`, "error");
    console.error("Cancellable client failed:", error);
    storeTaskId(null);
    activeTaskId = null;
  } finally {
  setCancelAction(null, { resetCancelState: false });
    setStartDisabled(false);
    cancelInFlight = false;
  }
}

async function handleCancelClick(): Promise<void> {
  if (!cancelAction || cancelInFlight) {
    return;
  }
  const cancelButton = getElementById<HTMLButtonElement>("cancelButton");
  cancelInFlight = true;
  cancelButton.disabled = true;
  try {
    await cancelAction();
  } catch (error) {
    cancelInFlight = false;
    cancelButton.disabled = false;
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`✗ Cancel failed: ${message}`, "error");
    console.error("Cancellation failed:", error);
  }
}

function main(): void {
  try {
    const startButton = getElementById<HTMLButtonElement>("startButton");
    const cancelButton = getElementById<HTMLButtonElement>("cancelButton");

    startButton.addEventListener("click", () => {
      void startTaskFlow();
    });

    cancelButton.addEventListener("click", () => {
      void handleCancelClick();
    });

    resetProgress();
    setStatus("Ready. Start a task and cancel it whenever you like.");
    if (readStoredTaskId()) {
      updateProgressDisplay("Progress: 0%", 0);
      setStatus("Previous task detected. Start a new task to cancel it automatically.", "warning");
    }
  } catch (error) {
    console.error("Failed to initialise UI:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
