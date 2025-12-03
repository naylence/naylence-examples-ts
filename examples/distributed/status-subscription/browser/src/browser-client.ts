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

const TERMINAL_STATES = new Set(["FINISHED", "FAILED", "CANCELED", "CANCELLED"]);

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

function disableButton(disabled: boolean): void {
  const button = getElementById<HTMLButtonElement>("startButton");
  button.disabled = disabled;
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
    const value = Math.max(0, Math.min(100, percentage));
    fill.style.width = `${value}%`;
    const track = getElementById<HTMLDivElement>("progressTrack");
    track.setAttribute("aria-valuenow", value.toFixed(0));
  }
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
  if (typeof progressValue === "string") {
    const percentage = parseProgressPercentage(progressValue);
    return {
      message: progressValue,
      percentage,
    };
  }

  return {
    message: JSON.stringify(part.data),
    percentage: null,
  };
}

function parseProgressPercentage(text: string): number | null {
  const match = /step\s+(\d+)\s*\/\s*(\d+)/i.exec(text);
  if (!match) {
    return null;
  }

  const current = Number.parseInt(match[1] ?? "", 10);
  const total = Number.parseInt(match[2] ?? "", 10);

  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
    return null;
  }

  return (current / total) * 100;
}

async function startTaskFlow(): Promise<void> {
  disableButton(true);
  resetProgress();
  setStatus("Connecting to fabric...", "loading");

  try {
    await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
      const remote = Agent.remoteByAddress(AGENT_ADDR);
      const taskId = generateId();

      setStatus(`Connected. Starting task ${taskId}...`, "loading");
      await remote.startTask(makeTaskParams({ id: taskId }));

      setStatus(`Task ${taskId} started. Listening for updates...`, "loading");
      const updates = await remote.subscribeToTaskUpdates(
        makeTaskParams({ id: taskId }),
      );

      for await (const evt of updates as AsyncIterable<
        TaskStatusUpdateEvent | TaskArtifactUpdateEvent
      >) {
        if ("status" in evt) {
          const statusEvt = evt as TaskStatusUpdateEvent;
          const stateName = String(statusEvt.status.state);

          if (TERMINAL_STATES.has(stateName)) {
            setStatus(
              `Task ${taskId} reached state ${stateName}.`,
              stateName === "FINISHED" ? "success" : "error",
            );
            if (stateName === "FINISHED") {
              updateProgressDisplay("Task complete.", 100);
            } else if (stateName === "CANCELED" || stateName === "CANCELLED") {
              updateProgressDisplay("Task cancelled.", null);
            }
          } else {
            setStatus(`Task ${taskId} status: ${stateName}`, "loading");
          }
        } else if ("artifact" in evt) {
          const artifactEvt = evt as TaskArtifactUpdateEvent;
          const { message, percentage } = extractProgress(artifactEvt);
          updateProgressDisplay(message, percentage);
        }
      }
    });

    setStatus("Task completed. No further updates.", "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`✗ Error: ${message}`, "error");
    console.error("Status subscription failed:", error);
  } finally {
    disableButton(false);
  }
}

function main(): void {
  try {
    const button = getElementById<HTMLButtonElement>("startButton");
    button.addEventListener("click", () => {
      void startTaskFlow();
    });

    resetProgress();
    setStatus("Ready. Click Start Task to observe updates.");
  } catch (error) {
    console.error("Failed to initialise UI:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
