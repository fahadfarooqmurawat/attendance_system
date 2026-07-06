import { createApp } from "./server.js";
import { env } from "./config.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`device-gateway listening on :${env.PORT}`);
});
