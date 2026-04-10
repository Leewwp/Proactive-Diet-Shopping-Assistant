# Proactive Diet Shopping Assistant

A smart shopping assistant built with Expo + React Native. It identifies food products via barcode scanning and provides real-time risk alerts and alternative suggestions based on the user's dietary goals, allergens, and family member needs.

## Core Features

- Barcode scanning (EAN/UPC) — requires merchant partnership for full coverage
- Camera-based food recognition (Baidu Cloud Product Search API)
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

### Camera-Based Recognition (Baidu Cloud Product Search API)

For products without a scannable barcode, the app supports camera-based recognition via **Baidu Cloud Product Search API**. This approach matches user-taken product photos against a custom product image library to identify food items and display their local nutrition information.

#### How It Works

1. **Custom Image Library Setup**: A dedicated product image library is created in Baidu Cloud console, with food product images uploaded (3-5 multi-angle photos per product recommended) and each image linked to a local nutrition database via product ID.

2. **Photo Recognition Flow**:
   - Authenticate by obtaining an `access_token` via API credentials
   - Upload the user's photo in base64 encoding
   - The API searches the custom image library and returns matching results (including product ID and similarity score 0-1)

3. **Result Handling by Similarity Threshold**:
   - Similarity > 0.8: Auto-match, display nutrition facts directly
   - Similarity 0.6–0.8: Show confirmation dialog, user confirms before displaying nutrition facts
   - Similarity < 0.6: Recognition failed, guide user to manually select product

> **Note**: Camera-based recognition relies on a pre-configured custom image library in Baidu Cloud. Full coverage requires uploading local food product images and binding them to the nutrition database.

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
- Camera-based Baidu Cloud product search requires pre-configured custom image library
- Offline mode does not support remote product identification (local cache only)

## License

Private project. Not for external distribution.
