import { useState, useEffect } from "react";

export interface GameSettings {
  soundEnabled: boolean;
  soundVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
}

const DEFAULT: GameSettings = {
  soundEnabled: true,
  soundVolume: 70,
  musicEnabled: true,
  musicVolume: 50,
};

export function useGameSettings() {
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const stored = localStorage.getItem("game-settings");
      return stored ? { ...DEFAULT, ...JSON.parse(stored) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  useEffect(() => {
    localStorage.setItem("game-settings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (partial: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return { settings, updateSettings };
}
