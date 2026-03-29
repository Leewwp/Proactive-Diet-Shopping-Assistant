# 修复 Scan 和 Compare 功能问题计划

## 问题分析

### 问题 1: Enter Barcode Manually 找不到本地商品
**根因分析:**
- `ScanScreen.tsx` 中的 `handleBarcodeScan` 调用 `getProductByBarcode(barcode)`
- `normalizeBarcode` 函数会将 12 位 UPC 转为 13 位 EAN（前面加 0）
- 但本地商品存储时可能保存的是原始条码（12 位或自定义格式）
- `useLocalProductStore` 中的 `normalizeBarcodeForMatch` 只处理数字条码，不处理带有前缀的本地条码（如 `LOCAL_`）

**修复方案:**
1. 修改 `useLocalProductStore.ts` 中的 `normalizeBarcodeForMatch` 函数，支持本地条码格式
2. 在 `ScanScreen.tsx` 的 `handleBarcodeScan` 中，先检查本地商品，使用原始条码（不经过 normalize）

### 问题 2: Scan 显示 "Scan Product A/B" 问题
**根因分析:**
- `ScanScreen.tsx` 中 `isCompareMode = params.compare === 'true'`
- 当从非 compare 入口进入时，URL 没有 `compare=true` 参数
- 但可能存在 URL 参数残留或缓存问题

**修复方案:**
1. 确保 `isCompareMode` 只在明确从 compare 入口进入时为 true
2. 检查所有跳转到 Scan 的入口，确保只有 compare 相关入口传递 `compare=true`

### 问题 3: Compare 完成后返回 Home 而不是 compare 界面
**根因分析:**
- `ScanScreen.tsx` 中 `handleProductFound` 调用 `router.back()` 返回上一页
- 如果用户从 Home -> ProductDetail -> Compare -> Scan，`router.back()` 会返回到 ProductDetail
- 需要使用 `router.push('/comparison')` 而不是 `router.back()`

**修复方案:**
1. 修改 `ScanScreen.tsx` 中的 `handleProductFound`，在 compare 模式下使用 `router.replace('/comparison')` 或 `router.push('/comparison')`

### 问题 4: ProductComparison 组件报错
**根因分析:**
- 错误信息 "Element type is invalid" 表示组件导入/导出问题
- `ComparisonScreen.tsx` 从 `@/components` 导入 `ProductComparison`
- 需要检查导出链是否完整

**修复方案:**
1. 检查 `src/components/product/ProductComparison.tsx` 的导出
2. 检查 `src/components/product/index.ts` 的导出
3. 检查 `src/components/index.ts` 的导出
4. 确保所有导出链完整

## 实施步骤

### 步骤 1: 修复本地商品条码匹配问题
**文件:** `src/stores/useLocalProductStore.ts`
- 修改 `normalizeBarcodeForMatch` 函数，支持本地条码格式（LOCAL_ 前缀）
- 增加对原始条码的匹配支持

**文件:** `src/screens/ScanScreen.tsx`
- 修改 `handleBarcodeScan`，在 normalize 之前先检查原始条码

### 步骤 2: 修复 Compare 模式判断和返回逻辑
**文件:** `src/screens/ScanScreen.tsx`
- 修改 `handleProductFound`，在 compare 模式下使用 `router.replace('/comparison')`

### 步骤 3: 修复 ProductComparison 组件导出
**文件:** `src/components/product/ProductComparison.tsx`
- 确保组件正确导出

**文件:** `src/components/product/index.ts`
- 确保导出语句正确

**文件:** `src/components/index.ts`
- 确保导出链完整

### 步骤 4: 修复 ComparisonScreen 的商品加载逻辑
**文件:** `src/screens/ComparisonScreen.tsx`
- 确保从 Scan 返回后能正确加载 comparisonProducts

## 详细代码修改

### 1. useLocalProductStore.ts
```typescript
function normalizeBarcodeForMatch(barcode: string): string[] {
  // 如果是本地条码（LOCAL_ 前缀），直接返回
  if (barcode.toUpperCase().startsWith('LOCAL_')) {
    return [barcode.toUpperCase()];
  }
  
  const cleanBarcode = barcode.replace(/[^0-9]/g, '');
  if (cleanBarcode.length === 0) {
    return [barcode]; // 返回原始条码
  }
  
  const candidates = [cleanBarcode];
  if (cleanBarcode.length === 12) {
    candidates.push(`0${cleanBarcode}`);
  }
  if (cleanBarcode.length === 13 && cleanBarcode.startsWith('0')) {
    candidates.push(cleanBarcode.substring(1));
  }
  return candidates;
}
```

### 2. ScanScreen.tsx - handleBarcodeScan
```typescript
const handleBarcodeScan = useCallback(
  async (rawBarcode: string) => {
    // 先检查原始条码的本地商品
    const localProductRaw = getProductByBarcode(rawBarcode);
    if (localProductRaw) {
      const product = convertLocalProductToProduct(localProductRaw);
      handleProductFound(product);
      return;
    }

    const barcode = normalizeBarcode(rawBarcode);
    // ... 其余逻辑
  },
  [getProductByBarcode, handleProductFound, ...]
);
```

### 3. ScanScreen.tsx - handleProductFound
```typescript
const handleProductFound = useCallback((product: Product) => {
  addRecentScan(product);
  
  if (isCompareMode) {
    addToComparison(product);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    // 使用 replace 而不是 back，确保返回到 comparison 页面
    router.replace('/comparison');
    return;
  }
  
  setScannedProduct(product);
}, [addRecentScan, addToComparison, isCompareMode, router]);
```

### 4. 检查组件导出链
确保以下文件正确导出：
- `src/components/product/ProductComparison.tsx` - `export function ProductComparison(...)`
- `src/components/product/index.ts` - `export { ProductComparison } from './ProductComparison';`
- `src/components/index.ts` - `export * from './product';`
