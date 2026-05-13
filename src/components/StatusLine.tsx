import { invoke } from "@tauri-apps/api/core";

interface StatusLineProps {
  loading: boolean;
  error: string | null;
}

export function StatusLine({ loading, error }: StatusLineProps) {
  const openSaltaDev = () => {
    invoke("open_url", { url: "https://www.salta.dev" }).catch(() => {});
  };

  const left = error ? (
    <p className="text-xs blink" style={{ color: "#ef4444" }}>
      * {error.substring(0, 28)}
    </p>
  ) : loading ? (
    <p className="text-xs blink" style={{ color: "#f97316" }}>
      * Syncing...
    </p>
  ) : (
    <p className="text-xs" style={{ color: "#374151" }}>
      * Idle
    </p>
  );

  return (
    <div className="flex items-center justify-between">
      {left}
      <button
        onClick={openSaltaDev}
        style={{ color: "#2d2d2d", fontSize: 9, lineHeight: 1 }}
        className="hover:text-gray-500 transition-colors"
        title="SaltaDev — Comunidad de tecnología en Salta"
      >
        salta.dev
      </button>
    </div>
  );
}
