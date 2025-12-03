import { BaseAgent } from '@naylence/agent-sdk';

export class HelloAgent extends BaseAgent {
  private onMessageReceived?: (message: string) => void;

  setMessageCallback(callback: (message: string) => void) {
    this.onMessageReceived = callback;
  }

  async runTask(payload: any): Promise<any> {
    const message = payload.message;
    
    // Notify that a message was received
    if (this.onMessageReceived) {
      this.onMessageReceived(message);
    }
    
    // Echo back the message with a greeting
    return `You said: "${message}"`;
  }
}
