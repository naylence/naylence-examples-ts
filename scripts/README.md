# Shared Scripts

This directory contains shared utility scripts used across all TypeScript examples.

## generate-secrets.mjs

A unified secret generation script that creates OAuth2 client credentials and populates `.env` files from `.env.*.example` templates.

### Usage

From any example directory:

```bash
# Most examples
node ../../scripts/generate-secrets.mjs

# Examples in subdirectories (security/*, distributed/*, etc.)
node ../../../scripts/generate-secrets.mjs
```

Or use the Makefile:
```bash
make init
```

### Options

- `--recursive` - Walk subdirectories to find all `.env.*.example` files
- `--hmac` - Generate HMAC secret (`${FAME_HMAC_SECRET}`)
- `--oauth-json` - Generate `oauth2-clients.json` file in `.secrets` directory

### Examples

**Simple example** (most examples):
```bash
node ../../../scripts/generate-secrets.mjs
```

**With options** (http-connector):
```bash
node ../../../scripts/generate-secrets.mjs --recursive --hmac --oauth-json
```

### What it does

1. Scans the `config/` directory for `.env.*.example` template files
2. Generates random OAuth2 client credentials
3. Replaces placeholders in templates:
   - `${DEV_CLIENT_ID}` → generated client ID
   - `${DEV_CLIENT_SECRET}` → generated client secret
   - `${FAME_HMAC_SECRET}` → generated HMAC secret (if `--hmac`)
4. Writes populated `.env` files
5. Saves credentials to `config/secrets/oauth2-credentials.txt`
6. Optionally generates `config/.secrets/oauth2-clients.json` (if `--oauth-json`)

### Benefits

- **Single source of truth** - One script to maintain instead of 10+
- **Consistency** - All examples generate secrets the same way
- **Easy updates** - Bug fixes and improvements apply to all examples
- **Flexibility** - Options allow customization for different example needs
