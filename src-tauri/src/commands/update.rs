// 更新相关命令

use crate::models::UpdateInfo;
use crate::services::UpdateService;
use std::path::PathBuf;
use tauri::AppHandle;

/// 获取 yt-dlp 路径
fn get_ytdlp_path() -> PathBuf {
    if cfg!(target_os = "windows") {
        PathBuf::from("yt-dlp.exe")
    } else {
        PathBuf::from("yt-dlp")
    }
}

/// 检查 yt-dlp 更新
/// 需求：6.1, 6.2, 6.3, 6.4
#[tauri::command]
pub async fn check_ytdlp_update() -> Result<UpdateInfo, String> {
    let ytdlp_path = get_ytdlp_path();
    let service = UpdateService::new(ytdlp_path);
    service.check_update().await.map_err(|e| e.into())
}

/// 更新 yt-dlp
/// 需求：6.5, 6.6, 6.7
#[tauri::command]
pub async fn update_ytdlp(app_handle: AppHandle) -> Result<(), String> {
    let ytdlp_path = get_ytdlp_path();
    let service = UpdateService::new(ytdlp_path);

    // 首先检查更新以获取下载 URL
    let update_info = service.check_update().await?;

    if !update_info.has_update {
        return Ok(()); // 没有更新可用
    }

    // 执行更新
    service
        .update_ytdlp(&update_info.download_url, app_handle)
        .await
        .map_err(|e| e.into())
}
