import { withFabric } from "@naylence/runtime";
import { Agent, CLIENT_CONFIG } from "@naylence/agent-sdk";
import { ANALYSIS_AGENT_ADDR } from "./common.js";

const textToAnalyze = `
    I just watched the new sci-fi film "Galactic Frontier" and I have mixed feelings.
    The visuals were stunning and the world-building immersive, but the plot felt predictable
    and some characters lacked depth. Overall, it was an entertaining experience but not
    groundbreaking.
`;

await withFabric({ rootConfig: CLIENT_CONFIG }, async () => {
  const agent = Agent.remoteByAddress(ANALYSIS_AGENT_ADDR);
  const result = await agent.runTask(textToAnalyze);
  console.log(JSON.stringify(result, null, 2));
});
