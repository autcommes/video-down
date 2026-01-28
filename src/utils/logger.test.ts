/**
 * Logger 工具测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import logger, { LogLevel } from './logger';

describe('Logger', () => {
  beforeEach(() => {
    // 清空日志
    logger.clearLogs();
    
    // Mock 控制台方法
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('debug', () => {
    it('应该记录调试信息', () => {
      logger.debug('调试消息', { key: 'value' });

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('调试消息');
      expect(logs[0].data).toEqual({ key: 'value' });
    });
  });

  describe('info', () => {
    it('应该记录普通信息', () => {
      logger.info('信息消息');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('信息消息');
    });
  });

  describe('warn', () => {
    it('应该记录警告信息', () => {
      logger.warn('警告消息');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].message).toBe('警告消息');
    });
  });

  describe('error', () => {
    it('应该记录错误信息', () => {
      const error = new Error('测试错误');
      logger.error('错误消息', error);

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].message).toBe('错误消息');
      expect(logs[0].error).toBe(error);
    });
  });

  describe('getLogsByLevel', () => {
    it('应该按级别过滤日志', () => {
      logger.debug('调试');
      logger.info('信息');
      logger.warn('警告');
      logger.error('错误', new Error());

      const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe('错误');

      const infoLogs = logger.getLogsByLevel(LogLevel.INFO);
      expect(infoLogs).toHaveLength(1);
      expect(infoLogs[0].message).toBe('信息');
    });
  });

  describe('clearLogs', () => {
    it('应该清空所有日志', () => {
      logger.info('消息1');
      logger.info('消息2');
      expect(logger.getLogs()).toHaveLength(2);

      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('exportLogs', () => {
    it('应该导出日志为文本格式', () => {
      logger.info('测试消息', { data: 'value' });
      logger.error('错误消息', new Error('测试错误'));

      const exported = logger.exportLogs();
      
      expect(exported).toContain('[INFO] 测试消息');
      expect(exported).toContain('Data: {');
      expect(exported).toContain('[ERROR] 错误消息');
      expect(exported).toContain('Error: 测试错误');
    });
  });

  describe('日志数量限制', () => {
    it('应该限制日志数量不超过最大值', () => {
      // 记录超过最大数量的日志
      for (let i = 0; i < 1100; i++) {
        logger.info(`消息 ${i}`);
      }

      const logs = logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(1000);
      
      // 验证保留的是最新的日志
      expect(logs[logs.length - 1].message).toBe('消息 1099');
    });
  });
});
