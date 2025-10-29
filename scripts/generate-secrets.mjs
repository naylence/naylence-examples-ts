#!/usr/bin/env node

/**
 * Shared secret generation script for all TypeScript examples
 * 
 * This script generates OAuth2 client credentials and populates .env files
 * from .env.*.example templates in the config directory.
 * 
 * Usage:
 *   node scripts/generate-secrets.mjs [options]
 * 
 * Options:
 *   --recursive   Walk subdirectories to find all .env.*.example files
 *   --hmac        Generate HMAC secret (for advanced configurations)
 *   --oauth-json  Generate oauth2-clients.json file
 */

import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  recursive: args.includes("--recursive"),
  hmac: args.includes("--hmac"),
  oauthJson: args.includes("--oauth-json"),
};

// Determine config directory (relative to where script is called from)
const ROOT_DIR = process.cwd();
const CONFIG_DIR = resolve(ROOT_DIR, "config");
const SECRETS_DIR = options.oauthJson 
  ? resolve(CONFIG_DIR, ".secrets")
  : resolve(CONFIG_DIR, "secrets");

// Validate config directory exists
if (!existsSync(CONFIG_DIR)) {
  console.error(`❌ Config directory not found: ${CONFIG_DIR}`);
  console.error(`   Make sure to run this script from an example directory.`);
  process.exit(1);
}

// Create secrets directory if it doesn't exist
if (!existsSync(SECRETS_DIR)) {
  mkdirSync(SECRETS_DIR, { recursive: true });
}

// Generate credentials
const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomId(prefix) {
  const chars = Array.from({ length: 12 }, () =>
    alphabet.charAt(Math.floor(Math.random() * alphabet.length)),
  );
  return `${prefix}-${chars.join("")}`;
}

const clientId = options.oauthJson 
  ? randomId("client")
  : randomBytes(16).toString("hex");

const clientSecret = options.oauthJson
  ? randomId("s")
  : randomBytes(32).toString("hex");

const hmacSecret = options.hmac 
  ? randomBytes(32).toString("base64url")
  : null;

const storageMasterKey = randomBytes(32).toString("base64url");

// Build replacement map
const replacements = new Map([
  ["${DEV_CLIENT_ID}", clientId],
  ["${DEV_CLIENT_SECRET}", clientSecret],
  ["${FAME_STORAGE_MASTER_KEY}", storageMasterKey],
]);

if (hmacSecret) {
  replacements.set("${FAME_HMAC_SECRET}", hmacSecret);
}

// Find template files
function walkTemplates(dir, results = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory() && options.recursive) {
      walkTemplates(entryPath, results);
      continue;
    }
    if (entry.isFile() && entry.name.startsWith(".env.") && entry.name.endsWith(".example")) {
      results.push(entryPath);
    }
  }
  return results;
}

const templates = options.recursive
  ? walkTemplates(CONFIG_DIR)
  : readdirSync(CONFIG_DIR)
      .filter(name => name.startsWith(".env.") && name.endsWith(".example"))
      .map(name => resolve(CONFIG_DIR, name));

if (templates.length === 0) {
  console.warn(`⚠️  No .env.*.example template files found in ${CONFIG_DIR}`);
  process.exit(0);
}

// Process templates
const generated = [];
for (const templatePath of templates) {
  const envPath = templatePath.replace(/\.example$/, "");
  
  let content = readFileSync(templatePath, "utf8");
  
  // Replace all placeholders
  for (const [token, value] of replacements) {
    content = content.replaceAll(token, value);
  }
  
  writeFileSync(envPath, content, "utf8");
  generated.push(relative(ROOT_DIR, envPath));
  console.log(`Generated: ${envPath}`);
}

// Generate oauth2-clients.json if requested
if (options.oauthJson) {
  const oauthClientsPath = join(SECRETS_DIR, "oauth2-clients.json");
  const oauthClients = {
    clients: [
      {
        client_id: clientId,
        client_secret: clientSecret,
        audience: "fame.fabric",
      },
    ],
  };
  writeFileSync(oauthClientsPath, `${JSON.stringify(oauthClients, null, 2)}\n`);
  console.log(`Credentials saved to: ${oauthClientsPath}`);
}

// Write credentials file
const secretsFile = resolve(SECRETS_DIR, "oauth2-credentials.txt");
const secretsContent = `OAuth2 Client Credentials (auto-generated)\n` +
  `==========================================\n` +
  `CLIENT_ID=${clientId}\n` +
  `CLIENT_SECRET=${clientSecret}\n` +
  (hmacSecret ? `HMAC_SECRET=${hmacSecret}\n` : "") +
  `\n` +
  `These credentials are shared across all services.\n`;

writeFileSync(secretsFile, secretsContent, "utf8");
console.log(`Credentials saved to: ${secretsFile}`);

// Summary
console.log("\n✅ All secrets generated successfully!");
console.log(`   Client ID: ${clientId}`);
console.log(`   Client Secret: ${clientSecret.substring(0, 16)}...`);
if (hmacSecret) {
  console.log(`   HMAC Secret: ${hmacSecret.substring(0, 16)}...`);
}
console.log(`   ${generated.length} environment file(s) configured`);
