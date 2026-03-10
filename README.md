# Proactive Diet Shopping Assistant

一个基于 Expo + React Native 的智能购物助手，核心能力是通过条形码扫描识别食品，并结合用户饮食目标、过敏原和家庭成员需求，提供实时风险提醒与替代建议。

## 核心功能

- 条形码扫描识别（EAN/UPC）
- 商品营养信息解析（每 100g）
- 过敏原冲突检查（含家庭成员维度）
- 购物车营养汇总与合规评分
- 商品对比与替代品推荐
- 多语言支持（`en` / `zh-HK`）

## 扫码与数据源策略（已优化）

项目已实现“地区感知 + 多源兜底”的扫码查询链路，重点优化中国香港和中国内地场景：

1. 根据条码前缀识别地区并调整 Open Food Facts 查询优先级  
   - 中国内地条码（`690-699`）优先 `cn.openfoodfacts.org`
   - 其他（含香港 `489`）优先 `world.openfoodfacts.org`
2. Open Food Facts 直查使用并发 + 超时控制，提升首包速度
3. 失败后自动进入 Open Food Facts 搜索回退
4. 可选接入阿里云条码 API 作为兜底数据源（提高识别覆盖率）
5. 内存缓存 + In-flight 去重，避免重复请求造成延迟

## 技术栈

- Expo 54
- React 19
- React Native 0.79
- Expo Router
- Zustand + AsyncStorage
- React Native Paper
- i18next

## 目录结构

```txt
src/
  app/                # 路由入口（expo-router）
  screens/            # 页面
  components/         # UI 组件
  services/           # API、条码逻辑、营养分析
  stores/             # Zustand 状态管理
  utils/              # 业务规则与计算工具
  constants/          # 主题、目标、过敏原常量
  i18n/               # 国际化
```

## 快速开始

### 1) 安装依赖

```bash
npm install
```

### 2) 启动开发环境

```bash
npx expo start
```

可通过命令快捷启动：

```bash
npm run android
npm run ios
npm run web
```

## 阿里云条码兜底配置（可选）

复制 `.env.example` 并填写：

```bash
EXPO_PUBLIC_ALIYUN_BARCODE_ENDPOINT=
EXPO_PUBLIC_ALIYUN_BARCODE_APPCODE=
EXPO_PUBLIC_ALIYUN_BARCODE_PARAM=code
```

说明：

- `EXPO_PUBLIC_ALIYUN_BARCODE_ENDPOINT` 支持两种格式：
  - `https://xxx.aliyunapi.com/barcode/{barcode}`
  - `https://xxx.aliyunapi.com/barcode`（系统会自动追加查询参数）
- `EXPO_PUBLIC_ALIYUN_BARCODE_APPCODE` 用于 `Authorization: APPCODE <value>`
- 未配置时不会调用阿里云，仅使用 Open Food Facts

## 代码质量

运行 lint：

```bash
npm run lint
```

## 当前已知限制

- Open Food Facts 数据完整度受地区与商品品牌覆盖影响
- 阿里云兜底依赖外部服务可用性与套餐配额
- 离线模式下无法进行远程商品识别（仅可查看本地已缓存记录）

## 团队协作与部署指南

### 预览地址

- **Web 预览**: https://proactive-diet-shopping-assistant--dgv9cuug7w.expo.app
- **Android APK**: 正在构建中，构建完成后可在 Expo 控制台下载

### 参与开发

#### 1) 克隆项目

```bash
git clone <your-repo-url>
cd Proactive-Diet-Shopping-Assistant
npm install
```

#### 2) 登录 Expo 账号

```bash
npx expo login
# 输入你的 Expo 账号邮箱和密码
# 如果开启了 2FA，使用 --otp 参数
```

#### 3) 本地开发

```bash
npx expo start
# 或启动特定平台
npm run web      # Web 开发服务器
npm run android  # Android
npm run ios      # iOS
```

### 部署更新

代码提交后，需要重新构建才能在预览地址看到效果。

#### 部署 Web

```bash
# 1. 导出 Web 资源
npx expo export -p web

# 2. 部署到 EAS Hosting
npx eas deploy
```

部署完成后访问: https://proactive-diet-shopping-assistant--dgv9cuug7w.expo.app

#### 部署 Android (APK)

```bash
# 预览版本（生成 APK）
npx eas build -p android --profile preview
```

构建完成后在 Expo 控制台下载 APK:
https://expo.dev/accounts/polyu-hci-group/projects/proactive-diet-shopping-assistant/builds

### 常见问题

**Q: 推送代码后网页没有更新？**
A: Web 需要手动执行 `npx expo export -p web && npx eas deploy` 重新部署。

**Q: Android 构建排队时间很长？**
A: 免费账户有排队限制，可考虑订阅 Expo 付费计划加速。

**Q: 遇到 EAS 登录问题？**
A: 确保你的 Expo 账号已添加到 `polyu-hci-group` 组织。

---

## 许可证

`private` 项目，默认不对外发布。
