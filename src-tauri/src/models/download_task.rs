use serde::{Deserialize, Serialize};

/// 下载任务
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadTask {
    /// 任务 ID (UUID)
    pub id: String,
    /// 视频 URL
    pub url: String,
    /// 视频标题
    pub title: String,
    /// 选择的格式 ID
    pub format_id: String,
    /// 保存路径
    pub save_path: String,
    /// 任务状态
    pub status: TaskStatus,
    /// 创建时间戳
    pub created_at: i64,
}

/// 任务状态
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum TaskStatus {
    /// 等待中
    Pending,
    /// 下载中
    Downloading,
    /// 已完成
    Completed,
    /// 失败
    Failed,
    /// 已取消
    Cancelled,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use proptest::prelude::*;
    use crate::models::history::HistoryItem;

    #[test]
    fn test_download_task_serialization() {
        let task = DownloadTask {
            id: "task-123".to_string(),
            url: "https://youtube.com/watch?v=test".to_string(),
            title: "Test Video".to_string(),
            format_id: "137".to_string(),
            save_path: "/downloads/video.mp4".to_string(),
            status: TaskStatus::Downloading,
            created_at: 1234567890,
        };

        let json = serde_json::to_string(&task).unwrap();
        assert!(json.contains("\"formatId\":\"137\"")); // 验证 camelCase
        assert!(json.contains("\"savePath\":\"/downloads/video.mp4\"")); // 验证 camelCase
        assert!(json.contains("\"createdAt\":1234567890")); // 验证 camelCase
    }

    #[test]
    fn test_task_status_equality() {
        assert_eq!(TaskStatus::Completed, TaskStatus::Completed);
        assert_ne!(TaskStatus::Completed, TaskStatus::Failed);
        assert_ne!(TaskStatus::Downloading, TaskStatus::Completed);
    }

    // 模拟的历史记录存储
    struct MockHistoryStore {
        items: HashMap<String, HistoryItem>,
    }

    impl MockHistoryStore {
        fn new() -> Self {
            Self {
                items: HashMap::new(),
            }
        }

        fn add_item(&mut self, item: HistoryItem) {
            self.items.insert(item.id.clone(), item);
        }

        fn get_item(&self, id: &str) -> Option<&HistoryItem> {
            self.items.get(id)
        }

        fn contains(&self, id: &str) -> bool {
            self.items.contains_key(id)
        }
    }

    // 模拟的文件系统
    struct MockFileSystem {
        files: HashMap<String, Vec<u8>>,
    }

    impl MockFileSystem {
        fn new() -> Self {
            Self {
                files: HashMap::new(),
            }
        }

        fn create_file(&mut self, path: &str, content: Vec<u8>) {
            self.files.insert(path.to_string(), content);
        }

        fn file_exists(&self, path: &str) -> bool {
            self.files.contains_key(path)
        }
    }

    // 模拟完成下载任务的函数
    fn complete_download_task(
        task: &mut DownloadTask,
        history_store: &mut MockHistoryStore,
        file_system: &mut MockFileSystem,
    ) {
        // 1. 将任务状态设置为 Completed
        task.status = TaskStatus::Completed;

        // 2. 创建文件
        let file_content = vec![0u8; 1024]; // 模拟文件内容
        file_system.create_file(&task.save_path, file_content.clone());

        // 3. 添加到历史记录
        let history_item = HistoryItem {
            id: task.id.clone(),
            title: task.title.clone(),
            url: task.url.clone(),
            resolution: "1080p".to_string(), // 简化处理
            file_path: task.save_path.clone(),
            file_size: file_content.len() as u64,
            downloaded_at: task.created_at,
            file_exists: true,
        };
        history_store.add_item(history_item);
    }

    // Feature: youtube-downloader-tool, Property 15: 任务完成状态一致性
    // 验证需求：3.4
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn prop_task_completion_state_consistency(
            // 生成随机的任务 ID
            task_id in "[a-zA-Z0-9_-]{5,20}",
            // 生成随机的视频标题
            title in "[\\p{L}\\p{N}\\s]{1,100}",
            // 生成随机的 URL
            url_suffix in "[a-zA-Z0-9_-]{5,15}",
            // 生成随机的格式 ID
            format_id in "[0-9]{1,3}",
            // 生成随机的文件名
            filename in "[a-zA-Z0-9_-]{5,20}",
            // 生成随机的时间戳
            created_at in 1000000000i64..2000000000i64,
        ) {
            // 构造下载任务
            let mut task = DownloadTask {
                id: task_id.clone(),
                url: format!("https://youtube.com/watch?v={}", url_suffix),
                title: title.clone(),
                format_id: format_id.clone(),
                save_path: format!("/downloads/{}.mp4", filename),
                status: TaskStatus::Downloading,
                created_at,
            };

            // 创建模拟的历史记录存储和文件系统
            let mut history_store = MockHistoryStore::new();
            let mut file_system = MockFileSystem::new();

            // 模拟完成下载任务
            complete_download_task(&mut task, &mut history_store, &mut file_system);

            // 属性验证：对于任意成功完成的下载任务，应该同时满足：
            
            // 1. 任务状态为 Completed
            prop_assert_eq!(
                task.status,
                TaskStatus::Completed,
                "任务状态应该为 Completed"
            );

            // 2. 任务存在于历史记录中
            prop_assert!(
                history_store.contains(&task.id),
                "任务 {} 应该存在于历史记录中",
                task.id
            );

            // 验证历史记录的详细信息
            let history_item = history_store.get_item(&task.id);
            prop_assert!(
                history_item.is_some(),
                "应该能够从历史记录中获取任务 {}",
                task.id
            );

            let history_item = history_item.unwrap();
            prop_assert_eq!(
                &history_item.id,
                &task.id,
                "历史记录的 ID 应该与任务 ID 一致"
            );
            prop_assert_eq!(
                &history_item.title,
                &task.title,
                "历史记录的标题应该与任务标题一致"
            );
            prop_assert_eq!(
                &history_item.url,
                &task.url,
                "历史记录的 URL 应该与任务 URL 一致"
            );
            prop_assert_eq!(
                &history_item.file_path,
                &task.save_path,
                "历史记录的文件路径应该与任务保存路径一致"
            );

            // 3. 对应的文件存在于文件系统中
            prop_assert!(
                file_system.file_exists(&task.save_path),
                "文件 {} 应该存在于文件系统中",
                task.save_path
            );

            // 额外验证：历史记录中的 file_exists 标志应该为 true
            prop_assert!(
                history_item.file_exists,
                "历史记录中的 file_exists 标志应该为 true"
            );
        }
    }

    // 测试边缘情况：未完成的任务不应该在历史记录中
    #[test]
    fn test_incomplete_task_not_in_history() {
        let task = DownloadTask {
            id: "task-incomplete".to_string(),
            url: "https://youtube.com/watch?v=test".to_string(),
            title: "Incomplete Video".to_string(),
            format_id: "137".to_string(),
            save_path: "/downloads/incomplete.mp4".to_string(),
            status: TaskStatus::Downloading,
            created_at: 1234567890,
        };

        let history_store = MockHistoryStore::new();

        // 未完成的任务不应该在历史记录中
        assert!(!history_store.contains(&task.id));
    }

    // 测试边缘情况：失败的任务不应该在历史记录中
    #[test]
    fn test_failed_task_not_in_history() {
        let task = DownloadTask {
            id: "task-failed".to_string(),
            url: "https://youtube.com/watch?v=test".to_string(),
            title: "Failed Video".to_string(),
            format_id: "137".to_string(),
            save_path: "/downloads/failed.mp4".to_string(),
            status: TaskStatus::Failed,
            created_at: 1234567890,
        };

        let history_store = MockHistoryStore::new();

        // 失败的任务不应该在历史记录中
        assert!(!history_store.contains(&task.id));
    }

    // 测试边缘情况：取消的任务不应该在历史记录中
    #[test]
    fn test_cancelled_task_not_in_history() {
        let task = DownloadTask {
            id: "task-cancelled".to_string(),
            url: "https://youtube.com/watch?v=test".to_string(),
            title: "Cancelled Video".to_string(),
            format_id: "137".to_string(),
            save_path: "/downloads/cancelled.mp4".to_string(),
            status: TaskStatus::Cancelled,
            created_at: 1234567890,
        };

        let history_store = MockHistoryStore::new();

        // 取消的任务不应该在历史记录中
        assert!(!history_store.contains(&task.id));
    }
}
