use serde::{Deserialize, Serialize};

/// 进度数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressData {
    /// 任务 ID
    pub task_id: String,
    /// 完成百分比 (0.0 - 100.0)
    pub percent: f32,
    /// 下载速度 (如 "2.5MB/s")
    pub speed: String,
    /// 已下载大小 (如 "125MB")
    pub downloaded: String,
    /// 总大小 (如 "280MB")
    pub total: String,
    /// 预计剩余时间 (如 "00:02:30")
    pub eta: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_progress_data_serialization() {
        let progress = ProgressData {
            task_id: "task-123".to_string(),
            percent: 45.5,
            speed: "2.5MB/s".to_string(),
            downloaded: "125MB".to_string(),
            total: "280MB".to_string(),
            eta: "00:02:30".to_string(),
        };

        let json = serde_json::to_string(&progress).unwrap();
        assert!(json.contains("\"taskId\":\"task-123\"")); // 验证 camelCase
    }
}
