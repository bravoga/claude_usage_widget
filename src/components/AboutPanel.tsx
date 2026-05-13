import { invoke } from "@tauri-apps/api/core";

interface AboutPanelProps {
  onClose: () => void;
}

function openUrl(url: string) {
  invoke("open_url", { url }).catch(() => {});
}

export function AboutPanel({ onClose }: AboutPanelProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col rounded-xl"
      style={{ backgroundColor: "rgba(13,13,13,0.97)", border: "1px solid #1f1f1f" }}
    >
      <div className="flex items-center justify-between px-3 pt-2.5 pb-2">
        <span className="text-white text-sm font-semibold">About</span>
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-300 transition-colors"
          style={{ fontSize: 16, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      <div className="mx-3 mb-2" style={{ height: 1, backgroundColor: "#1a1a1a" }} />

      <div className="flex-1 px-3 pb-3 flex flex-col gap-3">
        <div>
          <p className="text-white text-xs font-semibold">Claude Usage Widget</p>
          <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
            Floating token usage monitor for Claude Code on Windows.
          </p>
          <p className="text-xs mt-1" style={{ color: "#4b5563" }}>by Gabriel Bravo</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => openUrl("https://github.com/bravoga/claude_usage_widget")}
            className="text-left text-xs hover:brightness-125 transition-all"
            style={{ color: "#f97316" }}
          >
            ↗ github.com/bravoga/claude_usage_widget
          </button>
          <button
            onClick={() => openUrl("https://www.salta.dev")}
            className="text-left text-xs hover:brightness-125 transition-all"
            style={{ color: "#9ca3af" }}
          >
            ↗ salta.dev — Comunidad tech en Salta
          </button>
        </div>

        <div style={{ color: "#374151" }} className="text-xs mt-auto">
          MIT License · Built with Tauri + React
        </div>
      </div>
    </div>
  );
}
