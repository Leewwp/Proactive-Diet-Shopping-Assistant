# Compare 模式和 Demo 逻辑优化计划

## 问题分析

### 问题 1: Compare 模式下不能选择 barcode 和 identify
**根因分析:**
- `ScanScreen.tsx` 中有条件判断 `{!isCompareMode && (<SegmentedButtons...)}`
- 这导致 compare 模式下不显示 barcode/identify 切换选项

**修复方案:**
- 移除 `!isCompareMode` 条件，让 compare 模式也显示切换选项

### 问题 2: Compare 模式下 ObjectDetector 的 take photo 不能点击
**根因分析:**
- `ObjectDetector` 组件接收 `isActive` 属性
- `ScanScreen.tsx` 传递 `isActive={!scannedProduct && !showManualInput && !showSearch && !isErrorDialogVisible}`
- 可能在 compare 模式下 `isActive` 被设置为 false

**修复方案:**
- 检查 `isActive` 的传递逻辑，确保 compare 模式下也能正常使用

### 问题 3: 兜底逻辑需要只循环最新的两个商品
**根因分析:**
- 当前 `getDemoProduct` 函数使用 `demoProductIndex % sortedProducts.length`
- 这会遍历所有本地商品

**修复方案:**
- 修改逻辑为：只取最新的两个商品，然后在这两个商品之间循环
- `demoProductIndex % 2` 只循环 0 和 1

## 实现步骤

### Step 1: 修复 ScanScreen.tsx - Compare 模式显示切换选项
移除 SegmentedButtons 的 `!isCompareMode` 条件

### Step 2: 检查并修复 ObjectDetector 的 isActive 传递
确保 compare 模式下 `isActive` 为 true

### Step 3: 修改 aiProductIdentifier.ts 的 getDemoProduct 函数
只循环最新的两个商品

## 详细代码修改

### 1. ScanScreen.tsx
```typescript
// 移除条件，让 compare 模式也显示切换选项
<SegmentedButtons
  value={scanMode}
  onValueChange={(value) => {
    if (isErrorDialogVisible) return;
    setScanMode(value as ScanMode);
  }}
  buttons={[
    { value: 'barcode', label: 'Barcode', icon: 'barcode-scan', disabled: isErrorDialogVisible },
    { value: 'identify', label: 'Identify', icon: 'camera', disabled: isErrorDialogVisible },
  ]}
  style={styles.segmentedButtons}
/>
```

### 2. aiProductIdentifier.ts
```typescript
export async function getDemoProduct(localProducts: LocalProduct[]): Promise<Product | null> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (localProducts.length === 0) return null;
  
  const sortedProducts = [...localProducts].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // 只取最新的两个商品
  const topTwoProducts = sortedProducts.slice(0, 2);
  
  // 在这两个商品之间循环
  const product = topTwoProducts[demoProductIndex % topTwoProducts.length];
  demoProductIndex++;
  
  return convertLocalProductToProduct(product);
}
```
