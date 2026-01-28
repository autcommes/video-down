// 下载相关命令

use crate::error::AppError;
use crate::models::{ProgressData, VideoInfo};
use crate::services::YtdlpService;
use serde::Deserialize;
use tauri::{AppHandle, Manager};

/// 下载视频请求参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct DownloadVideoRequest {
    url: String,
    format_id: String,
    save_path: String,
    task_id: String,
}

/// 获取视频信息
/// 需求：1.1, 1.2, 1.3, 1.4
#[tauri::command]
pub async fn get_video_info(url: String) -> Result<VideoInfo, String> {
    let service = YtdlpService::new()?;
    service.fetch_info(&url).await.map_err(|e| e.into())
}

/// 下载视频
/// 需求：3.1, 3.2, 3.3, 3.4, 3.5
#[tauri::command]
pub async fn download_video(
    request: DownloadVideoRequest,
    app_handle: AppHandle,
) -> Result<String, String> {
    eprintln!("[download_video] 收到下载请求:");
    eprintln!("  - task_id: {}", request.task_id);
    eprintln!("  - url: {}", request.url);
    eprintln!("  - format_id: {}", request.format_id);
    eprintln!("  - save_path: {}", request.save_path);
    
    let service = YtdlpService::new()?;

    // 克隆数据用于异步任务
    let task_id = request.task_id.clone();
    let url = request.url.clone();
    let format_id = request.format_id.clone();
    let save_path = request.save_path.clone();
    let app_handle_clone = app_handle.clone();
    
    // 在后台异步执行下载,不阻塞返回
    tokio::spawn(async move {
        eprintln!("[download_video] 开始执行下载...");
        
        // 创建进度回调函数
        let progress_callback = {
            let app_handle = app_handle_clone.clone();
            move |progress: ProgressData| {
                eprintln!("[download_video] 进度更新: {}%", progress.percent);
                // 通过 Tauri 事件系统发送进度更新
                let _ = app_handle.emit_all("download-progress", progress);
            }
        };

        // 执行下载
        let result = service
            .download_video(
                task_id.clone(),
                url,
                format_id,
                save_path,
                progress_callback,
            )
            .await;

        match result {
            Ok(file_path) => {
                eprintln!("[download_video] 下载成功: {}", file_path);
                
                // 获取文件大小
                let file_size = std::fs::metadata(&file_path)
                    .map(|m| m.len())
                    .unwrap_or(0);
                
                // 发送下载完成事件
                let _ = app_handle_clone.emit_all(
                    "download-complete",
                    serde_json::json!({
                        "taskId": task_id,
                        "filePath": file_path,
                        "fileSize": file_size,
                    }),
                );
            }
            Err(e) => {
                eprintln!("[download_video] 下载失败: {:?}", e);
                // 发送下载错误事件
                let error_msg = e.user_message();
                let _ = app_handle_clone.emit_all(
                    "download-error",
                    serde_json::json!({
                        "taskId": task_id,
                        "error": error_msg,
                    }),
                );
            }
        }
    });

    // 立即返回任务 ID,不等待下载完成
    eprintln!("[download_video] 下载任务已启动,返回 task_id");
    Ok(request.task_id)
}

/// 取消下载
/// 需求：3.5
#[tauri::command]
pub async fn cancel_download(task_id: String) -> Result<(), String> {
    let service = YtdlpService::new()?;
    service.cancel_download(&task_id).await.map_err(|e| e.into())
}

/// 获取 yt-dlp 版本
/// 需求：6.1
#[tauri::command]
pub async fn get_ytdlp_version() -> Result<String, String> {
    use std::process::Command;

    let ytdlp_path = if cfg!(target_os = "windows") {
        "yt-dlp.exe"
    } else {
        "yt-dlp"
    };

    let output = tokio::task::spawn_blocking(move || {
        Command::new(ytdlp_path)
            .arg("--version")
            .output()
    })
    .await
    .map_err(|e| AppError::YtdlpError(format!("任务执行失败: {}", e)))?
    .map_err(|e| AppError::YtdlpError(format!("获取版本失败: {}", e)))?;

    if output.status.success() {
        let version = String::from_utf8_lossy(&output.stdout)
            .trim()
            .to_string();
        Ok(version)
    } else {
        Err(AppError::YtdlpNotFound.into())
    }
}
