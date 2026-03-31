# Proactive Diet Shopping Assistant

A smart shopping assistant built with Expo + React Native. It identifies food products via barcode scanning and provides real-time risk alerts and alternative suggestions based on the user's dietary goals, allergens, and family member needs.

## Core Features

- Barcode scanning (EAN/UPC) — requires merchant partnership for full coverage
- Product nutrition information parsing (per 100g)
- Allergen conflict detection (including family member dimension)
- Shopping cart nutrition summary and compliance scoring
- Product comparison and alternative recommendations

## Product Identification

### Barcode Scanning

The app queries [Open Food Facts](https://world.openfoodfacts.org/) for product data. To maximize recognition coverage in Hong Kong and Mainland China, the following strategies are applied:

1. **Region-aware query routing**: barcode prefixes are used to route queries to the appropriate Open Food Facts instance
   - Mainland China barcodes (`690-699`) → priority to `cn.openfoodfacts.org`
   - Other regions (including Hong Kong `489`) → priority to `world.openfoodfacts.org`
2. Concurrent queries with timeout control for faster first-response
3. Automatic search fallback when direct lookup fails
4. In-memory caching with in-flight request deduplication

> **Note**: Barcode-based product identification relies on data availability in Open Food Facts. Full coverage requires collaboration with merchants and brands to populate the database.

### Camera-Based Recognition (VLM Match)

For products without a scannable barcode, the app supports camera-based recognition via **VLM Match (Vision-Language Model Matching)**. This approach uses a vision-language model to analyze product images and match them against known product information, enabling identification of products that are not yet in any database.

> **Current Status**: Camera-based VLM Match is under development and not yet fully functional.

## Tech Stack

- Expo 54
- React 19
- React Native 0.79
- Expo Router
- Zustand + AsyncStorage
- React Native Paper
- i18next

## Project Structure

```txt
src/
  app/                # Route entry points (expo-router)
  screens/            # Pages
  components/         # UI components
  services/          # API, barcode logic, nutrition analysis
  stores/             # Zustand state management
  utils/              # Business rules and calculation utilities
  constants/          # Theme, goals, allergen constants
  i18n/               # Internationalization
```

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Start the development server

```bash
npx expo start
```

Shortcut commands:

```bash
npm run android
npm run ios
npm run web
```

## Code Quality

Run lint:

```bash
npm run lint
```

## Known Limitations

- Open Food Facts data completeness varies by region and brand coverage
- Camera-based VLM Match recognition is not yet fully implemented
- Offline mode does not support remote product identification (local cache only)

## License

Private project. Not for external distribution.
