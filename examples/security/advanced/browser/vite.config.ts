import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, '..');
const caddyOrigin = 'https://localhost:8443';

const hostMap: Record<string, { host: string; port: number; scheme: string }> = {
  'sentinel-internal': { host: 'localhost', port: 3000, scheme: 'ws' },
  'sentinel': { host: 'localhost', port: 3000, scheme: 'ws' },
  ca: { host: 'localhost', port: 3000, scheme: 'https' },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const tokenKeyMatchers = [/token/i, /^jwt$/i];

function pathHasToken(pathSegments: string[]): boolean {
  return pathSegments.some((segment) =>
    tokenKeyMatchers.some((matcher) => matcher.test(segment))
  );
}

function rewriteUrlIfNeeded(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    const mapping = hostMap[url.hostname];

    if (!mapping) {
      return urlStr;
    }

    // For localhost in browser, use http instead of https to avoid SSL errors
    // The vite dev server runs on http://localhost:3000
    const browserScheme = mapping.scheme === 'https' ? 'http' : mapping.scheme;
    
    url.protocol = `${browserScheme}:`;
    url.hostname = mapping.host;
    url.port = String(mapping.port);

    return url.toString();
  } catch {
    return urlStr;
  }
}

function rewriteWelcomePayload(
  payload: unknown,
  currentPath: string[] = ['$']
): unknown {
  if (Array.isArray(payload)) {
    return payload.map((entry, index) =>
      rewriteWelcomePayload(entry, [...currentPath, `[${index}]`])
    );
  }

  if (!isRecord(payload)) {
    if (typeof payload === 'string' && !pathHasToken(currentPath)) {
      return rewriteUrlIfNeeded(payload);
    }

    return payload;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    const nextPath = [...currentPath, key];

    if (pathHasToken(nextPath)) {
      result[key] = value;
      continue;
    }

    result[key] = rewriteWelcomePayload(value, nextPath);
  }

  return result;
}

function captureBody(proxyRes: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    proxyRes.on('data', (chunk: Buffer | string) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });

    proxyRes.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    proxyRes.on('error', (error) => {
      reject(error);
    });
  });
}

async function rewriteWelcomeResponse(
  proxyRes: IncomingMessage,
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>
): Promise<void> {
  const originalHeaders = { ...proxyRes.headers };
  const statusCode = proxyRes.statusCode ?? 200;
  const contentType = String(originalHeaders['content-type'] ?? '').toLowerCase();

  if (!contentType.includes('application/json')) {
    console.info(
      `[vite] welcome rewrite bypass (non-json) url=${req.url ?? ''} content-type=${contentType}`
    );
    res.writeHead(statusCode, originalHeaders);
    proxyRes.pipe(res);
    return;
  }

  const buffer = await captureBody(proxyRes);

  try {
    const parsed = JSON.parse(buffer.toString('utf8'));
    const rewritten = rewriteWelcomePayload(parsed);

    console.info('[vite] welcome rewrite completed', {
      url: req.url ?? '',
    });

    const responseBuffer = Buffer.from(JSON.stringify(rewritten));
    const headers = {
      ...originalHeaders,
      'content-type': 'application/json; charset=utf-8',
      'content-length': responseBuffer.length.toString(),
    } as Record<string, string | string[]>;

    delete headers['content-encoding'];

    res.writeHead(statusCode, headers);
    res.end(responseBuffer);
  } catch (error) {
    console.error(`[vite] welcome rewrite failed for ${req.url ?? ''}`, error);
    const headers = {
      ...originalHeaders,
      'content-length': buffer.length.toString(),
    } as Record<string, string | string[]>;

    res.writeHead(statusCode, headers);
    res.end(buffer);
  }
}

function attachWelcomeRewrite(proxy: any) {
  proxy.on(
    'proxyRes',
    async (
      proxyRes: IncomingMessage,
      req: IncomingMessage,
      res: ServerResponse<IncomingMessage>
    ) => {
      try {
        await rewriteWelcomeResponse(proxyRes, req, res);
      } catch {
        res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Upstream welcome rewrite failed.');
      }
    }
  );
}

export default defineConfig({
  root: __dirname,
  optimizeDeps: {
    esbuildOptions: {
      conditions: ['browser', 'import', 'module', 'default'],
    },
    exclude: ['@naylence/runtime/dist/esm/naylence/fame/http'],
  },
  resolve: {
    alias: {
      '../../src/common.js': resolve(projectRoot, 'src/common.ts'),
      '@naylence/runtime/dist/esm/naylence/fame/connector/default-http-server': resolve(__dirname, 'stubs/empty.js'),
    },
    conditions: ['browser', 'import', 'module', 'default'],
    mainFields: ['browser', 'module', 'main'],
  },
  build: {
    target: 'es2020',
    outDir: resolve(__dirname, 'dist'),
    rollupOptions: {
      external: [
        /\/naylence\/fame\/http\//,
        /\/oauth2-server/,
        /\/default-http-server/,
      ],
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('/@naylence/runtime/dist/')) {
            if (id.includes('/naylence/fame/connector')) {
              return 'naylence-runtime-connectors';
            }

            if (id.includes('/naylence/fame/')) {
              if (id.includes('/naylence/fame/node/')) {
                return 'naylence-runtime-fame-node';
              }

              if (id.includes('/naylence/fame/security/')) {
                return 'naylence-runtime-fame-security';
              }

              if (id.includes('/naylence/fame/storage/')) {
                return 'naylence-runtime-fame-storage';
              }

              if (id.includes('/naylence/fame/transport/')) {
                return 'naylence-runtime-fame-transport';
              }

              if (id.includes('/naylence/fame/service/')) {
                return 'naylence-runtime-fame-service';
              }

              if (id.includes('/naylence/fame/channel/')) {
                return 'naylence-runtime-fame-channel';
              }

              if (id.includes('/naylence/fame/delivery/')) {
                return 'naylence-runtime-fame-delivery';
              }

              if (id.includes('/naylence/fame/util/')) {
                return 'naylence-runtime-fame-util';
              }

              return 'naylence-runtime-fame';
            }

            if (id.includes('/telemetry')) {
              return 'naylence-runtime-telemetry';
            }

            return 'naylence-runtime-core';
          }

          if (id.includes('/@naylence/agent-sdk')) {
            return 'naylence-agent';
          }

          if (id.includes('/zod')) {
            return 'schema-zod';
          }

          if (
            id.includes('/@peculiar/') ||
            id.includes('/asn1js') ||
            id.includes('/pvutils') ||
            id.includes('/pvtsutils')
          ) {
            return 'crypto-asn1';
          }

          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 3000,
    fs: {
      allow: [projectRoot],
    },
    proxy: {
      '/.well-known': {
        target: caddyOrigin,
        changeOrigin: true,
        secure: false,
      },
      '/oauth': {
        target: caddyOrigin,
        changeOrigin: true,
        secure: false,
      },
      '/fame/v1/welcome': {
        target: caddyOrigin,
        changeOrigin: true,
        secure: false,
        selfHandleResponse: true,
        configure(proxy) {
          attachWelcomeRewrite(proxy);
        },
      },
      '/fame/welcome': {
        target: caddyOrigin,
        changeOrigin: true,
        secure: false,
        selfHandleResponse: true,
        configure(proxy) {
          attachWelcomeRewrite(proxy);
        },
      },
      '/fame': {
        target: caddyOrigin,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
