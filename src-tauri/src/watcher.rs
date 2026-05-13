use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::mpsc;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};

use crate::commands::AppState;

pub fn start_watcher(app: AppHandle) {
    let claude_dir = dirs::home_dir()
        .unwrap_or_default()
        .join(".claude")
        .join("projects");

    if !claude_dir.exists() {
        return;
    }

    let (tx, rx) = mpsc::channel::<notify::Result<Event>>();

    let mut watcher = match RecommendedWatcher::new(
        move |res| {
            tx.send(res).ok();
        },
        Config::default(),
    ) {
        Ok(w) => w,
        Err(_) => return,
    };

    if watcher.watch(&claude_dir, RecursiveMode::Recursive).is_err() {
        return;
    }

    let mut last_emit = Instant::now();

    loop {
        match rx.recv_timeout(Duration::from_secs(60)) {
            Ok(Ok(event)) => {
                let is_jsonl = event
                    .paths
                    .iter()
                    .any(|p| p.extension().map(|e| e == "jsonl").unwrap_or(false));

                if is_jsonl && last_emit.elapsed() > Duration::from_secs(2) {
                    last_emit = Instant::now();

                    // Invalidate entry cache so next get_usage_stats re-reads files
                    let state = app.state::<AppState>();
                    if let Ok(mut cache) = state.cache.lock() {
                        cache.fetched_at = Instant::now()
                            - Duration::from_secs(60);
                    }

                    app.emit("usage-updated", ()).ok();
                }
            }
            Ok(Err(_)) | Err(mpsc::RecvTimeoutError::Timeout) => {}
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        }
    }
}
