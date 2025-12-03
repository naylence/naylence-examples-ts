import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, '..');
export default defineConfig({
  root: __dirname,
  build: {
    target: 'es2020',
    outDir: resolve(__dirname, 'dist'),
    rollupOptions: {
      output: {
        manualChunks(id) {
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
      // Allow serving files from the parent project directory
      allow: [projectRoot],
    },
  },
  resolve: {
    alias: {
      // Ensure we can resolve the common.js from the parent src directory
      '../../src/common.js': resolve(projectRoot, 'src/common.ts'),
    },
    conditions: ['browser', 'import', 'module', 'default'],
  },
});
