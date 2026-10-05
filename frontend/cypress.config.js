import { defineConfig } from "cypress";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const registerCleanup = require("./cypress/plugins/recovery-cleanup.cjs");

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on, config) {
      registerCleanup(on, config);
      const selected = String(config.env.RESET_CASE || '').split('+');
      if (config.env.RESET_GOOGLE_CHECK === true || config.env.RESET_RUN_ALL === true || selected.some(id => id === '017' || id === '17' || id === 'CY-RESET-017')) {
        config.experimentalModifyObstructiveThirdPartyCode = true;
      }
      return config;
    },
  },
});
