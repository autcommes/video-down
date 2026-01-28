/**
 * 全局类型定义
 * 为浏览器和 Node.js 环境提供类型支持
 */

// 浏览器全局对象
declare global {
  interface Window {
    __TAURI_IPC__?: unknown;
  }

  // 浏览器 API
  const alert: (message?: string) => void;
  const confirm: (message?: string) => boolean;
  const Blob: typeof Blob;
  const URL: typeof URL;
}

// Node.js 全局对象（用于配置文件）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const process: NodeJS.Process;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const __dirname: string;

export {};
