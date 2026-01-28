/**
 * 视频信息
 */
export interface VideoInfo {
  /** 视频 ID */
  id: string;
  /** 视频标题 */
  title: string;
  /** 时长（秒） */
  duration: number;
  /** 缩略图 URL */
  thumbnail: string;
  /** 上传者 */
  uploader: string;
  /** 可用格式列表 */
  formats: Format[];
}

/**
 * 视频格式
 */
export interface Format {
  /** 格式 ID */
  formatId: string;
  /** 分辨率 (如 "1920x1080") */
  resolution: string;
  /** 文件扩展名 */
  ext: string;
  /** 文件大小（字节） */
  filesize?: number;
  /** 帧率 */
  fps?: number;
  /** 视频编码 */
  vcodec: string;
  /** 音频编码 */
  acodec: string;
}

/**
 * 下载任务
 */
export interface DownloadTask {
  /** 任务 ID (UUID) */
  id: string;
  /** 视频 URL */
  url: string;
  /** 视频标题 */
  title: string;
  /** 选择的格式 ID */
  formatId: string;
  /** 保存路径 */
  savePath: string;
  /** 任务状态 */
  status: TaskStatus;
  /** 创建时间戳 */
  createdAt: number;
}

/**
 * 任务状态
 */
export enum TaskStatus {
  Pending = 'pending',
  Downloading = 'downloading',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

/**
 * 进度数据
 */
export interface ProgressData {
  /** 任务 ID */
  taskId: string;
  /** 完成百分比 (0.0 - 100.0) */
  percent: number;
  /** 下载速度 (如 "2.5MB/s") */
  speed: string;
  /** 已下载大小 (如 "125MB") */
  downloaded: string;
  /** 总大小 (如 "280MB") */
  total: string;
  /** 预计剩余时间 (如 "00:02:30") */
  eta: string;
}

/**
 * 浏览器类型（用于读取 Cookie）
 */
export type BrowserType = 'none' | 'chrome' | 'edge' | 'firefox' | 'brave' | 'opera';

/**
 * 应用配置
 */
export interface AppConfig {
  /** 默认保存路径 */
  savePath: string;
  /** 默认分辨率偏好 */
  defaultResolution: string;
  /** 自动检查更新 */
  autoCheckUpdate: boolean;
  /** 并发下载数 */
  concurrentDownloads: number;
  /** YouTube 下载使用的浏览器 Cookie（用于绕过登录限制） */
  youtubeCookieBrowser: BrowserType;
}

/**
 * 历史记录项
 */
export interface HistoryItem {
  /** 记录 ID */
  id: string;
  /** 视频标题 */
  title: string;
  /** 视频 URL */
  url: string;
  /** 下载的分辨率 */
  resolution: string;
  /** 文件路径 */
  filePath: string;
  /** 文件大小 */
  fileSize: number;
  /** 下载时间戳 */
  downloadedAt: number;
  /** 文件是否存在 */
  fileExists: boolean;
}

/**
 * 更新信息
 */
export interface UpdateInfo {
  /** 当前版本 */
  currentVersion: string;
  /** 最新版本 */
  latestVersion: string;
  /** 是否有更新 */
  hasUpdate: boolean;
  /** 下载 URL */
  downloadUrl: string;
  /** 更新说明 */
  releaseNotes: string;
}

/**
 * 更新进度数据
 */
export interface UpdateProgress {
  /** 完成百分比 (0.0 - 100.0) */
  percent: number;
  /** 已下载大小 (如 "5MB") */
  downloaded: string;
  /** 总大小 (如 "10MB") */
  total: string;
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  /** 错误类型 */
  errorType: string;
  /** 错误消息 */
  message: string;
}
