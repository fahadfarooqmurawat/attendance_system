import { env } from "./config.js";
import { createApp } from "./server.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`device-gateway listening on :${env.PORT}`);
});
