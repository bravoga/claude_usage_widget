# Claude Usage Widget

A lightweight, always-on-top floating widget for Windows that shows your **Claude Code token usage** in real time — 5-hour rolling window and 7-day weekly period.

> Built with Tauri 2 + React + TypeScript. Reads authoritative utilization data directly from Claude Code's OAuth API, with a local JSONL fallback.

---

## Features

- **Real-time usage** — 5-hour rolling window and 7-day weekly bars
- **Authoritative data** — pulls live utilization percentages from Anthropic's OAuth endpoint (`/api/oauth/usage`) using your existing Claude Code credentials
- **Local fallback** — if the API is unavailable, reads token counts directly from `~/.claude/projects/**/*.jsonl`
- **Always on top** — floats above all windows, never in your way
- **Transparent + frameless** — blends into any desktop setup
- **Draggable** — click and drag anywhere on the header to reposition
- **Compact mode** — collapse to a minimal 42 px pill showing both bars at a glance
- **System tray** — minimize to tray, show/hide, open settings
- **Configurable limits** — set your own max tokens per period in the settings panel
- **Pixel art llama** — because why not

---

The widget comes in two modes: a **full view** (230px) showing detailed usage bars with token counts and reset timers, and a **compact mode** (42px pill) that collapses to two minimal progress bars — perfect for keeping an eye on usage without taking up screen space.

---

## Requirements

- **Windows 10 / 11**
- **[Claude Code](https://claude.ai/code)** installed and authenticated (provides the OAuth token at `~/.claude/.credentials.json`)
- **Rust + Cargo** ([install](https://rustup.rs/))
- **Node.js** + **[Bun](https://bun.sh/)** (`npm install -g bun`)
- **WebView2** — pre-installed on Windows 11; Windows 10 users may need to install it from [Microsoft](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

---

## Installation

### Download a release *(recommended)*

Download the latest `.msi` or `.exe` installer from the [Releases](../../releases) page and run it.

### Build from source

```bash
git clone https://github.com/bravoga/claude_usage_widget.git
cd claude_usage_widget
bun install
bun run tauri build
```

The installer will be at `src-tauri/target/release/bundle/`.

### Development

```bash
bun install
bun run tauri dev
```

---

## How it works

1. **OAuth API** (primary) — on startup the widget reads your Claude Code OAuth access token from `~/.claude/.credentials.json` and calls `https://api.anthropic.com/api/oauth/usage` with the `anthropic-beta: oauth-2025-04-20` header. The response contains `five_hour.utilization` and `seven_day.utilization` — integer percentages straight from Anthropic. Results are cached for 5 minutes to respect rate limits.

2. **JSONL fallback** — if the API call fails, the widget scans all `.jsonl` files under `~/.claude/projects/`, sums `input_tokens + output_tokens` for each message within the relevant time window, and calculates a percentage against your configured limits.

No data leaves your machine except for the single usage API call to Anthropic.

---

## Configuration

Click the ⚙ icon (or right-click the tray icon → Settings) to configure:

| Setting | Default | Description |
|---------|---------|-------------|
| Max tokens (5h) | 2,200,000 | Your plan's 5-hour rolling window limit |
| Max tokens (weekly) | 16,000,000 | Your plan's 7-day limit |

These limits are only used by the JSONL fallback. The OAuth API provides its own authoritative percentages independently of these values.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Tauri 2](https://tauri.app/) (Rust) |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS 3 |
| Build | Vite 5 |
| HTTP | reqwest 0.12 |
| File watching | notify 6 |

---

## Privacy

- The widget never sends your conversation content anywhere.
- The only outbound network call is `GET https://api.anthropic.com/api/oauth/usage` using your own Claude Code credentials.
- All JSONL processing happens locally.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

## Made with ❤️ at [SaltaDev](https://www.salta.dev)

**SaltaDev** — Comunidad de tecnología y desarrollo en Salta. Impulsando el futuro digital del norte.

[www.salta.dev](https://www.salta.dev)
