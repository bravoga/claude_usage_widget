use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::State;

use crate::{
    config::{Config, persist_config},
    usage::{aggregate_window, collect_all_entries, TokenEntry},
};

const CACHE_TTL_SECS: u64 = 25;
const OAUTH_TTL_SECS: u64 = 300; // 5 minutes — avoids rate limits on the beta endpoint

pub struct EntriesCache {
    pub entries: Vec<TokenEntry>,
    pub fetched_at: Instant,
}

impl Default for EntriesCache {
    fn default() -> Self {
        Self {
            entries: Vec::new(),
            fetched_at: Instant::now() - Duration::from_secs(CACHE_TTL_SECS + 1),
        }
    }
}

pub struct OAuthCache {
    pub data: Option<serde_json::Value>,
    pub fetched_at: Instant,
}

impl Default for OAuthCache {
    fn default() -> Self {
        Self {
            data: None,
            fetched_at: Instant::now() - Duration::from_secs(OAUTH_TTL_SECS + 1),
        }
    }
}

pub struct AppState {
    pub config: Mutex<Config>,
    pub cache: Mutex<EntriesCache>,
    pub oauth_cache: Mutex<OAuthCache>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeriodStats {
    pub tokens_used: u64,
    pub percent: f64,
    pub reset_in_secs: Option<i64>,
    pub max_tokens: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageStats {
    pub current: PeriodStats,
    pub weekly: PeriodStats,
}

#[tauri::command]
pub fn get_usage_stats(state: State<AppState>) -> UsageStats {
    let config = state.config.lock().unwrap().clone();

    let entries = {
        let mut cache = state.cache.lock().unwrap();
        if cache.fetched_at.elapsed().as_secs() > CACHE_TTL_SECS {
            cache.entries = collect_all_entries();
            cache.fetched_at = Instant::now();
        }
        cache.entries.clone()
    };

    let current_raw = aggregate_window(&entries, 5 * 3600);
    let weekly_raw = aggregate_window(&entries, 7 * 24 * 3600);

    let pct = |used: u64, max: u64| -> f64 {
        if max == 0 {
            0.0
        } else {
            (used as f64 / max as f64 * 100.0).min(100.0)
        }
    };

    UsageStats {
        current: PeriodStats {
            tokens_used: current_raw.tokens_used,
            percent: pct(current_raw.tokens_used, config.max_5h_tokens),
            reset_in_secs: current_raw.reset_in_secs,
            max_tokens: config.max_5h_tokens,
        },
        weekly: PeriodStats {
            tokens_used: weekly_raw.tokens_used,
            percent: pct(weekly_raw.tokens_used, config.max_weekly_tokens),
            reset_in_secs: weekly_raw.reset_in_secs,
            max_tokens: config.max_weekly_tokens,
        },
    }
}

#[tauri::command]
pub fn get_config(state: State<AppState>) -> Config {
    state.config.lock().unwrap().clone()
}

#[tauri::command]
pub fn save_config(config: Config, state: State<AppState>) -> Result<(), String> {
    persist_config(&config)?;
    *state.config.lock().unwrap() = config;
    Ok(())
}

#[tauri::command]
pub fn open_url(url: String) -> Result<(), String> {
    std::process::Command::new("cmd")
        .args(["/C", "start", "", &url])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_oauth_usage(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    // Serve from cache if still fresh — avoids hammering the rate-limited endpoint
    {
        let cache = state.oauth_cache.lock().unwrap();
        if cache.fetched_at.elapsed().as_secs() < OAUTH_TTL_SECS {
            if let Some(ref data) = cache.data {
                return Ok(data.clone());
            }
        }
    }

    let data = crate::oauth::fetch_usage().await?;

    {
        let mut cache = state.oauth_cache.lock().unwrap();
        cache.data = Some(data.clone());
        cache.fetched_at = Instant::now();
    }

    Ok(data)
}
