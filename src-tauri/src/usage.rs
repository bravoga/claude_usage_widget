use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use walkdir::WalkDir;

#[derive(Debug, Clone)]
pub struct TokenEntry {
    pub timestamp: DateTime<Utc>,
    pub total: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregateResult {
    pub tokens_used: u64,
    pub reset_in_secs: Option<i64>,
}

// JSONL parsing structures
#[derive(Debug, Deserialize)]
struct JsonlLine {
    #[serde(rename = "type")]
    msg_type: Option<String>,
    timestamp: Option<String>,
    message: Option<MessageField>,
}

#[derive(Debug, Deserialize)]
struct MessageField {
    usage: Option<UsageField>,
}

#[derive(Debug, Deserialize)]
struct UsageField {
    input_tokens: Option<u64>,
    output_tokens: Option<u64>,
}

fn claude_projects_dir() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_default()
        .join(".claude")
        .join("projects")
}

pub fn collect_all_entries() -> Vec<TokenEntry> {
    let base = claude_projects_dir();
    if !base.exists() {
        return vec![];
    }

    let mut entries = Vec::new();

    for dir_entry in WalkDir::new(&base)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.file_type().is_file()
                && e.path().extension().map(|x| x == "jsonl").unwrap_or(false)
        })
    {
        let Ok(content) = std::fs::read_to_string(dir_entry.path()) else {
            continue;
        };

        for line in content.lines() {
            if line.trim().is_empty() {
                continue;
            }
            let Ok(parsed) = serde_json::from_str::<JsonlLine>(line) else {
                continue;
            };

            let (Some(msg_type), Some(ts_str), Some(message)) =
                (parsed.msg_type, parsed.timestamp, parsed.message)
            else {
                continue;
            };

            if msg_type != "assistant" {
                continue;
            }

            let Some(usage) = message.usage else {
                continue;
            };

            let Ok(ts) = ts_str.parse::<DateTime<Utc>>() else {
                continue;
            };

            let total = usage.input_tokens.unwrap_or(0)
                + usage.output_tokens.unwrap_or(0);

            if total > 0 {
                entries.push(TokenEntry { timestamp: ts, total });
            }
        }
    }

    entries
}

pub fn aggregate_window(entries: &[TokenEntry], window_secs: i64) -> AggregateResult {
    let now = Utc::now();
    let cutoff = now - Duration::seconds(window_secs);

    let in_window: Vec<&TokenEntry> = entries.iter().filter(|e| e.timestamp >= cutoff).collect();

    let tokens_used: u64 = in_window.iter().map(|e| e.total).sum();

    let reset_in_secs = in_window
        .iter()
        .map(|e| e.timestamp)
        .min()
        .map(|oldest| {
            let reset_at = oldest + Duration::seconds(window_secs);
            (reset_at - now).num_seconds()
        })
        .filter(|&s| s > 0);

    AggregateResult {
        tokens_used,
        reset_in_secs,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_aggregate_empty() {
        let result = aggregate_window(&[], 18000);
        assert_eq!(result.tokens_used, 0);
        assert!(result.reset_in_secs.is_none());
    }

    #[test]
    fn test_aggregate_filters_old_entries() {
        let now = Utc::now();
        let entries = vec![
            TokenEntry {
                timestamp: now - Duration::hours(6),
                total: 5000,
            },
            TokenEntry {
                timestamp: now - Duration::hours(2),
                total: 2300,
            },
        ];
        let result = aggregate_window(&entries, 18000);
        assert_eq!(result.tokens_used, 2300);
        assert!(result.reset_in_secs.is_some());
        let secs = result.reset_in_secs.unwrap();
        assert!(secs > 10_000 && secs <= 18000);
    }

    #[test]
    fn test_aggregate_all_in_window() {
        let now = Utc::now();
        let entries = vec![
            TokenEntry { timestamp: now - Duration::hours(1), total: 1000 },
            TokenEntry { timestamp: now - Duration::minutes(30), total: 500 },
        ];
        let result = aggregate_window(&entries, 18000);
        assert_eq!(result.tokens_used, 1500);
    }
}
