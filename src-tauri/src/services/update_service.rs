use crate::error::AppError;
use crate::models::UpdateInfo;
use reqwest;
use serde::Deserialize;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

/// GitHub Release 响应结构
#[derive(Debug, Deserialize)]
struct GithubRelease {
    tag_name: String,
    body: Option<String>,
    assets: Vec<GithubAsset>,
}

/// GitHub Asset 响应结构
#[derive(Debug, Deserialize)]
struct GithubAsset {
    name: String,
    browser_download_url: String,
}

/// 更新服务
pub struct UpdateService {
    ytdlp_path: PathBuf,
}

impl UpdateService {
    /// 创建新的更新服务实例
    pub fn new(ytdlp_path: PathBuf) -> Self {
        Self { ytdlp_path }
    }

    /// 读取本地 yt-dlp 版本
    pub async fn get_local_version(&self) -> Result<String, AppError> {
        if !self.ytdlp_path.exists() {
            return Err(AppError::YtdlpNotFound);
        }

        // 执行 yt-dlp --version 获取版本号
        let output = tokio::process::Command::new(&self.ytdlp_path)
            .arg("--version")
            .output()
            .await
            .map_err(|e| AppError::YtdlpError(format!("无法执行 yt-dlp: {}", e)))?;

        if !output.status.success() {
            return Err(AppError::YtdlpError("获取版本失败".to_string()));
        }

        let version = String::from_utf8_lossy(&output.stdout)
            .trim()
            .to_string();

        Ok(version)
    }

    /// 从 GitHub API 获取最新版本信息
    async fn get_latest_version(&self) -> Result<GithubRelease, AppError> {
        let url = "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest";

        let client = reqwest::Client::new();
        let response = client
            .get(url)
            .header("User-Agent", "youtube-downloader-tool")
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(AppError::NetworkError(
                reqwest::Error::from(response.error_for_status().unwrap_err())
            ));
        }

        let release: GithubRelease = response.json().await?;
        Ok(release)
    }

    /// 比较版本号
    /// 返回 true 如果 latest > current
    pub fn compare_versions(&self, current: &str, latest: &str) -> bool {
        // 移除 'v' 前缀（如果存在）
        let current = current.trim_start_matches('v');
        let latest = latest.trim_start_matches('v');

        // 简单的字符串比较（适用于 YYYY.MM.DD 格式）
        latest > current
    }

    /// 检查更新
    pub async fn check_update(&self) -> Result<UpdateInfo, AppError> {
        let current_version = self.get_local_version().await?;
        let release = self.get_latest_version().await?;
        let latest_version = release.tag_name.clone();

        let has_update = self.compare_versions(&current_version, &latest_version);

        // 根据平台选择正确的下载 URL
        let download_url = self.get_download_url_for_platform(&release)?;

        Ok(UpdateInfo {
            current_version,
            latest_version,
            has_update,
            download_url,
            release_notes: release.body.unwrap_or_default(),
        })
    }

    /// 根据平台获取下载 URL
    fn get_download_url_for_platform(&self, release: &GithubRelease) -> Result<String, AppError> {
        let platform_name = if cfg!(target_os = "windows") {
            "yt-dlp.exe"
        } else if cfg!(target_os = "macos") {
            "yt-dlp_macos"
        } else if cfg!(target_os = "linux") {
            "yt-dlp"
        } else {
            return Err(AppError::ConfigError("不支持的操作系统".to_string()));
        };

        // 查找匹配的 asset
        for asset in &release.assets {
            if asset.name == platform_name {
                return Ok(asset.browser_download_url.clone());
            }
        }

        Err(AppError::ConfigError(format!(
            "未找到平台 {} 的下载文件",
            platform_name
        )))
    }

    /// 下载 yt-dlp 更新
    pub async fn download_update(
        &self,
        download_url: &str,
        app_handle: AppHandle,
    ) -> Result<PathBuf, AppError> {
        let client = reqwest::Client::new();
        let response = client
            .get(download_url)
            .header("User-Agent", "youtube-downloader-tool")
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(AppError::NetworkError(
                reqwest::Error::from(response.error_for_status().unwrap_err())
            ));
        }

        let total_size = response.content_length().unwrap_or(0);
        let bytes = response.bytes().await?;

        // 发送下载完成事件
        let _ = app_handle.emit_all(
            "update-progress",
            serde_json::json!({
                "percent": 100.0,
                "downloaded": format!("{} bytes", bytes.len()),
                "total": format!("{} bytes", total_size),
            }),
        );

        // 保存到临时文件
        let temp_path = self.ytdlp_path.with_extension("tmp");
        fs::write(&temp_path, &bytes)?;

        Ok(temp_path)
    }

    /// 备份当前版本并替换为新版本
    pub async fn replace_ytdlp(&self, new_file_path: &Path) -> Result<(), AppError> {
        // 创建备份
        let backup_path = self.ytdlp_path.with_extension("bak");
        if self.ytdlp_path.exists() {
            fs::copy(&self.ytdlp_path, &backup_path)?;
        }

        // 替换文件
        fs::rename(new_file_path, &self.ytdlp_path)?;

        // 在 Unix 系统上设置执行权限
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = fs::metadata(&self.ytdlp_path)?.permissions();
            perms.set_mode(0o755);
            fs::set_permissions(&self.ytdlp_path, perms)?;
        }

        Ok(())
    }

    /// 执行完整的更新流程
    pub async fn update_ytdlp(
        &self,
        download_url: &str,
        app_handle: AppHandle,
    ) -> Result<(), AppError> {
        // 下载新版本
        let temp_path = self.download_update(download_url, app_handle).await?;

        // 备份并替换
        self.replace_ytdlp(&temp_path).await?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;
    use proptest::prelude::*;

    #[test]
    fn test_compare_versions() {
        let temp_dir = TempDir::new().unwrap();
        let ytdlp_path = temp_dir.path().join("yt-dlp.exe");
        let service = UpdateService::new(ytdlp_path);

        // 测试基本版本比较
        assert!(service.compare_versions("2024.01.10", "2024.01.15"));
        assert!(!service.compare_versions("2024.01.15", "2024.01.10"));
        assert!(!service.compare_versions("2024.01.15", "2024.01.15"));

        // 测试带 'v' 前缀的版本
        assert!(service.compare_versions("v2024.01.10", "v2024.01.15"));
        assert!(service.compare_versions("2024.01.10", "v2024.01.15"));
        assert!(service.compare_versions("v2024.01.10", "2024.01.15"));
    }

    // Feature: youtube-downloader-tool, Property 8: 版本号比较正确性
    // 验证需求：6.3
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn prop_version_comparison_correctness(
            year1 in 2020u32..2030u32,
            month1 in 1u32..13u32,
            day1 in 1u32..29u32,
            year2 in 2020u32..2030u32,
            month2 in 1u32..13u32,
            day2 in 1u32..29u32,
            with_v_prefix1: bool,
            with_v_prefix2: bool,
        ) {
            let temp_dir = TempDir::new().unwrap();
            let ytdlp_path = temp_dir.path().join("yt-dlp.exe");
            let service = UpdateService::new(ytdlp_path);

            // 构造版本号字符串（YYYY.MM.DD 格式）
            let version1 = format!(
                "{}{:04}.{:02}.{:02}",
                if with_v_prefix1 { "v" } else { "" },
                year1,
                month1,
                day1
            );
            let version2 = format!(
                "{}{:04}.{:02}.{:02}",
                if with_v_prefix2 { "v" } else { "" },
                year2,
                month2,
                day2
            );

            // 移除前缀进行数值比较
            let v1_clean = version1.trim_start_matches('v');
            let v2_clean = version2.trim_start_matches('v');

            let result = service.compare_versions(&version1, &version2);
            let expected = v2_clean > v1_clean;

            prop_assert_eq!(
                result,
                expected,
                "版本比较失败: compare_versions({}, {}) = {}, 期望 {}",
                version1,
                version2,
                result,
                expected
            );
        }
    }

    // Feature: youtube-downloader-tool, Property 8: 版本号比较正确性
    // 验证需求：6.3
    // 测试传递性：如果 v1 < v2 且 v2 < v3，则 v1 < v3
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn prop_version_comparison_transitivity(
            year in 2020u32..2028u32,
            month in 1u32..13u32,
            day in 1u32..27u32,
        ) {
            let temp_dir = TempDir::new().unwrap();
            let ytdlp_path = temp_dir.path().join("yt-dlp.exe");
            let service = UpdateService::new(ytdlp_path);

            // 创建三个递增的版本号
            let v1 = format!("{:04}.{:02}.{:02}", year, month, day);
            let v2 = format!("{:04}.{:02}.{:02}", year, month, day + 1);
            let v3 = format!("{:04}.{:02}.{:02}", year, month, day + 2);

            // v2 > v1
            let v2_gt_v1 = service.compare_versions(&v1, &v2);
            // v3 > v2
            let v3_gt_v2 = service.compare_versions(&v2, &v3);
            // v3 > v1
            let v3_gt_v1 = service.compare_versions(&v1, &v3);

            prop_assert!(
                v2_gt_v1,
                "期望 {} > {}",
                v2,
                v1
            );
            prop_assert!(
                v3_gt_v2,
                "期望 {} > {}",
                v3,
                v2
            );
            prop_assert!(
                v3_gt_v1,
                "传递性失败: {} > {} 且 {} > {}，但 {} 不大于 {}",
                v2,
                v1,
                v3,
                v2,
                v3,
                v1
            );
        }
    }

    // Feature: youtube-downloader-tool, Property 8: 版本号比较正确性
    // 验证需求：6.3
    // 测试反对称性：如果 v1 != v2，则 compare_versions(v1, v2) != compare_versions(v2, v1)
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn prop_version_comparison_antisymmetry(
            year1 in 2020u32..2030u32,
            month1 in 1u32..13u32,
            day1 in 1u32..29u32,
            year2 in 2020u32..2030u32,
            month2 in 1u32..13u32,
            day2 in 1u32..29u32,
        ) {
            let temp_dir = TempDir::new().unwrap();
            let ytdlp_path = temp_dir.path().join("yt-dlp.exe");
            let service = UpdateService::new(ytdlp_path);

            let v1 = format!("{:04}.{:02}.{:02}", year1, month1, day1);
            let v2 = format!("{:04}.{:02}.{:02}", year2, month2, day2);

            // 如果版本号不同
            if v1 != v2 {
                let v2_gt_v1 = service.compare_versions(&v1, &v2);
                let v1_gt_v2 = service.compare_versions(&v2, &v1);

                // 反对称性：不能同时为真
                prop_assert!(
                    !(v2_gt_v1 && v1_gt_v2),
                    "反对称性失败: compare_versions({}, {}) = {} 且 compare_versions({}, {}) = {}",
                    v1,
                    v2,
                    v2_gt_v1,
                    v2,
                    v1,
                    v1_gt_v2
                );
            }
        }
    }

    // Feature: youtube-downloader-tool, Property 8: 版本号比较正确性
    // 验证需求：6.3
    // 测试相等性：compare_versions(v, v) 应该返回 false（因为不是更新）
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn prop_version_comparison_equality(
            year in 2020u32..2030u32,
            month in 1u32..13u32,
            day in 1u32..29u32,
            with_v_prefix: bool,
        ) {
            let temp_dir = TempDir::new().unwrap();
            let ytdlp_path = temp_dir.path().join("yt-dlp.exe");
            let service = UpdateService::new(ytdlp_path);

            let version = format!(
                "{}{:04}.{:02}.{:02}",
                if with_v_prefix { "v" } else { "" },
                year,
                month,
                day
            );

            let result = service.compare_versions(&version, &version);

            prop_assert!(
                !result,
                "相同版本比较应该返回 false: compare_versions({}, {}) = {}",
                version,
                version,
                result
            );
        }
    }

    #[test]
    fn test_get_local_version_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let ytdlp_path = temp_dir.path().join("yt-dlp.exe");
        let service = UpdateService::new(ytdlp_path);

        let runtime = tokio::runtime::Runtime::new().unwrap();
        let result = runtime.block_on(service.get_local_version());

        assert!(result.is_err());
        match result {
            Err(AppError::YtdlpNotFound) => {}
            _ => panic!("Expected YtdlpNotFound error"),
        }
    }

    #[tokio::test]
    async fn test_replace_ytdlp() {
        let temp_dir = TempDir::new().unwrap();
        let ytdlp_path = temp_dir.path().join("yt-dlp.exe");
        let new_file_path = temp_dir.path().join("yt-dlp.tmp");

        // 创建原始文件
        fs::write(&ytdlp_path, b"old version").unwrap();

        // 创建新文件
        fs::write(&new_file_path, b"new version").unwrap();

        let service = UpdateService::new(ytdlp_path.clone());
        let result = service.replace_ytdlp(&new_file_path).await;

        assert!(result.is_ok());

        // 验证备份文件存在
        let backup_path = ytdlp_path.with_extension("bak");
        assert!(backup_path.exists());
        assert_eq!(fs::read(&backup_path).unwrap(), b"old version");

        // 验证新文件已替换
        assert_eq!(fs::read(&ytdlp_path).unwrap(), b"new version");

        // 验证临时文件已被移除
        assert!(!new_file_path.exists());
    }

    #[test]
    fn test_get_download_url_for_platform() {
        let temp_dir = TempDir::new().unwrap();
        let ytdlp_path = temp_dir.path().join("yt-dlp.exe");
        let service = UpdateService::new(ytdlp_path);

        let release = GithubRelease {
            tag_name: "2024.01.15".to_string(),
            body: Some("Release notes".to_string()),
            assets: vec![
                GithubAsset {
                    name: "yt-dlp.exe".to_string(),
                    browser_download_url: "https://github.com/releases/yt-dlp.exe".to_string(),
                },
                GithubAsset {
                    name: "yt-dlp_macos".to_string(),
                    browser_download_url: "https://github.com/releases/yt-dlp_macos".to_string(),
                },
                GithubAsset {
                    name: "yt-dlp".to_string(),
                    browser_download_url: "https://github.com/releases/yt-dlp".to_string(),
                },
            ],
        };

        let result = service.get_download_url_for_platform(&release);
        assert!(result.is_ok());

        // 验证返回的 URL 包含正确的平台文件
        let url = result.unwrap();
        if cfg!(target_os = "windows") {
            assert!(url.contains("yt-dlp.exe"));
        } else if cfg!(target_os = "macos") {
            assert!(url.contains("yt-dlp_macos"));
        } else if cfg!(target_os = "linux") {
            assert!(url.contains("yt-dlp") && !url.contains("_macos") && !url.contains(".exe"));
        }
    }

    // Feature: youtube-downloader-tool, Property 9: 文件更新备份保留
    // 验证需求：6.6
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn prop_file_update_backup_retention(
            old_content in prop::collection::vec(any::<u8>(), 0..1000),
            new_content in prop::collection::vec(any::<u8>(), 0..1000),
        ) {
            let temp_dir = TempDir::new().unwrap();
            let ytdlp_path = temp_dir.path().join("yt-dlp.exe");
            let new_file_path = temp_dir.path().join("yt-dlp.tmp");
            let backup_path = ytdlp_path.with_extension("bak");

            // 创建原始文件
            fs::write(&ytdlp_path, &old_content).unwrap();

            // 创建新文件
            fs::write(&new_file_path, &new_content).unwrap();

            let service = UpdateService::new(ytdlp_path.clone());
            let runtime = tokio::runtime::Runtime::new().unwrap();
            let result = runtime.block_on(service.replace_ytdlp(&new_file_path));

            prop_assert!(
                result.is_ok(),
                "replace_ytdlp 应该成功: {:?}",
                result
            );

            // 属性 1: 备份文件应该存在
            prop_assert!(
                backup_path.exists(),
                "备份文件应该存在于 {:?}",
                backup_path
            );

            // 属性 2: 备份文件内容应该与原始文件内容一致
            let backup_content = fs::read(&backup_path).unwrap();
            prop_assert_eq!(
                backup_content,
                old_content,
                "备份文件内容应该与原始文件内容一致"
            );

            // 属性 3: 新文件内容应该与提供的新内容一致
            let current_content = fs::read(&ytdlp_path).unwrap();
            prop_assert_eq!(
                current_content,
                new_content,
                "更新后的文件内容应该与新内容一致"
            );

            // 属性 4: 临时文件应该被移除
            prop_assert!(
                !new_file_path.exists(),
                "临时文件应该被移除"
            );
        }
    }

    // Feature: youtube-downloader-tool, Property 9: 文件更新备份保留
    // 验证需求：6.6
    // 测试边缘情况：空文件更新
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn prop_file_update_empty_files(
            old_is_empty: bool,
            new_is_empty: bool,
        ) {
            let temp_dir = TempDir::new().unwrap();
            let ytdlp_path = temp_dir.path().join("yt-dlp.exe");
            let new_file_path = temp_dir.path().join("yt-dlp.tmp");
            let backup_path = ytdlp_path.with_extension("bak");

            let old_content = if old_is_empty { vec![] } else { vec![1, 2, 3] };
            let new_content = if new_is_empty { vec![] } else { vec![4, 5, 6] };

            // 创建原始文件
            fs::write(&ytdlp_path, &old_content).unwrap();

            // 创建新文件
            fs::write(&new_file_path, &new_content).unwrap();

            let service = UpdateService::new(ytdlp_path.clone());
            let runtime = tokio::runtime::Runtime::new().unwrap();
            let result = runtime.block_on(service.replace_ytdlp(&new_file_path));

            prop_assert!(result.is_ok());

            // 即使是空文件，备份也应该存在
            prop_assert!(backup_path.exists());
            
            let backup_content = fs::read(&backup_path).unwrap();
            prop_assert_eq!(backup_content, old_content);

            let current_content = fs::read(&ytdlp_path).unwrap();
            prop_assert_eq!(current_content, new_content);
        }
    }

    // Feature: youtube-downloader-tool, Property 9: 文件更新备份保留
    // 验证需求：6.6
    // 测试多次更新：每次更新都应该创建新的备份
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(50))]
        
        #[test]
        fn prop_file_update_multiple_updates(
            content1 in prop::collection::vec(any::<u8>(), 1..100),
            content2 in prop::collection::vec(any::<u8>(), 1..100),
            content3 in prop::collection::vec(any::<u8>(), 1..100),
        ) {
            let temp_dir = TempDir::new().unwrap();
            let ytdlp_path = temp_dir.path().join("yt-dlp.exe");
            let backup_path = ytdlp_path.with_extension("bak");

            let runtime = tokio::runtime::Runtime::new().unwrap();

            // 第一次更新
            fs::write(&ytdlp_path, &content1).unwrap();
            let temp1 = temp_dir.path().join("yt-dlp.tmp1");
            fs::write(&temp1, &content2).unwrap();
            
            let service = UpdateService::new(ytdlp_path.clone());
            runtime.block_on(service.replace_ytdlp(&temp1)).unwrap();

            // 验证第一次更新
            prop_assert!(backup_path.exists());
            let backup1 = fs::read(&backup_path).unwrap();
            prop_assert_eq!(backup1, content1);
            let current1 = fs::read(&ytdlp_path).unwrap();
            prop_assert_eq!(current1, content2.clone());

            // 第二次更新
            let temp2 = temp_dir.path().join("yt-dlp.tmp2");
            fs::write(&temp2, &content3).unwrap();
            runtime.block_on(service.replace_ytdlp(&temp2)).unwrap();

            // 验证第二次更新：备份应该是第一次更新后的内容
            let backup2 = fs::read(&backup_path).unwrap();
            prop_assert_eq!(
                backup2,
                content2,
                "第二次更新后，备份应该是第一次更新后的内容"
            );
            let current2 = fs::read(&ytdlp_path).unwrap();
            prop_assert_eq!(current2, content3);
        }
    }
}
