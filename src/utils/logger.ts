/**
 * 日志记录工具
 * 提供统一的日志记录接口
 * 需求：8.5
 */

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  data?: unknown;
  error?: Error;
}

/**
 * 日志记录器类
 */
class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // 最多保存 1000 条日志

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, data?: unknown, error?: Error) {
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
      error,
    };

    // 添加到日志列表
    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 输出到控制台
    const consoleMessage = `[${entry.timestamp}] [${level}] ${message}`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(consoleMessage, data);
        break;
      case LogLevel.INFO:
        console.info(consoleMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(consoleMessage, data);
        break;
      case LogLevel.ERROR:
        console.error(consoleMessage, data, error);
        break;
    }
  }

  /**
   * 记录调试信息
   */
  debug(message: string, data?: unknown) {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * 记录普通信息
   */
  info(message: string, data?: unknown) {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * 记录警告信息
   */
  warn(message: string, data?: unknown) {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * 记录错误信息
   */
  error(message: string, error?: Error, data?: unknown) {
    this.log(LogLevel.ERROR, message, data, error);
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 获取指定级别的日志
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * 导出日志为文本
   */
  exportLogs(): string {
    return this.logs
      .map((log) => {
        let line = `[${log.timestamp}] [${log.level}] ${log.message}`;
        if (log.data) {
          line += `\nData: ${JSON.stringify(log.data, null, 2)}`;
        }
        if (log.error) {
          line += `\nError: ${log.error.message}\nStack: ${log.error.stack}`;
        }
        return line;
      })
      .join('\n\n');
  }

  /**
   * 下载日志文件
   */
  downloadLogs() {
    const content = this.exportLogs();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * 全局日志记录器实例
 */
export const logger = new Logger();

/**
 * 默认导出
 */
export default logger;
