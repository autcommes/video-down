// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod error;
mod models;
mod services;
mod utils;

use commands::{
    add_history, cancel_download, check_ytdlp_update, clear_history, download_video, get_config,
    get_history, get_video_info, get_ytdlp_version, normalize_file_path, open_file, save_config,
    select_folder, update_ytdlp, verify_path,
};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // 文件系统命令
            select_folder,
            verify_path,
            open_file,
            normalize_file_path,
            // 下载命令
            get_video_info,
            download_video,
            cancel_download,
            get_ytdlp_version,
            // 配置命令
            get_config,
            save_config,
            // 历史记录命令
            get_history,
            clear_history,
            add_history,
            // 更新命令
            check_ytdlp_update,
            update_ytdlp,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
