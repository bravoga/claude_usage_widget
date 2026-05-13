use serde::Deserialize;
use std::path::PathBuf;

#[derive(Debug, Deserialize)]
struct Credentials {
    #[serde(rename = "claudeAiOauth")]
    claude_ai_oauth: Option<ClaudeAiOauth>,
}

#[derive(Debug, Deserialize)]
struct ClaudeAiOauth {
    #[serde(rename = "accessToken")]
    access_token: String,
}

fn credentials_path() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_default()
        .join(".claude")
        .join(".credentials.json")
}

pub fn read_access_token() -> Option<String> {
    let content = std::fs::read_to_string(credentials_path()).ok()?;
    let creds: Credentials = serde_json::from_str(&content).ok()?;
    creds.claude_ai_oauth.map(|c| c.access_token)
}

pub async fn fetch_usage() -> Result<serde_json::Value, String> {
    let token = read_access_token()
        .ok_or_else(|| "No OAuth token in ~/.claude/.credentials.json".to_string())?;

    let client = reqwest::Client::new();
    let resp = client
        .get("https://api.anthropic.com/api/oauth/usage")
        .header("Authorization", format!("Bearer {}", token))
        .header("anthropic-beta", "oauth-2025-04-20")
        .header("accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    let status = resp.status();
    let json: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("JSON parse error: {}", e))?;

    if !status.is_success() {
        return Err(format!("API {} – {}", status.as_u16(), json));
    }

    Ok(json)
}
