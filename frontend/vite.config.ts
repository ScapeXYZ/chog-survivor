import {defineConfig} from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // Unit tests use a deterministic read-only baseline, independent of .env.local.
    // Local-chain suites opt in with explicit environment stubs or contract mocks.
    env: {
      VITE_CHOG_ENV: 'production',
      VITE_MONAD_RPC_URL: '',
      VITE_LOCAL_RPC_URL: '',
      VITE_LOCAL_CHOG_SURVIVOR_ADDRESS: '',
      VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK: '',
    },
  },
})
