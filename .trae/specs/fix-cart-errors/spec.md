# 修复购物车及相关错误 Spec

## Why
购物车页面出现报错，项目存在 86 个 TypeScript 错误，主要是组件导入错误、路由错误和隐式 any 类型问题。

## What Changes
- 修复 CartScreen.tsx 中不存在的组件导入
- 修复 ComparisonScreen.tsx 中的 `as const` 语法错误
- 修复 ScanScreen.tsx 中的路由错误
- 修复各文件中的隐式 any 类型错误

## Impact
- Affected code: `src/screens/CartScreen.tsx`, `src/screens/ComparisonScreen.tsx`, `src/screens/ScanScreen.tsx`, `src/components/`

## ADDED Requirements

### Requirement: CartScreen 组件导入修复
系统 SHALL 正确导入 CartItem 和 NutritionBarChart 组件，或使用正确的替代组件。

#### Scenario: 购物车页面正常加载
- **WHEN** 用户进入购物车页面
- **THEN** 页面正常显示，无组件导入错误

### Requirement: ComparisonScreen 类型修复
系统 SHALL 使用正确的类型断言方式，避免 `as const` 语法错误。

### Requirement: ScanScreen 路由修复
系统 SHALL 使用正确的路由路径进行导航。
