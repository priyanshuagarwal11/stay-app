import { config } from "./config.js";
import { createApp } from "./app.js";
import { initStore } from "./store/index.js";

await initStore();
createApp().listen(config.port, "0.0.0.0", () => {
  console.log(`[server] StaySupply API on http://localhost:${config.port}`);
});
