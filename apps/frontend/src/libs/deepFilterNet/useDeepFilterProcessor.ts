import { useMemo, useState } from "react";
import { createDeepFilterProcessor, DeepFilterNetSettings } from "./createDeepFilterProcessor";

export const useDeepFilterProcessor = () => {
  const [isDeepFilterEnabled, setIsDeepFilterEnabled] = useState(true);
  const [deepFilterSettings, setDeepFilterSettings] = useState<DeepFilterNetSettings>({
    attenLim: 100,
    postFilterBeta: 0.05,
    modelName: 'DeepFilterNet3'
  })

  const deepFilterProcessor = useMemo(() => {
    if (!isDeepFilterEnabled) {
      return null
    }

    return createDeepFilterProcessor(deepFilterSettings);
  }, [isDeepFilterEnabled, deepFilterSettings]);

  return {
    isEnabled: isDeepFilterEnabled,
    processor: deepFilterProcessor,
    settings: deepFilterSettings,
    setIsEnabled: setIsDeepFilterEnabled,
    setSettings: setDeepFilterSettings,
  };
};