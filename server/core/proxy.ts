import { ProxyAgent, setGlobalDispatcher } from "undici";
// Force UI sync
import { config } from "./config";

export function setupProxy() {
  if (config.PROXY) {
    console.log(`Using proxy: ${config.PROXY}`);
    const dispatcher = new ProxyAgent(config.PROXY);
    setGlobalDispatcher(dispatcher);
  }
}
