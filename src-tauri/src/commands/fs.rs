use crate::utils::fs::{normalize_path, open_path, verify_path_permission};
use tauri::api::dialog::blocking::FileDialogBuilder;

/// 选择文件夹
#[tauri::command]
pub async fn select_folder() -> Result<Option<String>, String> {
    let result = FileDialogBuilder::new()
        .set_title("选择保存文件夹")
        .pick_folder();
    
    Ok(result.map(|path| path.to_string_lossy().to_string()))
}

/// 验证路径权限
#[tauri::command]
pub async fn verify_path(path: String) -> Result<bool, String> {
    verify_path_permission(&path).map_err(|e| e.into())
}

/// 打开文件或文件夹
#[tauri::command]
pub async fn open_file(path: String) -> Result<(), String> {
    open_path(&path).map_err(|e| e.into())
}

/// 规范化路径
#[tauri::command]
pub async fn normalize_file_path(path: String) -> Result<String, String> {
    normalize_path(&path)
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.into())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_verify_path_valid() {
        let temp_dir = std::env::temp_dir();
        let path = temp_dir.to_string_lossy().to_string();
        
        let result = verify_path(path).await;
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_normalize_file_path_valid() {
        let temp_dir = std::env::temp_dir();
        let path = temp_dir.to_string_lossy().to_string();
        
        let result = normalize_file_path(path).await;
        assert!(result.is_ok());
    }
}
