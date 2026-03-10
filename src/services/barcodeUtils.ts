export type BarcodeRegion =
  | 'mainland-china'
  | 'hong-kong'
  | 'taiwan'
  | 'north-america'
  | 'japan'
  | 'uk'
  | 'netherlands'
  | 'international';

export type OpenFoodFactsHost = 'cn' | 'world';

const CHECK_DIGIT_LENGTHS = new Set([8, 12, 13, 14]);

export const BARCODE_SCAN_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

export function sanitizeBarcodeInput(barcode: string): string {
  return barcode.replace(/[^0-9]/g, '');
}

export function normalizeBarcode(barcode: string): string {
  const cleanBarcode = sanitizeBarcodeInput(barcode);
  if (cleanBarcode.length === 12) {
    return `0${cleanBarcode}`;
  }
  return cleanBarcode;
}

function computeGtinCheckDigit(dataDigits: string): number {
  let sum = 0;
  let factor = 3;

  for (let index = dataDigits.length - 1; index >= 0; index -= 1) {
    sum += Number(dataDigits[index]) * factor;
    factor = factor === 3 ? 1 : 3;
  }

  return (10 - (sum % 10)) % 10;
}

function hasValidCheckDigit(cleanBarcode: string): boolean {
  if (cleanBarcode.length < 2) {
    return false;
  }

  const checkDigit = Number(cleanBarcode[cleanBarcode.length - 1]);
  const dataDigits = cleanBarcode.slice(0, -1);
  return computeGtinCheckDigit(dataDigits) === checkDigit;
}

export function isBarcodeValid(barcode: string): boolean {
  const cleanBarcode = sanitizeBarcodeInput(barcode);

  if (cleanBarcode.length < 8 || cleanBarcode.length > 14) {
    return false;
  }

  if (CHECK_DIGIT_LENGTHS.has(cleanBarcode.length)) {
    return hasValidCheckDigit(cleanBarcode);
  }

  return true;
}

export function getBarcodeRegion(barcode: string): BarcodeRegion {
  const cleanBarcode = normalizeBarcode(barcode);
  const prefix3 = Number(cleanBarcode.slice(0, 3));
  const prefix2 = Number(cleanBarcode.slice(0, 2));

  if (!Number.isFinite(prefix3)) {
    return 'international';
  }

  if (prefix3 >= 690 && prefix3 <= 699) {
    return 'mainland-china';
  }

  if (prefix3 === 489) {
    return 'hong-kong';
  }

  if (prefix3 === 471) {
    return 'taiwan';
  }

  if (prefix3 >= 450 && prefix3 <= 459) {
    return 'japan';
  }

  if (prefix3 >= 490 && prefix3 <= 499) {
    return 'japan';
  }

  if (prefix3 >= 870 && prefix3 <= 879) {
    return 'netherlands';
  }

  if (prefix2 === 50) {
    return 'uk';
  }

  if (prefix3 >= 0 && prefix3 <= 139) {
    return 'north-america';
  }

  return 'international';
}

export function getBarcodeType(barcode: string): string {
  const region = getBarcodeRegion(barcode);

  switch (region) {
    case 'mainland-china':
      return 'China Mainland (GS1 CN)';
    case 'hong-kong':
      return 'Hong Kong (GS1 HK)';
    case 'taiwan':
      return 'Taiwan (GS1 TW)';
    case 'north-america':
      return 'USA/Canada (GS1 US)';
    case 'japan':
      return 'Japan (GS1 JP)';
    case 'uk':
      return 'UK (GS1 UK)';
    case 'netherlands':
      return 'Netherlands (GS1 NL)';
    default:
      return 'International';
  }
}

export function getPreferredOpenFoodFactsHosts(barcode: string): OpenFoodFactsHost[] {
  const region = getBarcodeRegion(barcode);

  if (region === 'mainland-china') {
    return ['cn', 'world'];
  }

  return ['world', 'cn'];
}

export function getBarcodeCandidates(barcode: string): string[] {
  const cleanBarcode = sanitizeBarcodeInput(barcode);
  const normalizedBarcode = normalizeBarcode(cleanBarcode);
  const candidates = [normalizedBarcode, cleanBarcode];

  if (normalizedBarcode.length === 13 && normalizedBarcode.startsWith('0')) {
    candidates.push(normalizedBarcode.slice(1));
  }

  return [...new Set(candidates.filter((candidate) => candidate.length > 0))];
}
