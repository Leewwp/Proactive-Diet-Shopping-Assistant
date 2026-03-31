# Proactive Diet Shopping Assistant - 技术文档

## 项目概述

**Proactive Diet Shopping Assistant** 是一个基于 React Native (Expo) 的智能饮食购物助手应用。该应用帮助用户在购物时做出更健康的食品选择，通过扫描商品条形码或 AI 识别商品，获取营养信息，并根据用户的饮食偏好和过敏原信息提供个性化建议。

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React Native | 0.81.5 | 跨平台移动应用开发 |
| Expo | ~54.0.0 | React Native 开发框架 |
| TypeScript | ~5.9.2 | 类型安全的 JavaScript |
| React Navigation | ^7.0.14 | 导航管理 |
| Zustand | 4.5.5 | 状态管理 |
| React Native Paper | ^5.12.5 | UI 组件库 |
| Expo Camera | ~17.0.0 | 相机和条形码扫描 |
| AsyncStorage | 2.2.0 | 本地数据持久化 |

---

## 项目结构

```
src/
├── app/                    # 路由配置 (Expo Router)
│   ├── _layout.tsx        # 主布局和导航配置
│   ├── index.tsx          # 首页入口
│   ├── scan.tsx           # 扫描页面路由
│   ├── cart.tsx           # 购物车页面路由
│   ├── compare.tsx        # 商品比较页面路由
│   ├── profile.tsx        # 用户配置页面路由
│   ├── local-products.tsx # 本地商品管理路由
│   ├── summary.tsx        # 购物总结页面路由
│   ├── product/[barcode].tsx    # 商品详情页面
│   └── alternatives/[barcode].tsx # 替代商品页面
│
├── screens/               # 页面组件
│   ├── HomeScreen.tsx     # 首页
│   ├── ScanScreen.tsx     # 扫描页面
│   ├── CartScreen.tsx     # 购物车页面
│   ├── ComparisonScreen.tsx # 商品比较页面
│   ├── ProductDetailScreen.tsx # 商品详情页面
│   ├── ProfileScreen.tsx  # 用户配置页面
│   ├── LocalProductManagerScreen.tsx # 本地商品管理
│   ├── OnboardingScreen.tsx # 引导页面
│   └── SummaryScreen.tsx  # 购物总结页面
│
├── components/            # 可复用组件
│   ├── cart/              # 购物车相关组件
│   ├── common/            # 通用组件
│   ├── local-product/     # 本地商品组件
│   ├── product/           # 商品相关组件
│   ├── profile/           # 用户配置组件
│   └── scanner/           # 扫描相关组件
│
├── services/              # 服务层
│   ├── openFoodFactsApi.ts # Open Food Facts API
│   ├── aliyunBarcodeApi.ts # 阿里云条码 API
│   ├── aiProductIdentifier.ts # AI 商品识别
│   ├── nutritionAnalyzer.ts # 营养分析
│   └── localProductService.ts # 本地商品服务
│
├── stores/                # 状态管理 (Zustand)
│   ├── useCartStore.ts    # 购物车状态
│   ├── useProductStore.ts # 商品状态
│   ├── useProfileStore.ts # 用户配置状态
│   └── useLocalProductStore.ts # 本地商品状态
│
├── types/                 # TypeScript 类型定义
├── constants/             # 常量配置
├── utils/                 # 工具函数
└── i18n/                  # 国际化配置
```

---

## 核心功能模块

### 1. 商品扫描 (Scan)

**入口:** 首页底部导航 "Scan" 或 Compare 页面的 "Scan Product"

**功能说明:**

#### 1.1 条形码扫描 (Barcode)
- 使用手机相机扫描商品条形码
- 支持 EAN-13、EAN-8、UPC-A、UPC-E 等主流条码格式
- 自动识别条码类型并查询商品信息

#### 1.2 AI 商品识别 (Identify)
- 使用手机相机拍摄商品照片
- 通过 AI 分析识别商品（需配置 API）
- 未配置 API 时使用 Demo 模式（返回本地商品）

#### 1.3 手动输入条码
- 点击键盘图标手动输入条码
- 支持查询本地商品和远程数据库

#### 1.4 商品名称搜索
- 点击搜索图标输入商品名称
- 同时搜索本地商品和 Open Food Facts 数据库

**操作流程:**
```
打开 Scan 页面 
  → 选择扫描模式 (Barcode/Identify)
  → 扫描/拍照/输入
  → 显示商品信息卡片
  → 添加到购物车或查看详情
```

---

### 2. 商品比较 (Compare)

**入口:** 
- 商品详情页面点击 "Compare" 按钮
- 首页 Compare 卡片

**功能说明:**
- 选择两个商品进行营养成分对比
- 显示热量、糖、脂肪、钠、蛋白质等指标对比
- 根据用户健康目标推荐更优选择
- 支持替换已选商品

**操作流程:**
```
商品详情页点击 Compare
  → 进入 Scan Product B 页面
  → 扫描/选择第二个商品
  → 显示对比结果
  → 选择更优商品加入购物车
```

---

### 3. 购物车 (Cart)

**入口:** 首页底部导航 "Cart"

**功能说明:**
- 显示已添加的商品列表
- 可折叠的营养平衡摘要
- 可折叠的购物车总结
- 显示购物车中的过敏原冲突警告
- 支持修改商品数量、删除商品
- 结账功能

**操作流程:**
```
扫描商品 → 点击 "Add to Cart" 
  → 进入购物车查看
  → 调整数量或删除
  → 点击 "Checkout" 结账
```

---

### 4. 用户配置 (Profile)

**入口:** 首页底部导航 "Profile"

**功能说明:**

#### 4.1 过敏原设置
- 选择需要避免的过敏原类别
- 支持多种过敏原同时选择
- 扫描时自动检测过敏原冲突

#### 4.2 饮食目标
- 设置健康饮食目标
- 根据目标推荐更健康的替代品

#### 4.3 家庭成员管理
- 添加家庭成员
- 为每个成员设置过敏原和饮食偏好
- 购物时检测全家人的过敏原冲突

**操作流程:**
```
进入 Profile 页面
  → 设置过敏原
  → 设置饮食目标
  → 添加家庭成员
  → 保存配置
```

---

### 5. 本地商品管理 (Local Products)

**入口:** 首页 "Local Products" 卡片或 Scan 页面数据库图标

**功能说明:**
- 添加自定义商品信息
- 编辑已有商品
- 删除商品
- 商品信息包括：名称、品牌、条码、营养成分、过敏原、类别等

**使用场景:**
- 数据库中没有的商品
- 自制食品
- 特殊品牌商品

**操作流程:**
```
进入 Local Products 页面
  → 点击 "+" 添加商品
  → 填写商品信息
  → 保存
  → 可通过条码扫描查询
```

---

### 6. 商品详情 (Product Detail)

**入口:** 
- 扫描后点击商品卡片
- 购物车中点击商品
- Recent Scans 中点击商品

**功能说明:**
- 显示商品完整营养信息
- 显示过敏原列表
- 显示营养评分 (Nutri-Score)
- 过敏原冲突警告
- 健康替代品推荐
- Compare 功能入口
- 添加到购物车

---

### 7. 健康替代品推荐 (Alternatives)

**入口:** 商品详情页 "Find Healthier Alternatives" 按钮

**功能说明:**
- 根据当前商品推荐更健康的替代品
- 基于营养成分和用户饮食目标
- 显示替代品的营养优势

---

## 数据存储

### 本地持久化存储

使用 `AsyncStorage` 配合 `Zustand` 的 `persist` 中间件：

| Store | 存储键名 | 存储内容 |
|-------|---------|---------|
| useProfileStore | profile-storage | 用户配置、过敏原、家庭成员 |
| useCartStore | cart-storage | 购物车商品 |
| useProductStore | product-storage | 商品缓存、最近扫描 |
| useLocalProductStore | local-product-storage | 本地商品数据 |

---

## API 服务

### 1. Open Food Facts API
- **用途:** 获取商品营养信息
- **端点:** `https://world.openfoodfacts.org/api/v2/product/{barcode}`
- **返回:** 商品名称、品牌、营养成分、过敏原等

### 2. 阿里云条码 API (可选)
- **用途:** 中国区商品条码查询
- **配置:** 需要配置 API Key

### 3. AI 商品识别 (可选)
- **用途:** 通过照片识别商品
- **支持:** OpenAI、Anthropic 等大模型
- **配置:** 在 `aiProductIdentifier.ts` 中配置 API Key

---

## 状态管理

使用 Zustand 进行状态管理，主要 Store：

### useProfileStore
```typescript
interface ProfileState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  updateAllergens: (allergens: AllergenCategory[]) => void;
  addFamilyMember: (member: FamilyMember) => void;
  // ...
}
```

### useCartStore
```typescript
interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (barcode: string) => void;
  updateQuantity: (barcode: string, quantity: number) => void;
  clearCart: () => void;
}
```

### useProductStore
```typescript
interface ProductState {
  products: Record<string, Product>;
  recentScans: Product[];
  comparisonProducts: Product[];
  // ...
}
```

---

## 核心组件说明

### AlertCard
显示过敏原警告、建议或提示信息。

### ComplianceBadge
显示合规性状态徽章（compliant/suggestion/emergency）。

### ProductCard
商品卡片组件，显示商品基本信息和营养评分。

### ProductComparison
商品对比组件，显示两个商品的营养成分对比。

### BarcodeScanner
条形码扫描组件，基于 expo-camera。

### ObjectDetector
AI 商品识别组件，支持相机拍照和 AI 分析。

### AllergenSelector
过敏原选择器组件。

### FamilyMemberCard
家庭成员卡片组件。

---

## 配置说明

### AI API 配置

在 `src/services/aiProductIdentifier.ts` 中配置：

```typescript
const AI_CONFIG: AIConfig = {
  provider: 'openai',     // 或 'anthropic'
  apiKey: 'your-api-key',
  model: 'gpt-4-vision',  // 或其他模型
};
```

### 主题配置

在 `src/constants/colors.ts` 中配置明暗主题颜色。

---

## 运行项目

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm start
```

### 运行 Android
```bash
npm run android
```

### 运行 iOS
```bash
npm run ios
```

### 运行 Web
```bash
npm run web
```

---

## 常见问题

### Q: 扫描商品找不到怎么办？
A: 
1. 使用手动输入条码功能
2. 使用商品名称搜索
3. 在 Local Products 中添加商品

### Q: 如何添加家庭成员？
A: Profile 页面 → Family Members → 点击 "+" 添加

### Q: 如何使用 Demo 模式录制演示？
A: 
1. 在 Local Products 中添加 2 个商品
2. 不配置 AI API Key
3. 使用 Identify 功能拍照，会自动返回本地商品

### Q: 过敏原警告如何工作？
A: 在 Profile 中设置过敏原后，扫描商品时会自动检测并显示警告。

---

## 版本历史

- **v1.0.0** - 初始版本
  - 条形码扫描功能
  - AI 商品识别功能
  - 商品比较功能
  - 购物车管理
  - 用户配置
  - 本地商品管理
