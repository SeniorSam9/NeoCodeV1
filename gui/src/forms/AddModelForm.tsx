import { useContext, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button, Input } from "../components";
import Alert from "../components/gui/Alert";
import { useAuth } from "../context/Auth";
import { IdeMessengerContext } from "../context/IdeMessenger";
import {
  ProviderInfo,
  providers,
} from "../pages/AddNewModel/configs/providers";
import { useAppDispatch } from "../redux/hooks";
import { updateSelectedModelByRole } from "../redux/thunks/updateSelectedModelByRole";

interface AddModelFormProps {
  onDone: () => void;
  hideFreeTrialLimitMessage?: boolean;
}

const MODEL_PROVIDERS_URL =
  "https://docs.continue.dev/customize/model-providers";
const CODESTRAL_URL = "https://console.mistral.ai/codestral";
const CONTINUE_SETUP_URL = "https://docs.continue.dev/setup/overview";

export function AddModelForm({
  onDone,
  hideFreeTrialLimitMessage,
}: AddModelFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo>(
    providers["openai"]!,
  );
  const dispatch = useAppDispatch();
  const { selectedProfile } = useAuth();
  const [selectedModel, setSelectedModel] = useState(
    selectedProvider.packages[0],
  );
  const formMethods = useForm();
  const [models, setModels] = useState<(string | { name: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const ideMessenger = useContext(IdeMessengerContext);

  const popularProviderTitles = [
    providers["openai"]?.title || "",
    providers["anthropic"]?.title || "",
    providers["mistral"]?.title || "",
    providers["gemini"]?.title || "",
    providers["azure"]?.title || "",
    providers["ollama"]?.title || "",
  ];

  const allProviders = Object.entries(providers)
    .filter(([key]) => !["openai-aiohttp"].includes(key))
    .map(([, provider]) => provider)
    .filter((provider) => !!provider)
    .map((provider) => provider!); // for type checking

  const popularProviders = allProviders
    .filter((provider) => popularProviderTitles.includes(provider.title))
    .sort((a, b) => a.title.localeCompare(b.title));

  const otherProviders = allProviders
    .filter((provider) => !popularProviderTitles.includes(provider.title))
    .sort((a, b) => a.title.localeCompare(b.title));

  const selectedProviderApiKeyUrl = selectedModel.params.model.startsWith(
    "codestral",
  )
    ? CODESTRAL_URL
    : selectedProvider.apiKeyUrl;

  function isDisabled() {
    if (selectedProvider.downloadUrl) {
      return false;
    }

    const required = selectedProvider.collectInputFor
      ?.filter((input) => input.required)
      .map((input) => {
        const value = formMethods.watch(input.key);
        return value;
      });

    return !required?.every((value) => value !== undefined && value.length > 0);
  }

  useEffect(() => {
    const modelsUrl = formMethods.watch("modelsUrl");
    const apiKey = formMethods.watch("apiKey");

    if (!modelsUrl || modelsUrl === "" || !apiKey || apiKey === "") {
      setModels([]);
      return;
    }
    setLoading(true);
    setFetchError(null);

    fetch(modelsUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch models");
        const data = await res.json();
        // Assume data is an array of model names/objects
        setModels(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        setFetchError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [formMethods.watch("modelsUrl"), formMethods.watch("apiKey")]);

  useEffect(() => {
    setSelectedModel(selectedProvider.packages[0]);
  }, [selectedProvider]);

  function onSubmit() {
    const modelsUrl = formMethods.getValues("modelsUrl");
    const apiKey = formMethods.getValues("apiKey");

    window.postMessage(
      {
        type: "updateConfigYaml",
        payload: {
          provider: "local",
          modelsUrl,
          apiKey,
          selectedModel,
        },
      },
      "*",
    );

    ideMessenger.post("config/openProfile", {
      profileId: "local",
    });

    void dispatch(
      updateSelectedModelByRole({
        selectedProfile,
        role: "chat",
        modelTitle: selectedModel.title,
      }),
    );

    onDone();
  }

  function onClickDownloadProvider() {
    selectedProvider.downloadUrl &&
      ideMessenger.post("openUrl", selectedProvider.downloadUrl);
  }

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)}>
        <div
          style={{
            borderRadius: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
          }}
          className="mx-auto max-w-md rounded-xl bg-gray-800 p-6 shadow-md"
        >
          <h1 className="mb-0 text-center text-2xl">NeoCode</h1>
          <h1 className="mb-0 text-center text-lg">
            ⚡Start by adding your local models
          </h1>
          <hr className="border" />
          <div className="my-8 flex flex-col gap-6">
            <div className="flex flex-col justify-center">
              <label className="mb-2 block text-[16px] font-medium">
                Provider
              </label>
              <label className="block text-[15px]">NeoGia</label>
            </div>
            <div>
              <label className="block text-sm font-medium">Models URL</label>
              <Input
                id="modelsUrl"
                className="w-full"
                type="text"
                placeholder="Enter the URL to fetch models"
                {...formMethods.register("modelsUrl", { required: true })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">API key</label>
              <Input
                id="apiKey"
                className="w-full"
                type="password"
                placeholder="Enter your API key"
                {...formMethods.register("apiKey", { required: true })}
              />
            </div>
            {loading && <Alert>Loading models...</Alert>}
            {fetchError && <Alert>{fetchError}</Alert>}
            {models.length > 0 && (
              <div>
                <label className="block text-sm font-medium">
                  Select Model
                </label>
                <select
                  className="w-full"
                  {...formMethods.register("selectedModel", { required: true })}
                >
                  {models.map((model, idx) => (
                    <option
                      key={idx}
                      value={typeof model === "string" ? model : model.name}
                    >
                      {typeof model === "string" ? model : model.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="mt-4 w-full">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || models.length === 0}
            >
              Connect
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

export default AddModelForm;
