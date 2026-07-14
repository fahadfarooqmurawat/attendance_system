import { env } from "./config.js";
import { createApp } from "./server.js";

const app = createApp();

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`device-gateway listening on :${env.PORT}`);
});
