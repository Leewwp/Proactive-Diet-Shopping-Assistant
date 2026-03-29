# AI Product Identification Demo 模式实现计划

## 需求分析

用户希望在 AI API 未配置时，使用 Local Products 中的商品来模拟 identify 功能，用于录制 demo。

### 具体需求
1. 当 AI API 未配置时，identify 功能返回 Local Products 中的商品
2. 第一次 identify 返回最新的商品，第二次返回第二新的商品，以此类推
3. 显示 2 秒加载延迟，模拟 AI 处理时间
4. 支持 compare 模式，可以依次选择两个商品进行比较

## 实现方案

### 修改文件

#### 1. `src/components/scanner/ObjectDetector.tsx`
- 添加相机拍照功能
- 检测 AI API 是否配置
- 如果未配置，调用 demo 模式返回本地商品
- 显示加载状态 2 秒

#### 2. `src/stores/useLocalProductStore.ts`
- 添加 `getLastUsedIndex` 和 `setLastUsedIndex` 方法
- 或者使用模块级变量跟踪返回顺序

#### 3. `src/services/aiProductIdentifier.ts`
- 添加 `getDemoProduct()` 函数，返回本地商品

### 实现步骤

#### Step 1: 添加 demo 模式服务函数
在 `aiProductIdentifier.ts` 中添加：
```typescript
let demoProductIndex = 0;

export async function getDemoProduct(localProducts: LocalProduct[]): Promise<Product | null> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (localProducts.length === 0) return null;
  
  const product = localProducts[demoProductIndex % localProducts.length];
  demoProductIndex++;
  
  return convertLocalProductToProduct(product);
}

export function resetDemoIndex(): void {
  demoProductIndex = 0;
}
```

#### Step 2: 修改 ObjectDetector 组件
- 添加相机权限和拍照功能
- 检测 AI 配置状态
- 未配置时使用 demo 模式
- 显示加载动画

#### Step 3: 集成到 ScanScreen
- ObjectDetector 返回商品后调用 `handleProductFound`
- 支持 compare 模式

## 详细代码修改

### 1. `src/services/aiProductIdentifier.ts`
添加 demo 模式相关函数

### 2. `src/components/scanner/ObjectDetector.tsx`
- 导入必要的依赖（相机、本地商品 store）
- 添加拍照和 demo 模式逻辑
- 显示加载状态

### 3. 导出更新
确保所有新增函数正确导出

## 注意事项
- 保持最小改动，不影响现有功能
- AI API 配置后仍然使用真实的 AI 识别
- Demo 模式仅在没有配置 API 时生效
