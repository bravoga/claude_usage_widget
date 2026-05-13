import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Config {
  max_5h_tokens: number;
  max_weekly_tokens: number;
}

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [cfg, setCfg] = useState<Config>({ max_5h_tokens: 500_000, max_weekly_tokens: 3_000_000 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    invoke<Config>("get_config").then(setCfg).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await invoke("save_config", { config: cfg });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    color: "#fff",
    outline: "none",
  } as const;

  return (
    <div
      className="absolute inset-0 flex flex-col p-3 rounded-xl z-10"
      style={{ backgroundColor: "#0d0d0d" }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-white text-sm font-semibold">Settings</span>
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-300 text-base leading-none w-5 h-5 flex items-center justify-center"
        >
          ×
        </button>
      </div>

      <label className="text-xs mb-1" style={{ color: "#6b7280" }}>
        5-hour limit (tokens)
      </label>
      <input
        type="number"
        value={cfg.max_5h_tokens}
        onChange={(e) => setCfg((c) => ({ ...c, max_5h_tokens: Number(e.target.value) }))}
        className="mb-2 px-2 py-1 rounded text-sm w-full"
        style={inputStyle}
      />

      <label className="text-xs mb-1" style={{ color: "#6b7280" }}>
        Weekly limit (tokens)
      </label>
      <input
        type="number"
        value={cfg.max_weekly_tokens}
        onChange={(e) => setCfg((c) => ({ ...c, max_weekly_tokens: Number(e.target.value) }))}
        className="mb-1 px-2 py-1 rounded text-sm w-full"
        style={inputStyle}
      />

      <p className="text-xs mb-2" style={{ color: "#374151" }}>
        Max Pro ($20): ~500K / 3M · Max 5× ($100): ~2M / 15M
      </p>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={onClose}
          className="flex-1 py-1.5 rounded text-xs"
          style={{ backgroundColor: "#1a1a1a", color: "#6b7280" }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-1.5 rounded text-xs font-semibold"
          style={{ backgroundColor: "#f97316", color: "#fff", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
