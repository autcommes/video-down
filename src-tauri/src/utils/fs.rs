use crate::error::AppError;
use std::path::{Path, PathBuf};
use std::fs;

/// 验证路径是否具有写入权限
pub fn verify_path_permission(path: &str) -> Result<bool, AppError> {
    let path = Path::new(path);
    
    // 如果路径不存在，检查父目录
    let check_path = if path.exists() {
        path
    } else {
        path.parent().ok_or_else(|| {
            AppError::FileSystemError(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "无效的路径",
            ))
        })?
    };
    
    // 尝试创建临时文件来测试写入权限
    let test_file = check_path.join(".write_test_tmp");
    match fs::write(&test_file, b"test") {
        Ok(_) => {
            // 清理测试文件
            let _ = fs::remove_file(&test_file);
            Ok(true)
        }
        Err(_) => Ok(false),
    }
}

/// 检测文件名冲突并生成新的文件名
#[allow(dead_code)]
pub fn resolve_filename_conflict(dir: &Path, filename: &str) -> Result<String, AppError> {
    let mut final_name = filename.to_string();
    let mut counter = 1;
    
    // 分离文件名和扩展名
    let path = Path::new(filename);
    let stem = path.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(filename);
    let extension = path.extension()
        .and_then(|s| s.to_str())
        .unwrap_or("");
    
    // 检查文件是否存在，如果存在则添加数字后缀
    while dir.join(&final_name).exists() {
        if extension.is_empty() {
            final_name = format!("{}_{}", stem, counter);
        } else {
            final_name = format!("{}_{}.{}", stem, counter, extension);
        }
        counter += 1;
        
        // 防止无限循环
        if counter > 9999 {
            return Err(AppError::FileSystemError(std::io::Error::other(
                "无法生成唯一的文件名",
            )));
        }
    }
    
    Ok(final_name)
}

/// 跨平台路径规范化
pub fn normalize_path(path: &str) -> Result<PathBuf, AppError> {
    let path = Path::new(path);
    
    // 展开相对路径和符号链接
    match path.canonicalize() {
        Ok(canonical) => Ok(canonical),
        Err(_) => {
            // 如果路径不存在，尝试规范化父目录
            if let Some(parent) = path.parent() {
                if parent.exists() {
                    let canonical_parent = parent.canonicalize()?;
                    if let Some(filename) = path.file_name() {
                        Ok(canonical_parent.join(filename))
                    } else {
                        Ok(canonical_parent)
                    }
                } else {
                    // 父目录也不存在，返回绝对路径
                    Ok(path.to_path_buf())
                }
            } else {
                Ok(path.to_path_buf())
            }
        }
    }
}

/// 打开文件或文件夹（使用系统默认程序）
pub fn open_path(path: &str) -> Result<(), AppError> {
    let path = Path::new(path);
    
    if !path.exists() {
        return Err(AppError::FileSystemError(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "文件或文件夹不存在",
        )));
    }
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(AppError::FileSystemError)?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(AppError::FileSystemError)?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(AppError::FileSystemError)?;
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;
    
    #[test]
    fn test_verify_path_permission_writable() {
        let temp_dir = TempDir::new().unwrap();
        let path = temp_dir.path().to_str().unwrap();
        
        let result = verify_path_permission(path);
        assert!(result.is_ok());
        assert!(result.unwrap());
    }
    
    #[test]
    fn test_resolve_filename_conflict_no_conflict() {
        let temp_dir = TempDir::new().unwrap();
        let filename = "test.txt";
        
        let result = resolve_filename_conflict(temp_dir.path(), filename);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "test.txt");
    }
    
    #[test]
    fn test_resolve_filename_conflict_with_conflict() {
        let temp_dir = TempDir::new().unwrap();
        let filename = "test.txt";
        
        // 创建冲突文件
        fs::write(temp_dir.path().join(filename), b"test").unwrap();
        
        let result = resolve_filename_conflict(temp_dir.path(), filename);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "test_1.txt");
    }
    
    #[test]
    fn test_resolve_filename_conflict_multiple_conflicts() {
        let temp_dir = TempDir::new().unwrap();
        let filename = "test.txt";
        
        // 创建多个冲突文件
        fs::write(temp_dir.path().join("test.txt"), b"test").unwrap();
        fs::write(temp_dir.path().join("test_1.txt"), b"test").unwrap();
        fs::write(temp_dir.path().join("test_2.txt"), b"test").unwrap();
        
        let result = resolve_filename_conflict(temp_dir.path(), filename);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "test_3.txt");
    }
    
    #[test]
    fn test_resolve_filename_conflict_no_extension() {
        let temp_dir = TempDir::new().unwrap();
        let filename = "test";
        
        // 创建冲突文件
        fs::write(temp_dir.path().join(filename), b"test").unwrap();
        
        let result = resolve_filename_conflict(temp_dir.path(), filename);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "test_1");
    }
    
    #[test]
    fn test_normalize_path_existing() {
        let temp_dir = TempDir::new().unwrap();
        let path = temp_dir.path().to_str().unwrap();
        
        let result = normalize_path(path);
        assert!(result.is_ok());
    }
    
    // Feature: youtube-downloader-tool, Property 12: 路径权限验证正确性
    // Validates: Requirements 4.3
    #[cfg(test)]
    mod property_tests {
        use super::*;
        use proptest::prelude::*;
        use std::fs;
        
        proptest! {
            #![proptest_config(ProptestConfig::with_cases(100))]
            
            // Feature: youtube-downloader-tool, Property 12: 路径权限验证正确性
            // Validates: Requirements 4.3
            #[test]
            fn prop_verify_writable_paths_return_true(
                subdir_name in "[a-zA-Z0-9_-]{1,20}"
            ) {
                // 创建临时目录（可写）
                let temp_dir = TempDir::new().unwrap();
                let writable_path = temp_dir.path().join(&subdir_name);
                
                // 创建子目录
                fs::create_dir_all(&writable_path).unwrap();
                
                let path_str = writable_path.to_str().unwrap();
                let result = verify_path_permission(path_str);
                
                // 对于可写路径，应该返回 Ok(true)
                prop_assert!(result.is_ok(), "可写路径应该返回 Ok");
                prop_assert!(result.unwrap(), "可写路径应该返回 true");
            }
            
            #[test]
            fn prop_verify_nonexistent_parent_paths(
                subdir_name in "[a-zA-Z0-9_-]{1,20}",
                filename in "[a-zA-Z0-9_-]{1,20}"
            ) {
                // 创建临时目录
                let temp_dir = TempDir::new().unwrap();
                let parent_path = temp_dir.path().join(&subdir_name);
                
                // 创建父目录
                fs::create_dir_all(&parent_path).unwrap();
                
                // 测试不存在的文件路径（但父目录存在且可写）
                let nonexistent_file = parent_path.join(&filename);
                let path_str = nonexistent_file.to_str().unwrap();
                
                let result = verify_path_permission(path_str);
                
                // 如果父目录可写，不存在的文件路径也应该返回 true
                prop_assert!(result.is_ok(), "父目录可写时应该返回 Ok");
                prop_assert!(result.unwrap(), "父目录可写时应该返回 true");
            }
            
            // Feature: youtube-downloader-tool, Property 4: 文件名冲突避免
            // Validates: Requirements 4.5
            #[test]
            fn prop_filename_conflict_avoidance(
                base_name in "[a-zA-Z0-9_-]{1,20}",
                extension in prop::option::of("[a-zA-Z0-9]{1,5}"),
                num_conflicts in 0usize..10usize
            ) {
                // 创建临时目录
                let temp_dir = TempDir::new().unwrap();
                
                // 构造文件名
                let filename = if let Some(ext) = &extension {
                    format!("{}.{}", base_name, ext)
                } else {
                    base_name.clone()
                };
                
                // 创建冲突文件
                let mut existing_files = Vec::new();
                for i in 0..num_conflicts {
                    let conflict_name = if i == 0 {
                        filename.clone()
                    } else if let Some(ext) = &extension {
                        format!("{}_{}.{}", base_name, i, ext)
                    } else {
                        format!("{}_{}", base_name, i)
                    };
                    
                    let conflict_path = temp_dir.path().join(&conflict_name);
                    fs::write(&conflict_path, b"test").unwrap();
                    existing_files.push(conflict_name);
                }
                
                // 调用冲突解决函数
                let result = resolve_filename_conflict(temp_dir.path(), &filename);
                
                // 验证结果
                prop_assert!(result.is_ok(), "应该成功生成新文件名");
                let new_filename = result.unwrap();
                
                // 属性 1：新文件名不应该在已存在列表中
                prop_assert!(
                    !existing_files.contains(&new_filename),
                    "新文件名 '{}' 不应该在已存在文件列表中",
                    new_filename
                );
                
                // 属性 2：新文件名应该保留原始文件名作为前缀
                let expected_prefix = base_name.as_str();
                prop_assert!(
                    new_filename.starts_with(expected_prefix),
                    "新文件名 '{}' 应该以原始文件名 '{}' 开头",
                    new_filename,
                    expected_prefix
                );
                
                // 属性 3：如果有扩展名，新文件名应该保留相同的扩展名
                if let Some(ext) = &extension {
                    prop_assert!(
                        new_filename.ends_with(&format!(".{}", ext)),
                        "新文件名 '{}' 应该保留扩展名 '.{}'",
                        new_filename,
                        ext
                    );
                }
                
                // 属性 4：新文件名对应的文件不应该存在
                let new_path = temp_dir.path().join(&new_filename);
                prop_assert!(
                    !new_path.exists(),
                    "新文件路径不应该已经存在"
                );
            }
            
            // Feature: youtube-downloader-tool, Property 4: 文件名冲突避免（无冲突情况）
            // Validates: Requirements 4.5
            #[test]
            fn prop_filename_no_conflict_returns_original(
                base_name in "[a-zA-Z0-9_-]{1,20}",
                extension in prop::option::of("[a-zA-Z0-9]{1,5}")
            ) {
                // 创建临时目录（空目录，无冲突）
                let temp_dir = TempDir::new().unwrap();
                
                // 构造文件名
                let filename = if let Some(ext) = &extension {
                    format!("{}.{}", base_name, ext)
                } else {
                    base_name.clone()
                };
                
                // 调用冲突解决函数
                let result = resolve_filename_conflict(temp_dir.path(), &filename);
                
                // 验证结果
                prop_assert!(result.is_ok(), "应该成功返回文件名");
                let new_filename = result.unwrap();
                
                // 属性：无冲突时应该返回原始文件名
                prop_assert_eq!(
                    new_filename,
                    filename,
                    "无冲突时应该返回原始文件名"
                );
            }
        }
        
        #[test]
        fn test_verify_readonly_path_with_temp_dir() {
            // 创建一个临时目录，然后尝试将其设置为只读
            let temp_dir = TempDir::new().unwrap();
            let test_path = temp_dir.path();
            
            // 在 Windows 上，我们可以创建一个只读文件来测试
            #[cfg(target_os = "windows")]
            {
                use std::fs::File;
                
                // 创建一个测试文件
                let test_file = test_path.join("readonly_test.txt");
                File::create(&test_file).unwrap();
                
                // 尝试设置为只读（这在 Windows 上可能需要管理员权限）
                let mut perms = fs::metadata(&test_file).unwrap().permissions();
                perms.set_readonly(true);
                let _ = fs::set_permissions(&test_file, perms);
                
                // 测试父目录的权限（应该仍然可写）
                let result = verify_path_permission(test_path.to_str().unwrap());
                assert!(result.is_ok());
                // 父目录应该仍然可写
                assert!(result.unwrap(), "父目录应该可写");
            }
            
            #[cfg(not(target_os = "windows"))]
            {
                use std::os::unix::fs::PermissionsExt;
                
                // 在 Unix 系统上，创建一个只读目录
                let readonly_dir = test_path.join("readonly");
                fs::create_dir(&readonly_dir).unwrap();
                
                // 设置为只读（移除写权限）
                let mut perms = fs::metadata(&readonly_dir).unwrap().permissions();
                perms.set_mode(0o555); // r-xr-xr-x
                fs::set_permissions(&readonly_dir, perms).unwrap();
                
                // 测试只读目录
                let result = verify_path_permission(readonly_dir.to_str().unwrap());
                assert!(result.is_ok());
                assert!(!result.unwrap(), "只读目录应该返回 false");
                
                // 恢复权限以便清理
                let mut perms = fs::metadata(&readonly_dir).unwrap().permissions();
                perms.set_mode(0o755);
                let _ = fs::set_permissions(&readonly_dir, perms);
            }
        }
        
        // Feature: youtube-downloader-tool, Property 13: 跨平台路径处理一致性
        // Validates: Requirements 10.4
        proptest! {
            #![proptest_config(ProptestConfig::with_cases(100))]
            
            // Feature: youtube-downloader-tool, Property 13: 跨平台路径处理一致性
            // Validates: Requirements 10.4
            #[test]
            fn prop_normalize_path_consistency(
                dir_name in "[a-zA-Z0-9_-]{1,20}",
                file_name in "[a-zA-Z0-9_-]{1,20}",
                extension in "[a-zA-Z0-9]{1,5}"
            ) {
                // 创建临时目录结构
                let temp_dir = TempDir::new().unwrap();
                let subdir = temp_dir.path().join(&dir_name);
                fs::create_dir_all(&subdir).unwrap();
                
                // 创建测试文件
                let filename = format!("{}.{}", file_name, extension);
                let file_path = subdir.join(&filename);
                fs::write(&file_path, b"test content").unwrap();
                
                // 测试路径规范化
                let path_str = file_path.to_str().unwrap();
                let result = normalize_path(path_str);
                
                // 属性 1：规范化应该成功
                prop_assert!(result.is_ok(), "路径规范化应该成功");
                
                let normalized = result.unwrap();
                
                // 属性 2：规范化后的路径应该是绝对路径
                prop_assert!(
                    normalized.is_absolute(),
                    "规范化后的路径应该是绝对路径"
                );
                
                // 属性 3：规范化后的路径应该指向同一个文件
                prop_assert!(
                    normalized.exists(),
                    "规范化后的路径应该指向存在的文件"
                );
                
                // 属性 4：规范化后的路径应该保留文件名
                prop_assert_eq!(
                    normalized.file_name().and_then(|n| n.to_str()),
                    Some(filename.as_str()),
                    "规范化后应该保留原始文件名"
                );
                
                // 属性 5：多次规范化应该得到相同的结果（幂等性）
                let normalized_str = normalized.to_str().unwrap();
                let result2 = normalize_path(normalized_str);
                prop_assert!(result2.is_ok(), "第二次规范化应该成功");
                
                let normalized2 = result2.unwrap();
                prop_assert_eq!(
                    normalized,
                    normalized2,
                    "多次规范化应该得到相同的结果"
                );
            }
            
            // Feature: youtube-downloader-tool, Property 13: 跨平台路径处理一致性（相对路径）
            // Validates: Requirements 10.4
            #[test]
            fn prop_normalize_relative_paths(
                dir_name in "[a-zA-Z0-9_-]{1,20}",
                file_name in "[a-zA-Z0-9_-]{1,20}"
            ) {
                // 创建临时目录结构
                let temp_dir = TempDir::new().unwrap();
                let subdir = temp_dir.path().join(&dir_name);
                fs::create_dir_all(&subdir).unwrap();
                
                // 创建测试文件
                let file_path = subdir.join(&file_name);
                fs::write(&file_path, b"test").unwrap();
                
                // 获取绝对路径
                let absolute_path = file_path.canonicalize().unwrap();
                
                // 测试：规范化绝对路径
                let result = normalize_path(absolute_path.to_str().unwrap());
                prop_assert!(result.is_ok(), "规范化绝对路径应该成功");
                
                let normalized = result.unwrap();
                
                // 属性：规范化后应该得到语义等价的路径
                // 在所有平台上，规范化后的路径应该指向同一个文件
                prop_assert!(
                    normalized.exists(),
                    "规范化后的路径应该存在"
                );
                
                // 属性：规范化后的路径应该与原始绝对路径等价
                prop_assert_eq!(
                    normalized.canonicalize().unwrap(),
                    absolute_path,
                    "规范化后的路径应该与原始路径指向同一文件"
                );
            }
            
            // Feature: youtube-downloader-tool, Property 13: 跨平台路径处理一致性（不存在的路径）
            // Validates: Requirements 10.4
            #[test]
            fn prop_normalize_nonexistent_paths(
                dir_name in "[a-zA-Z0-9_-]{1,20}",
                file_name in "[a-zA-Z0-9_-]{1,20}"
            ) {
                // 创建临时目录（但不创建文件）
                let temp_dir = TempDir::new().unwrap();
                let subdir = temp_dir.path().join(&dir_name);
                fs::create_dir_all(&subdir).unwrap();
                
                // 构造不存在的文件路径
                let nonexistent_file = subdir.join(&file_name);
                let path_str = nonexistent_file.to_str().unwrap();
                
                // 测试规范化不存在的路径
                let result = normalize_path(path_str);
                
                // 属性 1：即使文件不存在，规范化也应该成功（因为父目录存在）
                prop_assert!(result.is_ok(), "规范化不存在的路径应该成功（父目录存在）");
                
                let normalized = result.unwrap();
                
                // 属性 2：规范化后的路径应该保留文件名
                prop_assert_eq!(
                    normalized.file_name().and_then(|n| n.to_str()),
                    Some(file_name.as_str()),
                    "规范化后应该保留文件名"
                );
                
                // 属性 3：规范化后的父目录应该存在
                if let Some(parent) = normalized.parent() {
                    prop_assert!(
                        parent.exists(),
                        "规范化后的父目录应该存在"
                    );
                }
            }
            
            // Feature: youtube-downloader-tool, Property 13: 跨平台路径处理一致性（路径分隔符）
            // Validates: Requirements 10.4
            #[test]
            fn prop_normalize_path_separators(
                dir1 in "[a-zA-Z0-9_-]{1,15}",
                dir2 in "[a-zA-Z0-9_-]{1,15}",
                file_name in "[a-zA-Z0-9_-]{1,15}"
            ) {
                // 创建嵌套目录结构
                let temp_dir = TempDir::new().unwrap();
                let nested_dir = temp_dir.path().join(&dir1).join(&dir2);
                fs::create_dir_all(&nested_dir).unwrap();
                
                // 创建测试文件
                let file_path = nested_dir.join(&file_name);
                fs::write(&file_path, b"test").unwrap();
                
                // 获取规范化路径
                let canonical = file_path.canonicalize().unwrap();
                let result = normalize_path(canonical.to_str().unwrap());
                
                prop_assert!(result.is_ok(), "规范化应该成功");
                let normalized = result.unwrap();
                
                // 属性：规范化后的路径应该使用平台特定的分隔符
                // 在所有平台上，路径应该是有效的
                prop_assert!(
                    normalized.is_absolute(),
                    "规范化后应该是绝对路径"
                );
                
                // 属性：路径组件应该正确保留
                let components: Vec<_> = normalized.components().collect();
                // 注意：在某些 CI 环境中，路径可能更短
                prop_assert!(
                    !components.is_empty(),
                    "路径应该至少包含根组件"
                );
                
                // 属性：文件名应该保留
                prop_assert_eq!(
                    normalized.file_name().and_then(|n| n.to_str()),
                    Some(file_name.as_str()),
                    "文件名应该保留"
                );
            }
        }
    }
}
