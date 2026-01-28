use crate::error::AppError;
use crate::models::HistoryItem;
use std::fs;
use std::path::{Path, PathBuf};

/// 历史记录管理服务
pub struct HistoryService {
    history_path: PathBuf,
}

impl HistoryService {
    /// 创建新的历史记录服务实例
    ///
    /// # Arguments
    /// * `data_dir` - 历史记录文件所在目录
    ///
    /// # Returns
    /// 历史记录服务实例
    pub fn new(data_dir: impl AsRef<Path>) -> Result<Self, AppError> {
        let data_dir = data_dir.as_ref();
        
        // 确保数据目录存在
        if !data_dir.exists() {
            fs::create_dir_all(data_dir).map_err(|e| {
                AppError::FileSystemError(e)
            })?;
        }
        
        let history_path = data_dir.join("history.json");
        
        Ok(HistoryService { history_path })
    }
    
    /// 加载历史记录
    ///
    /// 如果历史记录文件不存在，返回空列表
    ///
    /// # Returns
    /// 历史记录列表
    pub fn load(&self) -> Result<Vec<HistoryItem>, AppError> {
        // 如果历史记录文件不存在，返回空列表
        if !self.history_path.exists() {
            return Ok(Vec::new());
        }
        
        // 读取历史记录文件
        let content = fs::read_to_string(&self.history_path)?;
        
        // 解析 JSON
        let mut items: Vec<HistoryItem> = serde_json::from_str(&content)?;
        
        // 更新文件存在性状态
        for item in &mut items {
            item.file_exists = Path::new(&item.file_path).exists();
        }
        
        Ok(items)
    }
    
    /// 保存历史记录项
    ///
    /// 将新的历史记录项添加到列表中并保存
    ///
    /// # Arguments
    /// * `item` - 要保存的历史记录项
    ///
    /// # Returns
    /// 成功或错误
    pub fn save(&self, item: HistoryItem) -> Result<(), AppError> {
        // 加载现有历史记录
        let mut items = self.load()?;
        
        // 添加新记录到列表开头（最新的在前面）
        items.insert(0, item);
        
        // 保存整个列表
        self.save_all(&items)
    }
    
    /// 保存所有历史记录
    ///
    /// # Arguments
    /// * `items` - 历史记录列表
    ///
    /// # Returns
    /// 成功或错误
    fn save_all(&self, items: &[HistoryItem]) -> Result<(), AppError> {
        // 序列化为 JSON（格式化输出）
        let json = serde_json::to_string_pretty(items)?;
        
        // 使用原子写入：先写入临时文件，然后重命名
        let temp_path = self.history_path.with_extension("json.tmp");
        
        // 写入临时文件
        fs::write(&temp_path, json)?;
        
        // 原子重命名
        fs::rename(&temp_path, &self.history_path).map_err(|e| {
            // 如果重命名失败，清理临时文件
            let _ = fs::remove_file(&temp_path);
            AppError::FileSystemError(e)
        })?;
        
        Ok(())
    }
    
    /// 清空历史记录（保留文件）
    ///
    /// 清空历史记录列表，但不删除已下载的文件
    ///
    /// # Returns
    /// 成功或错误
    pub fn clear(&self) -> Result<(), AppError> {
        // 保存空列表
        self.save_all(&[])
    }
    
    /// 检查文件是否存在
    ///
    /// # Arguments
    /// * `file_path` - 文件路径
    ///
    /// # Returns
    /// 文件是否存在
    #[allow(dead_code)]
    pub fn check_file_exists(file_path: &str) -> bool {
        Path::new(file_path).exists()
    }
    
    /// 获取历史记录文件路径
    #[allow(dead_code)]
    pub fn history_path(&self) -> &Path {
        &self.history_path
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs::File;
    use std::io::Write;
    use proptest::prelude::*;
    
    fn create_test_item(id: &str, title: &str, file_path: &str) -> HistoryItem {
        HistoryItem {
            id: id.to_string(),
            title: title.to_string(),
            url: format!("https://youtube.com/watch?v={}", id),
            resolution: "1080p".to_string(),
            file_path: file_path.to_string(),
            file_size: 1024000,
            downloaded_at: 1234567890,
            file_exists: true,
        }
    }
    
    #[test]
    fn test_history_service_new() {
        let temp_dir = TempDir::new().unwrap();
        let service = HistoryService::new(temp_dir.path()).unwrap();
        
        assert_eq!(
            service.history_path(),
            temp_dir.path().join("history.json")
        );
    }
    
    #[test]
    fn test_load_empty_history() {
        let temp_dir = TempDir::new().unwrap();
        let service = HistoryService::new(temp_dir.path()).unwrap();
        
        // 首次加载应该返回空列表
        let items = service.load().unwrap();
        assert_eq!(items.len(), 0);
    }
    
    #[test]
    fn test_save_and_load_single_item() {
        let temp_dir = TempDir::new().unwrap();
        let service = HistoryService::new(temp_dir.path()).unwrap();
        
        let item = create_test_item("test1", "Test Video 1", "/downloads/video1.mp4");
        
        // 保存历史记录
        service.save(item.clone()).unwrap();
        
        // 加载历史记录
        let loaded_items = service.load().unwrap();
        
        assert_eq!(loaded_items.len(), 1);
        assert_eq!(loaded_items[0].id, item.id);
        assert_eq!(loaded_items[0].title, item.title);
    }
    
    #[test]
    fn test_save_multiple_items() {
        let temp_dir = TempDir::new().unwrap();
        let service = HistoryService::new(temp_dir.path()).unwrap();
        
        let item1 = create_test_item("test1", "Test Video 1", "/downloads/video1.mp4");
        let item2 = create_test_item("test2", "Test Video 2", "/downloads/video2.mp4");
        let item3 = create_test_item("test3", "Test Video 3", "/downloads/video3.mp4");
        
        // 保存多个历史记录
        service.save(item1.clone()).unwrap();
        service.save(item2.clone()).unwrap();
        service.save(item3.clone()).unwrap();
        
        // 加载历史记录
        let loaded_items = service.load().unwrap();
        
        assert_eq!(loaded_items.len(), 3);
        // 最新的应该在前面
        assert_eq!(loaded_items[0].id, item3.id);
        assert_eq!(loaded_items[1].id, item2.id);
        assert_eq!(loaded_items[2].id, item1.id);
    }
    
    #[test]
    fn test_clear_history() {
        let temp_dir = TempDir::new().unwrap();
        let service = HistoryService::new(temp_dir.path()).unwrap();
        
        // 创建实际的测试文件
        let file_path = temp_dir.path().join("video.mp4");
        let mut file = File::create(&file_path).unwrap();
        file.write_all(b"test video content").unwrap();
        
        let item = create_test_item("test1", "Test Video", file_path.to_str().unwrap());
        
        // 保存历史记录
        service.save(item).unwrap();
        
        // 验证历史记录存在
        let items = service.load().unwrap();
        assert_eq!(items.len(), 1);
        
        // 清空历史记录
        service.clear().unwrap();
        
        // 验证历史记录已清空
        let items = service.load().unwrap();
        assert_eq!(items.len(), 0);
        
        // 验证文件仍然存在
        assert!(file_path.exists());
    }
    
    #[test]
    fn test_file_exists_check() {
        let temp_dir = TempDir::new().unwrap();
        let service = HistoryService::new(temp_dir.path()).unwrap();
        
        // 创建一个实际存在的文件
        let existing_file = temp_dir.path().join("existing.mp4");
        File::create(&existing_file).unwrap();
        
        // 创建两个历史记录项：一个文件存在，一个不存在
        let item1 = create_test_item("test1", "Existing Video", existing_file.to_str().unwrap());
        let item2 = create_test_item("test2", "Missing Video", "/nonexistent/video.mp4");
        
        service.save(item1).unwrap();
        service.save(item2).unwrap();
        
        // 加载历史记录
        let items = service.load().unwrap();
        
        assert_eq!(items.len(), 2);
        // 最新的在前面（item2）
        assert_eq!(items[0].file_exists, false); // 不存在的文件
        assert_eq!(items[1].file_exists, true);  // 存在的文件
    }
    
    #[test]
    fn test_check_file_exists_static() {
        let temp_dir = TempDir::new().unwrap();
        
        // 创建一个文件
        let file_path = temp_dir.path().join("test.mp4");
        File::create(&file_path).unwrap();
        
        // 测试静态方法
        assert!(HistoryService::check_file_exists(file_path.to_str().unwrap()));
        assert!(!HistoryService::check_file_exists("/nonexistent/file.mp4"));
    }
    
    #[test]
    fn test_history_file_format() {
        let temp_dir = TempDir::new().unwrap();
        let service = HistoryService::new(temp_dir.path()).unwrap();
        
        let item = create_test_item("test1", "Test Video", "/downloads/video.mp4");
        
        service.save(item).unwrap();
        
        // 读取文件内容验证格式
        let content = fs::read_to_string(service.history_path()).unwrap();
        
        // 验证 camelCase 格式
        assert!(content.contains("\"filePath\""));
        assert!(content.contains("\"fileSize\""));
        assert!(content.contains("\"downloadedAt\""));
        assert!(content.contains("\"fileExists\""));
    }
    
    #[test]
    fn test_atomic_write() {
        let temp_dir = TempDir::new().unwrap();
        let service = HistoryService::new(temp_dir.path()).unwrap();
        
        let item1 = create_test_item("test1", "Video 1", "/downloads/video1.mp4");
        let item2 = create_test_item("test2", "Video 2", "/downloads/video2.mp4");
        
        // 保存第一个项
        service.save(item1).unwrap();
        
        // 保存第二个项
        service.save(item2.clone()).unwrap();
        
        // 加载应该包含两个项
        let loaded = service.load().unwrap();
        assert_eq!(loaded.len(), 2);
        assert_eq!(loaded[0].id, item2.id); // 最新的在前面
        
        // 临时文件不应该存在
        let temp_path = service.history_path().with_extension("json.tmp");
        assert!(!temp_path.exists());
    }
    
    // Feature: youtube-downloader-tool, Property 6: 历史记录往返一致性
    // 验证需求：5.1
    proptest! {
        #[test]
        fn prop_history_roundtrip_consistency(
            id in "[a-zA-Z0-9-]{1,50}",
            title in "[\\p{L}\\p{N}\\s]{1,200}",
            url in "https?://[a-zA-Z0-9.-]+\\.[a-z]{2,}/[a-zA-Z0-9?=&-]*",
            resolution in "(360|480|720|1080|1440|2160)p",
            file_path in "/[a-zA-Z0-9/_.-]{1,200}\\.(mp4|mkv|webm)",
            file_size in 1u64..10_000_000_000u64,
            downloaded_at in 1_000_000_000i64..2_000_000_000i64,
        ) {
            // 创建临时目录
            let temp_dir = TempDir::new().unwrap();
            let service = HistoryService::new(temp_dir.path()).unwrap();
            
            // 创建原始历史记录项
            let original = HistoryItem {
                id: id.clone(),
                title: title.clone(),
                url: url.clone(),
                resolution: resolution.clone(),
                file_path: file_path.clone(),
                file_size,
                downloaded_at,
                file_exists: false, // 文件不存在，避免文件系统依赖
            };
            
            // 保存历史记录
            service.save(original.clone()).unwrap();
            
            // 加载历史记录
            let loaded_items = service.load().unwrap();
            
            // 验证：应该有一个项
            prop_assert_eq!(loaded_items.len(), 1);
            
            // 验证：加载的项应该与原始项相等（除了 file_exists 字段）
            let loaded = &loaded_items[0];
            prop_assert_eq!(&loaded.id, &original.id);
            prop_assert_eq!(&loaded.title, &original.title);
            prop_assert_eq!(&loaded.url, &original.url);
            prop_assert_eq!(&loaded.resolution, &original.resolution);
            prop_assert_eq!(&loaded.file_path, &original.file_path);
            prop_assert_eq!(loaded.file_size, original.file_size);
            prop_assert_eq!(loaded.downloaded_at, original.downloaded_at);
            // file_exists 会被 load() 方法重新计算，所以应该是 false（文件不存在）
            prop_assert_eq!(loaded.file_exists, false);
        }
    }
    
    // Feature: youtube-downloader-tool, Property 6: 历史记录往返一致性（多项测试）
    // 验证需求：5.1
    proptest! {
        #[test]
        fn prop_history_multiple_items_roundtrip(
            items in prop::collection::vec(
                (
                    "[a-zA-Z0-9-]{1,50}",
                    "[\\p{L}\\p{N}\\s]{1,100}",
                    "(360|480|720|1080)p",
                    1u64..1_000_000_000u64,
                    1_000_000_000i64..2_000_000_000i64,
                ),
                1..10
            )
        ) {
            // 创建临时目录
            let temp_dir = TempDir::new().unwrap();
            let service = HistoryService::new(temp_dir.path()).unwrap();
            
            // 创建历史记录项列表
            let mut original_items = Vec::new();
            for (i, (id, title, resolution, file_size, downloaded_at)) in items.iter().enumerate() {
                let item = HistoryItem {
                    id: id.clone(),
                    title: title.clone(),
                    url: format!("https://example.com/video{}", i),
                    resolution: resolution.clone(),
                    file_path: format!("/downloads/video{}.mp4", i),
                    file_size: *file_size,
                    downloaded_at: *downloaded_at,
                    file_exists: false,
                };
                original_items.push(item);
            }
            
            // 保存所有历史记录项
            for item in original_items.iter().rev() {
                service.save(item.clone()).unwrap();
            }
            
            // 加载历史记录
            let loaded_items = service.load().unwrap();
            
            // 验证：数量应该相等
            prop_assert_eq!(loaded_items.len(), original_items.len());
            
            // 验证：每个项都应该存在（顺序相反，因为最新的在前面）
            for (i, original) in original_items.iter().enumerate() {
                let loaded = &loaded_items[i];
                prop_assert_eq!(&loaded.id, &original.id);
                prop_assert_eq!(&loaded.title, &original.title);
                prop_assert_eq!(&loaded.url, &original.url);
                prop_assert_eq!(&loaded.resolution, &original.resolution);
                prop_assert_eq!(&loaded.file_path, &original.file_path);
                prop_assert_eq!(loaded.file_size, original.file_size);
                prop_assert_eq!(loaded.downloaded_at, original.downloaded_at);
            }
        }
    }
    
    // Feature: youtube-downloader-tool, Property 7: 历史清空保留文件
    // 验证需求：5.4
    proptest! {
        #[test]
        fn prop_clear_history_preserves_files(
            items in prop::collection::vec(
                (
                    "[a-zA-Z0-9-]{1,50}",
                    "[\\p{L}\\p{N}\\s]{1,100}",
                    "(360|480|720|1080)p",
                    1u64..1_000_000_000u64,
                    1_000_000_000i64..2_000_000_000i64,
                ),
                1..10
            )
        ) {
            // 创建临时目录
            let temp_dir = TempDir::new().unwrap();
            let service = HistoryService::new(temp_dir.path()).unwrap();
            
            // 创建实际的文件和历史记录项
            let mut file_paths = Vec::new();
            for (i, (id, title, resolution, file_size, downloaded_at)) in items.iter().enumerate() {
                // 创建实际的文件
                let file_path = temp_dir.path().join(format!("video{}.mp4", i));
                let mut file = File::create(&file_path).unwrap();
                file.write_all(format!("test video content {}", i).as_bytes()).unwrap();
                
                // 保存文件路径用于后续验证
                file_paths.push(file_path.clone());
                
                // 创建历史记录项
                let item = HistoryItem {
                    id: id.clone(),
                    title: title.clone(),
                    url: format!("https://example.com/video{}", i),
                    resolution: resolution.clone(),
                    file_path: file_path.to_str().unwrap().to_string(),
                    file_size: *file_size,
                    downloaded_at: *downloaded_at,
                    file_exists: true,
                };
                
                // 保存历史记录
                service.save(item).unwrap();
            }
            
            // 验证历史记录存在
            let loaded_before = service.load().unwrap();
            prop_assert_eq!(loaded_before.len(), items.len());
            
            // 清空历史记录
            service.clear().unwrap();
            
            // 验证历史记录已清空
            let loaded_after = service.load().unwrap();
            prop_assert_eq!(loaded_after.len(), 0);
            
            // 验证所有文件仍然存在
            for file_path in file_paths {
                prop_assert!(
                    file_path.exists(),
                    "文件 {:?} 应该在清空历史记录后仍然存在",
                    file_path
                );
            }
        }
    }
    
    // Feature: youtube-downloader-tool, Property 11: 文件存在性检查准确性
    // 验证需求：5.5
    proptest! {
        #[test]
        fn prop_file_existence_check_accuracy(
            items in prop::collection::vec(
                (
                    "[a-zA-Z0-9-]{1,50}",
                    "[\\p{L}\\p{N}\\s]{1,100}",
                    "(360|480|720|1080)p",
                    1u64..1_000_000_000u64,
                    1_000_000_000i64..2_000_000_000i64,
                    prop::bool::ANY, // 是否创建实际文件
                ),
                1..10
            )
        ) {
            // 创建临时目录
            let temp_dir = TempDir::new().unwrap();
            let service = HistoryService::new(temp_dir.path()).unwrap();
            
            // 创建历史记录项，部分有实际文件，部分没有
            let mut expected_existence = Vec::new();
            for (i, (id, title, resolution, file_size, downloaded_at, should_create_file)) in items.iter().enumerate() {
                let file_path = temp_dir.path().join(format!("video{}.mp4", i));
                
                // 根据 should_create_file 决定是否创建实际文件
                if *should_create_file {
                    let mut file = File::create(&file_path).unwrap();
                    file.write_all(format!("test video content {}", i).as_bytes()).unwrap();
                }
                
                // 记录预期的文件存在性
                expected_existence.push(*should_create_file);
                
                // 创建历史记录项（初始 file_exists 设置为 true，load() 会重新计算）
                let item = HistoryItem {
                    id: id.clone(),
                    title: title.clone(),
                    url: format!("https://example.com/video{}", i),
                    resolution: resolution.clone(),
                    file_path: file_path.to_str().unwrap().to_string(),
                    file_size: *file_size,
                    downloaded_at: *downloaded_at,
                    file_exists: true, // 初始值，load() 会更新
                };
                
                // 保存历史记录
                service.save(item).unwrap();
            }
            
            // 加载历史记录
            let loaded_items = service.load().unwrap();
            
            // 验证：数量应该相等
            prop_assert_eq!(loaded_items.len(), items.len());
            
            // 注意：save() 会将新项插入到列表开头，所以加载的顺序是反向的
            // 我们需要反转 expected_existence 来匹配加载的顺序
            expected_existence.reverse();
            
            // 验证：每个项的 file_exists 字段应该准确反映文件是否存在
            for (i, (loaded, expected)) in loaded_items.iter().zip(expected_existence.iter()).enumerate() {
                prop_assert_eq!(
                    loaded.file_exists,
                    *expected,
                    "历史记录项 {} 的 file_exists 字段应该为 {}，但实际为 {}",
                    i,
                    expected,
                    loaded.file_exists
                );
            }
        }
    }
    
    // Feature: youtube-downloader-tool, Property 11: 文件存在性检查准确性（静态方法测试）
    // 验证需求：5.5
    proptest! {
        #[test]
        fn prop_check_file_exists_static_method(
            file_names in prop::collection::vec(
                "[a-zA-Z0-9_-]{1,50}\\.(mp4|mkv|webm)",
                1..10
            ),
            should_exist in prop::collection::vec(
                prop::bool::ANY,
                1..10
            )
        ) {
            // 创建临时目录
            let temp_dir = TempDir::new().unwrap();
            
            // 确保两个向量长度相同
            let count = file_names.len().min(should_exist.len());
            
            // 创建文件并测试
            for i in 0..count {
                let file_path = temp_dir.path().join(&file_names[i]);
                
                // 根据 should_exist 决定是否创建文件
                if should_exist[i] {
                    File::create(&file_path).unwrap();
                }
                
                // 使用静态方法检查文件是否存在
                let exists = HistoryService::check_file_exists(file_path.to_str().unwrap());
                
                // 验证：检查结果应该与预期一致
                prop_assert_eq!(
                    exists,
                    should_exist[i],
                    "文件 {:?} 的存在性检查结果应该为 {}，但实际为 {}",
                    file_path,
                    should_exist[i],
                    exists
                );
            }
        }
    }
}
