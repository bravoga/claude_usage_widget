import { useState } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import claudeLogo from "../src-tauri/icons/claude.png";
import { useUsage } from "./hooks/useUsage";
import { UsageBar } from "./components/UsageBar";
import { StatusLine } from "./components/StatusLine";
import { LlamaWalker } from "./components/LlamaWalker";
import { AboutPanel } from "./components/AboutPanel";

const FULL_H = 230;
const COMPACT_H = 42;

function MiniBar({ percent, label }: { percent: number; label: string }) {
  const color = percent >= 85 ? "#ef4444" : percent >= 60 ? "#f97316" : "#22c55e";
  return (
    <div className="flex items-center gap-1">
      <span style={{ color: "#6b7280", fontSize: 9, lineHeight: 1 }}>{label}</span>
      <div style={{ width: 36, height: 4, backgroundColor: "#222", borderRadius: 2 }}>
        <div style={{ width: `${Math.min(percent, 100)}%`, height: "100%", backgroundColor: color, borderRadius: 2 }} />
      </div>
      <span style={{ color: "#d1d5db", fontSize: 10, lineHeight: 1, minWidth: 22 }}>{Math.round(percent)}%</span>
    </div>
  );
}


export default function App() {
  const { stats, loading, error } = useUsage();
  const [compact, setCompact] = useState(false);
  const [showAbout, setShowAbout] = useState(false);


  const handleDrag = () => getCurrentWindow().startDragging().catch(() => {});

  const toggleCompact = async () => {
    const win = getCurrentWindow();
    if (compact) {
      await win.setSize(new LogicalSize(260, FULL_H));
      setCompact(false);
    } else {
      await win.setSize(new LogicalSize(260, COMPACT_H));
      setCompact(true);
    }
  };

  if (compact) {
    return (
      <div
        data-tauri-drag-region
        className="w-full h-full relative flex items-center px-2 gap-2 rounded-xl overflow-hidden cursor-move"
        style={{ backgroundColor: "rgba(13,13,13,0.93)", border: "1px solid #1f1f1f" }}
        onMouseDown={(e) => {
          const t = e.target as HTMLElement;
          if (e.button === 0 && !t.closest("button, a, input")) handleDrag();
        }}
      >
        <img src={claudeLogo} alt="" style={{ width: 14, height: 14, imageRendering: "pixelated", flexShrink: 0 }} />

        {stats ? (
          <>
            <MiniBar percent={stats.current.percent} label="5h" />
            <span style={{ color: "#2a2a2a", fontSize: 10 }}>│</span>
            <MiniBar percent={stats.weekly.percent} label="7d" />
          </>
        ) : (
          <span className="text-xs blink" style={{ color: "#f97316", fontSize: 9 }}>…</span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={toggleCompact}
            className="text-gray-700 hover:text-gray-400 transition-colors"
            style={{ fontSize: 12, lineHeight: 1 }}
            title="Expand"
          >
            ⊞
          </button>
          <button
            onClick={() => getCurrentWindow().close()}
            className="text-gray-700 hover:text-red-500 transition-colors"
            style={{ fontSize: 14, lineHeight: 1 }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div
        className="w-full h-full flex flex-col rounded-xl overflow-hidden"
        style={{ backgroundColor: "rgba(13,13,13,0.93)", border: "1px solid #1f1f1f" }}
      >
        {showAbout && <AboutPanel onClose={() => setShowAbout(false)} />}

        <div
          data-tauri-drag-region
          className="flex items-center justify-between px-3 pt-2.5 pb-1.5 cursor-move"
          onMouseDown={(e) => {
            const t = e.target as HTMLElement;
            if (e.button === 0 && !t.closest("button, a, input")) handleDrag();
          }}
        >
          <div className="flex items-center gap-1.5 pointer-events-none">
            <img src={claudeLogo} alt="Claude" style={{ width: 18, height: 18, imageRendering: "pixelated" }} />
            <span className="text-white text-sm font-semibold tracking-wide">Claude - Usage</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleCompact}
              className="text-gray-700 hover:text-gray-400 transition-colors"
              style={{ fontSize: 12, lineHeight: 1 }}
              title="Compact mode"
            >
              ⊟
            </button>
            <button
              onClick={() => setShowAbout(true)}
              className="text-gray-700 hover:text-gray-400 transition-colors"
              style={{ fontSize: 12, lineHeight: 1 }}
              title="About"
            >
              ?
            </button>
            <button
              onClick={() => getCurrentWindow().close()}
              className="text-gray-700 hover:text-red-500 transition-colors"
              style={{ fontSize: 16, lineHeight: 1 }}
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="mx-3 mb-2" style={{ height: 1, backgroundColor: "#1a1a1a" }} />

        <div className="flex-1 px-3 pb-1">
          {stats ? (
            <>
              <UsageBar
                percent={stats.current.percent}
                label="Current"
                resetInSecs={stats.current.reset_in_secs}
              />
              <UsageBar
                percent={stats.weekly.percent}
                label="Weekly"
                resetInSecs={stats.weekly.reset_in_secs}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-16">
              <span className="text-xs blink" style={{ color: "#f97316" }}>* Loading...</span>
            </div>
          )}
        </div>

        <div className="px-3 pb-2">
          <StatusLine loading={loading} error={error} />
        </div>
      </div>

      <LlamaWalker />
    </div>
  );
}
