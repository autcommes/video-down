// 数据模型模块

mod video_info;
mod download_task;
mod progress;
mod config;
mod history;
mod update;

pub use video_info::{VideoInfo, Format};
// DownloadTask 和 TaskStatus 仅在测试中使用
#[cfg(test)]
pub use download_task::{DownloadTask, TaskStatus};
pub use progress::ProgressData;
pub use config::AppConfig;
pub use history::HistoryItem;
pub use update::UpdateInfo;
