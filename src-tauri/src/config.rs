use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub max_5h_tokens: u64,
    pub max_weekly_tokens: u64,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            max_5h_tokens: 2_200_000,
            max_weekly_tokens: 16_000_000,
        }
    }
}

fn config_path() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_default()
        .join("claude-usage-widget")
        .join("config.json")
}

pub fn load_config() -> Config {
    let path = config_path();
    if path.exists() {
        if let Ok(content) = std::fs::read_to_string(&path) {
            if let Ok(config) = serde_json::from_str::<Config>(&content) {
                // Reject obviously wrong values (< 100k tokens can't be real limits)
                if config.max_5h_tokens >= 100_000 && config.max_weekly_tokens >= 100_000 {
                    return config;
                }
            }
        }
    }
    Config::default()
}

pub fn persist_config(config: &Config) -> Result<(), String> {
    let path = config_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    std::fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}
