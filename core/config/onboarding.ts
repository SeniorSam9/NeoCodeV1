import { ConfigYaml } from "@continuedev/config-yaml";

export const LOCAL_ONBOARDING_PROVIDER_TITLE = "NeoCode";
export const LOCAL_ONBOARDING_CHAT_MODEL =
  "meta-llama/Meta-Llama-3-8B-Instruct";
export const LOCAL_ONBOARDING_CHAT_TITLE = "NeoCode";
export const LOCAL_ONBOARDING_FIM_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";
export const LOCAL_ONBOARDING_FIM_TITLE = "NeoCode";
export const LOCAL_ONBOARDING_EMBEDDINGS_MODEL = "internal-embedder";
export const LOCAL_ONBOARDING_EMBEDDINGS_TITLE = "NeoCode Embedder";

export function setupBestConfig(config: ConfigYaml): ConfigYaml {
  return {
    ...config,
    models: [
      {
        name: LOCAL_ONBOARDING_CHAT_TITLE,
        provider: "openai",
        model: LOCAL_ONBOARDING_CHAT_MODEL,
        apiBase: "http://localhost:8000/v1",
        apiKey: "EMPTY",
        roles: ["chat", "edit", "apply", "autocomplete", "embed"],
      },
    ],
  };
}

export function setupLocalConfig(config: ConfigYaml): ConfigYaml {
  return setupBestConfig(config);
}

export function setupQuickstartConfig(config: ConfigYaml): ConfigYaml {
  return setupBestConfig(config);
}

export function setupProviderConfig(
  config: ConfigYaml,
  provider: string,
  apiKey: string,
): ConfigYaml {
  return setupBestConfig(config);
}
