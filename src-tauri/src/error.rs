use serde::{Deserialize, Serialize};

/// 应用程序错误类型
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("yt-dlp 执行失败: {0}")]
    YtdlpError(String),

    #[error("视频信息解析失败: {0}")]
    ParseError(String),

    #[error("文件系统错误: {0}")]
    FileSystemError(#[from] std::io::Error),

    #[error("网络请求失败: {0}")]
    NetworkError(#[from] reqwest::Error),

    #[error("配置错误: {0}")]
    ConfigError(String),

    #[error("无效的 URL: {0}")]
    InvalidUrl(String),

    #[error("不支持的网站: {0}")]
    UnsupportedSite(String),

    #[error("任务不存在: {0}")]
    TaskNotFound(String),

    #[error("权限不足: {0}")]
    PermissionDenied(String),

    #[error("磁盘空间不足")]
    InsufficientSpace,

    #[error("yt-dlp 未找到或已损坏")]
    YtdlpNotFound,

    #[error("JSON 序列化/反序列化错误: {0}")]
    JsonError(#[from] serde_json::Error),
}

impl AppError {
    /// 转换为用户友好的错误消息
    pub fn user_message(&self) -> String {
        match self {
            AppError::YtdlpError(msg) => format!("下载工具执行失败：{}", msg),
            AppError::ParseError(_) => "视频信息解析失败，请检查链接是否正确".to_string(),
            AppError::FileSystemError(e) => format!("文件操作失败：{}", e),
            AppError::NetworkError(_) => "网络连接失败，请检查网络设置".to_string(),
            AppError::ConfigError(msg) => format!("配置错误：{}", msg),
            AppError::InvalidUrl(_) => "无效的视频链接，请输入正确的 URL".to_string(),
            AppError::UnsupportedSite(_) => {
                "该网站暂不支持，yt-dlp 支持 1000+ 网站，请尝试其他链接".to_string()
            }
            AppError::TaskNotFound(_) => "下载任务不存在".to_string(),
            AppError::PermissionDenied(_) => "没有写入权限，请选择其他保存位置".to_string(),
            AppError::InsufficientSpace => "磁盘空间不足，请清理磁盘后重试".to_string(),
            AppError::YtdlpNotFound => "yt-dlp 未找到，请尝试更新或重新安装".to_string(),
            AppError::JsonError(e) => format!("数据格式错误：{}", e),
        }
    }
}

/// 转换为 Tauri 命令返回的 String 错误
impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.user_message()
    }
}

/// 错误响应结构（用于前端）
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorResponse {
    pub error_type: String,
    pub message: String,
}

impl From<AppError> for ErrorResponse {
    fn from(error: AppError) -> Self {
        ErrorResponse {
            error_type: format!("{:?}", error).split('(').next().unwrap_or("Unknown").to_string(),
            message: error.user_message(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Feature: youtube-downloader-tool, Property 15: 错误信息结构完整性
    #[test]
    fn prop_error_message_structure_completeness() {
        // 测试所有错误类型变体
        let test_cases = vec![
            AppError::YtdlpError("test error".to_string()),
            AppError::ParseError("parse failed".to_string()),
            AppError::FileSystemError(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "file not found",
            )),
            AppError::ConfigError("config invalid".to_string()),
            AppError::InvalidUrl("bad url".to_string()),
            AppError::UnsupportedSite("example.com".to_string()),
            AppError::TaskNotFound("task-123".to_string()),
            AppError::PermissionDenied("/protected/path".to_string()),
            AppError::InsufficientSpace,
            AppError::YtdlpNotFound,
            AppError::JsonError(serde_json::Error::io(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "invalid json",
            ))),
        ];

        for error in test_cases {
            // 验证 user_message() 返回非空字符串
            let user_msg = error.user_message();
            assert!(
                !user_msg.is_empty(),
                "user_message() 应该返回非空字符串，错误类型: {:?}",
                error
            );

            // 验证 ErrorResponse 包含完整信息
            let error_response: ErrorResponse = error.into();
            assert!(
                !error_response.error_type.is_empty(),
                "error_type 应该非空"
            );
            assert!(
                !error_response.message.is_empty(),
                "message 应该非空"
            );

            // 验证 error_type 不是 "Unknown"
            assert_ne!(
                error_response.error_type, "Unknown",
                "error_type 不应该是 'Unknown'"
            );
        }
    }

    #[test]
    fn test_error_response_serialization() {
        // 测试 ErrorResponse 可以正确序列化为 JSON
        let error = AppError::YtdlpError("test".to_string());
        let response: ErrorResponse = error.into();
        
        let json = serde_json::to_string(&response).expect("应该能够序列化为 JSON");
        assert!(json.contains("errorType"));
        assert!(json.contains("message"));
    }

    #[test]
    fn test_error_type_identification() {
        // 测试不同错误类型有不同的 error_type
        let errors = vec![
            (AppError::YtdlpError("test".to_string()), "YtdlpError"),
            (AppError::ParseError("test".to_string()), "ParseError"),
            (AppError::ConfigError("test".to_string()), "ConfigError"),
            (AppError::InvalidUrl("test".to_string()), "InvalidUrl"),
            (AppError::InsufficientSpace, "InsufficientSpace"),
            (AppError::YtdlpNotFound, "YtdlpNotFound"),
        ];

        for (error, expected_type) in errors {
            let response: ErrorResponse = error.into();
            assert_eq!(
                response.error_type, expected_type,
                "错误类型标识应该匹配"
            );
        }
    }
}
