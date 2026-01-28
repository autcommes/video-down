import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { logger } from '@/utils/logger'

// 在测试环境中禁用日志输出到控制台
logger.setSilent(true)

// 禁用所有 console 输出
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}
