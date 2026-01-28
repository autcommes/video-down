use serde::{Deserialize, Serialize};

/// 浏览器类型（用于读取 Cookie）
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "lowercase")]
pub enum BrowserType {
    #[default]
    None,
    Chrome,
    Edge,
    Firefox,
    Brave,
    Opera,
}

/// 应用配置
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    /// 默认保存路径
    pub save_path: String,
    /// 默认分辨率偏好
    pub default_resolution: String,
    /// 自动检查更新
    pub auto_check_update: bool,
    /// 并发下载数
    pub concurrent_downloads: u32,
    /// YouTube 下载使用的浏览器 Cookie
    #[serde(default)]
    pub youtube_cookie_browser: BrowserType,
}

impl Default for AppConfig {
    fn default() -> Self {
        // 获取系统默认下载文件夹
        let default_path = dirs::download_dir()
            .unwrap_or_else(|| std::env::current_dir().unwrap_or_default())
            .to_string_lossy()
            .to_string();

        AppConfig {
            save_path: default_path,
            default_resolution: "1080p".to_string(),
            auto_check_update: true,
            concurrent_downloads: 3,
            youtube_cookie_browser: BrowserType::None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_config_default() {
        let config = AppConfig::default();
        assert_eq!(config.default_resolution, "1080p");
        assert!(config.auto_check_update);
        assert_eq!(config.concurrent_downloads, 3);
    }

    #[test]
    fn test_app_config_serialization() {
        let config = AppConfig {
            save_path: "/downloads".to_string(),
            default_resolution: "1080p".to_string(),
            auto_check_update: true,
            concurrent_downloads: 3,
            youtube_cookie_browser: BrowserType::Edge,
        };

        let json = serde_json::to_string(&config).unwrap();
        assert!(json.contains("\"savePath\":\"/downloads\"")); // 验证 camelCase
        assert!(json.contains("\"defaultResolution\":\"1080p\"")); // 验证 camelCase
        assert!(json.contains("\"autoCheckUpdate\":true")); // 验证 camelCase
        assert!(json.contains("\"concurrentDownloads\":3")); // 验证 camelCase

        // 测试往返
        let deserialized: AppConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, config);
    }

    // Feature: youtube-downloader-tool, Property 5: 配置持久化往返
    // 验证需求：4.4, 9.1, 9.2
    mod prop_tests {
        use super::*;
        use proptest::prelude::*;

        proptest! {
            #![proptest_config(ProptestConfig::with_cases(100))]
            
            #[test]
            fn prop_config_roundtrip_consistency(
                save_path in ".*",
                default_resolution in "(360|480|720|1080|1440|2160)p",
                auto_check_update: bool,
                concurrent_downloads in 1u32..10u32,
            ) {
                // 创建配置对象
                let original = AppConfig {
                    save_path,
                    default_resolution,
                    auto_check_update,
                    concurrent_downloads,
                    youtube_cookie_browser: BrowserType::None,
                };
                
                // 序列化为 JSON
                let json = serde_json::to_string(&original).expect("序列化失败");
                
                // 反序列化回配置对象
                let loaded: AppConfig = serde_json::from_str(&json).expect("反序列化失败");
                
                // 验证往返一致性
                prop_assert_eq!(original, loaded);
            }
        }
    }
}
