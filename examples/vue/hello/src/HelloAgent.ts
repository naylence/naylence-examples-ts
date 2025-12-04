import { BaseAgent } from '@naylence/agent-sdk';

export class HelloAgent extends BaseAgent {
  private onMessageReceived?: (message: string) => void;

  setMessageCallback(callback: (message: string) => void) {
    this.onMessageReceived = callback;
  }

  async runTask(payload: any): Promise<any> {
    const message = payload.message;

    if (this.onMessageReceived) {
      this.onMessageReceived(message);
    }

    return `You said: "${message}"`;
  }
}
