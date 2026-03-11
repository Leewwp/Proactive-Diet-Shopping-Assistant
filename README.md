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

## TODO 开发计划

> 本计划已按 `COMP5517` 作业要求和 rubric 对齐：Project 占课程总评 15%，其中 **Final Project Report 占 70%**、**Project Presentation 占 30%**；小组规模 7-8 人。

### 课程评分对齐（必须达成）

- [ ] 交付 `Final Project Report`，并逐项覆盖 rubric：
  - Focus（目标相关性与清晰度）
  - Knowledge and Application（理论理解与应用）
  - Methods of Inquiry / Problem Solving（方法有效性与可靠性）
  - Evidence and Arguments（证据、分析与批判性讨论）
  - Citations and References（引用与参考文献规范）
  - Discipline Skills（HCI 方法与实现能力）
- [ ] 交付 `Project Presentation`，并覆盖 rubric：
  - Organization（结构、连贯性、时间控制）
  - Presentation Effectiveness（表达清晰度、流畅度、展示效果）
- [ ] 报告中体现“自我调节学习过程”：明确记录每轮反馈、修改决策和结果

### 当前进度（代码现状）

- [x] Expo + React Native 基础架构完成（Home / Scan / Product / Cart / Summary / Profile）
- [x] Open Food Facts + 阿里云兜底链路完成（地区感知、并发查询、超时、缓存）
- [x] 营养分析、过敏原冲突提醒、购物车汇总、替代品推荐已接入
- [x] 扫描页 UI 已支持条码模式 + 识别模式 + 手动输入/名称搜索

### 高优先级 TODO（答辩前必须完成）

1. [ ] 条形码扫描功能可交付化
   - 真机端到端打通：`Scan -> Product Detail -> Add to Cart`
   - 补齐异常路径：权限拒绝、弱网、无码/脏码、重复扫描去重反馈
   - 输出可用性数据：识别成功率、任务完成时长、失败原因分布
2. [ ] AI 大模型商品识别正式落地
   - 修复 `src/services/aiProductIdentifier.ts` 配置读取问题（当前识别调用配置链路不完整）
   - 完成稳定链路：拍照/相册 -> 识别 -> 置信度阈值 -> 结果展示
   - 增加“AI 估算数据”免责声明与低置信度回退（转条码扫描/名称搜索）

### 报告与展示工作包（按 rubric 分工）

- [ ] Focus：补充 Problem Statement、目标用户、使用场景边界
- [ ] Knowledge & Application：补充 HCI 理论映射（如可用性启发式、认知负荷、错误预防）
- [ ] Methods：完成并记录用户研究方法（访谈/可用性测试/A-B 对照）
- [ ] Evidence & Arguments：沉淀数据证据（任务成功率、错误率、主观满意度）并形成分析结论
- [ ] Citations：建立参考文献清单与统一引用格式
- [ ] Discipline Skills：整理“设计-实现-评估”闭环证据（线框、迭代记录、最终界面对照）
- [ ] Presentation：准备 8-12 分钟讲稿与分工，确保结构完整（问题-方法-结果-反思）

### 低优先级 TODO（可选优化）

- [ ] 性能：`cachedProducts` 增加容量上限与淘汰策略
- [ ] 稳定性：增强离线可用（本地历史检索 + 恢复联网自动刷新）
- [ ] 可访问性：补充 `accessibilityLabel`、读屏文案、色弱友好对比
- [ ] 工程质量：补最小自动化测试（条码规范化、阈值判定、过敏原匹配）
- [ ] 安全：AI Key 调用改为服务端代理，避免客户端暴露密钥

### 里程碑（建议）

- M1：条码扫描链路稳定可演示（含异常路径）
- M2：AI 识别可演示（含低置信度回退与免责声明）
- M3：完成用户测试与数据分析，写入 Final Report
- M4：完成 Presentation 彩排与最终版材料

---

**贡献指南**：欢迎提交 PR！请参考上方的「团队协作与部署指南」参与开发。

## 团队协作与部署指南

### 预览地址

- **Web 预览**: <https://proactive-diet-shopping-assistant--guzccluucx.expo.app>
- **Android APK**: Expo构建失败，待处理

### 参与开发

#### 1) 克隆项目

```bash
git clone https://github.com/Leewwp/Proactive-Diet-Shopping-Assistant
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

部署完成后访问Deployment URL: <https://proactive-diet-shopping-assistant--guzccluucx.expo.app>

#### 部署 Android (APK)

```bash
# 预览版本（生成 APK）
npx eas build -p android --profile preview
```

构建完成后在 Expo 控制台下载 APK:
<https://expo.dev/accounts/polyu-hci-group/projects/proactive-diet-shopping-assistant/builds>

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
