# AI Product Identification 优化计划

## 需求分析

### 需求 1: AI Product Identification 界面优化
用户希望 AI Product Identification 界面看起来和真正的 AI 识别完全一样，不需要显示 "Demo Mode" 或其他提示信息。只在底层做兜底逻辑：如果没有配置大模型 API，则直接返回本地商品。

**具体要求：**
- 移除 "Demo Mode" 标签
- 移除 "Take a photo to identify a product. Demo mode uses your local products." 提示
- 移除 "Demo mode: Will return products from your local catalog" 提示
- 按钮文字统一为 "Take Photo"
- 界面看起来和配置了 AI API 时完全一样

### 需求 2: 移除 Recent Scans 部分
用户反馈手机上 recent scans 效果不好，需要移除这部分内容。

## 实现方案

### 修改文件

#### 1. `src/components/scanner/ObjectDetector.tsx`
- 移除所有 "Demo Mode" 相关的 UI 元素
- 统一界面显示，无论是否配置 AI API
- 按钮文字统一为 "Take Photo"
- 底层逻辑保持不变：未配置 API 时返回本地商品

#### 2. `src/screens/ScanScreen.tsx`
- 移除 recent scans 相关的 JSX 代码
- 移除相关的样式定义

## 详细代码修改

### 1. ObjectDetector.tsx 修改
```typescript
// 移除以下内容：
// - "Demo Mode" 标签
// - 条件判断显示不同的描述文字
// - "Demo mode: Will return products from your local catalog" 提示
// - 按钮文字条件判断

// 统一显示：
// - 标题: "AI Product Identification"
// - 描述: "Snap a photo of any product to identify it and get nutritional information."
// - 按钮: "Take Photo"
```

### 2. ScanScreen.tsx 修改
```typescript
// 移除 recent scans 部分：
// - 删除 recentScans 相关的 JSX
// - 删除 recentScans, recentScansContent 等样式
```

## 注意事项
- 保持底层兜底逻辑不变
- 移除 recent scans 不影响其他功能
