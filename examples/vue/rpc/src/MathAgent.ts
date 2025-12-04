import { BaseAgent } from '@naylence/agent-sdk';
import { operation } from '@naylence/runtime';

export class MathAgent extends BaseAgent {
  private static nextId = 1;
  private readonly instanceId: string;

  constructor() {
    super();
    this.instanceId = `math-agent-${MathAgent.nextId++}`;
    console.log('[MathAgent] created', this.instanceId);
  }

  get debugId(): string {
    return this.instanceId;
  }

  @operation()
  async add(params: { x: number; y: number }): Promise<number> {
    const { x, y } = params;
    return x + y;
  }

  @operation({ name: 'multiply' })
  async multi(params: { x: number; y: number }): Promise<number> {
    const { x, y } = params;
    return x * y;
  }

  @operation({ name: 'fib_stream', streaming: true })
  async *fib(params: { n: number }): AsyncGenerator<number> {
    const { n } = params;
    let a = 0;
    let b = 1;
    for (let i = 0; i < n; i++) {
      yield a;
      [a, b] = [b, a + b];
    }
  }
}
