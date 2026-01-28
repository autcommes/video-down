use serde::{Deserialize, Serialize};

/// 视频信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoInfo {
    /// 视频 ID
    pub id: String,
    /// 视频标题
    pub title: String,
    /// 时长（秒）
    pub duration: u32,
    /// 缩略图 URL
    pub thumbnail: String,
    /// 上传者
    pub uploader: String,
    /// 可用格式列表
    pub formats: Vec<Format>,
}

/// 视频格式
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Format {
    /// 格式 ID
    pub format_id: String,
    /// 分辨率 (如 "1920x1080")
    pub resolution: String,
    /// 文件扩展名
    pub ext: String,
    /// 文件大小（字节）
    pub filesize: Option<u64>,
    /// 帧率
    pub fps: Option<u32>,
    /// 视频编码
    pub vcodec: String,
    /// 音频编码
    pub acodec: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_video_info_serialization() {
        let format = Format {
            format_id: "137".to_string(),
            resolution: "1920x1080".to_string(),
            ext: "mp4".to_string(),
            filesize: Some(1024000),
            fps: Some(30),
            vcodec: "avc1".to_string(),
            acodec: "mp4a".to_string(),
        };

        let video_info = VideoInfo {
            id: "test123".to_string(),
            title: "Test Video".to_string(),
            duration: 300,
            thumbnail: "https://example.com/thumb.jpg".to_string(),
            uploader: "Test User".to_string(),
            formats: vec![format],
        };

        // 测试序列化
        let json = serde_json::to_string(&video_info).unwrap();
        assert!(json.contains("\"id\":\"test123\""));
        assert!(json.contains("\"formatId\":\"137\"")); // 验证 camelCase

        // 测试反序列化
        let deserialized: VideoInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.id, "test123");
        assert_eq!(deserialized.formats[0].format_id, "137");
    }
}
