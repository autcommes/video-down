/**
 * 同步 package.json 和 tauri.conf.json 的版本号
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const rootDir = process.cwd();
const packageJsonPath = join(rootDir, 'package.json');
const tauriConfPath = join(rootDir, 'src-tauri', 'tauri.conf.json');

try {
  // 读取 package.json 版本
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const version = packageJson.version;

  console.log(`📦 同步版本号: ${version}`);

  // 更新 tauri.conf.json
  const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'));
  tauriConf.package.version = version;

  writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');

  console.log('✅ 版本号同步完成');
  console.log(`   - package.json: ${version}`);
  console.log(`   - tauri.conf.json: ${version}`);
} catch (error) {
  console.error('❌ 版本号同步失败:', error.message);
  process.exit(1);
}
