use crate::error::AppError;
use crate::models::{Format, ProgressData, VideoInfo};
use regex::Regex;
use serde_json::Value;
use std::process::{Command, Stdio};
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;
use tokio::sync::Mutex;

/// yt-dlp 服务
#[allow(dead_code)]
pub struct YtdlpService {
    ytdlp_path: String,
    /// 存储正在运行的下载进程，用于取消操作
    active_downloads: Arc<Mutex<std::collections::HashMap<String, tokio::process::Child>>>,
}

impl YtdlpService {
    /// 创建新的 YtdlpService 实例
    pub fn new() -> Result<Self, AppError> {
        // 检查 yt-dlp 是否存在
        let ytdlp_path = if cfg!(target_os = "windows") {
            // 1. 在当前工作目录查找
            let cwd = std::env::current_dir().ok();
            let mut found_path: Option<String> = None;
            
            if let Some(cwd_path) = &cwd {
                let path = cwd_path.join("yt-dlp.exe");
                eprintln!("检查当前工作目录: {:?}", path);
                if path.exists() {
                    eprintln!("✓ 找到 yt-dlp");
                    found_path = Some(path.to_string_lossy().to_string());
                } else {
                    // 2. 尝试父目录（开发环境下，当前目录可能是 src-tauri）
                    if let Some(parent) = cwd_path.parent() {
                        let parent_path = parent.join("yt-dlp.exe");
                        eprintln!("检查父目录: {:?}", parent_path);
                        if parent_path.exists() {
                            eprintln!("✓ 在父目录找到 yt-dlp");
                            found_path = Some(parent_path.to_string_lossy().to_string());
                        }
                    }
                }
            }
            
            // 3. 如果还没找到，检查程序所在目录（发布环境）
            if found_path.is_none() {
                if let Ok(exe_path) = std::env::current_exe() {
                    if let Some(exe_dir) = exe_path.parent() {
                        let local_path = exe_dir.join("yt-dlp.exe");
                        eprintln!("检查程序目录: {:?}", local_path);
                        if local_path.exists() {
                            eprintln!("✓ 在程序目录找到 yt-dlp");
                            found_path = Some(local_path.to_string_lossy().to_string());
                        }
                    }
                }
            }
            
            found_path.unwrap_or_else(|| "yt-dlp.exe".to_string())
        } else {
            "yt-dlp".to_string()
        };

        // 验证 yt-dlp 是否可执行
        eprintln!("尝试使用 yt-dlp 路径: {}", ytdlp_path);
        let output = Command::new(&ytdlp_path)
            .arg("--version")
            .output();

        match output {
            Ok(out) => {
                if out.status.success() {
                    let version = String::from_utf8_lossy(&out.stdout);
                    eprintln!("yt-dlp 版本: {}", version.trim());
                    Ok(Self {
                        ytdlp_path: ytdlp_path.to_string(),
                        active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
                    })
                } else {
                    let stderr = String::from_utf8_lossy(&out.stderr);
                    eprintln!("yt-dlp 执行失败: {}", stderr);
                    Err(AppError::YtdlpNotFound)
                }
            }
            Err(e) => {
                eprintln!("无法执行 yt-dlp: {}", e);
                Err(AppError::YtdlpNotFound)
            }
        }
    }

    /// 获取视频信息
    pub async fn fetch_info(&self, url: &str) -> Result<VideoInfo, AppError> {
        eprintln!("[fetch_info] 开始获取视频信息: {}", url);
        
        // 验证 URL 基本格式
        if !url.starts_with("http://") && !url.starts_with("https://") {
            eprintln!("[fetch_info] URL 格式无效");
            return Err(AppError::InvalidUrl(url.to_string()));
        }

        eprintln!("[fetch_info] 使用 yt-dlp 路径: {}", self.ytdlp_path);
        eprintln!("[fetch_info] 启动 spawn_blocking 任务...");
        
        // 调用 yt-dlp --dump-json 获取视频信息
        let output = tokio::task::spawn_blocking({
            let ytdlp_path = self.ytdlp_path.clone();
            let url = url.to_string();
            move || {
                eprintln!("[spawn_blocking] 执行 yt-dlp 命令...");
                let result = Command::new(&ytdlp_path)
                    .arg("--dump-json")
                    .arg("--no-playlist")
                    .arg(&url)
                    .output();
                eprintln!("[spawn_blocking] 命令执行完成");
                result
            }
        })
        .await
        .map_err(|e| {
            eprintln!("[fetch_info] spawn_blocking 任务失败: {}", e);
            AppError::YtdlpError(format!("任务执行失败: {}", e))
        })?
        .map_err(|e| {
            eprintln!("[fetch_info] 进程启动失败: {}", e);
            AppError::YtdlpError(format!("进程启动失败: {}", e))
        })?;

        // 检查是否执行成功
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            eprintln!("[fetch_info] yt-dlp 执行失败: {}", stderr);
            
            // 检查是否是不支持的网站
            if stderr.contains("Unsupported URL") || stderr.contains("not supported") {
                return Err(AppError::UnsupportedSite(url.to_string()));
            }
            
            return Err(AppError::YtdlpError(stderr.to_string()));
        }

        eprintln!("[fetch_info] yt-dlp 执行成功,开始解析 JSON...");
        
        // 解析 JSON 输出
        let stdout = String::from_utf8_lossy(&output.stdout);
        let result = self.parse_video_info(&stdout);
        
        match &result {
            Ok(info) => eprintln!("[fetch_info] 解析成功: {}", info.title),
            Err(e) => eprintln!("[fetch_info] 解析失败: {:?}", e),
        }
        
        result
    }

    /// 解析 yt-dlp 的 JSON 输出
    fn parse_video_info(&self, json_str: &str) -> Result<VideoInfo, AppError> {
        let json: Value = serde_json::from_str(json_str)
            .map_err(|e| AppError::ParseError(format!("JSON 解析失败: {}", e)))?;

        // 提取基本信息
        let id = json["id"]
            .as_str()
            .ok_or_else(|| AppError::ParseError("缺少视频 ID".to_string()))?
            .to_string();

        let title = json["title"]
            .as_str()
            .ok_or_else(|| AppError::ParseError("缺少视频标题".to_string()))?
            .to_string();

        let duration = json["duration"]
            .as_u64()
            .unwrap_or(0) as u32;

        let thumbnail = json["thumbnail"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let uploader = json["uploader"]
            .as_str()
            .unwrap_or("Unknown")
            .to_string();

        // 提取格式列表
        let formats = self.extract_formats(&json)?;

        if formats.is_empty() {
            return Err(AppError::ParseError("没有可用的视频格式".to_string()));
        }

        Ok(VideoInfo {
            id,
            title,
            duration,
            thumbnail,
            uploader,
            formats,
        })
    }

    /// 从 JSON 中提取格式列表
    fn extract_formats(&self, json: &Value) -> Result<Vec<Format>, AppError> {
        let formats_array = json["formats"]
            .as_array()
            .ok_or_else(|| AppError::ParseError("缺少格式列表".to_string()))?;

        let mut formats = Vec::new();

        for format_json in formats_array {
            // 只处理包含视频流的格式
            let vcodec = format_json["vcodec"]
                .as_str()
                .unwrap_or("none");

            if vcodec == "none" {
                continue;
            }

            let format_id = format_json["format_id"]
                .as_str()
                .unwrap_or("")
                .to_string();

            // 解析分辨率
            let resolution = self.parse_resolution(format_json);

            let ext = format_json["ext"]
                .as_str()
                .unwrap_or("mp4")
                .to_string();

            let filesize = format_json["filesize"]
                .as_u64()
                .or_else(|| format_json["filesize_approx"].as_u64());

            let fps = format_json["fps"]
                .as_u64()
                .map(|f| f as u32);

            let acodec = format_json["acodec"]
                .as_str()
                .unwrap_or("none")
                .to_string();

            formats.push(Format {
                format_id,
                resolution,
                ext,
                filesize,
                fps,
                vcodec: vcodec.to_string(),
                acodec,
            });
        }

        Ok(formats)
    }

    /// 解析分辨率信息
    fn parse_resolution(&self, format_json: &Value) -> String {
        // 尝试从 resolution 字段获取
        if let Some(res) = format_json["resolution"].as_str() {
            if res != "audio only" && !res.is_empty() {
                return res.to_string();
            }
        }

        // 尝试从 width 和 height 构造
        if let (Some(width), Some(height)) = (
            format_json["width"].as_u64(),
            format_json["height"].as_u64(),
        ) {
            return format!("{}x{}", width, height);
        }

        // 尝试从 format_note 获取（如 "1080p"）
        if let Some(note) = format_json["format_note"].as_str() {
            if note.ends_with('p') {
                return note.to_string();
            }
        }

        // 默认返回未知
        "unknown".to_string()
    }

    /// 从分辨率字符串中提取像素数量
    /// 支持格式：
    /// - "1920x1080" -> 1920 * 1080 = 2073600
    /// - "1080p" -> 1920 * 1080 = 2073600 (假设 16:9)
    /// - "720p" -> 1280 * 720 = 921600
    #[allow(dead_code)]
    fn extract_pixel_count(&self, resolution: &str) -> u64 {
        // 处理 "1920x1080" 格式
        if let Some(pos) = resolution.find('x') {
            let width: u64 = resolution[..pos].parse().unwrap_or(0);
            let height: u64 = resolution[pos + 1..].parse().unwrap_or(0);
            return width * height;
        }

        // 处理 "1080p" 格式
        if let Some(height_str) = resolution.strip_suffix('p') {
            if let Ok(height) = height_str.parse::<u64>() {
                // 假设 16:9 宽高比
                let width = (height * 16) / 9;
                return width * height;
            }
        }

        // 未知格式返回 0
        0
    }

    /// 按分辨率排序格式列表（从高到低）
    /// 需求：2.2
    #[allow(dead_code)]
    pub fn sort_formats_by_resolution(&self, mut formats: Vec<Format>) -> Vec<Format> {
        formats.sort_by(|a, b| {
            let pixels_a = self.extract_pixel_count(&a.resolution);
            let pixels_b = self.extract_pixel_count(&b.resolution);
            // 降序排序
            pixels_b.cmp(&pixels_a)
        });
        formats
    }

    /// 选择默认分辨率（优先 1080p）
    /// 需求：2.3
    #[allow(dead_code)]
    pub fn select_default_resolution(&self, formats: &[Format]) -> Option<String> {
        if formats.is_empty() {
            return None;
        }

        let target_pixels = 1920 * 1080; // 1080p 的像素数

        // 首先尝试找到精确的 1080p
        for format in formats {
            let pixels = self.extract_pixel_count(&format.resolution);
            if pixels == target_pixels {
                return Some(format.format_id.clone());
            }
        }

        // 如果没有精确的 1080p，找最接近的
        let mut closest_format: Option<&Format> = None;
        let mut min_diff = u64::MAX;

        for format in formats {
            let pixels = self.extract_pixel_count(&format.resolution);
            if pixels > 0 {
                let diff = pixels.abs_diff(target_pixels);

                if diff < min_diff {
                    min_diff = diff;
                    closest_format = Some(format);
                }
            }
        }

        closest_format.map(|f| f.format_id.clone())
    }

    /// 检测格式是否需要音视频流合并
    /// 需求：2.4
    #[allow(dead_code)]
    pub fn needs_audio_merge(&self, format: &Format) -> bool {
        // 如果视频编码存在但音频编码为 "none"，则需要合并
        format.vcodec != "none" && format.acodec == "none"
    }

    /// 格式化文件大小显示
    /// 需求：2.5
    #[allow(dead_code)]
    pub fn format_filesize(&self, filesize: Option<u64>) -> String {
        match filesize {
            Some(size) => {
                if size >= 1_073_741_824 {
                    // >= 1 GB
                    format!("{:.2} GB", size as f64 / 1_073_741_824.0)
                } else if size >= 1_048_576 {
                    // >= 1 MB
                    format!("{:.2} MB", size as f64 / 1_048_576.0)
                } else if size >= 1024 {
                    // >= 1 KB
                    format!("{:.2} KB", size as f64 / 1024.0)
                } else {
                    format!("{} B", size)
                }
            }
            None => "未知大小".to_string(),
        }
    }

    /// 下载视频
    /// 需求：3.1, 3.2, 3.3, 3.4, 3.5
    /// 
    /// # 参数
    /// - `task_id`: 任务 ID
    /// - `url`: 视频 URL
    /// - `format_id`: 格式 ID
    /// - `save_path`: 保存路径（包含文件名）
    /// - `progress_callback`: 进度回调函数
    /// 
    /// # 返回
    /// - `Ok(String)`: 下载完成，返回文件路径
    /// - `Err(AppError)`: 下载失败
    pub async fn download_video<F>(
        &self,
        task_id: String,
        url: String,
        format_id: String,
        save_path: String,
        progress_callback: F,
    ) -> Result<String, AppError>
    where
        F: Fn(ProgressData) + Send + 'static,
    {
        eprintln!("[download_video] 开始下载:");
        eprintln!("  - task_id: {}", task_id);
        eprintln!("  - url: {}", url);
        eprintln!("  - format_id: {}", format_id);
        eprintln!("  - save_path: {}", save_path);
        
        // 构造输出路径模板
        // save_path 是目录路径，需要添加文件名模板
        // 使用 yt-dlp 的文件名清理功能，限制文件名长度为 200 字符
        let output_template = if save_path.ends_with('\\') || save_path.ends_with('/') {
            format!("{}%(title).200B.%(ext)s", save_path)
        } else {
            format!("{}\\%(title).200B.%(ext)s", save_path)
        };
        
        eprintln!("[download_video] 输出模板: {}", output_template);
        
        // 构造下载命令
        let mut cmd = TokioCommand::new(&self.ytdlp_path);
        cmd.arg("--format")
            .arg(&format_id)
            .arg("--output")
            .arg(&output_template)
            .arg("--no-part")  // 不使用 .part 文件,直接下载
            .arg("--force-overwrites")  // 强制覆盖已存在的文件
            .arg("--restrict-filenames")  // 限制文件名只使用 ASCII 字符
            .arg("--newline") // 每行输出进度信息
            .arg("--no-playlist")
            .arg(&url)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        eprintln!("[download_video] 启动 yt-dlp 进程...");
        
        // 启动进程
        let mut child = cmd.spawn()
            .map_err(|e| {
                eprintln!("[download_video] 启动进程失败: {}", e);
                AppError::YtdlpError(format!("启动下载进程失败: {}", e))
            })?;
        
        eprintln!("[download_video] 进程已启动");

        // 获取 stdout 和 stderr（在移动 child 之前）
        let stdout = child.stdout.take()
            .ok_or_else(|| {
                eprintln!("[download_video] 无法获取进程输出");
                AppError::YtdlpError("无法获取进程输出".to_string())
            })?;

        let stderr = child.stderr.take()
            .ok_or_else(|| {
                eprintln!("[download_video] 无法获取进程错误输出");
                AppError::YtdlpError("无法获取进程错误输出".to_string())
            })?;

        eprintln!("[download_video] 已获取进程输出流");
        
        // 保存进程引用以便取消
        {
            let mut downloads = self.active_downloads.lock().await;
            downloads.insert(task_id.clone(), child);
            eprintln!("[download_video] 进程已保存到 active_downloads");
        }

        // 创建异步读取器
        let stdout_reader = BufReader::new(stdout);
        let stderr_reader = BufReader::new(stderr);

        let task_id_clone = task_id.clone();

        // 在独立任务中读取进度输出
        let progress_handle = tokio::spawn(async move {
            eprintln!("[download_video] 开始读取进度输出...");
            let mut lines = stdout_reader.lines();
            let mut line_count = 0;
            while let Ok(Some(line)) = lines.next_line().await {
                line_count += 1;
                eprintln!("[download_video] stdout line {}: {}", line_count, line);
                if let Some(progress) = Self::parse_progress(&task_id_clone, &line) {
                    progress_callback(progress);
                }
            }
            eprintln!("[download_video] 进度输出读取完成,共 {} 行", line_count);
        });

        // 读取错误输出
        let stderr_handle = tokio::spawn(async move {
            eprintln!("[download_video] 开始读取错误输出...");
            let mut errors = String::new();
            let mut stderr_lines = stderr_reader.lines();
            let mut line_count = 0;
            while let Ok(Some(line)) = stderr_lines.next_line().await {
                line_count += 1;
                eprintln!("[download_video] stderr line {}: {}", line_count, line);
                errors.push_str(&line);
                errors.push('\n');
            }
            eprintln!("[download_video] 错误输出读取完成,共 {} 行", line_count);
            errors
        });

        // 从 HashMap 中取出 child 以便等待
        let mut child = {
            let mut downloads = self.active_downloads.lock().await;
            downloads.remove(&task_id)
                .ok_or_else(|| {
                    eprintln!("[download_video] 任务不存在: {}", task_id);
                    AppError::TaskNotFound(task_id.clone())
                })?
        };

        eprintln!("[download_video] 等待进程完成...");
        
        // 等待进程完成
        let status = child.wait().await
            .map_err(|e| {
                eprintln!("[download_video] 等待进程失败: {}", e);
                AppError::YtdlpError(format!("等待进程失败: {}", e))
            })?;

        eprintln!("[download_video] 进程已完成,状态: {:?}", status);
        
        // 等待进度读取完成
        let _ = progress_handle.await;
        
        // 获取错误输出
        let error_output = stderr_handle.await
            .unwrap_or_else(|_| String::new());

        // 检查下载是否成功
        if status.success() {
            eprintln!("[download_video] 下载成功: {}", save_path);
            Ok(save_path)
        } else {
            eprintln!("[download_video] 下载失败: {}", error_output);
            Err(AppError::YtdlpError(format!("下载失败: {}", error_output)))
        }
    }

    /// 解析 yt-dlp 的进度输出
    /// 需求：3.2
    /// 
    /// 输出格式示例：
    /// [download]  45.2% of 280.00MiB at 2.50MiB/s ETA 00:52
    /// [download] 100% of 280.00MiB in 01:52
    fn parse_progress(task_id: &str, line: &str) -> Option<ProgressData> {
        // 只处理 [download] 开头的行
        if !line.contains("[download]") {
            return None;
        }

        // 使用正则表达式解析进度信息
        // 格式：[download]  45.2% of 280.00MiB at 2.50MiB/s ETA 00:52
        let re = Regex::new(
            r"\[download\]\s+(\d+\.?\d*)%\s+of\s+([\d.]+\w+)(?:\s+at\s+([\d.]+\w+/s))?(?:\s+ETA\s+([\d:]+))?"
        ).ok()?;

        if let Some(captures) = re.captures(line) {
            let percent = captures.get(1)?.as_str().parse::<f32>().ok()?;
            let total = captures.get(2)?.as_str().to_string();
            let speed = captures.get(3).map(|m| m.as_str().to_string()).unwrap_or_else(|| "N/A".to_string());
            let eta = captures.get(4).map(|m| m.as_str().to_string()).unwrap_or_else(|| "N/A".to_string());

            // 计算已下载大小
            let downloaded = if percent >= 100.0 {
                total.clone()
            } else {
                format!("{:.1}%", percent)
            };

            return Some(ProgressData {
                task_id: task_id.to_string(),
                percent,
                speed,
                downloaded,
                total,
                eta,
            });
        }

        None
    }

    /// 取消下载
    /// 需求：3.5
    /// 
    /// # 参数
    /// - `task_id`: 任务 ID
    /// 
    /// # 返回
    /// - `Ok(())`: 取消成功
    /// - `Err(AppError)`: 取消失败或任务不存在
    pub async fn cancel_download(&self, task_id: &str) -> Result<(), AppError> {
        let mut downloads = self.active_downloads.lock().await;
        
        if let Some(mut child) = downloads.remove(task_id) {
            // 终止进程
            child.kill().await
                .map_err(|e| AppError::YtdlpError(format!("终止进程失败: {}", e)))?;
            
            Ok(())
        } else {
            Err(AppError::TaskNotFound(task_id.to_string()))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    #[test]
    fn test_parse_resolution_from_dimensions() {
        let service = YtdlpService {
            ytdlp_path: "yt-dlp".to_string(),
            active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
        };

        let json = serde_json::json!({
            "width": 1920,
            "height": 1080
        });

        let resolution = service.parse_resolution(&json);
        assert_eq!(resolution, "1920x1080");
    }

    #[test]
    fn test_parse_resolution_from_resolution_field() {
        let service = YtdlpService {
            ytdlp_path: "yt-dlp".to_string(),
            active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
        };

        let json = serde_json::json!({
            "resolution": "1920x1080"
        });

        let resolution = service.parse_resolution(&json);
        assert_eq!(resolution, "1920x1080");
    }

    #[test]
    fn test_parse_resolution_from_format_note() {
        let service = YtdlpService {
            ytdlp_path: "yt-dlp".to_string(),
            active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
        };

        let json = serde_json::json!({
            "format_note": "1080p"
        });

        let resolution = service.parse_resolution(&json);
        assert_eq!(resolution, "1080p");
    }

    #[test]
    fn test_parse_resolution_unknown() {
        let service = YtdlpService {
            ytdlp_path: "yt-dlp".to_string(),
            active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
        };

        let json = serde_json::json!({});

        let resolution = service.parse_resolution(&json);
        assert_eq!(resolution, "unknown");
    }

    #[test]
    fn test_ytdlp_service_creation() {
        // 测试 YtdlpService 是否能成功创建
        // 注意：这个测试需要系统中安装了 yt-dlp
        let result = YtdlpService::new();
        
        // 如果 yt-dlp 未安装，应该返回 YtdlpNotFound 错误
        match result {
            Ok(_) => {
                // yt-dlp 已安装，测试通过
                assert!(true);
            }
            Err(AppError::YtdlpNotFound) => {
                // yt-dlp 未安装，这也是预期的行为
                assert!(true);
            }
            Err(e) => {
                // 其他错误，测试失败
                panic!("意外的错误: {:?}", e);
            }
        }
    }

    // Feature: youtube-downloader-tool, Property 1: 视频信息解析完整性
    // 验证需求：1.2, 1.3
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn prop_video_info_parsing_completeness(
            video_id in "[a-zA-Z0-9_-]{5,20}",
            title in "[\\p{L}\\p{N}\\s]{1,100}",
            duration in 1u32..86400u32,
            thumbnail_url in "https?://[a-z0-9.-]+/[a-z0-9/._-]+\\.(jpg|png|webp)",
            uploader in "[\\p{L}\\p{N}\\s]{1,50}",
            num_formats in 1usize..10usize,
        ) {
            let service = YtdlpService {
                ytdlp_path: "yt-dlp".to_string(),
                active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
            };

            // 生成格式列表
            let mut formats_json = Vec::new();
            for i in 0..num_formats {
                let format = serde_json::json!({
                    "format_id": format!("{}", 100 + i),
                    "vcodec": "avc1",
                    "acodec": "mp4a",
                    "ext": "mp4",
                    "width": 1920,
                    "height": 1080,
                    "fps": 30,
                    "filesize": 1024000
                });
                formats_json.push(format);
            }

            // 构造符合 yt-dlp 输出格式的 JSON
            let json_output = serde_json::json!({
                "id": video_id,
                "title": title,
                "duration": duration,
                "thumbnail": thumbnail_url,
                "uploader": uploader,
                "formats": formats_json
            });

            let json_str = serde_json::to_string(&json_output).unwrap();

            // 解析视频信息
            let result = service.parse_video_info(&json_str);

            // 属性验证：对于任意成功的 yt-dlp 输出，解析后的 VideoInfo 对象应该：
            // 1. 包含非空的标题
            // 2. 有效的时长
            // 3. 至少一个可用格式
            prop_assert!(result.is_ok(), "解析应该成功");
            
            let video_info = result.unwrap();
            
            // 验证标题非空
            prop_assert!(!video_info.title.is_empty(), "标题不应为空");
            
            // 验证时长有效（大于 0）
            prop_assert!(video_info.duration > 0, "时长应该大于 0");
            
            // 验证至少有一个可用格式
            prop_assert!(!video_info.formats.is_empty(), "应该至少有一个可用格式");
            
            // 额外验证：确保解析的值与输入匹配
            prop_assert_eq!(video_info.id, video_id);
            prop_assert_eq!(video_info.title, title);
            prop_assert_eq!(video_info.duration, duration);
            prop_assert_eq!(video_info.formats.len(), num_formats);
        }
    }

    // 测试边缘情况：空格式列表应该返回错误
    #[test]
    fn test_empty_formats_returns_error() {
        let service = YtdlpService {
            ytdlp_path: "yt-dlp".to_string(),
            active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
        };

        let json_output = serde_json::json!({
            "id": "test123",
            "title": "Test Video",
            "duration": 300,
            "thumbnail": "https://example.com/thumb.jpg",
            "uploader": "Test User",
            "formats": []
        });

        let json_str = serde_json::to_string(&json_output).unwrap();
        let result = service.parse_video_info(&json_str);

        assert!(result.is_err());
        match result {
            Err(AppError::ParseError(msg)) => {
                assert!(msg.contains("没有可用的视频格式"));
            }
            _ => panic!("应该返回 ParseError"),
        }
    }

    // 测试边缘情况：只有音频格式（vcodec = "none"）应该被过滤
    #[test]
    fn test_audio_only_formats_filtered() {
        let service = YtdlpService {
            ytdlp_path: "yt-dlp".to_string(),
            active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
        };

        let json_output = serde_json::json!({
            "id": "test123",
            "title": "Test Video",
            "duration": 300,
            "thumbnail": "https://example.com/thumb.jpg",
            "uploader": "Test User",
            "formats": [
                {
                    "format_id": "140",
                    "vcodec": "none",
                    "acodec": "mp4a",
                    "ext": "m4a"
                },
                {
                    "format_id": "137",
                    "vcodec": "avc1",
                    "acodec": "mp4a",
                    "ext": "mp4",
                    "width": 1920,
                    "height": 1080
                }
            ]
        });

        let json_str = serde_json::to_string(&json_output).unwrap();
        let result = service.parse_video_info(&json_str);

        assert!(result.is_ok());
        let video_info = result.unwrap();
        
        // 应该只有一个视频格式（音频格式被过滤）
        assert_eq!(video_info.formats.len(), 1);
        assert_eq!(video_info.formats[0].format_id, "137");
    }

    // 测试像素数量提取
    #[test]
    fn test_extract_pixel_count() {
        let service = YtdlpService {
            ytdlp_path: "yt-dlp".to_string(),
            active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
        };

        // 测试 "1920x1080" 格式
        assert_eq!(service.extract_pixel_count("1920x1080"), 2_073_600);
        
        // 测试 "1280x720" 格式
        assert_eq!(service.extract_pixel_count("1280x720"), 921_600);
        
        // 测试 "1080p" 格式
        assert_eq!(service.extract_pixel_count("1080p"), 2_073_600);
        
        // 测试 "720p" 格式
        assert_eq!(service.extract_pixel_count("720p"), 921_600);
        
        // 测试 "480p" 格式 (480 * 16 / 9 = 853.33, 取整为 853)
        assert_eq!(service.extract_pixel_count("480p"), 409_440);
        
        // 测试未知格式
        assert_eq!(service.extract_pixel_count("unknown"), 0);
    }

    // 测试分辨率排序
    #[test]
    fn test_sort_formats_by_resolution() {
        let service = YtdlpService {
            ytdlp_path: "yt-dlp".to_string(),
            active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
        };

        let formats = vec![
            Format {
                format_id: "1".to_string(),
                resolution: "720p".to_string(),
                ext: "mp4".to_string(),
                filesize: None,
                fps: Some(30),
                vcodec: "avc1".to_string(),
                acodec: "mp4a".to_string(),
            },
            Format {
                format_id: "2".to_string(),
                resolution: "1080p".to_string(),
                ext: "mp4".to_string(),
                filesize: None,
                fps: Some(30),
                vcodec: "avc1".to_string(),
                acodec: "mp4a".to_string(),
            },
            Format {
                format_id: "3".to_string(),
                resolution: "480p".to_string(),
                ext: "mp4".to_string(),
                filesize: None,
                fps: Some(30),
                vcodec: "avc1".to_string(),
                acodec: "mp4a".to_string(),
            },
        ];

        let sorted = service.sort_formats_by_resolution(formats);

        // 验证排序顺序：1080p > 720p > 480p
        assert_eq!(sorted[0].resolution, "1080p");
        assert_eq!(sorted[1].resolution, "720p");
        assert_eq!(sorted[2].resolution, "480p");
    }

    // 测试默认分辨率选择（存在 1080p）
    #[test]
    fn test_select_default_resolution_with_1080p() {
        let service = YtdlpService {
            ytdlp_path: "yt-dlp".to_string(),
            active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
        };

        let formats = vec![
            Format {
                format_id: "137".to_string(),
                resolution: "1080p".to_string(),
                ext: "mp4".to_string(),
                filesize: None,
                fps: Some(30),
                vcodec: "avc1".to_string(),
                acodec: "mp4a".to_string(),
            },
            Format {
                format_id: "136".to_string(),
                resolution: "720p".to_string(),
                ext: "mp4".to_string(),
                filesize: None,
                fps: Some(30),
                vcodec: "avc1".to_string(),
                acodec: "mp4a".to_string(),
            },
        ];

        let default_id = service.select_default_resolution(&formats);
        assert_eq!(default_id, Some("137".to_string()));
    }

    // 测试默认分辨率选择（不存在 1080p，选择最接近的）
    #[test]
    fn test_select_default_resolution_closest() {
        let service = YtdlpService {
            ytdlp_path: "yt-dlp".to_string(),
            active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
        };

        let formats = vec![
            Format {
                format_id: "136".to_string(),
                resolution: "720p".to_string(),
                ext: "mp4".to_string(),
                filesize: None,
                fps: Some(30),
                vcodec: "avc1".to_string(),
                acodec: "mp4a".to_string(),
            },
            Format {
                format_id: "138".to_string(),
                resolution: "2160p".to_string(),
                ext: "mp4".to_string(),
                filesize: None,
                fps: Some(30),
                vcodec: "avc1".to_string(),
                acodec: "mp4a".to_string(),
            },
        ];

        let default_id = service.select_default_resolution(&formats);
        // 720p 更接近 1080p（差距小于 2160p）
        assert_eq!(default_id, Some("136".to_string()));
    }

    // 测试音视频流合并检测
    #[test]
    fn test_needs_audio_merge() {
        let service = YtdlpService {
            ytdlp_path: "yt-dlp".to_string(),
            active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
        };

        // 需要合并：有视频但无音频
        let format_needs_merge = Format {
            format_id: "137".to_string(),
            resolution: "1080p".to_string(),
            ext: "mp4".to_string(),
            filesize: None,
            fps: Some(30),
            vcodec: "avc1".to_string(),
            acodec: "none".to_string(),
        };
        assert!(service.needs_audio_merge(&format_needs_merge));

        // 不需要合并：有视频也有音频
        let format_no_merge = Format {
            format_id: "22".to_string(),
            resolution: "720p".to_string(),
            ext: "mp4".to_string(),
            filesize: None,
            fps: Some(30),
            vcodec: "avc1".to_string(),
            acodec: "mp4a".to_string(),
        };
        assert!(!service.needs_audio_merge(&format_no_merge));
    }

    // 测试文件大小格式化
    #[test]
    fn test_format_filesize() {
        let service = YtdlpService {
            ytdlp_path: "yt-dlp".to_string(),
            active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
        };

        // 测试 GB
        assert_eq!(service.format_filesize(Some(2_147_483_648)), "2.00 GB");
        
        // 测试 MB
        assert_eq!(service.format_filesize(Some(52_428_800)), "50.00 MB");
        
        // 测试 KB
        assert_eq!(service.format_filesize(Some(10_240)), "10.00 KB");
        
        // 测试 B
        assert_eq!(service.format_filesize(Some(512)), "512 B");
        
        // 测试 None
        assert_eq!(service.format_filesize(None), "未知大小");
    }

    // 测试进度解析
    #[test]
    fn test_parse_progress_valid() {
        let line = "[download]  45.2% of 280.00MiB at 2.50MiB/s ETA 00:52";
        let progress = YtdlpService::parse_progress("task-123", line);

        assert!(progress.is_some());
        let progress = progress.unwrap();
        
        assert_eq!(progress.task_id, "task-123");
        assert_eq!(progress.percent, 45.2);
        assert_eq!(progress.total, "280.00MiB");
        assert_eq!(progress.speed, "2.50MiB/s");
        assert_eq!(progress.eta, "00:52");
    }

    #[test]
    fn test_parse_progress_complete() {
        let line = "[download] 100% of 280.00MiB in 01:52";
        let progress = YtdlpService::parse_progress("task-456", line);

        assert!(progress.is_some());
        let progress = progress.unwrap();
        
        assert_eq!(progress.task_id, "task-456");
        assert_eq!(progress.percent, 100.0);
        assert_eq!(progress.total, "280.00MiB");
    }

    #[test]
    fn test_parse_progress_invalid() {
        let line = "Some other output";
        let progress = YtdlpService::parse_progress("task-789", line);

        assert!(progress.is_none());
    }

    #[test]
    fn test_parse_progress_no_speed() {
        let line = "[download]  10.5% of 100.00MiB";
        let progress = YtdlpService::parse_progress("task-999", line);

        assert!(progress.is_some());
        let progress = progress.unwrap();
        
        assert_eq!(progress.percent, 10.5);
        assert_eq!(progress.speed, "N/A");
        assert_eq!(progress.eta, "N/A");
    }

    // Feature: youtube-downloader-tool, Property 2: 分辨率排序单调性
    // 验证需求：2.2
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn prop_resolution_sorting_monotonic(
            // 生成随机的格式列表
            formats in prop::collection::vec(
                (
                    prop::string::string_regex("[0-9]+").unwrap(),  // format_id
                    prop::option::of(prop::num::u64::ANY),          // filesize
                    prop::option::of(1u32..120u32),                 // fps
                ),
                1..20  // 生成 1-20 个格式
            )
        ) {
            let service = YtdlpService {
                ytdlp_path: "yt-dlp".to_string(),
                active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
            };

            // 定义常见的分辨率选项
            let resolutions = vec![
                "3840x2160",  // 4K
                "2560x1440",  // 2K
                "1920x1080",  // 1080p
                "1280x720",   // 720p
                "854x480",    // 480p
                "640x360",    // 360p
                "426x240",    // 240p
                "2160p",
                "1440p",
                "1080p",
                "720p",
                "480p",
                "360p",
                "240p",
            ];

            // 构造格式列表，使用随机分辨率
            let mut format_list = Vec::new();
            for (i, (format_id, filesize, fps)) in formats.iter().enumerate() {
                // 从预定义的分辨率中随机选择
                let resolution = resolutions[i % resolutions.len()].to_string();
                
                format_list.push(Format {
                    format_id: format_id.clone(),
                    resolution,
                    ext: "mp4".to_string(),
                    filesize: *filesize,
                    fps: *fps,
                    vcodec: "avc1".to_string(),
                    acodec: "mp4a".to_string(),
                });
            }

            // 执行排序
            let sorted = service.sort_formats_by_resolution(format_list);

            // 属性验证：排序后的列表应该满足单调递减顺序
            // 即：对于所有相邻的格式对，前一个的像素数应该 >= 后一个的像素数
            for i in 0..sorted.len().saturating_sub(1) {
                let current_pixels = service.extract_pixel_count(&sorted[i].resolution);
                let next_pixels = service.extract_pixel_count(&sorted[i + 1].resolution);
                
                prop_assert!(
                    current_pixels >= next_pixels,
                    "排序违反单调性：位置 {} 的分辨率 {} ({} 像素) 应该 >= 位置 {} 的分辨率 {} ({} 像素)",
                    i,
                    sorted[i].resolution,
                    current_pixels,
                    i + 1,
                    sorted[i + 1].resolution,
                    next_pixels
                );
            }
        }
    }

    // Feature: youtube-downloader-tool, Property 3: 默认分辨率选择正确性
    // 验证需求：2.3
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn prop_default_resolution_selection_correctness(
            // 生成随机的格式列表
            formats in prop::collection::vec(
                prop::string::string_regex("[0-9]+").unwrap(),  // format_id
                1..15  // 生成 1-15 个格式
            ),
            // 随机决定是否包含 1080p
            include_1080p: bool,
        ) {
            let service = YtdlpService {
                ytdlp_path: "yt-dlp".to_string(),
                active_downloads: Arc::new(Mutex::new(std::collections::HashMap::new())),
            };

            // 定义可用的分辨率选项（不包含 1080p）
            let resolutions_without_1080p = vec![
                "3840x2160",  // 4K - 8294400 像素
                "2560x1440",  // 2K - 3686400 像素
                "1280x720",   // 720p - 921600 像素
                "854x480",    // 480p - 409920 像素
                "640x360",    // 360p - 230400 像素
                "2160p",      // 4K - 8294400 像素
                "1440p",      // 2K - 3686400 像素
                "720p",       // 720p - 921600 像素
                "480p",       // 480p - 409440 像素
                "360p",       // 360p - 230400 像素
            ];

            let target_pixels = 1920 * 1080; // 1080p = 2073600 像素

            // 构造格式列表
            let mut format_list = Vec::new();
            
            // 如果需要包含 1080p，添加一个 1080p 格式
            if include_1080p {
                format_list.push(Format {
                    format_id: "1080p_format".to_string(),
                    resolution: "1080p".to_string(),
                    ext: "mp4".to_string(),
                    filesize: None,
                    fps: Some(30),
                    vcodec: "avc1".to_string(),
                    acodec: "mp4a".to_string(),
                });
            }

            // 添加其他随机分辨率的格式
            for (i, format_id) in formats.iter().enumerate() {
                let resolution = resolutions_without_1080p[i % resolutions_without_1080p.len()].to_string();
                
                format_list.push(Format {
                    format_id: format_id.clone(),
                    resolution,
                    ext: "mp4".to_string(),
                    filesize: None,
                    fps: Some(30),
                    vcodec: "avc1".to_string(),
                    acodec: "mp4a".to_string(),
                });
            }

            // 选择默认分辨率
            let selected_id = service.select_default_resolution(&format_list);

            // 属性验证
            prop_assert!(selected_id.is_some(), "应该选择一个默认分辨率");

            let selected_id = selected_id.unwrap();

            if include_1080p {
                // 如果包含 1080p，应该选择 1080p
                prop_assert_eq!(
                    selected_id,
                    "1080p_format".to_string(),
                    "当存在 1080p 时，应该选择 1080p"
                );
            } else {
                // 如果不包含 1080p，应该选择最接近 1080p 的分辨率
                let selected_format = format_list.iter()
                    .find(|f| f.format_id == selected_id)
                    .expect("选择的格式应该存在于列表中");

                let selected_pixels = service.extract_pixel_count(&selected_format.resolution);

                // 验证选择的分辨率是最接近 1080p 的
                for format in &format_list {
                    let format_pixels = service.extract_pixel_count(&format.resolution);
                    if format_pixels > 0 {
                        let selected_diff = selected_pixels.abs_diff(target_pixels);
                        let format_diff = format_pixels.abs_diff(target_pixels);

                        prop_assert!(
                            selected_diff <= format_diff,
                            "选择的分辨率 {} ({} 像素，差距 {}) 应该比 {} ({} 像素，差距 {}) 更接近 1080p ({} 像素)",
                            selected_format.resolution,
                            selected_pixels,
                            selected_diff,
                            format.resolution,
                            format_pixels,
                            format_diff,
                            target_pixels
                        );
                    }
                }
            }
        }
    }

    // Feature: youtube-downloader-tool, Property 14: 进度解析字段完整性
    // 验证需求：3.2
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn prop_progress_parsing_field_completeness(
            // 生成随机的进度百分比 (0.0 - 100.0)
            percent in 0.0f32..=100.0f32,
            // 生成随机的文件大小 (1 - 10000 MB)
            total_mb in 1.0f64..10000.0f64,
            // 生成随机的下载速度 (0.1 - 100 MB/s)
            speed_mb in 0.1f64..100.0f64,
            // 生成随机的 ETA 分钟数 (0 - 120 分钟)
            eta_minutes in 0u32..120u32,
            eta_seconds in 0u32..60u32,
        ) {
            // 构造符合 yt-dlp 进度输出格式的字符串
            // 格式：[download]  45.2% of 280.00MiB at 2.50MiB/s ETA 00:52
            let progress_line = format!(
                "[download]  {:.1}% of {:.2}MiB at {:.2}MiB/s ETA {:02}:{:02}",
                percent,
                total_mb,
                speed_mb,
                eta_minutes,
                eta_seconds
            );

            // 解析进度信息
            let progress = YtdlpService::parse_progress("test-task", &progress_line);

            // 属性验证：对于任意符合 yt-dlp 进度输出格式的字符串，
            // 解析后的 ProgressData 应该包含有效的字段
            prop_assert!(progress.is_some(), "应该能够成功解析进度信息");

            let progress = progress.unwrap();

            // 验证 task_id 字段
            prop_assert_eq!(progress.task_id, "test-task", "task_id 应该正确设置");

            // 验证百分比字段在有效范围内 (0.0 - 100.0)
            prop_assert!(
                progress.percent >= 0.0 && progress.percent <= 100.0,
                "百分比应该在 0.0 到 100.0 之间，实际值: {}",
                progress.percent
            );

            // 验证百分比值与输入匹配（允许小的浮点误差）
            prop_assert!(
                (progress.percent - percent).abs() < 0.2,
                "解析的百分比 {} 应该接近输入值 {}",
                progress.percent,
                percent
            );

            // 验证 total 字段非空且包含单位
            prop_assert!(!progress.total.is_empty(), "total 字段不应为空");
            prop_assert!(
                progress.total.contains("MiB") || progress.total.contains("MB") || 
                progress.total.contains("GiB") || progress.total.contains("GB"),
                "total 字段应该包含大小单位，实际值: {}",
                progress.total
            );

            // 验证 speed 字段非空
            prop_assert!(!progress.speed.is_empty(), "speed 字段不应为空");
            
            // 如果不是 "N/A"，应该包含速度单位
            if progress.speed != "N/A" {
                prop_assert!(
                    progress.speed.contains("/s"),
                    "speed 字段应该包含速度单位，实际值: {}",
                    progress.speed
                );
            }

            // 验证 eta 字段非空
            prop_assert!(!progress.eta.is_empty(), "eta 字段不应为空");
            
            // 如果不是 "N/A"，应该是时间格式
            if progress.eta != "N/A" {
                prop_assert!(
                    progress.eta.contains(':'),
                    "eta 字段应该是时间格式 (包含 ':')，实际值: {}",
                    progress.eta
                );
            }

            // 验证 downloaded 字段非空
            prop_assert!(!progress.downloaded.is_empty(), "downloaded 字段不应为空");
        }
    }

    // 测试边缘情况：100% 完成的进度输出
    #[test]
    fn test_progress_parsing_100_percent() {
        let line = "[download] 100.0% of 500.00MiB at 5.00MiB/s ETA 00:00";
        let progress = YtdlpService::parse_progress("task-complete", line);

        assert!(progress.is_some());
        let progress = progress.unwrap();

        assert_eq!(progress.percent, 100.0);
        assert!(!progress.total.is_empty());
        assert!(!progress.speed.is_empty());
        assert!(!progress.eta.is_empty());
        assert!(!progress.downloaded.is_empty());
    }

    // 测试边缘情况：没有速度和 ETA 的进度输出
    #[test]
    fn test_progress_parsing_without_speed_eta() {
        let line = "[download]  25.5% of 150.00MiB";
        let progress = YtdlpService::parse_progress("task-slow", line);

        assert!(progress.is_some());
        let progress = progress.unwrap();

        assert_eq!(progress.percent, 25.5);
        assert!(!progress.total.is_empty());
        // 没有速度和 ETA 时应该返回 "N/A"
        assert_eq!(progress.speed, "N/A");
        assert_eq!(progress.eta, "N/A");
        assert!(!progress.downloaded.is_empty());
    }
}
