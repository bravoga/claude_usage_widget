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
        style={{ color: "#e5e7eb", fontSize: 10, lineHeight: 1, fontWeight: 500 }}
        className="hover:brightness-125 transition-all"
        title="SaltaDev — Comunidad de tecnología en Salta"
      >
        salta.dev
      </button>
    </div>
  );
}
