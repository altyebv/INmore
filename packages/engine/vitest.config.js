import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * The engine is consumed as source by whatever builds it, so it has no build
 * of its own — only a test config, which needs the React plugin to handle JSX
 * and CSS-module imports the same way a host's Vite would.
 */
export default defineConfig({
  plugins: [react()],
  test: { environment: 'node' },
});
