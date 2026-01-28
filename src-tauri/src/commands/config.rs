// 配置相关命令

use crate::models::AppConfig;
use crate::services::ConfigService;

/// 获取配置目录路径
fn get_config_dir() -> Result<std::path::PathBuf, String> {
    dirs::config_dir()
        .map(|p| p.join("youtube-downloader-tool"))
        .ok_or_else(|| "无法获取配置目录".to_string())
}

/// 获取配置
/// 需求：9.1, 9.3
#[tauri::command]
pub async fn get_config() -> Result<AppConfig, String> {
    let config_dir = get_config_dir()?;
    let service = ConfigService::new(config_dir)?;
    service.load().map_err(|e| e.into())
}

/// 保存配置
/// 需求：9.1, 9.2, 9.5
#[tauri::command]
pub async fn save_config(config: AppConfig) -> Result<(), String> {
    let config_dir = get_config_dir()?;
    let service = ConfigService::new(config_dir)?;
    service.save(&config).map_err(|e| e.into())
}
