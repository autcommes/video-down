import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    silent: true, // 禁用测试输出中的 console.log
    reporters: ['default'], // 使用默认报告器
    pool: 'forks', // 使用 forks 池避免挂起
    poolOptions: {
      forks: {
        singleFork: true, // 单进程运行避免资源竞争
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
