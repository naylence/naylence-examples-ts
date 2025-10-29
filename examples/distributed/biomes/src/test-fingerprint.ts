// Test fingerprint generation in Docker containers
import { generateIdAsync } from "@naylence/core";

console.log("Testing fingerprint generation...\n");

// Test with fingerprint mode (no material)
const id1 = await generateIdAsync({ mode: "fingerprint" });
console.log(`Fingerprint ID (no material): ${id1}`);

// Test with empty salt
const id2 = await generateIdAsync({ mode: "fingerprint", material: "" });
console.log(`Fingerprint ID (empty salt): ${id2}`);

// Test with random mode for comparison
const id3 = await generateIdAsync({ mode: "random" });
console.log(`Random ID: ${id3}`);

// Check environment
import os from "os";
const hostname = os.hostname();
const interfaces = os.networkInterfaces();
let mac = null;
for (const [name, ifaces] of Object.entries(interfaces)) {
  if (!ifaces) continue;
  for (const iface of ifaces) {
    if (iface.mac && iface.mac !== "00:00:00:00:00:00") {
      mac = iface.mac;
      break;
    }
  }
  if (mac) break;
}

console.log(`\nEnvironment:`);
console.log(`Hostname: ${hostname}`);
console.log(`First MAC: ${mac}`);
console.log(
  `FAME_NODE_ID_SALT: ${process.env.FAME_NODE_ID_SALT || "(not set)"}`,
);
console.log(`Command: ${process.argv.join(" ")}`);
