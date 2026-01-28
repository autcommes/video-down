// 数据模型模块

mod video_info;
mod download_task;
mod progress;
mod config;
mod history;
mod update;

pub use video_info::{VideoInfo, Format};
pub use progress::ProgressData;
pub use config::{AppConfig, BrowserType};
pub use history::HistoryItem;
pub use update::UpdateInfo;
