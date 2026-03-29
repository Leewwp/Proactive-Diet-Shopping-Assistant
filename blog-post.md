# Proactive Diet Shopping Assistant：Expo 智能购物助手的架构设计与实现

**TL;DR:** 本文介绍一个基于 Expo + React Native 的智能购物助手，核心能力是通过条形码扫描识别食品，结合用户饮食目标、过敏原和家庭成员需求提供实时风险提醒与替代建议。实现了"地区感知 + 多源兜底"的扫码查询链路（Open Food Facts 优先 + 阿里云 API 兜底），基于关键词匹配的过敏原冲突检测，以及购物车维度的营养汇总与合规评分系统。

---

## 一、为什么做这个项目

食品安全关系到每个家庭的健康。食品包装上的配料表信息密集，普通消费者难以在短时间内判断一款产品是否符合自己的饮食限制——过敏用户需要识别过敏原，健身用户需要控制糖分和热量，家有婴幼儿的家长需要避免特定添加剂。

这个项目的目标是：**把专业营养师和过敏咨询的能力，装进每个人的手机里。**

> 本项目面向有 React Native 基础、了解 REST API 调用的移动开发者。熟悉 Expo Camera 和 AsyncStorage 的读者更佳，但不强制要求。

---

## 二、系统架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Expo App (React Native)                          │
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Home    │  │  Scan    │  │ Product  │  │  Cart    │  │ Profile  │     │
│  │  主页    │  │  扫码    │  │ 详情     │  │ 购物车   │  │ 用户档案  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Zustand Store (持久化状态)                          │  │
│  │  useCartStore │ useProductStore │ useProfileStore                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                       Services Layer                                   │  │
│  │  openFoodFactsApi │ aliyunBarcodeApi │ nutritionAnalyzer │ conflictResolver │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                       Utils / Constants                                │  │
│  │  barcodeUtils │ complianceChecker │ nutritionThresholds │ allergens   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│  Open Food Facts API  │  │   阿里云条码 API       │  │    i18next            │
│  cn.openfoodfacts.org │  │   (可选兜底)           │  │    (en / zh-HK)       │
│  world.openfoodfacts  │  │                        │  │                        │
└───────────────────────┘  └───────────────────────┘  └───────────────────────┘
```

---

## 三、核心模块实现

### 3.1 条码查询链路：地区感知 + 多源兜底

这是本项目最关键的数据获取层。条码查询采用分层降级策略：

```
用户扫描条码
    ↓
本地缓存检查（10min TTL）
    ↓ 有缓存
直接返回缓存结果
    ↓ 无缓存
In-flight 请求去重（防止重复请求）
    ↓
并发直查 Open Food Facts（按地区优先host）
    ├─ 中国内地 (690-699) → cn.openfoodfacts.org 优先
    ├─ 香港 (489) → world.openfoodfacts 优先
    └─ 其他地区 → world.openfoodfacts 优先
    ↓ 失败
搜索回退（search endpoint + page_size=5）
    ↓ 仍失败
阿里云条码 API 兜底（可选，需配置）
```

```typescript
// openFoodFactsApi.ts
const REQUEST_TIMEOUT_MS = 2600;
const SEARCH_TIMEOUT_MS = 3200;
const BARCODE_CACHE_TTL_MS = 10 * 60 * 1000;
const BARCODE_MISS_CACHE_TTL_MS = 45 * 1000;

const barcodeCache = new Map<string, CacheEntry>();
const inflightBarcodeRequests = new Map<string, Promise<Product | null>>();

export async function fetchProductByBarcode(barcode: string): Promise<Product | null> {
  // 1. 规范化条码（UPC-A 12位 → EAN-13 13位）
  const normalizedBarcode = normalizeBarcode(barcode);
  const barcodeCandidates = getBarcodeCandidates(normalizedBarcode);

  // 2. 缓存检查
  for (const candidate of barcodeCandidates) {
    const cached = getCachedBarcodeValue(candidate);
    if (cached !== undefined) return cached;
  }

  // 3. In-flight 去重
  const cacheKey = barcodeCandidates[0];
  if (inflightBarcodeRequests.has(cacheKey)) {
    return inflightBarcodeRequests.get(cacheKey);
  }

  // 4. 分层查询
  const request = fetchProductByBarcodeInternal(normalizedBarcode)
    .then((product) => {
      setCachedBarcodeValue(barcodeCandidates, product);
      return product;
    })
    .finally(() => inflightBarcodeRequests.delete(cacheKey));

  inflightBarcodeRequests.set(cacheKey, request);
  return request;
}
```

**并发 + first-successful 模式**避免等待所有 host 返回：

```typescript
async function firstSuccessfulProduct(
  tasks: (() => Promise<Product | null>)[]
): Promise<Product | null> {
  return new Promise((resolve) => {
    let pendingCount = tasks.length;
    let hasResolved = false;

    const finishIfNeeded = () => {
      if (!hasResolved && --pendingCount === 0) resolve(null);
    };

    tasks.forEach((task) => {
      task()
        .then((product) => {
          if (!hasResolved && product) {
            hasResolved = true;
            resolve(product);
          }
        })
        .catch(() => undefined)
        .finally(finishIfNeeded);
    });
  });
}
```

### 3.2 条码地区识别与候选码生成

```typescript
// barcodeUtils.ts
export function getBarcodeRegion(barcode: string): BarcodeRegion {
  const prefix3 = Number(cleanBarcode.slice(0, 3));

  if (prefix3 >= 690 && prefix3 <= 699) return 'mainland-china';
  if (prefix3 === 489) return 'hong-kong';      // 香港
  if (prefix3 === 471) return 'taiwan';         // 台湾
  if (prefix3 >= 450 && prefix3 <= 459) return 'japan';
  if (prefix3 >= 490 && prefix3 <= 499) return 'japan';
  if (prefix3 >= 870 && prefix3 <= 879) return 'netherlands';
  if (prefix2 === 50) return 'uk';
  if (prefix3 >= 0 && prefix3 <= 139) return 'north-america';
  return 'international';
}

// EAN-13 和 UPC-A 相互转换
export function normalizeBarcode(barcode: string): string {
  const cleanBarcode = sanitizeBarcodeInput(barcode);
  if (cleanBarcode.length === 12) {
    return `0${cleanBarcode}`;  // UPC-A → EAN-13
  }
  return cleanBarcode;
}

// 生成多个可能的条码候选（处理前缀差异）
export function getBarcodeCandidates(barcode: string): string[] {
  const candidates = [normalizedBarcode, cleanBarcode];
  if (normalizedBarcode.length === 13 && normalizedBarcode.startsWith('0')) {
    candidates.push(normalizedBarcode.slice(1));  // 去掉前导0
  }
  return [...new Set(candidates)];
}
```

### 3.3 过敏原冲突检测：关键词多级匹配

过敏原检测采用**关键词逐级匹配**策略，而非简单的字符串包含：

```typescript
// constants/allergens.ts
export function checkAllergenMatch(
  allergenSelections: Record<AllergenCategory, AllergenSelection>,
  productKeywords: string[]  // 产品名称 + 品牌 + 分类 + 过敏原标签
): { matched: boolean; category?: AllergenCategoryData; subItem?: string } {

  for (const category of ALLERGEN_CATEGORIES) {
    const selection = allergenSelections[category.id];

    if (selection.isAllSelected) {
      // 全选模式：category 名称匹配 OR 任意 subItem 关键词匹配
      for (const keyword of productKeywords) {
        const lowerKeyword = keyword.toLowerCase();
        for (const subItem of category.subItems) {
          if (subItem.keywords.some(k => lowerKeyword.includes(k.toLowerCase()))) {
            return { matched: true, category, subItem: subItem.name };
          }
        }
      }
    } else {
      // 细粒度模式：只检查用户选中的 subItem
      for (const subItemId of selection.selectedSubItems) {
        const subItem = category.subItems.find(s => s.id === subItemId);
        if (subItem) {
          for (const keyword of productKeywords) {
            if (subItem.keywords.some(k => keyword.toLowerCase().includes(k.toLowerCase()))) {
              return { matched: true, category, subItem: subItem.name };
            }
          }
        }
      }
    }
  }
  return { matched: false };
}
```

**过敏原分类**涵盖 14 大类，包含中西式食品常见过敏原：

| 高风险（emergency） | 低风险（suggestion） |
|---------------------|----------------------|
| 花生、树坚果、鱼、贝类、蛋、奶制品、麸质、芝麻 | 水果、蔬菜、谷物、肉类、其他 |

### 3.4 营养阈值与告警分级

```typescript
// utils/complianceChecker.ts
export function determineAlertLevel(product: Product, profile: UserProfile): AlertInfo {
  // 1. 过敏原冲突 → emergency 级别
  const allergenCheck = checkAllergenConflictFromSelections(product, profile.allergenSelections);
  if (allergenCheck.hasConflict) {
    return {
      level: 'emergency',
      message: `Contains ${allergenCheck.conflictingAllergens.join(', ')}. Matches your allergen list.`,
      ...
    };
  }

  // 2. 素食者肉类检测
  if (profile.goals.includes('vegetarian') && !checkVegetarianCompliance(product)) {
    return { level: 'emergency', message: 'Not vegetarian. Contains meat or fish related ingredients.', ... };
  }

  // 3. 营养阈值违规 → suggestion 级别
  const { violations } = checkNutritionThresholds(product, thresholds);
  if (violations.length > 0) {
    return { level: 'suggestion', message: `High in: ${violations[0]}`, ... };
  }

  // 4. 接近阈值 → optimization 级别
  const { warnings } = checkNutritionThresholds(product, thresholds);
  if (warnings.length > 0) {
    return { level: 'optimization', message: warnings[0], ... };
  }

  // 5. 合规
  return { level: 'compliant', message: 'This product meets your dietary goals', ... };
}
```

**阈值判定采用 80% 预警机制**（避免用户在边界线上频繁踩雷）：

```typescript
if (nutrition.calories > thresholds.calories.max) {
  violations.push(`Calories: ${nutrition.calories}kcal (max: ${thresholds.calories.max}kcal)`);
} else if (nutrition.calories > thresholds.calories.max * 0.8) {
  warnings.push(`Calories: ${nutrition.calories}kcal (approaching limit)`);
}
```

### 3.5 购物车汇总与家庭成员分配

```typescript
// stores/useCartStore.ts
const calculateSummary = (items: CartItem[]): CartNutritionSummary => {
  const totals = items.reduce((acc, item) => {
    return {
      totalCalories: acc.totalCalories + item.product.nutrition.calories * item.quantity,
      totalSugar: acc.totalSugar + item.product.nutrition.sugar * item.quantity,
      totalSodium: acc.totalSodium + item.product.nutrition.sodium * item.quantity,
      totalFat: acc.totalFat + item.product.nutrition.fat * item.quantity,
      totalProtein: acc.totalProtein + item.product.nutrition.protein * item.quantity,
      totalFiber: acc.totalFiber + item.product.nutrition.fiber * item.quantity,
    };
  }, { totalCalories: 0, totalSugar: 0, ... });

  const complianceScore = calculateOverallComplianceScore(
    items.map(i => i.product),
    profile
  );

  return { ...totals, itemCount, complianceScore, alerts };
};
```

**购物车合规评分**（加权平均，每项 0-100 分）：

| Alert Level | 得分 |
|-------------|------|
| compliant | 100 |
| optimization | 80 |
| suggestion | 50 |
| emergency | 0 |

### 3.6 替代品推荐

```typescript
// openFoodFactsApi.ts
export async function findAlternatives(
  product: Product,
  maxSugar?: number,
  maxSodium?: number,
  minProtein?: number
): Promise<Product[]> {
  // 按同类目查询，附加营养过滤
  const categories = product.categories.slice(0, 2).join(',');
  let endpoint = `${API_BASE}/search?categories_tags=${categories}&page_size=12`;

  if (maxSugar !== undefined) {
    endpoint += `&nutriment_sugars_100g=${maxSugar}&nutriment_compare=sugars_100g`;
  }

  // 按钠/蛋白质过滤，返回 Top 5
  return candidates.filter(candidate => {
    if (maxSodium !== undefined && candidate.nutrition.sodium > maxSodium) return false;
    if (minProtein !== undefined && candidate.nutrition.protein < minProtein) return false;
    return true;
  }).slice(0, 5);
}
```

---

## 四、关键设计决策

### 4.1 离线缓存策略

```
命中缓存 → 直接返回（0ms 网络延迟）
未命中 → 并发查询 → 结果写入缓存

缓存击穿（同一条码大量并发请求）：
→ In-flight Map 去重，同一条码共享同一个 Promise

缓存穿透（无效条码）：
→ 写入 null 值，45s TTL 防止短期内重复查询无效码
```

### 4.2 家庭成员维度冲突检测

```typescript
// services/conflictResolver.ts
export function resolveFamilyConflicts(product, familyMembers): ConflictResolution {
  const conflicts: FamilyConflict[] = [];

  familyMembers.forEach(member => {
    const thresholds = getCombinedThresholds(member.goals);
    const allergenCheck = checkAllergenConflictFromSelections(product, member.allergenSelections);

    if (allergenCheck.hasConflict) {
      conflicts.push({
        memberId: member.id,
        memberName: member.name,
        conflictType: 'allergen',
        severity: allergenCheck.riskLevel === 'high' ? 'high' : 'medium',
      });
    }
  });

  // high severity 冲突 → 禁止加入购物车
  const canAdd = !conflicts.some(c => c.severity === 'high');

  return { canAdd, conflicts, suggestions, recommendedFor, notRecommendedFor };
}
```

---

## 五、项目结构

```
Proactive-Diet-Shopping-Assistant/
├── src/
│   ├── app/                    # Expo Router 路由入口
│   ├── screens/               # 页面（Home / Scan / Product / Cart / Profile）
│   ├── components/             # 可复用 UI 组件
│   ├── services/               # API 层
│   │   ├── openFoodFactsApi.ts # Open Food Facts 查询（含并发+缓存）
│   │   ├── aliyunBarcodeApi.ts # 阿里云条码 API 兜底
│   │   ├── barcodeUtils.ts     # 条码规范化与地区识别
│   │   ├── nutritionAnalyzer.ts # 营养分析与评分
│   │   └── conflictResolver.ts # 家庭成员冲突检测
│   ├── stores/                 # Zustand 状态管理
│   │   ├── useCartStore.ts    # 购物车（AsyncStorage 持久化）
│   │   ├── useProductStore.ts # 商品缓存
│   │   └── useProfileStore.ts # 用户档案
│   ├── utils/
│   │   ├── complianceChecker.ts  # 阈值判定与告警级别
│   │   └── nutritionThresholds.ts # 阈值配置
│   ├── constants/
│   │   ├── allergens.ts       # 14 类过敏原定义 + 关键词
│   │   ├── dietGoals.ts       # 饮食目标常量
│   │   └── colors.ts          # 颜色编码
│   ├── types/                  # TypeScript 类型定义
│   └── i18n/                   # 国际化（en / zh-HK）
├── app.json                    # Expo 配置
├── eas.json                    # EAS Build 配置
└── package.json
```

---

## 六、技术栈

| 层级 | 技术选型 | 用途 |
|------|---------|------|
| 框架 | Expo 54 + React Native 0.79 | 跨平台移动开发 |
| 路由 | Expo Router | 文件系统路由 |
| 状态管理 | Zustand + AsyncStorage | 全局状态 + 持久化 |
| UI | React Native Paper | Material Design 组件库 |
| 条码 | expo-camera / expo-barcode-scanner | 相机扫码 |
| 国际化 | i18next | 多语言支持 |
| API | Open Food Facts REST API | 食品营养数据 |
| 兜底 | 阿里云条码 API | 识别率补充 |

---

## 七、Trade-offs 与局限性

| 决策 | Trade-off | 改进方向 |
|------|----------|---------|
| Open Food Facts 数据源 | 免费开源，但地区覆盖不均 | 接入更多地区数据库（如 FoodDB） |
| 关键词过敏原匹配 | 实现简单，但无法处理隐晦表述 | 引入 NLP 实体识别 |
| 纯客户端架构 | 离线可缓存，但数据同步受限 | 添加服务端同步层 |
| 阿里云 API 兜底 | 提高识别率，但增加外部依赖 | 接入多个备用服务商 |
| 购物车合规评分 | 简单加权平均，但未考虑营养素相互作用 | 引入营养学专业评分模型 |

---

## 八、快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npx expo start

# Web 预览
npm run web

# Android 预览（需 Expo Go）
npx expo start --android

# 配置阿里云兜底（可选）
cp .env.example .env
# 填写 EXPO_PUBLIC_ALIYUN_BARCODE_ENDPOINT 和 APPCODE
```

---

## 九、Further Reading

- [Open Food Facts API v2](https://world.openfoodfacts.org/api/v2)
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Zustand Persistence](https://github.com/pmndrs/zustand#persist-middleware)
- [React Native Paper](https://reactnativepaper.com/)
- [GS1 Barcode Prefix Database](https://www.gs1.org/standards/barcodes/prefix-board)
