use serde::{Deserialize, Serialize};

/// 历史记录项
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct HistoryItem {
    /// 记录 ID
    pub id: String,
    /// 视频标题
    pub title: String,
    /// 视频 URL
    pub url: String,
    /// 下载的分辨率
    pub resolution: String,
    /// 文件路径
    pub file_path: String,
    /// 文件大小
    pub file_size: u64,
    /// 下载时间戳
    pub downloaded_at: i64,
    /// 文件是否存在
    pub file_exists: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_history_item_serialization() {
        let item = HistoryItem {
            id: "hist-123".to_string(),
            title: "Test Video".to_string(),
            url: "https://youtube.com/watch?v=test".to_string(),
            resolution: "1080p".to_string(),
            file_path: "/downloads/video.mp4".to_string(),
            file_size: 1024000,
            downloaded_at: 1234567890,
            file_exists: true,
        };

        let json = serde_json::to_string(&item).unwrap();
        assert!(json.contains("\"filePath\":\"/downloads/video.mp4\"")); // 验证 camelCase
        assert!(json.contains("\"fileSize\":1024000")); // 验证 camelCase
        assert!(json.contains("\"downloadedAt\":1234567890")); // 验证 camelCase
        assert!(json.contains("\"fileExists\":true")); // 验证 camelCase

        // 测试往返
        let deserialized: HistoryItem = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, item);
    }
}
