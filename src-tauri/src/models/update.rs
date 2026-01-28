use serde::{Deserialize, Serialize};

/// 更新信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    /// 当前版本
    pub current_version: String,
    /// 最新版本
    pub latest_version: String,
    /// 是否有更新
    pub has_update: bool,
    /// 下载 URL
    pub download_url: String,
    /// 更新说明
    pub release_notes: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_update_info_serialization() {
        let info = UpdateInfo {
            current_version: "2024.01.10".to_string(),
            latest_version: "2024.01.15".to_string(),
            has_update: true,
            download_url: "https://github.com/releases/yt-dlp.exe".to_string(),
            release_notes: "Bug fixes".to_string(),
        };

        let json = serde_json::to_string(&info).unwrap();
        assert!(json.contains("\"currentVersion\":\"2024.01.10\"")); // 验证 camelCase
        assert!(json.contains("\"latestVersion\":\"2024.01.15\"")); // 验证 camelCase
        assert!(json.contains("\"hasUpdate\":true")); // 验证 camelCase
        assert!(json.contains("\"downloadUrl\"")); // 验证 camelCase
        assert!(json.contains("\"releaseNotes\"")); // 验证 camelCase
    }
}
