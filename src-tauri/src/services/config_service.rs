use crate::error::AppError;
use crate::models::AppConfig;
use std::fs;
use std::path::{Path, PathBuf};

/// 配置管理服务
pub struct ConfigService {
    config_path: PathBuf,
}

impl ConfigService {
    /// 创建新的配置服务实例
    ///
    /// # Arguments
    /// * `config_dir` - 配置文件所在目录
    ///
    /// # Returns
    /// 配置服务实例
    pub fn new(config_dir: impl AsRef<Path>) -> Result<Self, AppError> {
        let config_dir = config_dir.as_ref();
        
        // 确保配置目录存在
        if !config_dir.exists() {
            fs::create_dir_all(config_dir).map_err(|e| {
                AppError::ConfigError(format!("无法创建配置目录: {}", e))
            })?;
        }
        
        let config_path = config_dir.join("config.json");
        
        Ok(ConfigService { config_path })
    }
    
    /// 加载配置文件
    ///
    /// 如果配置文件不存在或损坏，将使用默认配置并创建新文件
    ///
    /// # Returns
    /// 应用配置对象
    pub fn load(&self) -> Result<AppConfig, AppError> {
        // 如果配置文件不存在，使用默认配置
        if !self.config_path.exists() {
            let default_config = AppConfig::default();
            self.save(&default_config)?;
            return Ok(default_config);
        }
        
        // 尝试读取配置文件
        match fs::read_to_string(&self.config_path) {
            Ok(content) => {
                // 尝试解析 JSON
                match serde_json::from_str::<AppConfig>(&content) {
                    Ok(config) => Ok(config),
                    Err(e) => {
                        // 配置文件损坏，使用默认配置并恢复
                        eprintln!("配置文件损坏: {}, 使用默认配置", e);
                        self.recover_from_corruption()
                    }
                }
            }
            Err(e) => {
                // 读取失败，使用默认配置
                eprintln!("无法读取配置文件: {}, 使用默认配置", e);
                self.recover_from_corruption()
            }
        }
    }
    
    /// 保存配置文件（使用原子操作）
    ///
    /// # Arguments
    /// * `config` - 要保存的配置对象
    ///
    /// # Returns
    /// 成功或错误
    pub fn save(&self, config: &AppConfig) -> Result<(), AppError> {
        // 序列化配置为 JSON（格式化输出）
        let json = serde_json::to_string_pretty(config)?;
        
        // 使用原子写入：先写入临时文件，然后重命名
        let temp_path = self.config_path.with_extension("json.tmp");
        
        // 写入临时文件
        fs::write(&temp_path, json).map_err(|e| {
            AppError::ConfigError(format!("无法写入临时配置文件: {}", e))
        })?;
        
        // 原子重命名（在大多数文件系统上是原子操作）
        fs::rename(&temp_path, &self.config_path).map_err(|e| {
            // 如果重命名失败，清理临时文件
            let _ = fs::remove_file(&temp_path);
            AppError::ConfigError(format!("无法保存配置文件: {}", e))
        })?;
        
        Ok(())
    }
    
    /// 从配置损坏中恢复
    ///
    /// 备份损坏的配置文件，创建新的默认配置
    ///
    /// # Returns
    /// 默认配置对象
    fn recover_from_corruption(&self) -> Result<AppConfig, AppError> {
        // 如果存在损坏的配置文件，备份它
        if self.config_path.exists() {
            let backup_path = self.config_path.with_extension("json.backup");
            if let Err(e) = fs::rename(&self.config_path, &backup_path) {
                eprintln!("无法备份损坏的配置文件: {}", e);
            }
        }
        
        // 创建并保存默认配置
        let default_config = AppConfig::default();
        self.save(&default_config)?;
        
        Ok(default_config)
    }
    
    /// 获取配置文件路径
    #[allow(dead_code)]
    pub fn config_path(&self) -> &Path {
        &self.config_path
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[test]
    fn test_config_service_new() {
        let temp_dir = TempDir::new().unwrap();
        let service = ConfigService::new(temp_dir.path()).unwrap();
        
        assert!(service.config_path().exists() == false);
        assert_eq!(
            service.config_path(),
            temp_dir.path().join("config.json")
        );
    }
    
    #[test]
    fn test_load_creates_default_config() {
        let temp_dir = TempDir::new().unwrap();
        let service = ConfigService::new(temp_dir.path()).unwrap();
        
        // 首次加载应该创建默认配置
        let config = service.load().unwrap();
        assert_eq!(config.default_resolution, "1080p");
        assert_eq!(config.concurrent_downloads, 3);
        
        // 配置文件应该已创建
        assert!(service.config_path().exists());
    }
    
    #[test]
    fn test_save_and_load_roundtrip() {
        let temp_dir = TempDir::new().unwrap();
        let service = ConfigService::new(temp_dir.path()).unwrap();
        
        // 创建自定义配置
        let custom_config = AppConfig {
            save_path: "/custom/path".to_string(),
            default_resolution: "720p".to_string(),
            auto_check_update: false,
            concurrent_downloads: 5,
        };
        
        // 保存配置
        service.save(&custom_config).unwrap();
        
        // 重新加载配置
        let loaded_config = service.load().unwrap();
        
        // 验证往返一致性
        assert_eq!(loaded_config, custom_config);
    }
    
    #[test]
    fn test_recover_from_corrupted_config() {
        let temp_dir = TempDir::new().unwrap();
        let service = ConfigService::new(temp_dir.path()).unwrap();
        
        // 写入损坏的 JSON
        fs::write(service.config_path(), "{ invalid json }").unwrap();
        
        // 加载应该恢复为默认配置
        let config = service.load().unwrap();
        assert_eq!(config.default_resolution, "1080p");
        
        // 备份文件应该存在
        let backup_path = service.config_path().with_extension("json.backup");
        assert!(backup_path.exists());
    }
    
    #[test]
    fn test_atomic_write() {
        let temp_dir = TempDir::new().unwrap();
        let service = ConfigService::new(temp_dir.path()).unwrap();
        
        let config1 = AppConfig {
            save_path: "/path1".to_string(),
            default_resolution: "1080p".to_string(),
            auto_check_update: true,
            concurrent_downloads: 3,
        };
        
        let config2 = AppConfig {
            save_path: "/path2".to_string(),
            default_resolution: "720p".to_string(),
            auto_check_update: false,
            concurrent_downloads: 5,
        };
        
        // 保存第一个配置
        service.save(&config1).unwrap();
        
        // 保存第二个配置（应该覆盖第一个）
        service.save(&config2).unwrap();
        
        // 加载应该得到第二个配置
        let loaded = service.load().unwrap();
        assert_eq!(loaded, config2);
        
        // 临时文件不应该存在
        let temp_path = service.config_path().with_extension("json.tmp");
        assert!(!temp_path.exists());
    }
    
    #[test]
    fn test_config_file_format() {
        let temp_dir = TempDir::new().unwrap();
        let service = ConfigService::new(temp_dir.path()).unwrap();
        
        let config = AppConfig {
            save_path: "/downloads".to_string(),
            default_resolution: "1080p".to_string(),
            auto_check_update: true,
            concurrent_downloads: 3,
        };
        
        service.save(&config).unwrap();
        
        // 读取文件内容验证格式
        let content = fs::read_to_string(service.config_path()).unwrap();
        
        // 验证 camelCase 格式
        assert!(content.contains("\"savePath\""));
        assert!(content.contains("\"defaultResolution\""));
        assert!(content.contains("\"autoCheckUpdate\""));
        assert!(content.contains("\"concurrentDownloads\""));
    }
}
