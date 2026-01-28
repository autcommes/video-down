// 历史记录相关命令

use crate::models::HistoryItem;
use crate::services::HistoryService;

/// 获取数据目录路径
fn get_data_dir() -> Result<std::path::PathBuf, String> {
    dirs::data_dir()
        .map(|p| p.join("youtube-downloader-tool"))
        .ok_or_else(|| "无法获取数据目录".to_string())
}

/// 获取历史记录
/// 需求：5.2
#[tauri::command]
pub async fn get_history() -> Result<Vec<HistoryItem>, String> {
    let data_dir = get_data_dir()?;
    let service = HistoryService::new(data_dir)?;
    service.load().map_err(|e| e.into())
}

/// 清空历史记录
/// 需求：5.4
#[tauri::command]
pub async fn clear_history() -> Result<(), String> {
    let data_dir = get_data_dir()?;
    let service = HistoryService::new(data_dir)?;
    service.clear().map_err(|e| e.into())
}

/// 添加历史记录
/// 需求：5.1
#[tauri::command]
pub async fn add_history(item: HistoryItem) -> Result<(), String> {
    let data_dir = get_data_dir()?;
    let service = HistoryService::new(data_dir)?;
    service.save(item).map_err(|e| e.into())
}
