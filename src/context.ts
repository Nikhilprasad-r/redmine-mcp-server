import type { AppConfig } from "./config.js";
import type { RedmineClient } from "./redmine/client.js";

export type AppContext = {
  config: AppConfig;
  client: RedmineClient;
};
